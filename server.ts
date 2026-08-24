import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { startWhatsAppBot, getWhatsAppStatus } from './src/bot/whatsapp.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // PROTOCOLO DE SEGURANÇA: ANTI-SLEEP
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      engine: 'Baileys WebSockets Active',
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // ROTA DO QR CODE (PONTE FRONTEND-BACKEND)
  // ==========================================
  app.get('/api/whatsapp/status', (req, res) => {
    res.json(getWhatsAppStatus());
  });

  // ==========================================
  // INICIALIZAÇÃO DA ENGINE (WHATSAPP)
  // ==========================================
  console.log('Iniciando integração com WhatsApp...');
  startWhatsAppBot().catch(console.error);

  // ==========================================
  // MIDDLEWARE VITE (AMBIENTE DE DESENVOLVIMENTO)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // ==========================================
    // ROTAS DE PRODUÇÃO (SPA)
    // ==========================================
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor unificado (Backend + Frontend) rodando em http://localhost:${PORT}`);
    console.log(`📡 Rota Anti-Sleep ativa em http://localhost:${PORT}/api/health`);
  });
}

startServer();
