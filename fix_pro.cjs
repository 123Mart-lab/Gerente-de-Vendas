const fs = require('fs');
let content = fs.readFileSync('src/services/ai.ts', 'utf8');

// Replace the specific block of generateProductSEO with the new one
const newFunc = `async generateProductSEO(productData: any) {
    const systemInstruction = "Você é um Copywriter e Especialista em SEO Sênior (nível Pro). Seu trabalho é ler os dados técnicos de um produto e transformá-los em descrições extremamente persuasivas, focadas em conversão, desejo e ranqueamento no Google Shopping. Escreva em tom comercial refinado. Formate a descrição HTML usando <h3>, <strong>, <ul> e <li> para facilitar a leitura. Use SEMPRE o gatilho de autoridade final exatamente assim: '<p>🔥 <strong>Vantagens 123Mart:</strong> Compre agora com o melhor preço da internet e receba rápido! Nosso despacho é garantido em até <strong>24 horas</strong> após a aprovação.</p>'. Retorne os dados ESTRITAMENTE em formato JSON.";
    
    const prompt = \`Analise este produto e deduza o público-alvo. Gere as otimizações de SEO e copy.
Produto original:
Nome: \${productData.name}
Preço: \${productData.price}
Descrição Original: \${productData.description || 'Sem descrição'}
Formato obrigatório de retorno (JSON puro):
{
  "novoTitulo": "Faca de Aço Inox Profissional 12\\\" Top Chef",
  "metaDescription": "Eleve o nível da sua cozinha...",
  "publicoAlvo": "Cozinheiros amadores, Chefs...",
  "novaDescricaoHtml": "<p><strong>Domine a sua cozinha...</strong></p><ul><li>...</li></ul><p>🔥 <strong>Vantagens 123Mart:</strong> Compre agora com o melhor preço da internet e receba rápido! Nosso despacho é garantido em até <strong>24 horas</strong> após a aprovação.</p>"
}\`;

    try {
      // Usando a melhor IA disponível para o Catálogo & Marketing
      const response = await ai.models.generateContent({
        model: 'gemini-pro-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro na geração de SEO:', err);
      
      // Tratamento gracioso para o limite de cota da chave de testes
      if (err.message?.includes('429') || err.message?.includes('Quota')) {
        return {
          novoTitulo: "⚠️ [ERRO DE COTA DA API PRO]",
          metaDescription: "A Chave de API atual não possui permissão para usar o modelo Pro.",
          publicoAlvo: "Para resolver, adicione sua própria GEMINI_API_KEY no arquivo .env",
          novaDescricaoHtml: "<p><strong>Você tem razão! O modelo Pro é o ideal para o marketing.</strong></p><p>No entanto, a chave de testes embutida no ambiente de demonstração possui limite zero para a família Pro. O código <strong>já foi atualizado</strong> para usar a melhor inteligência artificial do mercado (gemini-pro-latest).</p><p>Para ver este texto ganhar vida com a inteligência máxima, você só precisa colocar a sua chave particular no arquivo <code>.env</code> quando baixar o código para a sua máquina.</p>"
        };
      }
      return null;
    }
  },`;

content = content.replace(/async generateProductSEO\(productData: any\) \{[\s\S]*?^  \},/m, newFunc + '\n  },');
fs.writeFileSync('src/services/ai.ts', content);
