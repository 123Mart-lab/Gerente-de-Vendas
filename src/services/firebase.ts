import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Protocolo: Lazy initialization para Firebase Admin
let dbInstance: ReturnType<typeof getFirestore> | null = null;

function getDb() {
  if (dbInstance) return dbInstance;
  
  if (!getApps().length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Faltam variáveis de ambiente do Firebase (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY)');
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
  
  // Apontando para o banco (padrão ou configurado)
  const dbId = process.env.FIREBASE_DATABASE_ID || '(default)';
  dbInstance = getFirestore(dbId !== '(default)' ? dbId : undefined);
  return dbInstance;
}

const inMemoryChats: any[] = [];

export const firebaseService = {
  /**
   * Busca um lead pelo telefone. Se não existir, cria com o estágio padrão (01_prospeccao).
   */
  async getOrCreateLead(phone: string) {
    try {
      const db = getDb();
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
      console.warn('Firebase error in getOrCreateLead', e);
      return { phone, pipelineStage: '01_prospeccao' };
    }
  },

  /**
   * Atualiza a etapa da pipeline de um cliente no banco de dados.
   */
  async updatePipelineStage(phone: string, stage: string) {
    try {
      await getDb().collection('leads').doc(phone).update({
        pipelineStage: stage,
        lastInteraction: FieldValue.serverTimestamp()
      });
      console.log(`[Firebase] Lead ${phone} movido para a etapa: ${stage}`);
    } catch (e) {
      console.warn('Firebase error in updatePipelineStage', e);
    }
  },

  /**
   * Salva a mensagem (seja do usuário ou do bot) no subcoleção de histórico.
   */
  async saveMessage(phone: string, text: string, role: 'user' | 'bot') {
    try {
      const db = getDb();
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
      console.warn('Firebase error in saveMessage', e);
    }
  },

  /**
   * Recupera as últimas 'limit' mensagens para passar como contexto para o Gemini.
   */
  async getChatHistory(phone: string, limit = 15) {
    try {
      const snapshot = await getDb().collection('leads').doc(phone).collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
        
      // Reverte para ficar em ordem cronológica (mais antiga -> mais nova)
      return snapshot.docs.map(doc => doc.data()).reverse();
    } catch (e) {
      console.warn('Firebase error in getChatHistory', e);
      return [];
    }
  },

  /**
   * Salva as configurações globais (Regras de Disparo e Warm-up) no Firestore.
   */
  async saveSettings(settings: any) {
    try {
      const db = getDb();
      await db.collection('config').doc('globalSettings').set(settings, { merge: true });
      console.log('[Firebase] Configurações globais atualizadas.');
    } catch (e) {
      console.warn('Firebase error in saveSettings', e);
    }
  },

  /**
   * Recupera as configurações globais.
   */
  async getSettings() {
    try {
      const db = getDb();
      const doc = await db.collection('config').doc('globalSettings').get();
      if (doc.exists) {
        return doc.data();
      }
    } catch (e: any) {
      console.warn('Fallback: Unable to fetch settings from Firebase, proceeding with defaults.', e.message);
    }
    return null;
  },

  /**
   * Salva as credenciais da Nuvemshop após a autorização.
   */
  async saveNuvemshopCredentials(storeId: string, accessToken: string) {
    try {
      const db = getDb();
      await db.collection('config').doc('nuvemshopAuth').set({
        storeId,
        accessToken,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('[Firebase] Credenciais da Nuvemshop salvas.');
    } catch (e) {
      console.warn('Firebase error in saveNuvemshopCredentials', e);
    }
  },

  /**
   * Recupera as credenciais da Nuvemshop.
   */
  async getNuvemshopCredentials() {
    try {
      const db = getDb();
      const doc = await db.collection('config').doc('nuvemshopAuth').get();
      if (doc.exists) {
        return doc.data();
      }
    } catch (e) {
      console.warn('Firebase error in getNuvemshopCredentials', e);
    }
    return null;
  },

  /**
   * Salva o histórico de produtos otimizados pelo SEO
   */
  async saveSeoHistory(products: any[]) {
    try {
      const db = getDb();
      await db.collection('config').doc('seoHistory').set({ products }, { merge: true });
      console.log('[Firebase] Histórico de SEO atualizado.');
    } catch (e) {
      console.warn('Firebase error in saveSeoHistory', e);
    }
  },

  /**
   * Recupera o histórico de produtos otimizados pelo SEO
   */
  async getSeoHistory() {
    try {
      const db = getDb();
      const doc = await db.collection('config').doc('seoHistory').get();
      if (doc.exists) {
        return doc.data()?.products || [];
      }
    } catch (e) {
      console.warn('Firebase error in getSeoHistory', e);
    }
    return [];
  },

  async getAgentChatHistory() {
    try {
      const db = getDb();
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
      console.warn('Firebase error in getAgentChatHistory', e.message);
      return inMemoryChats;
    }
  },

  async saveAgentChatMessage(text: string, sender: string, receiver: string) {
    const newMsg = {
      text,
      sender,
      receiver,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    try {
      const db = getDb();
      const docRef = await db.collection('agent_chats').add({
        text,
        sender,
        receiver,
        timestamp: FieldValue.serverTimestamp(),
        isRead: false
      });
      const savedMsg = { id: docRef.id, ...newMsg };
      inMemoryChats.push(savedMsg);
      return savedMsg;
    } catch (e: any) {
      console.warn('Firebase error in saveAgentChatMessage', e.message);
      const fallbackMsg = { id: Date.now().toString(), ...newMsg };
      inMemoryChats.push(fallbackMsg);
      return fallbackMsg;
    }
  }
};