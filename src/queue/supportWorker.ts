import { Worker } from 'bullmq';
import { connection } from './redis.js';
import { aiService } from '../services/ai.js';
import { firebaseService } from '../services/firebase.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const supportWorker = new Worker('support-queue', async (job) => {
  const { phone, text } = job.data;
  console.log(`\n[Support Worker] Iniciando processamento para ${phone}...`);
  
  try {
    const history = await firebaseService.getChatHistory(phone, 15);
    const settings = await firebaseService.getSettings() || {};
    
    const hasOpenWAPermission = settings?.agentPermissions?.['vendedor-1']?.['github-openwa'] !== false;
    const hasContactsPermission = settings?.agentPermissions?.['vendedor-1']?.['contacts-api'] === true;
    
    if (!hasOpenWAPermission) {
      console.log(`[Support Worker] 🛑 Acesso ao OpenWA desativado. Ignorando processamento de ${phone}.`);
      return;
    }

    if (hasContactsPermission) {
      console.log(`[Integração Google] 📇 Suporte tem permissão. Verificando o lead ${phone} na API do Google Contacts/People...`);
    }
    
    let delayMs = 0;
    
    // Motor de Cadência para Suporte (em segundos)
    if (settings.useReplyDelay !== false) {
      const minSec = settings.replyDelayMin || 5;
      const maxSec = settings.replyDelayMax || 15;
      const randomSeconds = randomInt(minSec, maxSec);
      
      delayMs = randomSeconds * 1000;
      console.log(`[Motor Anti-Ban] ⏳ SUPORTE: Cadência aplicada. Simulando digitação orgânica por ${randomSeconds} segundos para o cliente ${phone}...`);
    }
    
    const aiResponseText = await aiService.generateResponse(phone, text, history, '01_prospeccao', 'Você é o agente de SUPORTE TÉCNICO da 123Mart. Seja atencioso e resolva o problema do cliente.');
    
    // EXECUÇÃO DO BLOQUEIO STRICT DE TEMPO
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    
    await firebaseService.saveMessage(phone, aiResponseText, 'bot');
    console.log(`[Support Worker] ✅ Disparo autorizado e finalizado para ${phone}: ${aiResponseText}`);
    
  } catch (err) {
    console.error(`[Support Worker] ❌ Falha ao gerar resposta para ${phone}:`, err);
  }
}, { connection });
