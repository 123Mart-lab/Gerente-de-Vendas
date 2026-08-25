import 'dotenv/config';
import express from 'express';

// Serviços que serão integrados
import { firebaseService } from './src/services/firebase.js';
import { aiService } from './src/services/ai.js';
import { openwaService } from './src/services/openwa.js';

import { whatsappQueue } from './src/queue/whatsappQueue.js';
import './src/queue/whatsappWorker.js'; // Inicia o worker de triagem
import './src/queue/salesWorker.js';    // Inicia o worker de vendas
import './src/queue/supportWorker.js';  // Inicia o worker de suporte

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', role: '123Mart Brain API' });
});

// ==========================================
// 2. ROTA CENTRAL DE WEBHOOK (OPENWA)
// ==========================================
app.post('/webhook/openwa', async (req, res) => {
  // A Regra de Ouro: Sempre responda 200 OK IMEDIATAMENTE.
  res.status(200).send('OK');

  try {
    const payload = req.body;
    
    // CORREÇÃO AQUI: Aceita tanto o formato do Simulador quanto do WhatsApp Real
    if (payload.event === 'message.received' || payload.event === 'onMessage') {
      const msg = payload.data; 
      
      const phone = msg.sender || msg.from;     
      const text = msg.body;        
      const isFromMe = msg.fromMe;  
      const isGroup = msg.isGroup || msg.isGroupMsg;  

      if (isFromMe || isGroup || !text) {
        return;
      }

      console.log(`\n[📥 Webhook] Mensagem recebida de ${phone}. Empilhando na fila...`);
      
      // PASSO 1: Delegação Segura (Fila BullMQ)
      await whatsappQueue.add('process-lead', { phone, text });
      
    }
  } catch (error) {
    console.error('❌ Erro Crítico no processamento do Webhook:', error);
  }
});

// ==========================================
// INICIALIZAÇÃO DO CÉREBRO
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🧠 [123MART BRAIN API] Inicializada com sucesso!
  📡 Escutando Webhooks na porta: ${PORT}
  🔗 Rota de Webhook: POST http://localhost:3000/webhook/openwa
  `);
});