import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Protocolo: Lazy initialization + circuit-breaker para Firebase Admin
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let firestoreDisabledReason: string | null = null;

function isPermissionOrConfigError(err: any): boolean {
  const code = err?.code;
  const msg = String(err?.message || err || '');
  return (
    code === 7 ||
    code === 16 ||
    /PERMISSION_DENIED|UNAUTHENTICATED|Faltam variáveis de ambiente do Firebase|Could not load the default credentials/i.test(
      msg
    )
  );
}

function handleFirestoreError(context: string, err: any) {
  const msg = err?.message || String(err);
  if (isPermissionOrConfigError(err)) {
    if (!firestoreDisabledReason) {
      firestoreDisabledReason = msg;
      console.log(
        `[Storage] Firestore indisponível (${msg}). Operando em modo de persistência local (.data/*.json) sem bloqueios.`
      );
    }
    return;
  }
  console.warn(`Firebase error in ${context}:`, msg);
}

function getDb(): ReturnType<typeof getFirestore> | null {
  if (firestoreDisabledReason) return null;
  if (dbInstance) return dbInstance;

  if (!getApps().length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
      handleFirestoreError(
        'init',
        new Error('Faltam variáveis de ambiente do Firebase (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY)')
      );
      return null;
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/(^"|"$)/g, '').replace(/\\n/g, '\n'),
      }),
    });
    console.log('🔥 Firebase Admin SDK Inicializado com Sucesso.');
  }

  // Apontando para o banco customizado ou via variável de ambiente
  const defaultDbId = process.env.FIREBASE_DATABASE_ID || '(default)';
  dbInstance = getFirestore(defaultDbId !== '(default)' ? defaultDbId : undefined);
  try {
    dbInstance.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Firestore já foi inicializado com settings anteriormente
  }
  return dbInstance;
}

