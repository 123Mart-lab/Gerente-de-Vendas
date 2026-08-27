const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
// ==========================================
// ROTA DE MARKETING / SEO
// ==========================================
app.post('/api/marketing/optimize', async (req, res) => {
  try {
    const { productId, query } = req.body;
    const creds = await firebaseService.getNuvemshopCredentials();
    if (!creds) {
      return res.status(403).json({ error: 'Nuvemshop não conectada' });
    }
    
    const { default: axios } = await import('axios');
    const { storeId, accessToken } = creds;
    
    // Busca o produto (por ID ou Query)
    const API_URL = \`https://api.nuvemshop.com.br/v1/\${storeId}\`;
    let produto;
    
    if (productId) {
      const response = await axios.get(\`\${API_URL}/products/\${productId}\`, {
        headers: { 'Authentication': \`bearer \${accessToken}\`, 'User-Agent': '123Mart AI Assistant' }
      });
      produto = response.data;
    } else if (query) {
      const response = await axios.get(\`\${API_URL}/products\`, {
        headers: { 'Authentication': \`bearer \${accessToken}\`, 'User-Agent': '123Mart AI Assistant' },
        params: { q: query, per_page: 1 }
      });
      if (response.data && response.data.length > 0) {
        produto = response.data[0];
      }
    }
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Simplifica o payload para a IA
    const payload = {
      id: produto.id,
      name: produto.name?.pt || produto.name,
      price: produto.variants?.[0]?.price,
      description: produto.description?.pt || produto.description || ''
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
`;

serverCode = serverCode.replace('// ==========================================\n// INICIALIZAÇÃO DO CÉREBRO', newRoute + '\n// ==========================================\n// INICIALIZAÇÃO DO CÉREBRO');
fs.writeFileSync('server.ts', serverCode);
