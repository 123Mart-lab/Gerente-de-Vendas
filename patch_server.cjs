const fs = require('fs');
const path = require('path');
let code = fs.readFileSync('server.ts', 'utf8');

const newTemplate = `const defaultStepsTemplate = [
          { id: '1', role: 'Gerente', actionTitle: 'Prompt Planner', type: 'prompt', isCompleted: false },
          { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
          { id: '3', role: 'Gerente', actionTitle: 'Prompt Monitor', type: 'prompt', isCompleted: false },
          { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
          { id: '5', role: 'Gerente', actionTitle: 'Prompt Arte', type: 'prompt', isCompleted: false },
          { id: '6', role: 'Diret. Arte', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
          { id: '7', role: 'Gerente', actionTitle: 'Prompt SEO', type: 'prompt', isCompleted: false },
          { id: '8', role: 'Esp. SEO', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
          { id: '9', role: 'Gerente', actionTitle: 'Briefing Mestre', type: 'pdf', isCompleted: false },
          { id: '10', role: 'Integração', actionTitle: 'Webhook MeliAgent', type: 'webhook', isCompleted: false }
        ];`;

code = code.replace(/const defaultStepsTemplate = \[\s*\{ id: '1'[\s\S]*?\{ id: '9'[\s\S]*?\];/g, newTemplate);

const newLogic1 = `if (step === 'planner') {
          currentSteps[0].isCompleted = true; currentSteps[0].content = prompt;
          currentSteps[1].isCompleted = true; currentSteps[1].pdfUrl = \`/api/marketing/pdf/planner/\${payload.sku}\`;
      } else if (step === 'monitor') {
          currentSteps[2].isCompleted = true; currentSteps[2].content = prompt;
          currentSteps[3].isCompleted = true; currentSteps[3].pdfUrl = \`/api/marketing/pdf/monitor/\${payload.sku}\`;
      } else if (step === 'art') {
          currentSteps[4].isCompleted = true; currentSteps[4].content = prompt;
          currentSteps[5].isCompleted = true; currentSteps[5].pdfUrl = \`/api/marketing/pdf/arte/\${payload.sku}\`;
      } else if (step === 'seo') {
          currentSteps[6].isCompleted = true; currentSteps[6].content = prompt;
          currentSteps[7].isCompleted = true; currentSteps[7].pdfUrl = \`/api/marketing/pdf/seo/\${payload.sku}\`;
      } else if (step === 'manager') {
          currentSteps[8].isCompleted = true; currentSteps[8].pdfUrl = \`/api/marketing/pdf/briefing/\${payload.sku}\`;
          currentSteps[9].isCompleted = true; currentSteps[9].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';
      }`;

const newLogic2 = `if (step === 'planner') { 
             currentSteps[0].isCompleted = true; currentSteps[0].content = prompt;
             currentSteps[1].isCompleted = true; currentSteps[1].pdfUrl = \`/api/marketing/pdf/planner/\${productData.sku}\`;
          } else if (step === 'monitor') { 
             currentSteps[2].isCompleted = true; currentSteps[2].content = prompt;
             currentSteps[3].isCompleted = true; currentSteps[3].pdfUrl = \`/api/marketing/pdf/monitor/\${productData.sku}\`;
          } else if (step === 'art') { 
             currentSteps[4].isCompleted = true; currentSteps[4].content = prompt;
             currentSteps[5].isCompleted = true; currentSteps[5].pdfUrl = \`/api/marketing/pdf/arte/\${productData.sku}\`;
          } else if (step === 'seo') { 
             currentSteps[6].isCompleted = true; currentSteps[6].content = prompt;
             currentSteps[7].isCompleted = true; currentSteps[7].pdfUrl = \`/api/marketing/pdf/seo/\${productData.sku}\`;
          } else if (step === 'manager') { 
             currentSteps[8].isCompleted = true; currentSteps[8].pdfUrl = \`/api/marketing/pdf/briefing/\${productData.sku}\`;
             currentSteps[9].isCompleted = true; currentSteps[9].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';
          }`;

// Replace logic block 1
code = code.replace(/if \(step === 'planner'\) \{\s*currentSteps\[0\][\s\S]*?currentSteps\[8\].isCompleted = true; currentSteps\[8\].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';\s*\}/, newLogic1);

// Replace logic block 2 and 3
code = code.replace(/if \(step === 'planner'\) \{\s*currentSteps\[0\][\s\S]*?currentSteps\[8\].isCompleted = true; currentSteps\[8\].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';\s*\}/g, newLogic2);

fs.writeFileSync('server.ts', code);
console.log('server.ts patched');
