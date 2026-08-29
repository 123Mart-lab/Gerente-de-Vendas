import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const newRoutes = `
let globalAuditTasks: any[] = [];

app.get('/api/marketing/audit-logs', (req, res) => {
  res.json(globalAuditTasks);
});

app.post('/api/marketing/orchestrate-optimization', async (req, res) => {
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
      const API_URL = \`https://api.nuvemshop.com.br/v1/\${storeId}\`;
      
      try {
        if (productId) {
          const response = await axios.get(\`\${API_URL}/products/\${productId}\`, {
            headers: { 'Authentication': \`bearer \${accessToken}\`, 'User-Agent': '123Mart AI Assistant' }
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
    
    const result = await aiService.runOrchestrationPipeline(payload);
    
    const dateStr = new Date().toLocaleString('pt-BR');
    
    // Save to globalAuditTasks
    globalAuditTasks.push({
      id: \`task-planner-\${Date.now()}\`,
      date: dateStr,
      productName: payload.name,
      receivedPrompt: 'Analise o produto para uso, argumentos de venda e dores.',
      sentResponse: result.planner,
      status: 'completed',
      role: 'planner'
    });
    
    globalAuditTasks.push({
      id: \`task-monitor-\${Date.now()}\`,
      date: dateStr,
      productName: payload.name,
      receivedPrompt: 'Crie um relatório de Oportunidades (Benchmark) e analise preços.',
      sentResponse: result.monitor,
      status: 'completed',
      role: 'monitor'
    });
    
    globalAuditTasks.push({
      id: \`task-seo-\${Date.now()}\`,
      date: dateStr,
      productName: payload.name,
      receivedPrompt: 'Crie otimização SEO: Título, Meta e Copy.',
      sentResponse: result.seo,
      status: 'completed',
      role: 'seo'
    });
    
    globalAuditTasks.push({
      id: \`task-art-\${Date.now()}\`,
      date: dateStr,
      productName: payload.name,
      receivedPrompt: 'Crie diretrizes visuais para banners focados em conversão.',
      sentResponse: result.art,
      status: 'completed',
      role: 'art'
    });
    
    res.json({ success: true, result });
    
  } catch (err: any) {
    console.error('Erro na orquestração:', err);
    res.status(500).json({ error: 'Erro na orquestração' });
  }
});

`;

content = content.replace("app.post('/api/marketing/optimize'", newRoutes + "app.post('/api/marketing/optimize'");

fs.writeFileSync('server.ts', content, 'utf8');
console.log('patched');
