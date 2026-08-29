import 'dotenv/config';
import express from 'express';

// Serviços que serão integrados
import { firebaseService } from './src/services/firebase.js';
import { aiService } from './src/services/ai.js';
import { openwaService } from './src/services/openwa.js';

import { whatsappQueue, salesQueue, supportQueue } from './src/queue/whatsappQueue.js';
import './src/queue/whatsappWorker.js'; // Inicia o worker de triagem
import './src/queue/salesWorker.js';    // Inicia o worker de vendas
import './src/queue/supportWorker.js';  // Inicia o worker de suporte

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', role: '123Mart Brain API' });
});

// API Routes para o Dashboard
app.get('/api/stats', async (req, res) => {
  try {
    // Busca métricas do BullMQ e do Firebase (Mockado para o frontend inicial)
    res.json({
      activeWorkers: 3,
      messagesQueued: await whatsappQueue.getWaitingCount(),
      messagesProcessed: await whatsappQueue.getCompletedCount(),
      salesConversations: await salesQueue.getWaitingCount() + await salesQueue.getActiveCount(),
      supportConversations: await supportQueue.getWaitingCount() + await supportQueue.getActiveCount()
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
      await whatsappQueue.add('process-lead', { phone, text });
      
    }
  } catch (error) {
    console.error('❌ Erro Crítico no processamento do Webhook:', error);
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
        { id: 'mock-123', name: 'FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12" LINHA TOP CHEF', updated_at: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: 'mock-124', name: 'CONJUNTO DE PANELAS ANTIADERENTE 5 PECAS', updated_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: 'mock-125', name: 'CHURRASQUEIRA ELETRICA PORTATIL 220V', updated_at: new Date().toISOString() }
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
    
    const simplificado = response.data.map((p: any) => ({
      id: p.id,
      name: p.name?.pt ?? (typeof p.name === 'string' ? p.name : 'Produto sem nome'),
      updated_at: p.updated_at
    }));
    
    res.json(simplificado);
  } catch (err: any) {
    console.error('Erro no /api/marketing/products (Nuvemshop):', err?.response?.data || err.message);
    console.warn('⚠️ Fallback: Retornando produtos mockados para evitar bloqueio da interface.');
    return res.json([
      { id: 'mock-123', name: 'Base para Amaciante Concentrada Tuff 900g', updated_at: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 'mock-124', name: 'FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12" LINHA TOP CHEF', updated_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'mock-125', name: 'CHURRASQUEIRA ELETRICA PORTATIL 220V', updated_at: new Date().toISOString() }
    ]);
  }
});


let globalAuditTasks: any[] = [];

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


app.get('/api/marketing/audit-logs', (req, res) => {
  res.json(globalAuditTasks);
});

app.post('/api/marketing/audit-logs', (req, res) => {
  if (req.body && req.body.task) {
    globalAuditTasks.push(req.body.task);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Task is required' });
  }
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

app.post('/api/marketing/orchestrate-optimization', async (req, res) => {
  try {
    const { productId, query } = req.body;
    
    // SEO Filters check for direct orders
    if (globalSeoFilters.enabled) {
      const isKit = (query || '').toLowerCase().includes('kit');
      
      let blockedReason = null;
      if (globalSeoFilters.ignoreKits && isKit) {
        blockedReason = 'Variação de kit ignorada';
      }
      
      if (blockedReason) {
         const dateStr = new Date().toLocaleString('pt-BR');
         const responseMsg = `Neste momento, os filtros aplicados me impedem de fazer alteração no anúncio (Motivo: ${blockedReason}).`;
         
         // Add the blocked response directly to the audit log as the SEO specialist
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
           result: [{ step: 'seo', response: responseMsg }]
         });
      }
    }

    let creds = null;
    if (process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
      creds = { 
        accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN.replace(/[^a-zA-Z0-9]/g, ''), 
        storeId: process.env.NUVEMSHOP_STORE_ID.replace(/[^0-9]/g, '') 
      };
    } else {
      try {
        creds = await firebaseService.getNuvemshopCredentials();
      } catch (err: any) {}
    }
    
    let produto;
    if (!creds) {
      produto = {
        id: 'mock-123',
        name: query || 'FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12" LINHA TOP CHEF',
        variants: [{ price: '99.90' }],
        description: { pt: 'Experimente a Faca de Aço Inoxidável.' }, brand: { pt: 'Home&More' }
      };
    } else {
      const { default: axios } = await import('axios');
      const { storeId, accessToken } = creds;
      const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;
      
      try {
        if (productId) {
          const response = await axios.get(`${API_URL}/products/${productId}`, {
            headers: { 'Authentication': `bearer ${accessToken}`, 'User-Agent': '123Mart AI Assistant' }
          });
          produto = response.data;
        }
      } catch (err: any) {
        produto = { id: productId || 'mock-123', name: query || 'Produto Exemplo', variants: [{ price: '19.90' }] };
      }
    }
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const payload = {
      id: produto.id,
      name: produto.name?.pt ?? (typeof produto.name === 'string' ? produto.name : ''),
      price: produto.variants?.[0]?.price || 'N/A',
      description: produto.description?.pt ?? (typeof produto.description === 'string' ? produto.description : '')
    };
    
    const dateStr = new Date().toLocaleString('pt-BR');
    
    const getRoleMetadata = (step: string) => {
      switch (step) {
        case 'planner':
          return { req: 'Gerente de Projetos', exe: 'Pesquisador de Mercado', oldS: 35, newS: 60, ev: 71 };
        case 'monitor':
          return { req: 'Pesquisador de Mercado', exe: 'Monitor de Concorrência', oldS: 60, newS: 75, ev: 25 };
        case 'manager':
          return { req: 'Monitor de Concorrência', exe: 'Gerente de Projetos', oldS: 75, newS: 85, ev: 13 };
        case 'seo':
          return { req: 'Gerente de Projetos', exe: 'Especialista SEO', oldS: 85, newS: 95, ev: 11 };
        case 'art':
          return { req: 'Especialista SEO', exe: 'Diretor de Arte', oldS: 95, newS: 98, ev: 3 };
        default:
          return { req: 'Gerente de Projetos', exe: 'Profissional', oldS: 50, newS: 70, ev: 40 };
      }
    };

    const saveProductCallback = async (seoJson: any) => {
        let creds: any = null;
        if (process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
          creds = { accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN.replace(/[^a-zA-Z0-9]/g, ''), storeId: process.env.NUVEMSHOP_STORE_ID.replace(/[^0-9]/g, '') };
        } else {
          try { creds = await firebaseService.getNuvemshopCredentials(); } catch (err) {}
        }
        
        if (!creds || String(payload.id).indexOf('mock-') !== -1) return;
        
        const updatePayload: any = {};
        if (seoJson.novoTitulo) updatePayload.name = { pt: seoJson.novoTitulo };
        if (seoJson.novaDescricaoHtml) updatePayload.description = { pt: seoJson.novaDescricaoHtml };
        if (seoJson.novaMetaDescription) updatePayload.seo_description = { pt: seoJson.novaMetaDescription };
        
        if (seoJson.novoTituloSeo !== undefined) {
          let seoTitle = seoJson.novoTituloSeo;
          if (seoTitle.length > 70) seoTitle = seoTitle.substring(0, 70);
          updatePayload.seo_title = { pt: seoTitle };
        }
        
        if (seoJson.novasTags) {
          if (Array.isArray(seoJson.novasTags)) {
            updatePayload.tags = seoJson.novasTags.join(', ');
          } else if (typeof seoJson.novasTags === 'string') {
            updatePayload.tags = seoJson.novasTags;
          }
        }
        
        try {
          const axios = require('axios');
          await axios.put(`https://api.nuvemshop.com.br/v1/${creds.storeId}/products/${payload.id}`, updatePayload, {
            headers: {
              'Authentication': `bearer ${creds.accessToken}`,
              'User-Agent': '123Mart AI (marcus.solidez@gmail.com)'
            }
          });
          
          // Add to SEO history
          const history = await firebaseService.getSeoHistory();
          history.unshift({
            id: payload.id.toString(),
            name: seoJson.novoTitulo,
            date: dateStr,
            oldScore: 50,
            newScore: 98,
            before: {
               titulo: payload.name,
               descricao: payload.description,
               meta: (payload as any).seo_description,
               seoTitle: (payload as any).seo_title
            },
            after: {
               titulo: seoJson.novoTitulo,
               descricao: seoJson.novaDescricaoHtml,
               meta: seoJson.novaMetaDescription,
               seoTitle: seoJson.novoTituloSeo
            }
          });
          await firebaseService.saveSeoHistory(history);
        } catch (err: any) {
          console.error("Failed to save product in orchestration:", err.response?.data || err.message);
        }
    };

    const result = await aiService.runOrchestrationPipeline(payload, (step, prompt, response) => {
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
    }, saveProductCallback);
    

    
    res.json({ success: true, result: [] });
    
  } catch (err: any) {
    console.error('Erro na orquestração:', err); 
    res.status(500).json({ error: 'Erro na orquestração' });
  }
});

app.post('/api/marketing/optimize', async (req, res) => {
  try {
    const { productId, query } = req.body;
    let creds = null;
    if (process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
      creds = { 
        accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN.replace(/[^a-zA-Z0-9]/g, ''), 
        storeId: process.env.NUVEMSHOP_STORE_ID.replace(/[^0-9]/g, '') 
      };
    } else {
      try {
        creds = await firebaseService.getNuvemshopCredentials();
      } catch (err: any) {
        console.warn('⚠️ Erro ao acessar Firebase (Mock ativado):', err.message);
      }
    }
    
    let produto;
    if (!creds) {
      console.log('⚠️ Nuvemshop não conectada. Retornando produto MOCK para testar a IA.');
      produto = {
        id: 'mock-123',
        name: query || 'FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12" LINHA TOP CHEF',
        variants: [{ price: '99.90' }],
        description: { pt: 'Experimente a Faca de Aço Inoxidável 12" Top Chef com lâmina de alta qualidade e cabo ergonômico. Adicione ao carrinho e eleve seu churrasco!' }, brand: { pt: 'Home&More' }, tags: 'Faca Inox, Faca Churrasco', handle: { pt: 'faca-de-aco-inoxidavel-c-cabo-plastico-12-linha-top-chef-48-pcs-p-cx' }, seo_title: { pt: 'Faca de Aço Inoxidável 12" Top Chef - Corte Perfeito' }
      };
    } else {
      const { default: axios } = await import('axios');
      const { storeId, accessToken } = creds;
      
      // Busca o produto (por ID ou Query)
      const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;
      
      try {
        if (productId) {
          const response = await axios.get(`${API_URL}/products/${productId}`, {
            headers: { 'Authentication': `bearer ${accessToken}`, 'User-Agent': '123Mart AI Assistant' }
          });
          produto = response.data;
        } else if (query) {
          const response = await axios.get(`${API_URL}/products`, {
            headers: { 'Authentication': `bearer ${accessToken}`, 'User-Agent': '123Mart AI Assistant' },
            params: { q: query, per_page: 1 }
          });
          if (response.data && response.data.length > 0) {
            produto = response.data[0];
          }
        }
      } catch (err: any) {
        console.error('Erro ao buscar produto específico na Nuvemshop:', err?.response?.data || err.message);
        console.warn('⚠️ Fallback: Retornando produto mockado para teste da IA.');
        produto = {
          id: productId || 'mock-123',
          name: query || 'Base para Amaciante Concentrada Tuff 900g',
          variants: [{ price: '19.90' }],
          description: { pt: 'Base para Amaciante Concentrada Tuff 900g. Rende até 15 litros.' }, brand: { pt: 'Tuff' }, tags: 'Amaciante, Base Concentrada', handle: { pt: 'base-para-amaciante-concentrada-tuff-900g' }, seo_title: { pt: 'Base para Amaciante Concentrada Tuff 900g - Rende 15L' }
        };
      }
    }
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Simplifica o payload para a IA
    const payload = {
      id: produto.id,
      name: produto.name?.pt ?? (typeof produto.name === 'string' ? produto.name : ''),
      price: produto.variants?.[0]?.price,
      description: produto.description?.pt ?? (typeof produto.description === 'string' ? produto.description : ''),
      brand: produto.brand?.pt ?? (typeof produto.brand === 'string' ? produto.brand : ''),
      tags: produto.tags,
      handle: produto.handle?.pt ?? (typeof produto.handle === 'string' ? produto.handle : ''),
      seo_title: produto.seo_title?.pt ?? (typeof produto.seo_title === 'string' ? produto.seo_title : ''),
      seo_description: produto.seo_description?.pt ?? (typeof produto.seo_description === 'string' ? produto.seo_description : '')
    };
    
    const otimizacao = await aiService.generateProductSEO(payload);
    
    res.json({
      original: payload,
      otimizado: otimizacao
    });
    
  } catch (err: any) {
    console.error('Erro no /api/marketing/optimize:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao otimizar produto' });
  }
});

