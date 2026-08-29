import fs from 'fs';
let content = fs.readFileSync('src/services/ai.ts', 'utf8');

const newMethods = `
  async generateViralContent(productData: any) {
    const prompt = \\\`Você é um Gestor de Social Media Especialista em Viralização e Afiliados, inspirado no "Rally MCP".
Sua missão é criar um pacote de conteúdo de marketing altamente conversivo e viral para as redes sociais.

Produto:
Nome: \\\${productData.name}
Preço: \\\${productData.price}
Descrição: \\\${productData.description || 'Sem descrição'}

Retorne ESTRITAMENTE um JSON puro com as seguintes chaves (sem formatação markdown):
{
  "tiktokScript": "Roteiro de 30 a 60 segundos focado em retenção nos primeiros 3 segundos e CTA forte. Formato (Cena/Áudio).",
  "reelsIdea": "Ideia visual para o Instagram Reels, focando na estética e trend musical do momento.",
  "whatsappBroadcast": "Mensagem curta, persuasiva e com gatilhos de escassez para enviar em grupos de WhatsApp.",
  "telegramMessage": "Mensagem para canal do Telegram com formatação rica (negrito/emoji) focada em benefício técnico.",
  "blogPost": "Ideia de título de blog post focado em SEO de cauda longa para este produto."
}\\\`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              tiktokScript: { type: "STRING" },
              reelsIdea: { type: "STRING" },
              whatsappBroadcast: { type: "STRING" },
              telegramMessage: { type: "STRING" },
              blogPost: { type: "STRING" }
            },
            required: ["tiktokScript", "reelsIdea", "whatsappBroadcast", "telegramMessage", "blogPost"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao gerar viral content:', err);
      throw err;
    }
  },

  async searchMarketplaceTrends(query: string) {
    const prompt = \\\`Você é um Pesquisador de Tendências de Marketplaces, especialista em Mercado Livre e Shopee, utilizando inteligência "Rally MCP".
Aja como se tivesse acesso em tempo real às plataformas. O usuário buscou pelo termo/nicho: "\\\${query}".

Identifique e crie 3 produtos/tendências fictícias, porém altamente realistas e embasadas no comportamento atual do mercado brasileiro, que estão em alta para este nicho.

Retorne ESTRITAMENTE um JSON puro com o formato:
{
  "trends": [
    {
      "marketplace": "Mercado Livre ou Shopee",
      "productName": "Nome do Produto",
      "priceRange": "Ex: R$ 50 - R$ 80",
      "competitiveness": "Alta/Média/Baixa",
      "qualityScore": "Ex: 9.5/10",
      "whyIsTrending": "Explicação rápida do motivo viral"
    }
  ]
}\\\`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              trends: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    marketplace: { type: "STRING" },
                    productName: { type: "STRING" },
                    priceRange: { type: "STRING" },
                    competitiveness: { type: "STRING" },
                    qualityScore: { type: "STRING" },
                    whyIsTrending: { type: "STRING" }
                  },
                  required: ["marketplace", "productName", "priceRange", "competitiveness", "qualityScore", "whyIsTrending"]
                }
              }
            },
            required: ["trends"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao buscar trends:', err);
      throw err;
    }
  },
\`;

content = content.replace('async generateProductSEO', newMethods + '\\n  async generateProductSEO');
fs.writeFileSync('src/services/ai.ts', content, 'utf8');
