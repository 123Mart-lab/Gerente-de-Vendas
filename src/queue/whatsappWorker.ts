import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { triageService } from '../services/triage.js';
import { firebaseService } from '../services/firebase.js';
import { salesQueue } from './salesQueue.js';
import { supportQueue } from './supportQueue.js';

// Conexão com o Redis local do Docker
const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Worker que age como nosso "Gerente de Triagem", retirando as mensagens da fila principal
export const whatsappWorker = new Worker('whatsapp-messages', async job => {
  const { phone, text } = job.data;
  
  console.log(`\n[🧠 Gerente de Triagem] Analisando mensagem na fila principal de: ${phone}`);
  
  try {
      // Puxa o histórico de contexto apenas para triagem (últimas 5 mensagens)
      const fullHistory = await firebaseService.getChatHistory(phone);
      const recentHistory = fullHistory.slice(-5);
      
      // Classifica a intenção via Gemini
      const intent = await triageService.classifyMessage(text, recentHistory);
      
      if (intent === 'SALES') {
          console.log(`👉 Direcionando ${phone} para a fila de VENDAS.`);
          await salesQueue.add('process-sales', { phone, text });
      } else if (intent === 'SUPPORT') {
          console.log(`👉 Direcionando ${phone} para a fila de SUPORTE.`);
          await supportQueue.add('process-support', { phone, text });
      } else {
          console.log(`👉 Direcionando ${phone} para VENDAS (Default/Outros).`);
          await salesQueue.add('process-sales', { phone, text });
      }

  } catch (error) {
      console.error(`❌ Erro processando mensagem de triagem de ${phone}:`, error);
      throw error; 
  }
}, { 
  connection,
  concurrency: 5 
});

whatsappWorker.on('ready', () => {
  console.log('🛠️ [Worker] Gerente de Triagem pronto e escutando a fila principal no Redis...');
});

whatsappWorker.on('failed', (job, err) => {
  console.error(`❌ Job de Triagem falhou [${job?.id}]: ${err.message}`);
});
