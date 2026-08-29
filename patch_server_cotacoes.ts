import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
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
`;

if (!content.includes('/api/marketing/product-quotes')) {
  content = content.replace("app.post('/api/marketing/marketplace-trends'", newEndpoint + "\napp.post('/api/marketing/marketplace-trends'");
  fs.writeFileSync('server.ts', content, 'utf8');
}
