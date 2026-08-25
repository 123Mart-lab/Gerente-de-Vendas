import 'dotenv/config';
import express from 'express';
// Serviços que serão integrados no Passo 3
import { firebaseService } from './src/services/firebase.js';
import { aiService } from './src/services/ai.js';
import { openwaService } from './src/services/openwa.js';
import { whatsappQueue } from './src/queue/whatsappQueue.js';
import './src/queue/whatsappWorker.js'; // Inicia o worker de triagem
import './src/queue/salesWorker.js';    // Inicia o worker de vendas
import './src/queue/supportWorker.js';  // Inicia o worker de suporte

const app = express();
const PORT = 3000;

// O Webhook do OpenWA pode ser pesado se enviar mídia em base64, então aumentamos o limite de JSON
app.use(express.json({ limit: '50mb' }));

// ==========================================
// 0. ROTA RAIZ (Para o Preview do AI Studio)
// ==========================================
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <h1 style="color: #38bdf8;">🧠 123Mart Brain API</h1>
        <p>Servidor Stateless de Inteligência Artificial operando perfeitamente.</p>
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #334155;">
          <strong>Status das Rotas:</strong><br>
          <span style="color: #4ade80;">🟢 GET</span> <a href="/api/health" style="color: #60a5fa;">/api/health</a> (Monitoramento)<br>
          <span style="color: #4ade80;">🟢 POST</span> /webhook/openwa (Recepção do WhatsApp)
        </div>
        <p style="margin-top: 30px; font-size: 0.9em; color: #94a3b8;">Nota: O Dashboard visual do WhatsApp está rodando no seu Docker local (porta 2785).</p>
      </body>
    </html>
  `);
});

// ==========================================
// 1. ROTA DE MONITORAMENTO (HEALTH CHECK)
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    role: '123Mart Brain API (Stateless)',
    engine: 'Waiting for OpenWA Webhooks'
  });
});

// ==========================================
// 2. ROTA CENTRAL DE WEBHOOK (OPENWA)
// ==========================================
app.post('/webhook/openwa', async (req, res) => {
  // A Regra de Ouro dos Webhooks: Sempre responda 200 OK IMEDIATAMENTE.
  // Isso impede que o OpenWA ache que nosso servidor caiu e fique re-enviando a mesma mensagem.
  res.status(200).send('OK');

  try {
    const payload = req.body;
    
    // Filtra apenas eventos de mensagem recebida
    if (payload.event === 'message.received') {
      const msg = payload.data; // O OpenWA envia os dados dentro do nó "data"
      
      // Extração dos campos conforme a documentação do OpenWA
      const phone = msg.sender;     // Ex: 551199999999@c.us
      const text = msg.body;        // Texto da mensagem
      const isFromMe = msg.fromMe;  // Booleano se fomos nós que enviamos
      const isGroup = msg.isGroup;  // Booleano se a mensagem veio de um grupo

      // Barreira de Segurança: Não processar mensagens enviadas por nós mesmos, de grupos, ou sem texto.
      if (isFromMe || isGroup || !text) {
        return;
      }

      console.log(`\n[📥 Webhook] Mensagem recebida de ${phone}. Empilhando na fila...`);

      // ==========================================
      // PASSO 1: Delegação Segura (Fila BullMQ)
      // ==========================================
      
      // Empurra o payload para o Redis.
      // O Gerente (Worker) puxará a mensagem automaticamente.
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
