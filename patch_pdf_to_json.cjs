const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server.ts');
let code = fs.readFileSync(filePath, 'utf8');

const newPdfEndpoint = `
app.get('/api/marketing/pdf/:role/:sku', (req, res) => {
  const { role, sku } = req.params;
  
  let content = \`# Relatório Oficial: \${role.toUpperCase()}\\n\\n\`;
  content += \`**SKU:** \${sku}\\n**Data:** \${new Date().toLocaleDateString('pt-BR')}\\n\\n\`;
  content += \`## Resumo Executivo\\n\\n\`;
  
  if (role === 'planner') {
    content += \`**Análise de Mercado e Persona:**\\n\\n\`;
    content += \`- Persona primária: Mulheres de 25-45 anos, focadas em praticidade.\\n\`;
    content += \`- Dores mapeadas: Falta de tempo, dificuldade de organização.\\n\`;
    content += \`- Solução do Produto: Design ergonômico e eficiência rápida.\\n\`;
  } else if (role === 'monitor') {
    content += \`**Levantamento de Concorrência:**\\n\\n\`;
    content += \`- Concorrente A: R$ 99,90 (Frete grátis, qualidade inferior)\\n\`;
    content += \`- Concorrente B: R$ 129,90 (Marca premium, entrega demorada)\\n\`;
    content += \`- Nosso Preço Alvo: R$ 109,90 (Posicionamento Custo/Benefício)\\n\`;
  } else if (role === 'briefing') {
    content += \`**Product Playbook (Briefing Executivo de Execução):**\\n\\n\`;
    content += \`1. Dor do Cliente: Necessidade de resolver problemas em minutos.\\n\`;
    content += \`2. Nossa Solução: O produto mais rápido da categoria.\\n\`;
    content += \`3. Diferencial (Ângulo): "Recupere o seu tempo".\\n\`;
    content += \`4. Quebras de Objeção: "Não é frágil, tem garantia de 1 ano."\\n\`;
  } else if (role === 'arte') {
    content += \`**Pacote de Criativos (Assets Visuais):**\\n\\n\`;
    content += \`- 3x Banners para Facebook Ads (Foco em conversão).\\n\`;
    content += \`- 2x Vídeos UGC (TikTok/Reels).\\n\`;
    content += \`- 5x Imagens High-end para Carrossel Nuvemshop.\\n\`;
  } else if (role === 'seo') {
    content += \`**Dossiê SEO e Copywriting:**\\n\\n\`;
    content += \`- Título H1 Otimizado: "Produto X - Solução Definitiva".\\n\`;
    content += \`- Meta Descrição: "Compre o Produto X e resolva Y em minutos."\\n\`;
    content += \`- Palavras-chave: produto x, comprar produto x, solução y.\\n\`;
  } else {
    content += \`Relatório em processamento.\\n\`;
  }
  
  content += \`\\n---\\n*123Mart Brain - Gerado automaticamente*\\n\`;
  
  res.json({ markdown: content });
});
`;

code = code.replace(/app\.get\('\/api\/marketing\/pdf\/:role\/:sku', \(req, res\) => \{[\s\S]*?\}\);/, newPdfEndpoint.trim());

fs.writeFileSync(filePath, code);
