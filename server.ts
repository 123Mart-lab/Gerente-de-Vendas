import 'dotenv/config';
import express from 'express';
// Serviços que serão integrados no Passo 3
import { firebaseService } from './src/services/firebase.js';
import { aiService } from './src/services/ai.js';
import { openwaService } from './src/services/openwa.js';

const app = express();
const PORT = 3000;

// O Webhook do OpenWA pode ser pesado se enviar mídia em base64, então aumentamos o limite de JSON
app.use(express.json({ limit: '50mb' }));

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

      console.log(`\n[📥 Webhook] Mensagem recebida de ${phone}: "${text}"`);

      // ==========================================
      // PASSO 3 AQUI: 
      // 1. Buscar/Criar Lead no Firebase
      // 2. Chamar a IA (Gemini)
      // 3. Devolver a resposta via POST na API do OpenWA
      // ==========================================
      
      // 1. Recupera ou cria o Lead no Funil (Firebase)
      let lead = await firebaseService.getLead(phone);
      if (!lead) {
        lead = await firebaseService.createLead(phone);
      }
      
      // Salva a mensagem do usuário no histórico
      await firebaseService.saveMessage(phone, text, 'user');
      
      // Puxa o histórico de contexto
      const history = await firebaseService.getLeadHistory(phone);
      
      // 2. Cérebro em Ação: O Gemini vai analisar o texto, o histórico e o estágio atual.
      // Ele tem autonomia para consultar o TinyERP ou mudar o funil antes de formular o texto final.
      const aiResponseText = await aiService.generateResponse(phone, text, history, lead.pipelineStage);
      
      // 3. Responde via API Gateway (OpenWA)
      await openwaService.sendMessage(phone, aiResponseText);
      
      // 4. Salva o que a IA respondeu no banco
      await firebaseService.saveMessage(phone, aiResponseText, 'ai');
      
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
