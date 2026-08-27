const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
app.get('/api/marketing/products', async (req, res) => {
  try {
    const query = req.query.q as string;
    let creds = null;
    try {
      creds = await firebaseService.getNuvemshopCredentials();
    } catch (err) {}
    
    if (!creds) {
      return res.json([
        { id: 'mock-123', name: 'FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12" LINHA TOP CHEF' },
        { id: 'mock-124', name: 'CONJUNTO DE PANELAS ANTIADERENTE 5 PECAS' },
        { id: 'mock-125', name: 'CHURRASQUEIRA ELETRICA PORTATIL 220V' }
      ]);
    }
    
    const { default: axios } = await import('axios');
    const { storeId, accessToken } = creds;
    const API_URL = \`https://api.nuvemshop.com.br/v1/\${storeId}\`;
    
    const params: any = { per_page: 20 };
    if (query) {
      params.q = query;
    }
    
    const response = await axios.get(\`\${API_URL}/products\`, {
      headers: { 'Authentication': \`bearer \${accessToken}\`, 'User-Agent': '123Mart AI Assistant' },
      params
    });
    
    const simplificado = response.data.map((p: any) => ({
      id: p.id,
      name: p.name?.pt ?? (typeof p.name === 'string' ? p.name : 'Produto sem nome')
    }));
    
    res.json(simplificado);
  } catch (err: any) {
    console.error('Erro no /api/marketing/products:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.post('/api/marketing/optimize'`;

content = content.replace("app.post('/api/marketing/optimize'", newRoute);
fs.writeFileSync('server.ts', content);
