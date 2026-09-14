const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server.ts');
let code = fs.readFileSync(filePath, 'utf8');

// We need to replace the app.get('/api/marketing/pdf/:role/:sku'...) implementation
// with one that fetches from firebaseService.

const newEndpoint = `
// Rota de geração de PDFs dinâmicos
app.get('/api/marketing/pdf/:role/:sku', async (req, res) => {
  const { role, sku } = req.params;
  
  try {
    let briefingData = null;
    try {
      const allBriefings = await firebaseService.getSkuBriefings();
      briefingData = allBriefings.find((b: any) => b.sku === sku);
    } catch (e) {
      console.error('Erro ao buscar briefing:', e);
    }

    let content = \`# Relatório Oficial: \${role.toUpperCase()}\\n\\n\`;
    content += \`**SKU:** \${sku}\\n**Data:** \${new Date().toLocaleDateString('pt-BR')}\\n\\n\`;
    
    if (briefingData) {
      if (role === 'planner' && briefingData.planner) {
        content += briefingData.planner;
      } else if (role === 'monitor' && briefingData.monitor) {
        content += briefingData.monitor;
      } else if (role === 'briefing' && briefingData.manager) {
        content += briefingData.manager;
      } else if (role === 'arte' && briefingData.artDirector) {
        content += briefingData.artDirector;
      } else if (role === 'seo' && briefingData.seo) {
        content += briefingData.seo;
      } else {
        content += \`Relatório em processamento ou não encontrado para o papel: \${role}.\\n\`;
      }
    } else {
      content += \`Nenhum briefing encontrado para o SKU: \${sku}.\\n\`;
    }

    content += \`\\n---\\n*123Mart Brain - Gerado automaticamente*\\n\`;
    
    res.json({ markdown: content });
  } catch (error) {
    console.error('Erro ao gerar PDF', error);
    res.status(500).json({ error: 'Falha ao gerar o documento' });
  }
});
`;

// Replace the old implementation
const startIdx = code.indexOf("app.get('/api/marketing/pdf/:role/:sku', (req, res) => {");
if (startIdx !== -1) {
  const endStr = "res.json({ markdown: content });\n});";
  const endIdx = code.indexOf(endStr, startIdx) + endStr.length;
  
  code = code.substring(0, startIdx) + newEndpoint.trim() + code.substring(endIdx);
  fs.writeFileSync(filePath, code);
  console.log('Endpoint replaced successfully');
} else {
  console.log('Endpoint not found');
}
