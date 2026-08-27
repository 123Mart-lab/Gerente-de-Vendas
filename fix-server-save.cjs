const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldSave = `app.post('/api/marketing/save', async (req, res) => {
  try {
    const { productId, data } = req.body;
    
    // Converter os dados de SEO gerados para o payload esperado pela Nuvemshop
    const updatePayload: any = {};
    
    if (data.novoTitulo) updatePayload.name = { pt: data.novoTitulo };
    if (data.novaDescricaoHtml) updatePayload.description = { pt: data.novaDescricaoHtml };
    if (data.metaDescription) updatePayload.seo_description = data.metaDescription;
    if (data.novoTitulo) updatePayload.seo_title = data.novoTitulo;
    if (data.tags) updatePayload.tags = data.tags;
    if (data.marca) updatePayload.brand = data.marca;
    
    // Tratamento: Nuvemshop API aceita ID do produto. Se não for mock, tenta salvar.
    if (productId && !productId.startsWith('mock-')) {
        const result = await nuvemshopService.updateProduct(productId, updatePayload);
        return res.json({ success: true, result });
    }
    
    return res.json({ success: true, mock: true, message: 'Simulado com sucesso' });
  } catch (err: any) {
    console.error('Erro no /api/marketing/save:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao salvar produto na Nuvemshop' });
  }
});`;

const newSave = `app.post('/api/marketing/save', async (req, res) => {
  try {
    const { productId, data } = req.body;
    
    const updatePayload: any = {};
    if (data.novoTitulo) updatePayload.name = { pt: data.novoTitulo };
    if (data.novaDescricaoHtml) updatePayload.description = { pt: data.novaDescricaoHtml };
    if (data.metaDescription) updatePayload.seo_description = data.metaDescription;
    if (data.novoTitulo) updatePayload.seo_title = data.novoTitulo;
    if (data.tags) updatePayload.tags = data.tags;
    if (data.marca) updatePayload.brand = data.marca;
    
    if (productId && String(productId).indexOf('mock-') === -1) {
        let creds = null;
        try {
          creds = await firebaseService.getNuvemshopCredentials();
        } catch (err) {}
        
        if (creds) {
          const { default: axios } = await import('axios');
          const API_URL = \`https://api.nuvemshop.com.br/v1/\${creds.storeId}\`;
          const result = await axios.put(\`\${API_URL}/products/\${productId}\`, updatePayload, {
            headers: { 'Authentication': \`bearer \${creds.accessToken}\`, 'User-Agent': '123Mart AI Assistant' }
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
});`;

if (content.includes("!productId.startsWith('mock-')")) {
  content = content.replace(oldSave, newSave);
  fs.writeFileSync('server.ts', content);
  console.log("Server save route updated");
} else {
  console.log("Could not find the exact save route to replace.");
}
