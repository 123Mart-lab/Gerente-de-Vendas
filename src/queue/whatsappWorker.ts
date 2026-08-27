import { Worker } from 'bullmq';
import { connection } from './redis.js';
import { triageService } from '../services/triage.js';
import { salesQueue, supportQueue, whatsappQueue } from './whatsappQueue.js';
import { firebaseService } from '../services/firebase.js';

export const whatsappWorker = new Worker('whatsapp-inbound', async (job) => {
  const { phone, text } = job.data;
  console.log(`[Router] Iniciando triagem para mensagem de ${phone}...`);
  
  try {
    // 1. Get or Create Lead
    const lead = await firebaseService.getOrCreateLead(phone);
    
    // 2. Fetch recent history for context
    const history = await firebaseService.getChatHistory(phone, 3);
    
    // 3. Classify message
    const intent = await triageService.classifyMessage(text, history);
    
    // 4. Save the user's message to history
    await firebaseService.saveMessage(phone, text, 'user');
    
    // 5. Route to correct queue
    if (intent === 'SALES') {
      await salesQueue.add('process-sales', { phone, text, pipelineStage: lead.pipelineStage });
      console.log(`[Router] ➡️ Enviado para Vendas (${phone})`);
    } else if (intent === 'SUPPORT') {
      await supportQueue.add('process-support', { phone, text });
      console.log(`[Router] ➡️ Enviado para Suporte (${phone})`);
    } else if (intent === 'WARMUP') {
      // Re-use sales worker for warmup logic, we will pass a flag
      await salesQueue.add('process-warmup', { phone, text, isWarmup: true });
      console.log(`[Router] ➡️ Enviado para Aquecimento (${phone})`);
    } else {
      console.log(`[Router] 🛑 Ignorado: OTHER (${phone})`);
    }
    
  } catch (err) {
    console.error(`[Router] Falha ao processar a mensagem:`, err);
  }
}, { connection });