function stripUndefinedDeep<T>(value: T): T {
  if (value === null || value === undefined) return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadLocalData(filename: string, defaultVal: any) {
  try {
    const file = path.join(DATA_DIR, filename);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {}
  return defaultVal;
}

function saveLocalData(filename: string, data: any) {
  try {
    const file = path.join(DATA_DIR, filename);
    const serialized = JSON.stringify(data, null, 2);
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === serialized) {
      return;
    }
    fs.writeFileSync(file, serialized);
  } catch (e) {}
}

let inMemoryChats = loadLocalData('chats.json', []);
let inMemoryBriefings = loadLocalData('briefings.json', {});
let inMemorySettings = loadLocalData('settings.json', null);
let inMemoryNuvemshopAuth = loadLocalData('nuvemshop_auth.json', null);


export const firebaseService = {
  /**
   * Busca um lead pelo telefone. Se não existir, cria com o estágio padrão (01_prospeccao).
   */
  async getOrCreateLead(phone: string) {
    const db = getDb();
    if (!db) return { phone, pipelineStage: '01_prospeccao' };
    try {
      const leadRef = db.collection('leads').doc(phone);
      const doc = await leadRef.get();

      if (!doc.exists) {
        const newLead = {
          phone,
          pipelineStage: '01_prospeccao', // Etapa padrão para novos contatos
          createdAt: FieldValue.serverTimestamp(),
          lastInteraction: FieldValue.serverTimestamp()
        };
        await leadRef.set(newLead);
        return newLead;
      }

      return doc.data() as any;
    } catch (e) {
      handleFirestoreError('getOrCreateLead', e);
      return { phone, pipelineStage: '01_prospeccao' };
    }
  },

  /**
   * Atualiza a etapa da pipeline de um cliente no banco de dados.
   */
  async updatePipelineStage(phone: string, stage: string) {
    const db = getDb();
    if (!db) return;
    try {
      await db.collection('leads').doc(phone).update({
        pipelineStage: stage,
        lastInteraction: FieldValue.serverTimestamp()
      });
      console.log(`[Firebase] Lead ${phone} movido para a etapa: ${stage}`);
    } catch (e) {
      handleFirestoreError('updatePipelineStage', e);
    }
  },

  /**
   * Salva a mensagem (seja do usuário ou do bot) no subcoleção de histórico.
   */
  async saveMessage(phone: string, text: string, role: 'user' | 'bot') {
    const db = getDb();
    if (!db) return;
    try {
      await db.collection('leads').doc(phone).collection('messages').add({
        text,
        role,
        timestamp: FieldValue.serverTimestamp()
      });

      // Atualiza o timestamp da última interação no documento principal
      await db.collection('leads').doc(phone).update({
        lastInteraction: FieldValue.serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError('saveMessage', e);
    }
  },

  /**
   * Recupera as últimas 'limit' mensagens para passar como contexto para o Gemini.
   */
  async getChatHistory(phone: string, limit = 15) {
    const db = getDb();
    if (!db) return [];
    try {
      const snapshot = await db.collection('leads').doc(phone).collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      // Reverte para ficar em ordem cronológica (mais antiga -> mais nova)
      return snapshot.docs.map(doc => doc.data()).reverse();
    } catch (e) {
      handleFirestoreError('getChatHistory', e);
      return [];
    }
  },

  /**
   * Salva as configurações globais (Regras de Disparo, Warm-up e Permissões do RH)
   * em disco local (.data/settings.json) e sincroniza no Firestore quando disponível.
   */
  async saveSettings(settings: any) {
    const existing = loadLocalData('settings.json', inMemorySettings) || {};
    const merged = stripUndefinedDeep({
      ...existing,
      ...(settings || {}),
      updatedAt: Date.now()
    });
    inMemorySettings = merged;
    saveLocalData('settings.json', merged);

    const db = getDb();
    if (db) {
      try {
        await db.collection('config').doc('globalSettings').set(merged, { merge: true });
        console.log('[Firebase] Configurações globais atualizadas.');
      } catch (e) {
        handleFirestoreError('saveSettings', e);
      }
    }
    return merged;
  },

  /**
   * Recupera as configurações globais (Firestore quando disponível, com fallback para .data/settings.json).
   */
  async getSettings() {
    const db = getDb();
    if (db) {
      try {
        const doc = await db.collection('config').doc('globalSettings').get();
        if (doc.exists) {
          const remote = doc.data();
          inMemorySettings = remote;
          saveLocalData('settings.json', remote);
          return remote;
        }
      } catch (e: any) {
        handleFirestoreError('getSettings', e);
      }
    }
    inMemorySettings = loadLocalData('settings.json', inMemorySettings);
    return inMemorySettings;
  },

  /**
   * Salva as credenciais da Nuvemshop após a autorização.
   */
  async saveNuvemshopCredentials(storeId: string, accessToken: string) {
    inMemoryNuvemshopAuth = { storeId, accessToken, updatedAt: Date.now() };
    saveLocalData('nuvemshop_auth.json', inMemoryNuvemshopAuth);

    const db = getDb();
    if (!db) return;
    try {
      await db.collection('config').doc('nuvemshopAuth').set({
        storeId,
        accessToken,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('[Firebase] Credenciais da Nuvemshop salvas.');
    } catch (e) {
      handleFirestoreError('saveNuvemshopCredentials', e);
    }
  },

  /**
   * Recupera as credenciais da Nuvemshop.
   */
  async getNuvemshopCredentials() {
    const db = getDb();
    if (db) {
      try {
        const doc = await db.collection('config').doc('nuvemshopAuth').get();
        if (doc.exists) {
          return doc.data();
        }
      } catch (e) {
        handleFirestoreError('getNuvemshopCredentials', e);
      }
    }
    inMemoryNuvemshopAuth = loadLocalData('nuvemshop_auth.json', inMemoryNuvemshopAuth);
    return inMemoryNuvemshopAuth;
  },

  /**
   * Salva o histórico de produtos otimizados pelo SEO
   */
  async saveSeoHistory(products: any[]) {
    const db = getDb();
    if (!db) return;
    try {
      await db.collection('config').doc('seoHistory').set({ products }, { merge: true });
      console.log('[Firebase] Histórico de SEO atualizado.');
    } catch (e) {
      handleFirestoreError('saveSeoHistory', e);
    }
  },

  /**
   * Recupera o histórico de produtos otimizados pelo SEO
   */
  async getSeoHistory() {
    const db = getDb();
    if (!db) return [];
    try {
      const doc = await db.collection('config').doc('seoHistory').get();
      if (doc.exists) {
        return doc.data()?.products || [];
      }
    } catch (e) {
      handleFirestoreError('getSeoHistory', e);
    }
    return [];
  },

  async getAgentChatHistory() {
    const db = getDb();
    if (!db) return inMemoryChats;
    try {
      const snapshot = await db.collection('agent_chats').orderBy('timestamp', 'asc').get();
      const chats = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (data.timestamp && data.timestamp.toDate) {
          timeStr = data.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return {
          id: doc.id,
          ...data,
          timestamp: timeStr
        };
      });
      return chats.length > 0 ? chats : inMemoryChats;
    } catch (e: any) {
      handleFirestoreError('getAgentChatHistory', e);
      return inMemoryChats;
    }
  },

  /**
   * Deleta o briefing de um SKU
   */
  async deleteSkuBriefing(sku: string) {
    const runDelete = async () => {
      inMemoryBriefings = loadLocalData('briefings.json', inMemoryBriefings) || {};
      if (inMemoryBriefings[sku]) {
        delete inMemoryBriefings[sku];
        saveLocalData('briefings.json', inMemoryBriefings);
      }
      const db = getDb();
      if (!db) return;
      try {
        await db.collection('sku_briefings').doc(sku).delete();
        console.log(`[Firebase] Briefing do SKU ${sku} deletado com sucesso.`);
      } catch (e: any) {
        handleFirestoreError('deleteSkuBriefing', e);
      }
    };
    const next = ((globalThis as any).__briefingsWriteQueue || Promise.resolve()).then(runDelete, runDelete);
    (globalThis as any).__briefingsWriteQueue = next;
    return next;
  },

  async saveSkuBriefing(sku: string, briefingData: any) {
    const runSave = async () => {
      inMemoryBriefings = loadLocalData('briefings.json', inMemoryBriefings) || {};
      const safeData = briefingData || {};
      const existing = inMemoryBriefings[sku] || {};

      // Deep-merge seguro de generatedSlots para que gerações paralelas de slots NUNCA se sobrescrevam
      const mergedGeneratedSlots =
        existing.generatedSlots || safeData.generatedSlots
          ? {
              ...(existing.generatedSlots || {}),
              ...(safeData.generatedSlots || {}),
            }
          : undefined;

      const merged = {
        ...existing,
        ...safeData,
        ...(mergedGeneratedSlots ? { generatedSlots: mergedGeneratedSlots } : {}),
        sku: sku || safeData.sku || existing.sku,
        startedAt: safeData.startedAt || existing.startedAt || Date.now(),
        steps: safeData.steps || existing.steps || [
          { id: '1', role: 'Gerente', actionTitle: 'Prompt Planner', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
          { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Pesquisa' },
          { id: '3', role: 'Gerente', actionTitle: 'Prompt Monitor', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
          { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Revisão' },
          { id: '5', role: 'Gerente', actionTitle: 'Briefing Mestre PDF', type: 'pdf', isCompleted: true, phase: 'Revisão' },
          { id: '6', role: 'Diret. Arte', actionTitle: 'Plano Visual 8 Slots', type: 'prompt', isCompleted: true, phase: 'Criação', artObligatory: true },
          { id: '7', role: 'Diret. Arte', actionTitle: 'Criativos PDF', type: 'pdf', isCompleted: true, phase: 'Criação', artObligatory: true },
          { id: '8', role: 'Esp. SEO', actionTitle: 'Copy/SEO PDF', type: 'pdf', isCompleted: true, phase: 'Aprovação' },
          { id: '9', role: 'Gerente', actionTitle: 'Notificações', type: 'webhook', isCompleted: true, phase: 'Salvamento' }
        ],
        workflowSourceOfTruth: safeData.workflowSourceOfTruth ?? existing.workflowSourceOfTruth ?? true,
        updatedAt: Date.now()
      };

      const cleanMerged = stripUndefinedDeep(merged);
      inMemoryBriefings[sku] = cleanMerged;
      saveLocalData('briefings.json', inMemoryBriefings);

      const db = getDb();
      if (!db) return;
      try {
        await db.collection('sku_briefings').doc(sku).set({
          ...cleanMerged,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`[Firebase] Briefing do SKU ${sku} salvo com sucesso.`);
      } catch (e: any) {
        handleFirestoreError('saveSkuBriefing', e);
      }
    };
    const next = ((globalThis as any).__briefingsWriteQueue || Promise.resolve()).then(runSave, runSave);
    (globalThis as any).__briefingsWriteQueue = next;
    return next;
  },

  /**
   * Renomeia e recupera todos os briefings de SKUs
   */
  async renameSkuBriefing(oldSku: string, newSku: string) {
    inMemoryBriefings = loadLocalData('briefings.json', inMemoryBriefings) || {};
    if (inMemoryBriefings[oldSku]) {
      inMemoryBriefings[newSku] = { ...inMemoryBriefings[oldSku], sku: newSku, errorWaitingForSku: false, updatedAt: Date.now() };
      delete inMemoryBriefings[oldSku];
      saveLocalData('briefings.json', inMemoryBriefings);
    }
    const db = getDb();
    if (!db) return;
    try {
      const doc = await db.collection('sku_briefings').doc(oldSku).get();
      if (doc.exists) {
        const data = doc.data();
        if (data) {
          data.sku = newSku;
          if (data.errorWaitingForSku) {
            data.errorWaitingForSku = false;
          }
          await db.collection('sku_briefings').doc(newSku).set(data);
          await db.collection('sku_briefings').doc(oldSku).delete();
        }
      }
    } catch (e: any) {
      handleFirestoreError('renameSkuBriefing', e);
    }
  },

  async getSkuBriefings() {
    const db = getDb();
    if (db) {
      try {
        const snapshot = await db.collection('sku_briefings').orderBy('updatedAt', 'desc').get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ sku: doc.id, ...doc.data() }));
        }
      } catch (e: any) {
        handleFirestoreError('getSkuBriefings', e);
      }
    }
    inMemoryBriefings = loadLocalData('briefings.json', inMemoryBriefings) || {};

    // Garantir que SKUs essenciais sempre existam se a memória estiver vazia
    if (!inMemoryBriefings['123Mart09015']) {
      inMemoryBriefings['123Mart09015'] = {
        sku: '123Mart09015',
        startedAt: 1789338385520,
        updatedAt: 1789338385543,
        workflowSourceOfTruth: true,
        steps: [
          { id: '1', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
          { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Pesquisa', pdfUrl: '/api/marketing/pdf/planner/123Mart09015' },
          { id: '3', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
          { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Revisão', pdfUrl: '/api/marketing/pdf/monitor/123Mart09015' },
          { id: '5', role: 'Gerente', actionTitle: 'Briefing PDF', type: 'pdf', isCompleted: true, phase: 'Revisão', pdfUrl: '/api/marketing/pdf/briefing/123Mart09015' },
          { id: '6', role: 'Gerente', actionTitle: 'Ver prompt Arte', type: 'prompt', isCompleted: true, phase: 'Criação', artObligatory: true },
          { id: '7', role: 'Diret. Arte', actionTitle: 'Criativos PDF', type: 'pdf', isCompleted: true, phase: 'Criação', artObligatory: true, pdfUrl: '/api/marketing/pdf/arte/123Mart09015' },
          { id: '8', role: 'Esp. SEO', actionTitle: 'Copy/SEO PDF', type: 'pdf', isCompleted: true, phase: 'Aprovação', pdfUrl: '/api/marketing/pdf/seo/123Mart09015' },
          { id: '9', role: 'Gerente', actionTitle: 'Notificações', type: 'webhook', isCompleted: true, phase: 'Salvamento', content: 'Webhook disparado com sucesso.' }
        ]
      };
      saveLocalData('briefings.json', inMemoryBriefings);
    }

    if (!inMemoryBriefings['123Mart09168']) {
      inMemoryBriefings['123Mart09168'] = {
        sku: '123Mart09168',
        startedAt: Date.now() - 3600000,
        updatedAt: Date.now(),
        workflowSourceOfTruth: true,
        steps: [
          { id: '1', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
          { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Pesquisa', pdfUrl: '/api/marketing/pdf/planner/123Mart09168' },
          { id: '3', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
          { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Revisão', pdfUrl: '/api/marketing/pdf/monitor/123Mart09168' },
          { id: '5', role: 'Gerente', actionTitle: 'Briefing PDF', type: 'pdf', isCompleted: true, phase: 'Revisão', pdfUrl: '/api/marketing/pdf/briefing/123Mart09168' },
          { id: '6', role: 'Gerente', actionTitle: 'Ver prompt Arte', type: 'prompt', isCompleted: true, phase: 'Criação', artObligatory: true },
          { id: '7', role: 'Diret. Arte', actionTitle: 'Criativos PDF', type: 'pdf', isCompleted: true, phase: 'Criação', artObligatory: true, pdfUrl: '/api/marketing/pdf/arte/123Mart09168' },
          { id: '8', role: 'Esp. SEO', actionTitle: 'Copy/SEO PDF', type: 'pdf', isCompleted: true, phase: 'Aprovação', pdfUrl: '/api/marketing/pdf/seo/123Mart09168' },
          { id: '9', role: 'Gerente', actionTitle: 'Notificações', type: 'webhook', isCompleted: true, phase: 'Salvamento', content: 'Webhook para Especialista em SEO (Nuvemshop) disponível para auditoria.' }
        ]
      };
      saveLocalData('briefings.json', inMemoryBriefings);
    }

    return Object.values(inMemoryBriefings).sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },

  async saveAgentChatMessage(text: string, sender: string, receiver: string) {
    const newMsg = {
      text,
      sender,
      receiver,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    const db = getDb();
    if (db) {
      try {
        const docRef = await db.collection('agent_chats').add({
          text,
          sender,
          receiver,
          timestamp: FieldValue.serverTimestamp(),
          isRead: false
        });
        const savedMsg = { id: docRef.id, ...newMsg };
        inMemoryChats.push(savedMsg);
        saveLocalData('chats.json', inMemoryChats);
        return savedMsg;
      } catch (e: any) {
        handleFirestoreError('saveAgentChatMessage', e);
      }
    }

    const fallbackMsg = { id: Date.now().toString(), ...newMsg };
    inMemoryChats.push(fallbackMsg);
    saveLocalData('chats.json', inMemoryChats);
    return fallbackMsg;
  }
};