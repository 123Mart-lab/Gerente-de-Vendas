import fs from 'fs';

let content = fs.readFileSync('src/components/publicidade/ProjectManager.tsx', 'utf8');

// Insert the mockHistory state
if (!content.includes('const [pesquisaHistory, setPesquisaHistory]')) {
  content = content.replace(
    'const [progress, setProgress] = useState(0);',
    'const [progress, setProgress] = useState(0);\n  const [pesquisaHistory, setPesquisaHistory] = useState<AuditTask[]>([]);'
  );
}

// Modify the startResearch function to simulate tasks
const oldStartResearch = `  const startResearch = () => {
    const validLinks = links.filter(l => l.trim() !== '');
    if (validLinks.length === 0 && files.length === 0) return;
    
    setIsRunning(true);
    setProgress(0);

    // Mock progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);
      if (currentProgress >= 3) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 2500);
  };`;

const newStartResearch = `  const startResearch = () => {
    const validLinks = links.filter(l => l.trim() !== '');
    if (validLinks.length === 0 && files.length === 0) return;
    
    setIsRunning(true);
    setProgress(0);
    setPesquisaHistory([]);

    const steps = [
      { role: 'planner', req: 'Gerente de Projetos', exe: 'Pesquisador de Mercado', oldS: 0, newS: 40, ev: 40, prompt: 'Analise os links fornecidos e encontre o padrão de preços.', resp: 'Encontrei um padrão onde o preço médio é R$ 120, com ofertas de R$ 99.' },
      { role: 'monitor', req: 'Pesquisador de Mercado', exe: 'Monitor de Concorrência', oldS: 40, newS: 70, ev: 30, prompt: 'Faça um benchmark detalhado com base na pesquisa.', resp: 'Nossos concorrentes diretos estão focados em frete grátis. Sugiro destacarmos nosso envio expresso.' },
      { role: 'finance', req: 'Monitor de Concorrência', exe: 'Analista Financeiro', oldS: 70, newS: 90, ev: 20, prompt: 'Avalie a viabilidade financeira desta estratégia de preço.', resp: 'A viabilidade é positiva. Temos margem para absorver o custo de envio expresso mantendo 35% de ROI.' }
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      if (currentProgress < steps.length) {
        const step = steps[currentProgress];
        setPesquisaHistory(prev => [...prev, {
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
        }]);
      }

      currentProgress += 1;
      setProgress(currentProgress);
      if (currentProgress >= 3) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 2500);
  };`;

content = content.replace(oldStartResearch, newStartResearch);

// Add the Audit Panel at the end of the component
if (!content.includes('<TaskAuditPanel mockTasks={pesquisaHistory} />')) {
  content = content.replace(
    '        </div>\n      </div>\n    </div>\n  );\n}\n\nfunction WorkflowStep',
    '        </div>\n\n        {/* Audit Panel (Pesquisa) */}\n        <TaskAuditPanel mockTasks={pesquisaHistory} />\n      </div>\n    </div>\n  );\n}\n\nfunction WorkflowStep'
  );
}

fs.writeFileSync('src/components/publicidade/ProjectManager.tsx', content, 'utf8');
console.log('patched pesquisa mercado');
