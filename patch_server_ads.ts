import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
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
`;

if (!content.includes('/api/marketing/ads-campaign')) {
  content = content.replace("app.post('/api/marketing/product-quotes'", newEndpoint + "\napp.post('/api/marketing/product-quotes'");
  fs.writeFileSync('server.ts', content, 'utf8');
}
