import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const oldCheck = `    // SEO Filters check for direct orders
    if (globalSeoFilters.enabled) {
      const isKit = (query || '').toLowerCase().includes('kit');
      
      if (globalSeoFilters.ignoreKits && isKit) {
         return res.json({ 
           success: true, 
           result: [{ step: 'seo', response: 'Neste momento, os filtros aplicados me impedem de fazer alteração no anúncio (Motivo: Variação de kit ignorada).' }]
         });
      }
      
      // Since we don't have Nuvemshop real dates instantly without fetching, we simulate the date block if needed
      // but let's just add the check logic
    }`;

const newCheck = `    // SEO Filters check for direct orders
    if (globalSeoFilters.enabled) {
      const isKit = (query || '').toLowerCase().includes('kit');
      
      let blockedReason = null;
      if (globalSeoFilters.ignoreKits && isKit) {
        blockedReason = 'Variação de kit ignorada';
      }
      
      if (blockedReason) {
         const dateStr = new Date().toLocaleString('pt-BR');
         const responseMsg = \`Neste momento, os filtros aplicados me impedem de fazer alteração no anúncio (Motivo: \${blockedReason}).\`;
         
         // Add the blocked response directly to the audit log as the SEO specialist
         globalAuditTasks.push({
           id: \`task-seo-\${Date.now()}\`,
           date: dateStr,
           productName: query || productId || 'Produto',
           receivedPrompt: 'Otimize este anúncio de acordo com as diretrizes.',
           sentResponse: responseMsg,
           status: 'completed',
           role: 'seo',
           requestingSector: 'Gerente de Projetos',
           executingSector: 'Especialista SEO',
           oldScore: 0,
           newScore: 0,
           evolutionPercentage: 0
         });
         
         return res.json({ 
           success: true, 
           result: [{ step: 'seo', response: responseMsg }]
         });
      }
    }`;

content = content.replace(oldCheck, newCheck);
fs.writeFileSync('server.ts', content, 'utf8');
