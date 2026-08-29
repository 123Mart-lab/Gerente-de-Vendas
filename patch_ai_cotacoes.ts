import fs from 'fs';
let content = fs.readFileSync('src/services/ai.ts', 'utf8');

const cotacoesFunction = `
  async searchProductQuotes(productName: string) {
    const prompt = \`Você é um Robô de Automação de Cotações (Scraper), equivalente ao repositório "cotacoes_google_buscape".
Sua missão é simular uma busca em tempo real por cotações de preços do produto: "\${productName}" no Google Shopping e no Buscapé.

Retorne ESTRITAMENTE um JSON puro no seguinte formato (invente dados extremamente realistas baseados no preço atual de mercado desse produto no Brasil):
{
  "minPrice": 0.00,
  "maxPrice": 0.00,
  "averagePrice": 0.00,
  "googleShopping": [
    { "store": "Nome da Loja", "price": 0.00, "link": "https://shopping.google.com/..." }
  ],
  "buscape": [
    { "store": "Nome da Loja", "price": 0.00, "link": "https://www.buscape.com.br/..." }
  ]
}\`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              minPrice: { type: "NUMBER" },
              maxPrice: { type: "NUMBER" },
              averagePrice: { type: "NUMBER" },
              googleShopping: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    store: { type: "STRING" },
                    price: { type: "NUMBER" },
                    link: { type: "STRING" }
                  },
                  required: ["store", "price", "link"]
                }
              },
              buscape: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    store: { type: "STRING" },
                    price: { type: "NUMBER" },
                    link: { type: "STRING" }
                  },
                  required: ["store", "price", "link"]
                }
              }
            },
            required: ["minPrice", "maxPrice", "averagePrice", "googleShopping", "buscape"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao buscar cotações:', err);
      throw err;
    }
  },
\`;

if (!content.includes('searchProductQuotes')) {
  content = content.replace('async searchMarketplaceTrends', cotacoesFunction + '\\n  async searchMarketplaceTrends');
  fs.writeFileSync('src/services/ai.ts', content, 'utf8');
}
