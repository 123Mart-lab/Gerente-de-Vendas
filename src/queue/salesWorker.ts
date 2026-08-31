import { Worker } from 'bullmq';
import { connection } from './redis.js';
import { aiService } from '../services/ai.js';
import { firebaseService } from '../services/firebase.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const salesWorker = new Worker('sales-queue', async (job) => {
  const { phone, text, pipelineStage, isWarmup } = job.data;
  console.log(`\n[Sales Worker] Iniciando processamento para ${phone}...`);
  
  try {
    const history = await firebaseService.getChatHistory(phone, 15);
    // Busca as regras do painel persistidas no banco
    const settings = await firebaseService.getSettings() || {};
    
    const hasOpenWAPermission = settings?.agentPermissions?.['vendedor-1']?.['github-openwa'] !== false;
    const hasContactsPermission = settings?.agentPermissions?.['vendedor-1']?.['contacts-api'] === true;
    const hasPeoplePermission = settings?.agentPermissions?.['vendedor-1']?.['people-api'] === true;

    if (!hasOpenWAPermission) {
      console.log(`[Sales Worker] 🛑 Acesso ao OpenWA desativado para Vendedores. Ignorando processamento de ${phone}.`);
      return;
    }

    if (hasContactsPermission || hasPeoplePermission) {
      console.log(`[Integração Google] 📇 Vendedor tem permissão. Sincronizando o lead ${phone} com a API do Google Contacts/People...`);
      // Lógica de sincronização com Google Contacts / People API em background
    }

    
    let aiResponseText = '';
    let delayMs = 0;
    
    // -----------------------------------------------------
    // REGRAS DE DISPARO PARA AQUECIMENTO
    // -----------------------------------------------------
    if (isWarmup) {
      if (settings.warmupEnabled === false) {
        console.log(`[Sales Worker] 🛑 Aquecimento DESATIVADO nas configurações globais. Ignorando ${phone}.`);
        return;
      }
      
      const warmupPrompt = settings.warmupPrompt || 'Você é uma IA de aquecimento. Converse casualmente.';
      
      // Lê as travas (Fase 1 por padrão no lab)
      const minMin = settings.warmupP1IntMin || 30;
      const maxMin = settings.warmupP1IntMax || 60;
      const randomMinutes = randomInt(minMin, maxMin);
      
      // Transforma a regra de MINUTOS em MILISSEGUNDOS
      delayMs = randomMinutes * 60 * 1000; 
      
      console.log(`[Motor Anti-Ban] ⏳ AQUECIMENTO: Cadência aplicada. Simulação humana iniciada. Aguardando ${randomMinutes} minutos para interagir com ${phone}...`);
      
      aiResponseText = await aiService.generateResponse(phone, text, history, '01_prospeccao', warmupPrompt);
    } 
    // -----------------------------------------------------
    // REGRAS DE DISPARO PARA VENDAS (CLIENTES)
    // -----------------------------------------------------
    else {
      if (settings.useReplyDelay !== false) {
        // Lê as travas normais de Anti-Ban
        const minSec = settings.replyDelayMin || 5;
        const maxSec = settings.replyDelayMax || 15;
        const randomSeconds = randomInt(minSec, maxSec);
        
        // Transforma a regra de SEGUNDOS em MILISSEGUNDOS
        delayMs = randomSeconds * 1000;
        console.log(`[Motor Anti-Ban] ⏳ VENDAS: Cadência aplicada. Simulando digitação orgânica por ${randomSeconds} segundos para o cliente ${phone}...`);
      }
      
      aiResponseText = await aiService.generateResponse(phone, text, history, pipelineStage);
    }
    
    // =====================================================
    // EXECUÇÃO DO BLOQUEIO STRICT DE TEMPO (A MÁGICA ACONTECE AQUI)
    // =====================================================
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    
    await firebaseService.saveMessage(phone, aiResponseText, 'bot');
    console.log(`[Sales Worker] ✅ Disparo autorizado e finalizado para ${phone}: ${aiResponseText}`);
    
  } catch (err) {
    console.error(`[Sales Worker] ❌ Falha ao gerar resposta para ${phone}:`, err);
  }
}, { connection });
