import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Protocolo: Singleton pattern para garantir que o admin inicialize apenas uma vez
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace lida com as quebras de linha em chaves privadas vindas do .env
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('🔥 Firebase Admin SDK Inicializado com Sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar o Firebase Admin:', error);
  }
}

const db = getFirestore();

export const firebaseService = {
  /**
   * Busca um lead pelo telefone. Se não existir, cria com o estágio padrão (01_prospeccao).
   */
  async getOrCreateLead(phone: string) {
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
    await db.collection('leads').doc(phone).update({
      pipelineStage: stage,
      lastInteraction: FieldValue.serverTimestamp()
    });
    console.log(`[Firebase] Lead ${phone} movido para a etapa: ${stage}`);
  },

  /**
   * Salva a mensagem (seja do usuário ou do bot) no subcoleção de histórico.
   */
  async saveMessage(phone: string, text: string, role: 'user' | 'bot') {
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
    const snapshot = await db.collection('leads').doc(phone).collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
      
    // Reverte para ficar em ordem cronológica (mais antiga -> mais nova)
    return snapshot.docs.map(doc => doc.data()).reverse();
  }
};
