import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { firebaseService } from '../services/firebase.js';
import { aiService } from '../services/ai.js';
import { openwaService } from '../services/openwa.js';

// Conexão com o Redis local do Docker
const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Worker de Suporte
export const supportWorker = new Worker('support-messages', async job => {
  const { phone, text } = job.data;
  
  console.log(`\n[🔧 Atendimento/Suporte] Atendendo o cliente: ${phone}`);
  
  try {
      // 1. Garante que existe no Firebase (embora já seja cliente)
      await firebaseService.getOrCreateLead(phone);
      
      // Salva a mensagem do usuário no histórico
      await firebaseService.saveMessage(phone, text, 'user');
      
      // Puxa o histórico de contexto
      const history = await firebaseService.getChatHistory(phone);
      
      // 2. Cérebro em Ação: O Gemini como suporte.
      // Passamos um "estágio de pipeline" fixo que forçará a carregar o prompt de suporte (se existir)
      // Ou a IA será informada pelo arquivo md de suporte.
      const aiResponseText = await aiService.generateResponse(phone, text, history, 'suporte_tecnico');
      
      // 3. Responde via API Gateway (OpenWA)
      await openwaService.sendMessage(phone, aiResponseText);
      
      // 4. Salva o que a IA respondeu no banco
      await firebaseService.saveMessage(phone, aiResponseText, 'bot');

      console.log(`✅ [Suporte] Resposta enviada para ${phone}`);
  } catch (error) {
      console.error(`❌ [Suporte] Erro processando cliente ${phone}:`, error);
      throw error; 
  }
}, { 
  connection,
  concurrency: 5 
});

supportWorker.on('ready', () => {
  console.log('🛠️ [Worker] Atendente de Suporte pronto na fila de suporte...');
});

supportWorker.on('failed', (job, err) => {
  console.error(`❌ [Suporte] Job falhou [${job?.id}]: ${err.message}`);
});
