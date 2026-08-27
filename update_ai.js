const fs = require('fs');

let aiCode = fs.readFileSync('src/services/ai.ts', 'utf8');

const newMethod = `
  async generateProductSEO(productData: any) {
    const systemInstruction = "Você é um especialista em Marketing e SEO de E-commerce. Sua missão é otimizar títulos, gerar metas descrições e copies conversivas (Textos persuasivos) para produtos. Use sempre o gatilho de autoridade final: 'Vantagens 123Mart: Compre agora com o melhor preço da internet e receba rápido! Nosso despacho é garantido em até 24 horas após a aprovação.' Retorne os dados estritamente em formato JSON.";
    
    const prompt = \`
Analise este produto e deduza o público-alvo. Gere as otimizações de SEO e copy.
Produto original:
Nome: \${productData.name}
Preço: \${productData.price}
Descrição Original: \${productData.description || 'Sem descrição'}

Formato obrigatório de retorno (JSON puro):
{
  "novoTitulo": "...",
  "metaDescription": "...",
  "publicoAlvo": "...",
  "novaDescricaoHtml": "<p>...</p>"
}
\`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err) {
      console.error('Erro na geração de SEO:', err);
      return null;
    }
  },
`;

// Insert it before the last closing brace
aiCode = aiCode.replace(/};\s*$/, newMethod + '};\n');
fs.writeFileSync('src/services/ai.ts', aiCode);
