import fs from 'fs';
let content = fs.readFileSync('src/services/ai.ts', 'utf8');

const titanosMethod = `
  async generateAdsCampaign(productData: any, platform: string) {
    const prompt = \`Você é um Especialista de Tráfego Pago e Marketplaces (nível Sênior), focado em performance (RoAS), operando com as skills do "Titanos Agent".
O cliente solicitou a criação de uma campanha para a plataforma: \${platform} (pode ser Amazon Ads, Google Ads ou Meta Ads).

Produto:
Nome: \${productData.name}
Preço: \${productData.price}
Descrição: \${productData.description || 'Sem descrição'}

Por favor, elabore uma estrutura de campanha focada em conversão, com base nas melhores práticas do mercado brasileiro e internacional.
Retorne ESTRITAMENTE um JSON puro com o seguinte formato:
{
  "campaignName": "Nome Estratégico da Campanha",
  "targetAudience": "Público-alvo / Perfil do comprador",
  "recommendedBudget": "Sugestão de orçamento diário (ex: R$ 50,00)",
  "adGroups": [
    {
      "name": "Nome do Grupo de Anúncio",
      "keywords": ["palavra-chave 1", "palavra-chave 2"],
      "biddingStrategy": "Estratégia de lances (ex: Manual, Max Conversões)",
      "adCopies": [
        {
          "headline": "Título Chamativo (até 30 char)",
          "description": "Texto principal com gatilhos mentais",
          "cta": "Call to Action"
        }
      ]
    }
  ],
  "fbaOrLogisticsInsight": "Se aplicável (ex. Amazon), dica sobre como o FBA ou frete rápido pode aumentar a conversão do anúncio. Caso contrário, dica geral de logística."
}\`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.6,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              campaignName: { type: "STRING" },
              targetAudience: { type: "STRING" },
              recommendedBudget: { type: "STRING" },
              adGroups: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    keywords: { type: "ARRAY", items: { type: "STRING" } },
                    biddingStrategy: { type: "STRING" },
                    adCopies: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          headline: { type: "STRING" },
                          description: { type: "STRING" },
                          cta: { type: "STRING" }
                        },
                        required: ["headline", "description", "cta"]
                      }
                    }
                  },
                  required: ["name", "keywords", "biddingStrategy", "adCopies"]
                }
              },
              fbaOrLogisticsInsight: { type: "STRING" }
            },
            required: ["campaignName", "targetAudience", "recommendedBudget", "adGroups", "fbaOrLogisticsInsight"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao gerar campanha de ads:', err);
      throw err;
    }
  },
\`;

if (!content.includes('generateAdsCampaign')) {
  content = content.replace('async searchMarketplaceTrends', titanosMethod + '\\n  async searchMarketplaceTrends');
  fs.writeFileSync('src/services/ai.ts', content, 'utf8');
}
