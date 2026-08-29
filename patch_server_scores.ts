import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const roleDataMap = `
    const getRoleMetadata = (step: string) => {
      switch (step) {
        case 'planner':
          return { req: 'Gerente de Projetos', exe: 'Pesquisador de Mercado', oldS: 35, newS: 60, ev: 71 };
        case 'monitor':
          return { req: 'Pesquisador de Mercado', exe: 'Monitor de Concorrência', oldS: 60, newS: 75, ev: 25 };
        case 'seo':
          return { req: 'Monitor de Concorrência', exe: 'Especialista SEO', oldS: 75, newS: 90, ev: 20 };
        case 'art':
          return { req: 'Especialista SEO', exe: 'Diretor de Arte', oldS: 90, newS: 98, ev: 8 };
        default:
          return { req: 'Gerente de Projetos', exe: 'Profissional', oldS: 50, newS: 70, ev: 40 };
      }
    };
`;

const aiCallReplacer = `const result = await aiService.runOrchestrationPipeline(payload, (step, prompt, response) => {
      const meta = getRoleMetadata(step);
      globalAuditTasks.push({
        id: \`task-\${step}-\${Date.now()}\`,
        date: dateStr,
        productName: payload.name,
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
    });`;

if (!content.includes('getRoleMetadata')) {
  // we replace the globalAuditTasks.push block
  const oldAiCall = `const result = await aiService.runOrchestrationPipeline(payload, (step, prompt, response) => {
      globalAuditTasks.push({
        id: \`task-\${step}-\${Date.now()}\`,
        date: dateStr,
        productName: payload.name,
        receivedPrompt: prompt,
        sentResponse: response,
        status: 'completed',
        role: step
      });
    });`;
    
  content = content.replace(oldAiCall, roleDataMap + "\n    " + aiCallReplacer);
}

fs.writeFileSync('server.ts', content, 'utf8');
console.log('patched server with metadata');