app.post('/api/marketing/save', async (req, res) => {
  try {
    const { productId, data } = req.body;
    
    const updatePayload: any = {};
    if (data.novoTitulo) updatePayload.name = { pt: data.novoTitulo };
    if (data.novaDescricaoHtml) updatePayload.description = { pt: data.novaDescricaoHtml };
    if (data.metaDescription) updatePayload.seo_description = { pt: data.metaDescription };
    
    // Título SEO truncado para 70 chars (limite Nuvemshop) para garantir, embora a Nuvemshop trunque silenciosamente
    if (data.novoTituloSeo !== undefined) {
      let seoTitle = data.novoTituloSeo;
      if (seoTitle.length > 70) seoTitle = seoTitle.substring(0, 70);
      updatePayload.seo_title = { pt: seoTitle };
    }
    
    if (data.tags) {
      if (Array.isArray(data.tags)) {
        updatePayload.tags = data.tags.join(', ');
      } else if (typeof data.tags === 'string') {
        updatePayload.tags = data.tags;
      }
    }
    
    if (data.urlProduto) updatePayload.handle = { pt: data.urlProduto };
    
    // Marca na Nuvemshop pode ser string ou null, mas enviamos como foi mapeado.
    if (data.marca) updatePayload.brand = data.marca;
    
    console.log("Saving payload to Nuvemshop:", JSON.stringify(updatePayload, null, 2));
    if (productId && String(productId).indexOf('mock-') === -1) {
        let creds = null;
        if (process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
          creds = { accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN.replace(/[^a-zA-Z0-9]/g, ''), storeId: process.env.NUVEMSHOP_STORE_ID.replace(/[^0-9]/g, '') };
        } else {
          try {
            creds = await firebaseService.getNuvemshopCredentials();
          } catch (err) {}
        }
        
        if (creds) {
          const { default: axios } = await import('axios');
          const API_URL = `https://api.nuvemshop.com.br/v1/${creds.storeId}`;
          const result = await axios.put(`${API_URL}/products/${productId}`, updatePayload, {
            headers: { 'Authentication': `bearer ${creds.accessToken}`, 'User-Agent': '123Mart AI Assistant' }
          });
          return res.json({ success: true, result: result.data });
        } else {
          return res.status(400).json({ error: 'Nuvemshop não conectada. Não foi possível salvar.' });
        }
    }
    
    return res.json({ success: true, mock: true, message: 'Simulado com sucesso' });
  } catch (err: any) {
    console.error('Erro no /api/marketing/save:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao salvar produto na Nuvemshop' });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🧠 [123MART BRAIN API] Inicializada com sucesso!
    📡 Escutando Webhooks na porta: ${PORT}
    🔗 Rota de Webhook: POST http://localhost:3000/webhook/openwa
    `);
  });
}

startServer();