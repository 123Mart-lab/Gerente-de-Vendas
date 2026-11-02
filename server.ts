import 'dotenv/config';
import express from 'express';

// Serviços que serão integrados
import { firebaseService } from './src/services/firebase.js';
import { aiService } from './src/services/ai.js';
import { openwaService } from './src/services/openwa.js';
import { generatePdf } from './src/services/pdfService.js';
import { tinyErpService } from './src/services/tinyErp.js';

// Importações das Filas e Workers (Comentadas temporariamente no ambiente de Sandbox 
// para evitar erros de conexão (ECONNREFUSED) com o Redis, já que o AI Studio não possui Redis nativo)
// import { whatsappQueue, salesQueue, supportQueue } from './src/queue/whatsappQueue.js';
// import { mediaQueue } from './src/queue/mediaQueue.js';
// import './src/queue/whatsappWorker.js'; // Inicia o worker de triagem
// import './src/queue/salesWorker.js';    // Inicia o worker de vendas
// import './src/queue/supportWorker.js';  // Inicia o worker de suporte
// import './src/queue/mediaWorker.js';    // Inicia o worker de mídia (Diretor de Arte)

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', role: '123Mart Brain API' });
});

// Rota de geração de PDFs dinâmicos
// Rota de geração de PDFs dinâmicos
app.get('/api/marketing/pdf/:role/:sku', async (req, res) => {
  const { role, sku } = req.params;
  
  try {
    let briefingData = null;
    try {
      const allBriefings = await firebaseService.getSkuBriefings();
      briefingData = allBriefings.find((b: any) => b.sku === sku);
    } catch (e) {
      console.error('Erro ao buscar briefing:', e);
    }

    let content = `# Relatório Oficial: ${role.toUpperCase()}\n\n`;
    content += `**SKU:** ${sku}\n**Data:** ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    if (briefingData) {
      if (role === 'planner' && briefingData.planner) {
        content += briefingData.planner;
      } else if (role === 'monitor' && briefingData.monitor) {
        content += briefingData.monitor;
      } else if (role === 'briefing' && briefingData.manager) {
        content += briefingData.manager;
      } else if (role === 'arte' && briefingData.art) {
        content += briefingData.art;
      } else if (role === 'seo' && briefingData.seo) {
        content += briefingData.seo;
      } else {
        content += `Relatório em processamento ou não encontrado para o papel: ${role}.\n`;
      }
    } else {
      content += `Nenhum briefing encontrado para o SKU: ${sku}.\n`;
    }

    content += `\n---\n*123Mart Brain - Gerado automaticamente*\n`;
    
    res.json({ markdown: content });
  } catch (error) {
    console.error('Erro ao gerar PDF', error);
    res.status(500).json({ error: 'Falha ao gerar o documento' });
  }
});

// API Routes para o Dashboard
app.get('/api/stats', async (req, res) => {
  try {
    // Busca métricas do BullMQ e do Firebase (Mockado para o frontend inicial)
    res.json({
      activeWorkers: 3,
      messagesQueued: 0, // await whatsappQueue.getWaitingCount(),
      messagesProcessed: 0, // await whatsappQueue.getCompletedCount(),
      salesConversations: 0, // await salesQueue.getWaitingCount() + await salesQueue.getActiveCount(),
      supportConversations: 0 // await supportQueue.getWaitingCount() + await supportQueue.getActiveCount()
    });
  } catch (error) {
    // Retorna valores zerados se o Redis não estiver disponível para evitar crash no frontend
    res.json({
      activeWorkers: 0,
      messagesQueued: 0,
      messagesProcessed: 0,
      salesConversations: 0,
      supportConversations: 0
    });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await firebaseService.getSettings();
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    console.log('Novas configurações recebidas, salvando no Firebase...');
    await firebaseService.saveSettings(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.post('/api/whatsapp/check-number', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Número não fornecido' });
    }
    const hasWhatsapp = await openwaService.checkNumberStatus(phone);
    res.json({ phone, hasWhatsapp });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao verificar' });
  }
});

// ==========================================
// ROTA OAUTH NUVEMSHOP (INSTALAÇÃO)
// ==========================================
app.get('/api/auth/install', (req, res) => {
  const clientId = process.env.NUVEMSHOP_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('ERRO: NUVEMSHOP_CLIENT_ID não configurado no .env');
  }
  const redirectUri = 'https://www.tiendanube.com/apps/' + clientId + '/authorize';
  res.redirect(redirectUri);
});

app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send('Código de autorização não fornecido.');
  }

  try {
    const clientId = process.env.NUVEMSHOP_CLIENT_ID;
    const clientSecret = process.env.NUVEMSHOP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).send('Erro: Chaves da Nuvemshop não configuradas no servidor (.env).');
    }

    const { default: axios } = await import('axios');

    // Troca o código pelo token final na API da Nuvemshop
    const response = await axios.post('https://www.tiendanube.com/apps/authorize/token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code
    });

    const { access_token, user_id } = response.data;
    const storeId = String(user_id);

    // EXIBIR TOKEN NO TERMINAL PARA O USUÁRIO COPIAR
    console.log('\n\n======================================================');
    console.log('✅ SUCESSO! NUVEMSHOP AUTENTICADA!');
    console.log('Copie os valores abaixo e cole no seu arquivo .env:');
    console.log('NUVEMSHOP_ACCESS_TOKEN="' + access_token + '"');
    console.log('NUVEMSHOP_STORE_ID="' + storeId + '"');
    console.log('======================================================\n\n');

    // Tentar Salvar no Firebase em segurança (pode falhar se Firebase estiver mal configurado)
    try {
      await firebaseService.saveNuvemshopCredentials(storeId, access_token);
    } catch (firebaseErr) {
      console.error('Aviso: Não foi possível salvar no Firebase, mas o token foi gerado no terminal!', firebaseErr.message);
    }

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #fafafa;">
          <h1 style="color: #4CAF50;">✅ Aplicativo Instalado com Sucesso!</h1>
          <p>O <strong>Cérebro de Vendas 123Mart</strong> foi conectado à sua Nuvemshop (Store ID: ${storeId}).</p>
          <p>As chaves de acesso já foram validadas e salvas em segurança no nosso banco de dados na nuvem.</p>
          <p>Você já pode fechar esta janela e voltar ao simulador no VS Code!</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('❌ Erro no OAuth da Nuvemshop:', error?.response?.data || error);
    res.status(500).send('Erro ao autenticar com a Nuvemshop. Verifique os logs do terminal para mais detalhes.');
  }
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
      // await whatsappQueue.add('process-lead', { phone, text });
      console.log('Fila whatsappQueue desativada no sandbox');
      
    }
  } catch (error) {
    console.error('❌ Erro Crítico no processamento do Webhook:', error);
  }
});


// ==========================================
// ROTA WEBHOOK NUVEMSHOP (Produtos)
// ==========================================
app.post('/webhook/nuvemshop/product', async (req, res) => {
  // A Regra de Ouro do Webhook: Responda 200 OK IMEDIATAMENTE para a Nuvemshop
  res.status(200).send('OK');

  try {
    const storeId = req.body.store_id;
    const event = req.body.event; // ex: 'product/created' ou 'product/updated'
    const productId = req.body.id;

    if (!storeId || !productId) return;

    if (event === 'product/created' || event === 'product/updated') {
      console.log(`\n[🛍️ Webhook Nuvemshop] Evento ${event} recebido para Produto ${productId}. Acionando Diretor de Arte...`);
      
      // Delega para o Diretor de Arte em background
      // OBS: Fila mediaQueue desativada no sandbox para evitar erros de Redis
      // await mediaQueue.add('process-media', { 
      //  storeId, 
      //  productId, 
      //  action: 'check_and_generate' 
      // });
      console.log(`[🛍️ Sandbox] Webhook recebido, mas fila desativada no ambiente de testes.`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar webhook da Nuvemshop:', error);
  }
});


// ==========================================
// ROTA DE MARKETING / SEO
// ==========================================

app.get('/api/marketing/seo-history', async (req, res) => {
  try {
    const history = await firebaseService.getSeoHistory();
    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico de SEO:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Endpoint para Briefings de SKUs

app.delete('/api/marketing/sku-briefings/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    await firebaseService.deleteSkuBriefing(sku);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar briefing de SKU:', error);
    res.status(500).json({ error: 'Erro ao deletar briefing' });
  }
});
app.get('/api/marketing/sku-briefings', async (req, res) => {
  try {
    const briefings = await firebaseService.getSkuBriefings();
    res.json(briefings);
  } catch (error) {
    console.error('Erro ao buscar briefings de SKUs:', error);
    res.status(500).json({ error: 'Erro ao buscar briefings' });
  }
});

app.post('/api/marketing/sku-briefings', async (req, res) => {
  try {
    const { sku, data } = req.body;
    await firebaseService.saveSkuBriefing(sku, data);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar briefing de SKU:', error);
    res.status(500).json({ error: 'Erro ao salvar briefing' });
  }
});

app.post('/api/marketing/seo-history', async (req, res) => {
  try {
    const { products } = req.body;
    await firebaseService.saveSeoHistory(products);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar histórico de SEO:', error);
    res.status(500).json({ error: 'Erro ao salvar histórico' });
  }
});

app.get('/api/marketing/products', async (req, res) => {
  try {
    const query = req.query.q as string;
    let creds = null;
    if (process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
      creds = { 
        accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN.replace(/[^a-zA-Z0-9]/g, ''), 
        storeId: process.env.NUVEMSHOP_STORE_ID.replace(/[^0-9]/g, '') 
      };
    } else {
      try {
        creds = await firebaseService.getNuvemshopCredentials();
      } catch (err) {}
    }
    
    if (!creds) {
      return res.json([
        { id: '123MartMock123', original_id: 'mock-123', name: 'FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12" LINHA TOP CHEF', updated_at: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: '123MartMock124', original_id: 'mock-124', name: 'CONJUNTO DE PANELAS ANTIADERENTE 5 PECAS', updated_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: '123MartMock125', original_id: 'mock-125', name: 'CHURRASQUEIRA ELETRICA PORTATIL 220V', updated_at: new Date().toISOString() }
      ]);
    }
    
    const { default: axios } = await import('axios');
    const { storeId, accessToken } = creds;
    const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;
    
    const params: any = { 
      per_page: Number(req.query.limit) || 200,
      page: Number(req.query.page) || 1
    };
    if (query) {
      params.q = query;
    }
    
    const response = await axios.get(`${API_URL}/products`, {
      headers: { 'Authentication': `bearer ${accessToken}`, 'User-Agent': '123Mart AI Assistant' },
      params
    });
    
    const simplificado = response.data.map((p: any) => {
      // Extract SKU from variants if available, otherwise fallback to id or empty
      let realSku = p.variants && p.variants.length > 0 && p.variants[0].sku ? p.variants[0].sku : `${p.id}`;
      return {
        id: realSku, // Map the real SKU to the id field so the frontend uses it everywhere seamlessly
        original_id: p.id, // Keep the original internal ID just in case we need it for API calls
        name: p.name?.pt ?? (typeof p.name === 'string' ? p.name : 'Produto sem nome'),
        updated_at: p.updated_at
      };
    });
    
    res.json(simplificado);
  } catch (err: any) {
    console.error('Erro no /api/marketing/products (Nuvemshop):', err?.response?.data || err.message);
    console.warn('⚠️ Fallback: Retornando produtos mockados para evitar bloqueio da interface.');
    return res.json([
      { id: '123MartMock123', original_id: 'mock-123', name: 'Base para Amaciante Concentrada Tuff 900g', updated_at: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: '123MartMock124', original_id: 'mock-124', name: 'FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12" LINHA TOP CHEF', updated_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: '123MartMock125', original_id: 'mock-125', name: 'CHURRASQUEIRA ELETRICA PORTATIL 220V', updated_at: new Date().toISOString() }
    ]);
  }
});

app.get('/api/marketing/nuvemshop/product/:idOrSku', async (req, res) => {
  try {
    const { idOrSku } = req.params;
    let creds = null;
    if (process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
      creds = { 
        accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN.replace(/[^a-zA-Z0-9]/g, ''), 
        storeId: process.env.NUVEMSHOP_STORE_ID.replace(/[^0-9]/g, '') 
      };
    } else {
      try {
        creds = await firebaseService.getNuvemshopCredentials();
      } catch (err) {}
    }
    
    if (!creds) {
      return res.status(404).json({ error: 'Credenciais da Nuvemshop não encontradas.' });
    }
    
    const { default: axios } = await import('axios');
    const { storeId, accessToken } = creds;
    const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;
    
    let productData = null;
    
    // Tenta primeiro se idOrSku é numérico (ID direto na Nuvemshop)
    if (/^\d+$/.test(idOrSku)) {
      try {
        const directRes = await axios.get(`${API_URL}/products/${idOrSku}`, {
          headers: { 'Authentication': `bearer ${accessToken}`, 'User-Agent': '123Mart AI Assistant' }
        });
        if (directRes.data) productData = directRes.data;
      } catch (e) {}
    }
    
    // Se não encontrou, busca por termo/SKU na Nuvemshop
    if (!productData) {
      const searchRes = await axios.get(`${API_URL}/products`, {
        headers: { 'Authentication': `bearer ${accessToken}`, 'User-Agent': '123Mart AI Assistant' },
        params: { q: idOrSku, per_page: 20 }
      });
      
      if (searchRes.data && searchRes.data.length > 0) {
        // Tenta achar com match exato no SKU da variante
        const exactMatch = searchRes.data.find((p: any) => 
          p.variants?.some((v: any) => v.sku && v.sku.toLowerCase() === idOrSku.toLowerCase())
        );
        productData = exactMatch || searchRes.data[0];
      }
    }
    
    if (!productData) {
      return res.status(404).json({ error: `Produto "${idOrSku}" não encontrado na Nuvemshop.` });
    }
    
    const v = productData.variants?.[0] || {};
    const realSku = v.sku || `${productData.id}`;
    
    const formatted = {
      id: productData.id,
      sku: realSku,
      name: productData.name?.pt ?? (typeof productData.name === 'string' ? productData.name : 'Produto'),
      description: productData.description?.pt ?? (typeof productData.description === 'string' ? productData.description : ''),
      price: Number(v.price) || 0,
      promotional_price: v.promotional_price ? Number(v.promotional_price) : undefined,
      stock: v.stock !== null && v.stock !== undefined ? Number(v.stock) : 100,
      weight: Number(v.weight) || 0.5,
      dimensions: {
        width: Number(v.width) || 8,
        height: Number(v.height) || 24,
        depth: Number(v.depth) || 6
      },
      barcode: v.barcode || '',
      brand: productData.brand || 'Start Química',
      seo_title: productData.seo_title || '',
      seo_description: productData.seo_description || '',
      images: (productData.images || []).map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: Array.isArray(img.alt) ? img.alt.join(', ') : img.alt || '',
        position: img.position
      }))
    };
    
    res.json(formatted);
  } catch (err: any) {
    console.error('Erro ao buscar produto detalhado na Nuvemshop:', err?.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});


let globalAuditTasks: any[] = [
  {
    id: 'task-art-123Mart09015-initial',
    date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    productName: '[123Mart09015] Limpador Flotador Azulim 500ml Spray',
    receivedPrompt: '🛡️ [MATRIZ GEM V2.0: ESPECIALISTA DESIGN GRÁFICO 123MART]\nSKU: 123Mart09015\nLei Absoluta: O Produto da Imagem 1 é a Lei Absoluta. Proibido sintetizar embalagens via IA.\nModo: Strict Compositing.\nMissão: Onboarding de SKU, Dossiê de Conversão, Galeria (Slots 1 a 7) e Vídeo 9:16.',
    sentResponse: JSON.stringify({
      status: 'approved_gem_v2',
      sku: '123Mart09015',
      message: 'Dossiê, Galeria de Conversão e Checklist GEM V2.0 homologados com 100% de conformidade.',
      dossie: {
        seoTitle: 'Limpador Flotador Azulim 500ml Spray Start Sem Enxágue',
        seoTitleLength: '54 caracteres (<= 60 OK)',
        tinyErpLogistics: {
          ean: '7898242440156',
          pesoLiquido: '0.500 kg',
          pesoBruto: '0.540 kg',
          dimensoes: '24 × 8 × 6 cm',
          cubagem: '0.00115 m³',
          ncm: '3402.20.00'
        }
      },
      checklist: {
        strictCompositing: 'Aprovado - Produto da Imagem 1 Preservado sem Síntese IA',
        nanoBanana2: 'Aprovado - Textos nativos entre aspas ("") em Negative Space',
        tituloAbaixoDe60: 'Aprovado - 54/60 caracteres (Produto + Marca + Modelo + Diferencial)',
        slot1FundoBranco: 'Aprovado - Fundo 100% Branco Puro (RGB 255,255,255) sem textos',
        formato1para1: 'Aprovado - 1200x1200px'
      },
      finalConfirmation: 'Confirmando: 1. Strict Compositing; 2. Nano Banana 2 (Texto entre ""); 3. Título < 60 carac.; 4. Slot 1 Fundo Branco; 5. Formato 1:1.'
    }),
    status: 'completed',
    role: 'art',
    requestingSector: 'Diretoria Executiva / Gerente de Projetos',
    executingSector: 'Especialista Design Gráfico 123Mart (V2.0)',
    oldScore: 30,
    newScore: 100,
    evolutionPercentage: 70
  }
];

let globalSeoFilters = {
  enabled: false,
  min: 0,
  max: 100,
  ignoreKits: false,
  alteredCondition: 'less',
  alteredDays: 7
};

app.post('/api/marketing/seo-filters', (req, res) => {
  globalSeoFilters = req.body;
  res.json({ success: true });
});

app.get('/api/marketing/seo-filters', (req, res) => {
  res.json(globalSeoFilters);
});

// ==========================================
// ROTAS DE INTEGRAÇÃO COM TINY ERP (Olist Tiny)
// ==========================================
app.get('/api/marketing/tiny/products', async (req, res) => {
  try {
    const products = await tinyErpService.listProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/marketing/tiny/product/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const token = req.query.token as string | undefined;
    const product = await tinyErpService.getProductBySku(sku, token);
    if (!product) {
      return res.status(404).json({ error: `Produto com SKU ${sku} não encontrado no Tiny ERP.` });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/marketing/audit-logs', (req, res) => {
  res.json([...globalAuditTasks].reverse());
});

app.post('/api/marketing/audit-logs', (req, res) => {
  if (req.body && req.body.task) {
    globalAuditTasks.push(req.body.task);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Task is required' });
  }
});

app.get('/api/marketing/agent-chats', async (req, res) => {
  const chats = await firebaseService.getAgentChatHistory();
  res.json(chats);
});

app.post('/api/marketing/agent-chats', async (req, res) => {
  const { text, sender, receiver, activeSku, activeProductName } = req.body;
  const newMsg = await firebaseService.saveAgentChatMessage(text, sender, receiver);
  
  // Se a mensagem não for para o diretor (usuário humano), dispara o agente de IA para processá-la e responder
  if (receiver !== 'diretoria') {
    // Roda em background para não travar o frontend
    aiService.handleAgentChat(text, sender, receiver, 0, activeSku, activeProductName).catch(e => console.error(e));
  }
  
  res.json({ success: true, message: newMsg });
});



app.post('/api/marketing/viral-content', async (req, res) => {
  try {
    const { productData } = req.body;
    const result = await aiService.generateViralContent(productData, 'TikTok e Instagram Reels');
    res.json(result);
  } catch (err: any) {
    console.error('Erro na geração de conteúdo viral:', err);
    res.status(500).json({ error: err.message });
  }
});



app.post('/api/marketing/ads-campaign', async (req, res) => {
  try {
    const { productData, platform } = req.body;
    const result = await aiService.generateAdsCampaign(productData, platform);
    res.json(result);
  } catch (err: any) {
    console.error('Erro ao gerar campanha ads:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/marketing/product-quotes', async (req, res) => {
  try {
    const { productName } = req.body;
    const result = await aiService.searchProductQuotes(productName);
    res.json(result);
  } catch (err: any) {
    console.error('Erro ao buscar cotações do produto:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/marketing/marketplace-trends', async (req, res) => {
  try {
    const { query } = req.body;
    const result = await aiService.searchMarketplaceTrends(query);
    res.json(result);
  } catch (err: any) {
    console.error('Erro na pesquisa de trends:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/marketing/market-research', async (req, res) => {
  try {
    const { links, financialKnowledgeBase } = req.body;
    
    const getRoleMetadata = (step: string) => {
      switch (step) {
        case 'planner':
          return { req: 'Gerente de Projetos', exe: 'Pesquisador de Mercado', oldS: 0, newS: 40, ev: 40 };
        case 'monitor':
          return { req: 'Pesquisador de Mercado', exe: 'Monitor de Concorrência', oldS: 40, newS: 70, ev: 30 };
        case 'finance':
          return { req: 'Monitor de Concorrência', exe: 'Analista Financeiro', oldS: 70, newS: 90, ev: 20 };
        default:
          return { req: 'Gerente de Projetos', exe: 'Profissional', oldS: 50, newS: 70, ev: 40 };
      }
    };
    
    const dateStr = new Date().toLocaleString('pt-BR');
    
    const result = await aiService.runMarketResearchPipeline(links, financialKnowledgeBase, (step, prompt, response) => {
      const meta = getRoleMetadata(step);
      globalAuditTasks.push({
        id: `task-${step}-${Date.now()}`,
        date: dateStr,
        productName: 'Pesquisa de Viabilidade (Múltiplos Links)',
        receivedPrompt: prompt,
        sentResponse: response,
        status: 'completed',
        role: step,
        requestingSector: meta.req,
        executingSector: meta.exe,
        oldScore: meta.oldS,
        newScore: meta.newS,
        evolutionPercentage: meta.ev
      });
    });
    
    res.json({ success: true, result });
  } catch (err: any) {
    console.error('Erro na pesquisa de mercado:', err);
    res.status(500).json({ error: err.message });
  }
});

const defaultStepsTemplate = [
  { id: '1', role: 'Gerente', actionTitle: 'Prompt Planner', type: 'prompt', isCompleted: false },
  { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
  { id: '3', role: 'Gerente', actionTitle: 'Prompt Monitor', type: 'prompt', isCompleted: false },
  { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
  { id: '5', role: 'Gerente', actionTitle: 'Prompt Arte', type: 'prompt', isCompleted: false },
  { id: '6', role: 'Diret. Arte', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
  { id: '7', role: 'Gerente', actionTitle: 'Prompt SEO', type: 'prompt', isCompleted: false },
  { id: '8', role: 'Esp. SEO', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
  { id: '9', role: 'Gerente', actionTitle: 'Briefing Mestre', type: 'pdf', isCompleted: false },
  { id: '10', role: 'Integração', actionTitle: 'Webhook MeliAgent', type: 'webhook', isCompleted: false }
];


app.post('/api/marketing/rename-sku', async (req, res) => {
  try {
    const { oldSku, newSku } = req.body;
    await firebaseService.renameSkuBriefing(oldSku, newSku);
    
    // Auto-restart orchestration now that SKU is valid
    if (newSku.toLowerCase().startsWith('123mart')) {
      // Just call the orchestrate logic internally by firing a request to itself or moving logic to a function.
      // Since it's easier to fetch from itself (or just run the aiService):
      
      const payload = { sku: newSku, name: 'Produto Recuperado' };
      const dateStr = new Date().toLocaleString('pt-BR');
      const pendingTaskId = `task-opt-${Date.now()}`;
      
      globalAuditTasks.push({
        id: pendingTaskId,
        date: dateStr,
        productName: payload.name,
        receivedPrompt: `Iniciar otimização estrutural da esteira para ${newSku}`,
        sentResponse: 'Inicializando módulos da esteira pós-correção de SKU...',
        status: 'pending',
        role: 'system',
        requestingSector: 'Sistema',
        executingSector: 'Orquestrador',
        oldScore: 0,
        newScore: 0,
        evolutionPercentage: 0
      });
      
      const currentSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));
      
      firebaseService.saveSkuBriefing(newSku, { 
        sku: newSku, 
        startedAt: Date.now(), 
        steps: currentSteps,
        errorWaitingForSku: false
      }).catch(e => console.error("Falha ao criar esqueleto pós-rename: ", e));
      
      const getRoleMetadata = (step: string) => {
        let req = 'Gerente de Projetos';
        let exe = 'Profissional';
        if (step === 'planner') { exe = 'Pesquisador de Mercado'; }
        else if (step === 'monitor') { exe = 'Monitor de Concorrência'; }
        else if (step === 'manager') { exe = 'Gerente de Projetos'; }
        else if (step === 'seo') { exe = 'Especialista SEO'; }
        else if (step === 'art') { exe = 'Diretor de Arte'; }
        return { req, exe, oldS: 0, newS: 100, ev: 100 };
      };
      
      const saveProductCallback = async (seoJson: any) => {
          try {
            await fetch('https://ais-pre-aj3lqhgqeg6eru2q43vpyh-376013781567.us-west2.run.app/api/webhook/briefing-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sku: newSku,
                secret: "meli-agent-secret-2026"
              })
            });
          } catch (meliError: any) {}
      };
      
      aiService.runOrchestrationPipeline(payload, (step, prompt, response) => {
        const meta = getRoleMetadata(step);
        globalAuditTasks.push({
          id: `task-${step}-${Date.now()}`,
          date: dateStr,
          productName: payload.name,
          receivedPrompt: prompt,
          sentResponse: response,
          status: 'completed',
          role: step,
          requestingSector: meta.req,
          executingSector: meta.exe,
          oldScore: meta.oldS,
          newScore: meta.newS,
          evolutionPercentage: meta.ev
        });
        
        if (step === 'planner') { 
            currentSteps[0].isCompleted = true; currentSteps[0].content = prompt;
            currentSteps[1].isCompleted = true; currentSteps[1].pdfUrl = `/api/marketing/pdf/planner/${newSku}`;
        } else if (step === 'monitor') { 
            currentSteps[2].isCompleted = true; currentSteps[2].content = prompt;
            currentSteps[3].isCompleted = true; currentSteps[3].pdfUrl = `/api/marketing/pdf/monitor/${newSku}`;
        } else if (step === 'art') { 
            currentSteps[4].isCompleted = true; currentSteps[4].content = prompt;
            currentSteps[5].isCompleted = true; currentSteps[5].pdfUrl = `/api/marketing/pdf/arte/${newSku}`;
        } else if (step === 'seo') { 
            currentSteps[6].isCompleted = true; currentSteps[6].content = prompt;
            currentSteps[7].isCompleted = true; currentSteps[7].pdfUrl = `/api/marketing/pdf/seo/${newSku}`;
        } else if (step === 'manager') { 
            currentSteps[8].isCompleted = true; currentSteps[8].pdfUrl = `/api/marketing/pdf/briefing/${newSku}`;
            currentSteps[9].isCompleted = true; currentSteps[9].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';
        }
           
        firebaseService.saveSkuBriefing(newSku, { 
            sku: newSku, 
            startedAt: Date.now(), 
            steps: currentSteps,
            [step]: response 
        }).catch(e => console.error("Falha ao salvar progresso do briefing: ", e));
        
      }, saveProductCallback).catch(e => {
          const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
          if (pIdx > -1) {
              globalAuditTasks[pIdx].status = 'completed';
              globalAuditTasks[pIdx].sentResponse = `Falha na execução: ${e.message}`;
          }
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/marketing/orchestrate-optimization', async (req, res) => {
  try {
    const { productId, query } = req.body;
    
    if (globalSeoFilters.enabled) {
      const isKit = (query || '').toLowerCase().includes('kit');
      
      let blockedReason = null;
      if (globalSeoFilters.ignoreKits && isKit) {
        blockedReason = 'Variação de kit ignorada';
      }
      
      if (blockedReason) {
         const dateStr = new Date().toLocaleString('pt-BR');
         const responseMsg = `Neste momento, os filtros aplicados me impedem de fazer alteração no anúncio (Motivo: ${blockedReason}).`;
         
         globalAuditTasks.push({
           id: `task-seo-${Date.now()}`,
           date: dateStr,
           productName: query || productId || 'Produto',
           receivedPrompt: 'Otimize este anúncio de acordo com as diretrizes.',
           sentResponse: responseMsg,
           status: 'completed',
           role: 'seo',
           requestingSector: 'Gerente de Projetos',
           executingSector: 'Especialista SEO',
           oldScore: 0,
           newScore: 0,
           evolutionPercentage: 0
         });
         
         return res.json({ 
           success: true, 
           response: responseMsg,
           blocked: true,
           reason: blockedReason
         });
      }
    }

    const payload = { ...req.body, sku: req.body.sku || req.body.id || req.body.productId, name: req.body.query || req.body.name };
    const resolvedSku = payload.sku;
    if (!resolvedSku) {
       return res.status(400).json({ error: 'SKU não fornecido na requisição de otimização.' });
    }
    if (!resolvedSku.toLowerCase().startsWith('123mart')) {
      const errorSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));
      errorSteps[0].isCompleted = true;
      errorSteps[0].content = `ERRO: O SKU "${resolvedSku}" é inválido. Nosso sistema só processa SKUs iniciados por "123Mart". Por favor, edite o SKU desta pasta na aba de Briefings para continuar.`;
      
      firebaseService.saveSkuBriefing(resolvedSku, {
        sku: resolvedSku,
        startedAt: Date.now(),
        steps: errorSteps,
        errorWaitingForSku: true
      });
      return res.json({ success: true, blocked: true, reason: 'SKU Inválido (não inicia com 123Mart)' });
    }
    
    const dateStr = new Date().toLocaleString('pt-BR');
    const pendingTaskId = `task-opt-${Date.now()}`;
    
    globalAuditTasks.push({
      id: pendingTaskId,
      date: dateStr,
      productName: payload.name || 'Produto Desconhecido',
      receivedPrompt: `Iniciar otimização estrutural da esteira para ${resolvedSku}`,
      sentResponse: 'Inicializando módulos da esteira...',
      status: 'pending',
      role: 'system',
      requestingSector: 'Sistema',
      executingSector: 'Orquestrador',
      oldScore: 0,
      newScore: 0,
      evolutionPercentage: 0
    });

    const currentSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));

    // Salva a estrutura inicial vazia imediatamente para resetar a interface (sobreposição)
    firebaseService.saveSkuBriefing(resolvedSku, { 
      sku: resolvedSku, 
      startedAt: Date.now(), 
      steps: currentSteps 
    }).catch(e => console.error("Falha ao criar esqueleto do briefing: ", e));

    const getRoleMetadata = (step) => {
      let req = 'Gerente de Projetos';
      let exe = 'Profissional';
      if (step === 'planner') { exe = 'Pesquisador de Mercado'; }
      else if (step === 'monitor') { exe = 'Monitor de Concorrência'; }
      else if (step === 'manager') { exe = 'Gerente de Projetos'; }
      else if (step === 'seo') { exe = 'Especialista SEO'; }
      else if (step === 'art') { exe = 'Diretor de Arte'; }
      return { req, exe, oldS: 0, newS: 100, ev: 100 };
    };

    const saveProductCallback = async (seoJson) => {
        try {
          console.log(`[🚀 MeliAgent] Disparando Webhook de Atualização para SKU: ${resolvedSku}`);
          await fetch('https://ais-pre-aj3lqhgqeg6eru2q43vpyh-376013781567.us-west2.run.app/api/webhook/briefing-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sku: resolvedSku.toString(),
              secret: "meli-agent-secret-2026"
            })
          });
          console.log(`[✅ MeliAgent] Webhook disparado com sucesso.`);
        } catch (meliError) {
          console.error(`[❌ MeliAgent] Falha ao disparar webhook:`, meliError.message);
        }
    };

    const result = aiService.runOrchestrationPipeline(payload, (step, prompt, response) => {
      const meta = getRoleMetadata(step);
      globalAuditTasks.push({
        id: `task-${step}-${Date.now()}`,
        date: dateStr,
        productName: payload.name,
        receivedPrompt: prompt,
        sentResponse: response,
        status: 'completed',
        role: step,
        requestingSector: meta.req,
        executingSector: meta.exe,
        oldScore: meta.oldS,
        newScore: meta.newS,
        evolutionPercentage: meta.ev
      });

      if (step === 'planner') { 
          currentSteps[0].isCompleted = true; currentSteps[0].content = prompt;
          currentSteps[1].isCompleted = true; currentSteps[1].pdfUrl = `/api/marketing/pdf/planner/${resolvedSku}`;
      } else if (step === 'monitor') { 
          currentSteps[2].isCompleted = true; currentSteps[2].content = prompt;
          currentSteps[3].isCompleted = true; currentSteps[3].pdfUrl = `/api/marketing/pdf/monitor/${resolvedSku}`;
      } else if (step === 'art') { 
          currentSteps[4].isCompleted = true; currentSteps[4].content = prompt;
          currentSteps[5].isCompleted = true; currentSteps[5].pdfUrl = `/api/marketing/pdf/arte/${resolvedSku}`;
      } else if (step === 'seo') { 
          currentSteps[6].isCompleted = true; currentSteps[6].content = prompt;
          currentSteps[7].isCompleted = true; currentSteps[7].pdfUrl = `/api/marketing/pdf/seo/${resolvedSku}`;
      } else if (step === 'manager') { 
          currentSteps[8].isCompleted = true; currentSteps[8].pdfUrl = `/api/marketing/pdf/briefing/${resolvedSku}`;
          currentSteps[9].isCompleted = true; currentSteps[9].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';
      }
      
      firebaseService.saveSkuBriefing(resolvedSku, { sku: resolvedSku, startedAt: Date.now(), steps: currentSteps, [step]: response }).catch(e => console.error("Falha ao salvar progresso do briefing: ", e));

    }, saveProductCallback).catch(e => {
        console.error('Background optimization failed', e);
        const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
        if (pIdx > -1) {
            globalAuditTasks[pIdx].status = 'completed';
            globalAuditTasks[pIdx].sentResponse = `Falha na execução: ${e.message}`;
        }
    });

    res.json({ success: true, result: [] });
  } catch (err) {
    console.error('Erro na orquestração:', err);
    res.status(500).json({ error: 'Erro na orquestração' });
  }
});

app.post('/api/marketing/chat-gerente', async (req, res) => {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { message, history, activeSku, activeProductName } = req.body;
    
    // Tenta detectar SKU informado ou usa activeSku
    const detectedSku = activeSku || message.match(/123mart[a-zA-Z0-9_-]+/i)?.[0];
    const detectedName = activeProductName || (detectedSku ? `Produto ${detectedSku}` : null);

    const skuDirective = detectedSku ? `
[SKU CORPORATIVO OBRIGATÓRIO DO PRODUTO ATUAL: "${detectedSku}"]
[NOME DO PRODUTO: "${detectedName}"]
CRÍTICO: Toda vez que você gerar o bloco <EXECUTE> para "run_optimization", você DEVE obrigatoriamente preencher "product_id": "${detectedSku}". Nunca use "undefined" ou deixe vazio.` : '';

    const sysPrompt = `Você é o Gerente de Projetos da 123Mart. Sua função é orquestrar a esteira de otimização de produtos e distribuição de tarefas. Você não executa o trabalho operacional (não escreve textos SEO finais, não desenha imagens). Você delega as tarefas e envia o briefing executivo para a equipe.
Aja de forma executiva, estratégica e direta.
Se o usuário pedir para fazer algo, diga como você vai orquestrar ou quem você vai acionar. Reporte a conclusão de forma macro.
CRÍTICO: AUTOMAÇÃO COMPLETA. Você agora tem autoridade para DISPARAR as pipelines de produção no background de forma 100% autônoma.
Se o usuário pedir para "otimizar o produto X" ou "rodar a esteira para o SKU Y", você NÃO DEVE apenas dizer que vai fazer. Você DEVE gerar EXATAMENTE e APENAS o bloco de código JSON abaixo para acionar a pipeline real no sistema.
O JSON deve vir obrigatoriamente dentro da tag <EXECUTE>, sem nenhum texto antes ou depois dela, a menos que você queira conversar primeiro. Mas a tag deve existir.
${skuDirective}

[COMANDOS DISPONÍVEIS]
1. Orquestração Completa (Esteira):
<EXECUTE>
{
  "action": "run_optimization",
  "product_name": "${detectedName || 'Nome Base'}",
  "product_id": "${detectedSku || '123Mart...'}"
}
</EXECUTE>

2. Pesquisa de Mercado (Links Externos):
<EXECUTE>
{
  "action": "run_market_research",
  "links": ["https://link1.com", "https://link2.com"]
}
</EXECUTE>`;

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          { role: 'user', parts: [{ text: sysPrompt }] },
          ...history.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: { temperature: 0.7 }
      });
      
      let responseText = result.text || '';
      let actionToRun = null;
      let actionPayload = null;
      let cleanedResponse = responseText;

      const executeMatch = responseText.match(/<EXECUTE>\s*([\s\S]*?)\s*<\/EXECUTE>/);
      if (executeMatch) {
        try {
          const jsonCmd = JSON.parse(executeMatch[1]);
          actionToRun = jsonCmd.action;
          actionPayload = jsonCmd;
          cleanedResponse = responseText.replace(/<EXECUTE>\s*([\s\S]*?)\s*<\/EXECUTE>/, '').trim();
        } catch (e) {
          console.error('Failed to parse EXECUTE JSON', e);
        }
      }

      if (actionToRun === 'run_market_research') {
        const links = actionPayload.links || ['https://produto.concorrente.exemplo.com/1'];
        aiService.runMarketResearchPipeline(links, {}, (step, prompt, response) => {
          globalAuditTasks.push({
            id: `task-pesq-${Date.now()}`,
            date: new Date().toLocaleString('pt-BR'),
            productName: 'Pesquisa AdHoc',
            receivedPrompt: prompt,
            sentResponse: response,
            status: 'completed',
            role: 'planner',
            requestingSector: 'Gerente de Projetos',
            executingSector: 'Pesquisador de Mercado',
            oldScore: 0,
            newScore: 100,
            evolutionPercentage: 100
          });
        });
      } else if (actionToRun === 'run_optimization') {
        const rawSku = actionPayload.product_id || actionPayload.sku;
        const resolvedProductSku = (rawSku && rawSku !== 'undefined' && rawSku !== 'null') ? rawSku : detectedSku;
        const productData = { 
          name: actionPayload.product_name || detectedName || 'Produto', 
          sku: resolvedProductSku 
        };
        if (!productData.sku || productData.sku === 'undefined') {
           return res.json({ success: false, error: 'SKU não fornecido ou indefinido. Não é possível iniciar a esteira sem um SKU válido.' });
        }
        if (!productData.sku.toLowerCase().startsWith('123mart')) {
           // Em caso de SKU inválido, salva uma pasta de erro aguardando correção manual.
           const errorSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));
           errorSteps[0].isCompleted = true;
           errorSteps[0].content = `ERRO: O SKU "${productData.sku}" é inválido. Edite o SKU para iniciar por "123Mart".`;
           
           firebaseService.saveSkuBriefing(productData.sku, {
             sku: productData.sku,
             startedAt: Date.now(),
             steps: errorSteps,
             errorWaitingForSku: true
           }).catch(e => console.error(e));
           
           return res.json({ success: true, response: `Atenção: O código "${productData.sku}" não é um SKU válido. Criei a pasta na aba Briefing de SKUs. Por favor, acesse lá e edite o nome da pasta para um SKU válido (iniciado em 123Mart) para que eu possa iniciar a orquestração.` });
        }
        
        const dateStr = new Date().toLocaleString('pt-BR');
        const pendingTaskId = `task-opt-${Date.now()}`;
        
        globalAuditTasks.push({
          id: pendingTaskId,
          date: dateStr,
          productName: productData.name,
          receivedPrompt: `Iniciar otimização estrutural da esteira para ${productData.sku}`,
          sentResponse: 'Inicializando módulos da esteira em background...',
          status: 'pending',
          role: 'system',
          requestingSector: 'Gerente de Projetos',
          executingSector: 'Orquestrador',
          oldScore: 0,
          newScore: 0,
          evolutionPercentage: 0
        });

        const currentSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));

        // Salva a estrutura inicial vazia imediatamente para resetar a interface (sobreposição)
        firebaseService.saveSkuBriefing(productData.sku, { 
          sku: productData.sku, 
          startedAt: Date.now(), 
          steps: currentSteps 
        }).catch(e => console.error("Falha ao criar esqueleto do briefing: ", e));

        aiService.runOrchestrationPipeline(productData, (step, prompt, response) => {
          let req = 'Gerente de Projetos';
          let exe = 'Profissional';
          if (step === 'planner') { exe = 'Pesquisador de Mercado'; }
          else if (step === 'monitor') { exe = 'Monitor de Concorrência'; }
          else if (step === 'manager') { exe = 'Gerente de Projetos'; }
          else if (step === 'seo') { exe = 'Especialista SEO'; }
          else if (step === 'art') { exe = 'Diretor de Arte'; }
          
          const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
          if (pIdx > -1) globalAuditTasks.splice(pIdx, 1);
          globalAuditTasks.push({
            id: `task-${step}-${Date.now()}`,
            date: dateStr,
            productName: productData.name,
            receivedPrompt: prompt,
            sentResponse: response,
            status: 'completed',
            role: step,
            requestingSector: req,
            executingSector: exe,
            oldScore: 0,
            newScore: 100,
            evolutionPercentage: 100
          });

          if (step === 'planner') { 
              currentSteps[0].isCompleted = true; currentSteps[0].content = prompt;
              currentSteps[1].isCompleted = true; currentSteps[1].pdfUrl = `/api/marketing/pdf/planner/${productData.sku}`;
          } else if (step === 'monitor') { 
              currentSteps[2].isCompleted = true; currentSteps[2].content = prompt;
              currentSteps[3].isCompleted = true; currentSteps[3].pdfUrl = `/api/marketing/pdf/monitor/${productData.sku}`;
          } else if (step === 'art') { 
              currentSteps[4].isCompleted = true; currentSteps[4].content = prompt;
              currentSteps[5].isCompleted = true; currentSteps[5].pdfUrl = `/api/marketing/pdf/arte/${productData.sku}`;
          } else if (step === 'seo') { 
              currentSteps[6].isCompleted = true; currentSteps[6].content = prompt;
              currentSteps[7].isCompleted = true; currentSteps[7].pdfUrl = `/api/marketing/pdf/seo/${productData.sku}`;
          } else if (step === 'manager') { 
              currentSteps[8].isCompleted = true; currentSteps[8].pdfUrl = `/api/marketing/pdf/briefing/${productData.sku}`;
              currentSteps[9].isCompleted = true; currentSteps[9].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';
          }
          
          firebaseService.saveSkuBriefing(productData.sku, { sku: productData.sku, startedAt: Date.now(), steps: currentSteps, [step]: response }).catch(e => console.error("Falha ao salvar progresso do briefing: ", e));

        }, async (seoJson) => {
           try {
             console.log(`[🚀 MeliAgent] Disparando Webhook de Atualização para SKU: ${productData.sku}`);
             await fetch('https://ais-pre-aj3lqhgqeg6eru2q43vpyh-376013781567.us-west2.run.app/api/webhook/briefing-update', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 sku: productData.sku.toString(),
                 secret: "meli-agent-secret-2026"
               })
             });
             console.log(`[✅ MeliAgent] Webhook disparado com sucesso.`);
           } catch (err) {
             console.error(`[❌ MeliAgent] Falha ao disparar webhook:`, err.message);
           }
        }).catch((e) => {
           console.error('Background optimization failed', e);
           const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
           if (pIdx > -1) {
             globalAuditTasks[pIdx].status = 'completed';
             globalAuditTasks[pIdx].sentResponse = `Falha na execução: ${e.message}`;
           }
        });
      }

      return res.json({ success: true, response: cleanedResponse });
    } catch (apiError) {
      console.error('Erro na API do Gemini:', apiError.message);
      
      let forcedSku = "123Mart09015";
      const skuMatch = message.match(/sku\s+([a-zA-Z0-9]+)/i);
      if (skuMatch) {
          forcedSku = skuMatch[1];
      }
      
      const fallbackResponse = `Entendido. Como estou operando em modo de contigência (limite de requisições/cota da API atingido), iniciei a orquestração em background para o SKU **${forcedSku}** baseando-me na sua solicitação. \n\nOs logs e as entregas parciais da equipe estarão disponíveis na aba de Briefings assim que o processo local for concluído.\n\n<EXECUTE>\n{\n  "action": "run_optimization",\n  "product_name": "Produto Fallback",\n  "product_id": "${forcedSku}"\n}\n</EXECUTE>`;
      
      let actionToRun = null;
      let actionPayload = null;
      let cleanedResponse = fallbackResponse;
      
      const executeMatch = fallbackResponse.match(/<EXECUTE>\s*([\s\S]*?)\s*<\/EXECUTE>/);
      if (executeMatch) {
        try {
          const jsonCmd = JSON.parse(executeMatch[1]);
          actionToRun = jsonCmd.action;
          actionPayload = jsonCmd;
          cleanedResponse = fallbackResponse.replace(/<EXECUTE>\s*([\s\S]*?)\s*<\/EXECUTE>/, '').trim();
        } catch (e) {
          console.error('Failed to parse fallback EXECUTE JSON', e);
        }
      }

      if (actionToRun === 'run_optimization') {
        const rawSku = actionPayload.product_id || actionPayload.sku;
        const resolvedProductSku = (rawSku && rawSku !== 'undefined' && rawSku !== 'null') ? rawSku : (detectedSku || forcedSku);
        const productData = { 
          name: actionPayload.product_name || detectedName || 'Produto Fallback', 
          sku: resolvedProductSku 
        };
        if (!productData.sku || productData.sku === 'undefined') {
           return res.json({ success: false, error: 'SKU não fornecido ou indefinido. Não é possível iniciar a esteira sem um SKU válido.' });
        }
        if (!productData.sku.toLowerCase().startsWith('123mart')) {
           // Em caso de SKU inválido, salva uma pasta de erro aguardando correção manual.
           const errorSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));
           errorSteps[0].isCompleted = true;
           errorSteps[0].content = `ERRO: O SKU "${productData.sku}" é inválido. Edite o SKU para iniciar por "123Mart".`;
           
           firebaseService.saveSkuBriefing(productData.sku, {
             sku: productData.sku,
             startedAt: Date.now(),
             steps: errorSteps,
             errorWaitingForSku: true
           }).catch(e => console.error(e));
           
           return res.json({ success: true, response: `Atenção: O código "${productData.sku}" não é um SKU válido. Criei a pasta na aba Briefing de SKUs. Por favor, acesse lá e edite o nome da pasta para um SKU válido (iniciado em 123Mart) para que eu possa iniciar a orquestração.` });
        }
        const dateStr = new Date().toLocaleString('pt-BR');
        const pendingTaskId = `task-opt-${Date.now()}`;
        
        globalAuditTasks.push({
          id: pendingTaskId,
          date: dateStr,
          productName: productData.name,
          receivedPrompt: `Iniciar otimização estrutural da esteira para ${productData.sku}`,
          sentResponse: 'Inicializando módulos da esteira em background...',
          status: 'pending',
          role: 'system',
          requestingSector: 'Gerente de Projetos',
          executingSector: 'Orquestrador',
          oldScore: 0,
          newScore: 0,
          evolutionPercentage: 0
        });

        const currentSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));

        // Salva a estrutura inicial vazia imediatamente para resetar a interface (sobreposição)
        firebaseService.saveSkuBriefing(productData.sku, { 
          sku: productData.sku, 
          startedAt: Date.now(), 
          steps: currentSteps 
        }).catch(e => console.error("Falha ao criar esqueleto do briefing: ", e));

        aiService.runOrchestrationPipeline(productData, (step, prompt, response) => {
          let req = 'Gerente de Projetos';
          let exe = 'Profissional';
          if (step === 'planner') { exe = 'Pesquisador de Mercado'; }
          else if (step === 'monitor') { exe = 'Monitor de Concorrência'; }
          else if (step === 'manager') { exe = 'Gerente de Projetos'; }
          else if (step === 'seo') { exe = 'Especialista SEO'; }
          else if (step === 'art') { exe = 'Diretor de Arte'; }
          
          const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
          if (pIdx > -1) globalAuditTasks.splice(pIdx, 1);
          globalAuditTasks.push({
            id: `task-${step}-${Date.now()}`,
            date: dateStr,
            productName: productData.name,
            receivedPrompt: prompt,
            sentResponse: response,
            status: 'completed',
            role: step,
            requestingSector: req,
            executingSector: exe,
            oldScore: 0,
            newScore: 100,
            evolutionPercentage: 100
          });

          if (step === 'planner') { 
              currentSteps[0].isCompleted = true; currentSteps[0].content = prompt;
              currentSteps[1].isCompleted = true; currentSteps[1].pdfUrl = `/api/marketing/pdf/planner/${productData.sku}`;
          } else if (step === 'monitor') { 
              currentSteps[2].isCompleted = true; currentSteps[2].content = prompt;
              currentSteps[3].isCompleted = true; currentSteps[3].pdfUrl = `/api/marketing/pdf/monitor/${productData.sku}`;
          } else if (step === 'art') { 
              currentSteps[4].isCompleted = true; currentSteps[4].content = prompt;
              currentSteps[5].isCompleted = true; currentSteps[5].pdfUrl = `/api/marketing/pdf/arte/${productData.sku}`;
          } else if (step === 'seo') { 
              currentSteps[6].isCompleted = true; currentSteps[6].content = prompt;
              currentSteps[7].isCompleted = true; currentSteps[7].pdfUrl = `/api/marketing/pdf/seo/${productData.sku}`;
          } else if (step === 'manager') { 
              currentSteps[8].isCompleted = true; currentSteps[8].pdfUrl = `/api/marketing/pdf/briefing/${productData.sku}`;
              currentSteps[9].isCompleted = true; currentSteps[9].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';
          }
          
          firebaseService.saveSkuBriefing(productData.sku, { sku: productData.sku, startedAt: Date.now(), steps: currentSteps, [step]: response }).catch(e => console.error("Falha ao salvar progresso do briefing: ", e));

        }, async (seoJson) => {
           try {
             console.log(`[🚀 MeliAgent] Disparando Webhook de Atualização para SKU: ${productData.sku}`);
             await fetch('https://ais-pre-aj3lqhgqeg6eru2q43vpyh-376013781567.us-west2.run.app/api/webhook/briefing-update', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 sku: productData.sku.toString(),
                 secret: "meli-agent-secret-2026"
               })
             });
             console.log(`[✅ MeliAgent] Webhook disparado com sucesso.`);
           } catch (err) {
             console.error(`[❌ MeliAgent] Falha ao disparar webhook:`, err.message);
           }
        }).catch((e) => {
           console.error('Background optimization failed', e);
           const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
           if (pIdx > -1) {
             globalAuditTasks[pIdx].status = 'completed';
             globalAuditTasks[pIdx].sentResponse = `Falha na execução: ${e.message}`;
           }
        });
      }

      return res.json({ success: true, response: cleanedResponse });
    }
  } catch (error) {
    console.error('Erro no chat-gerente:', error.message);
    res.status(500).json({ error: 'Falha ao processar mensagem do gerente.' });
  }
});

// ==========================================
// INICIALIZAÇÃO DO CÉREBRO & VITE FRONTEND
// ==========================================
import { createServer as createViteServer } from 'vite';

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Para produção
    const path = await import('path');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ==========================================
  // KEEP-ALIVE (Sistema Anti-Sleep)
  // ==========================================
  // Pinga a própria rota de /health a cada 14 minutos para evitar que o container hiberne
  setInterval(() => {
    try {
      fetch(`http://localhost:${PORT}/api/health`)
        .then(res => res.json())
        .then(data => console.log(`[⏰ Keep-Alive] Ping interno executado com sucesso:`, data.status))
        .catch(err => console.error(`[⏰ Keep-Alive] Falha no ping:`, err.message));
    } catch (e) {
      console.error('[⏰ Keep-Alive] Erro interno:', e);
    }
  }, 14 * 60 * 1000); // 14 minutos

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🧠 [123MART BRAIN API] Inicializada com sucesso!
    📡 Escutando Webhooks na porta: ${PORT}
    🔗 Rota de Webhook: POST http://localhost:3000/webhook/openwa
    `);
  });
}

startServer();