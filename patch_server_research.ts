import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const marketResearchEndpoint = `
app.post('/api/marketing/market-research', async (req, res) => {
  try {
    const { links, financialKnowledgeBase } = req.body;
    
    const getRoleMetadata = (step: string) => {
      switch (step) {
        case 'planner':
          return { req: 'Gerente de Projetos', exe: 'Pesquisador de Mercado', oldS: 0, newS: 40, ev: 40 };
        case 'monitor':
          return { req: 'Pesquisador de Mercado', exe: 'Monitor de Concorrência', oldS: 40, newS: 70, ev: 30 };
        case 'finance':
          return { req: 'Monitor de Concorrência', exe: 'Analista Financeiro', oldS: 70, newS: 90, ev: 20 };
        default:
          return { req: 'Gerente de Projetos', exe: 'Profissional', oldS: 50, newS: 70, ev: 40 };
      }
    };
    
    const dateStr = new Date().toLocaleString('pt-BR');
    
    const result = await aiService.runMarketResearchPipeline(links, financialKnowledgeBase, (step, prompt, response) => {
      const meta = getRoleMetadata(step);
      globalAuditTasks.push({
        id: \`task-\${step}-\${Date.now()}\`,
        date: dateStr,
        productName: 'Pesquisa de Viabilidade (Múltiplos Links)',
        receivedPrompt: prompt,
        sentResponse: response,
        status: 'completed',
        role: step,
        requestingSector: meta.req,
        executingSector: meta.exe,
        oldScore: meta.oldS,
        newScore: meta.newS,
        evolutionPercentage: meta.ev
      });
    });
    
    res.json({ success: true, result });
  } catch (err: any) {
    console.error('Erro na pesquisa de mercado:', err);
    res.status(500).json({ error: err.message });
  }
});
`;

if (!content.includes('/api/marketing/market-research')) {
  content = content.replace("app.post('/api/marketing/orchestrate-optimization'", marketResearchEndpoint + "\napp.post('/api/marketing/orchestrate-optimization'");
}

fs.writeFileSync('server.ts', content, 'utf8');
