import fs from 'fs';

let content = fs.readFileSync('src/components/publicidade/ProjectManager.tsx', 'utf8');

const oldSetHistory = `        setPesquisaHistory(prev => [...prev, {
          id: \`task-\${step.role}-\${Date.now()}\`,
          date: new Date().toLocaleString('pt-BR'),
          productName: 'Pesquisa de Viabilidade (Múltiplos Links)',
          receivedPrompt: step.prompt,
          sentResponse: step.resp,
          status: 'completed',
          role: step.role,
          requestingSector: step.req,
          executingSector: step.exe,
          oldScore: step.oldS,
          newScore: step.newS,
          evolutionPercentage: step.ev
        }]);`;

const newSetHistory = `        const newTask = {
          id: \`task-\${step.role}-\${Date.now()}\`,
          date: new Date().toLocaleString('pt-BR'),
          productName: 'Pesquisa de Viabilidade (Múltiplos Links)',
          receivedPrompt: step.prompt,
          sentResponse: step.resp,
          status: 'completed',
          role: step.role,
          requestingSector: step.req,
          executingSector: step.exe,
          oldScore: step.oldS,
          newScore: step.newS,
          evolutionPercentage: step.ev
        } as AuditTask;
        
        setPesquisaHistory(prev => [...prev, newTask]);
        axios.post('/api/marketing/audit-logs', { task: newTask }).catch(console.error);`;

content = content.replace(oldSetHistory, newSetHistory);
fs.writeFileSync('src/components/publicidade/ProjectManager.tsx', content, 'utf8');
console.log('patched ProjectManager to post audit logs');
