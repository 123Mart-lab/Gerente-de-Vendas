const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

const regex = /const creds = await firebaseService\.getNuvemshopCredentials\(\);[\s\S]*?let produto;\s*if \(productId\) \{[\s\S]*?\} else if \(query\) \{[\s\S]*?\}\s*\}/;

const replacement = `const creds = await firebaseService.getNuvemshopCredentials();
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
    }`;

serverCode = serverCode.replace(regex, replacement);
fs.writeFileSync('server.ts', serverCode);
