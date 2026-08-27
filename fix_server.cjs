const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeStart = code.indexOf("app.post('/api/marketing/optimize', async (req, res) => {");
const initStart = code.indexOf("// ==========================================\n// INICIALIZAÇÃO DO CÉREBRO");

const newRoute = `app.post('/api/marketing/optimize', async (req, res) => {
  try {
    const { productId, query } = req.body;
    const creds = await firebaseService.getNuvemshopCredentials();
    let produto;
    
    if (!creds) {
      console.log('⚠️ Nuvemshop não conectada. Retornando produto MOCK para testar a IA.');
      produto = {
        id: 'mock-123',
        name: query || 'FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12" LINHA TOP CHEF',
        variants: [{ price: '99.90' }],
        description: { pt: '' }
      };
    } else {
      const { default: axios } = await import('axios');
      const { storeId, accessToken } = creds;
      
      // Busca o produto (por ID ou Query)
      const API_URL = \`https://api.nuvemshop.com.br/v1/\${storeId}\`;
      
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
});\n\n`;

code = code.substring(0, routeStart) + newRoute + code.substring(initStart);
fs.writeFileSync('server.ts', code);
