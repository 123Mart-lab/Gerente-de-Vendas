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
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('🔥 Firebase Admin SDK Inicializado com Sucesso.');
  }
  
  dbInstance = getFirestore();
  return dbInstance;
}

export const firebaseService = {
  /**
   * Busca um lead pelo telefone. Se não existir, cria com o estágio padrão (01_prospeccao).
   */
  async getOrCreateLead(phone: string) {
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
  },

  /**
   * Atualiza a etapa da pipeline de um cliente no banco de dados.
   */
  async updatePipelineStage(phone: string, stage: string) {
    await getDb().collection('leads').doc(phone).update({
      pipelineStage: stage,
      lastInteraction: FieldValue.serverTimestamp()
    });
    console.log(`[Firebase] Lead ${phone} movido para a etapa: ${stage}`);
  },

  /**
   * Salva a mensagem (seja do usuário ou do bot) no subcoleção de histórico.
   */
  async saveMessage(phone: string, text: string, role: 'user' | 'bot') {
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
  },

  /**
   * Recupera as últimas 'limit' mensagens para passar como contexto para o Gemini.
   */
  async getChatHistory(phone: string, limit = 15) {
    const snapshot = await getDb().collection('leads').doc(phone).collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
      
    // Reverte para ficar em ordem cronológica (mais antiga -> mais nova)
    return snapshot.docs.map(doc => doc.data()).reverse();
  }
};
