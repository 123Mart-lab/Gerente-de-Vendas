import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';

export let waConnectionStatus: 'disconnected' | 'qr' | 'connected' = 'disconnected';
export let waQrCodeBase64: string | null = null;
let globalSock: any = null;

export const getWhatsAppStatus = () => ({
  status: waConnectionStatus,
  qrCodeBase64: waQrCodeBase64
});

export async function logoutWhatsApp() {
  if (globalSock) {
    try {
      await globalSock.logout();
    } catch (err) {
      console.error('Erro ao fazer logout do Baileys:', err);
    }
  }
  
  waConnectionStatus = 'disconnected';
  waQrCodeBase64 = null;
  
  try {
    const fs = await import('fs');
    fs.rmSync('./auth_info_baileys', { recursive: true, force: true });
  } catch (e) {
    console.error('Erro ao limpar pasta de autenticação:', e);
  }
  
  // Reinicia a engine para gerar novo QR Code
  startWhatsAppBot();
  return { success: true };
}

export async function startWhatsAppBot() {
  // Protocolo Disco Persistente: mapeamento direto para a pasta local
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

  // Protocolo Zero Chromium: Conexão estrita via WebSockets
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // Crucial para o Passo 3 (teste local)
    logger: pino({ level: 'silent' }) as any, // Silencia logs de rede massivos
    browser: ['123Mart Bot', 'Chrome', '2.0.0']
  });
  
  globalSock = sock;

  // Salva as credenciais sempre que houver alteração
  sock.ev.on('creds.update', saveCreds);

  // Monitoramento de conexão
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      waConnectionStatus = 'qr';
      try {
        waQrCodeBase64 = await QRCode.toDataURL(qr);
      } catch (err) {
        console.error('Erro ao gerar Base64 do QR Code', err);
      }
    }

    if (connection === 'close') {
      waConnectionStatus = 'disconnected';
      waQrCodeBase64 = null;
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexão WhatsApp encerrada. Motivo:', lastDisconnect?.error);
      
      if (shouldReconnect) {
        console.log('Reconectando...');
        startWhatsAppBot();
      } else {
        console.log('Desconectado. Delete a pasta auth_info_baileys e leia o QR code novamente.');
      }
    } else if (connection === 'open') {
      waConnectionStatus = 'connected';
      waQrCodeBase64 = null;
      console.log('✅ WhatsApp Engine Conectado com Sucesso!');
    }
  });

  // Listener principal do fluxo CRM Omnichannel
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    
    // Ignora mensagens enviadas pelo próprio bot, mensagens de status ou sem corpo de texto
    if (msg.key.fromMe || !msg.message || msg.key.remoteJid === 'status@broadcast') return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const phone = msg.key.remoteJid;
    
    if (text && phone) {
      console.log(`[📩 Nova Mensagem] ${phone}: ${text}`);

      try {
        // Carrega dinamicamente os serviços (evita erro de inicialização cíclica)
        const { firebaseService } = await import('../services/firebase.js');
        const { aiService } = await import('../services/ai.js');

        // 1. Garante que o Lead existe no Firebase e pega a etapa atual
        const lead = await firebaseService.getOrCreateLead(phone);
        
        // 2. Salva a mensagem recebida no Firebase
        await firebaseService.saveMessage(phone, text, 'user');
        
        // 3. Recupera o histórico de chat daquele número para dar contexto ao bot
        const history = await firebaseService.getChatHistory(phone);

        // 4. O Cérebro (Gemini) gera a resposta baseada no histórico e no Markdown da etapa atual
        // Se a pipeline não existir no banco, assumimos '01_prospeccao'
        const pipelineStage = lead.pipelineStage || '01_prospeccao';
        const botResponse = await aiService.generateResponse(phone, text, history, pipelineStage);

        // 5. Envia a resposta de volta ao WhatsApp do cliente
        await sock.sendMessage(phone, { text: botResponse });
        console.log(`[🤖 Resposta Bot] ${phone}: ${botResponse}`);

        // 6. Salva a resposta gerada pelo bot no Firebase
        await firebaseService.saveMessage(phone, botResponse, 'bot');
        
      } catch (err) {
        console.error('❌ Erro no processamento principal da mensagem CRM:', err);
      }
    }
  });
}
