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

// Worker de Vendas
export const salesWorker = new Worker('sales-messages', async job => {
  const { phone, text } = job.data;
  
  console.log(`\n[💼 Vendedor (Closer)] Atendendo o cliente: ${phone}`);
  
  try {
      // 1. Recupera ou cria o Lead no Funil (Firebase)
      const lead = await firebaseService.getOrCreateLead(phone);
      
      // Salva a mensagem do usuário no histórico
      await firebaseService.saveMessage(phone, text, 'user');
      
      // Puxa o histórico de contexto
      const history = await firebaseService.getChatHistory(phone);
      
      // 2. Cérebro em Ação: O Gemini como vendedor.
      const aiResponseText = await aiService.generateResponse(phone, text, history, lead.pipelineStage);
      
      // 3. Responde via API Gateway (OpenWA)
      await openwaService.sendMessage(phone, aiResponseText);
      
      // 4. Salva o que a IA respondeu no banco
      await firebaseService.saveMessage(phone, aiResponseText, 'bot');

      console.log(`✅ [Vendas] Resposta enviada para ${phone}`);
  } catch (error) {
      console.error(`❌ [Vendas] Erro processando cliente ${phone}:`, error);
      throw error; 
  }
}, { 
  connection,
  concurrency: 5 
});

salesWorker.on('ready', () => {
  console.log('🛠️ [Worker] Vendedor de Alta Conversão pronto na fila de vendas...');
});

salesWorker.on('failed', (job, err) => {
  console.error(`❌ [Vendas] Job falhou [${job?.id}]: ${err.message}`);
});
