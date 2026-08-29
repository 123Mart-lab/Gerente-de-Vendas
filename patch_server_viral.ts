import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const viralEndpoints = `
app.post('/api/marketing/viral-content', async (req, res) => {
  try {
    const { productData } = req.body;
    const result = await aiService.generateViralContent(productData);
    res.json(result);
  } catch (err: any) {
    console.error('Erro na geração de conteúdo viral:', err);
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
`;

if (!content.includes('/api/marketing/viral-content')) {
  content = content.replace("app.post('/api/marketing/market-research'", viralEndpoints + "\napp.post('/api/marketing/market-research'");
}

fs.writeFileSync('server.ts', content, 'utf8');
