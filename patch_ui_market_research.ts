import fs from 'fs';
let content = fs.readFileSync('src/components/publicidade/ProjectManager.tsx', 'utf8');

const knowledgeBaseUI = `
        <div className="max-w-2xl mb-8 bg-slate-50 p-4 border border-slate-200 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Knowledge Base do Analista Financeiro
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Taxa da Plataforma (%)</label>
              <input type="text" value={kbPlatformFee} onChange={e => setKbPlatformFee(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: 10% ou 12.5%" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Alíquota ICMS (%)</label>
              <input type="text" value={kbIcms} onChange={e => setKbIcms(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: 18%" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Impostos / Simples (%)</label>
              <input type="text" value={kbTaxes} onChange={e => setKbTaxes(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: 6%" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Logística Fixa (R$)</label>
              <input type="text" value={kbLogistics} onChange={e => setKbLogistics(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: R$ 5,00" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 font-medium mb-1">Margem de Lucro Líquida Desejada (%)</label>
              <input type="text" value={kbMargin} onChange={e => setKbMargin(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: 20%" />
            </div>
          </div>
        </div>
`;

// Add states
const oldStates = `  const [links, setLinks] = useState<string[]>(['', '', '']);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);`;

const newStates = `  const [links, setLinks] = useState<string[]>(['', '', '']);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [kbPlatformFee, setKbPlatformFee] = useState('10%');
  const [kbIcms, setKbIcms] = useState('18%');
  const [kbTaxes, setKbTaxes] = useState('6%');
  const [kbLogistics, setKbLogistics] = useState('R$ 5,00');
  const [kbMargin, setKbMargin] = useState('20%');`;

content = content.replace(oldStates, newStates);

const uiAnchor = `        <div className="max-w-2xl mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">Materiais de Apoio (Opcional)</label>`;
          
content = content.replace(uiAnchor, knowledgeBaseUI + '\n' + uiAnchor);

const oldStartResearch = `  const startResearch = () => {
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
        const newTask = {
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
        axios.post('/api/marketing/audit-logs', { task: newTask }).catch(console.error);
      }

      currentProgress += 1;
      setProgress(currentProgress);
      if (currentProgress >= 3) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 4000);
  };`;

const newStartResearch = `  const startResearch = async () => {
    const validLinks = links.filter(l => l.trim() !== '');
    if (validLinks.length === 0 && files.length === 0) return;
    
    setIsRunning(true);
    setProgress(0);
    setPesquisaHistory([]);

    const financialKnowledgeBase = {
      platformFee: kbPlatformFee,
      icms: kbIcms,
      taxes: kbTaxes,
      logisticsCost: kbLogistics,
      desiredMargin: kbMargin
    };

    // Simulate progress while waiting for the AI response
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 0.5;
      if (currentProgress < 3) {
        setProgress(Math.floor(currentProgress));
      }
    }, 3000);

    try {
      await axios.post('/api/marketing/market-research', {
        links: validLinks,
        financialKnowledgeBase
      });
      setProgress(3);
    } catch (err) {
      console.error('Erro na pesquisa de mercado:', err);
    } finally {
      clearInterval(progressInterval);
      setIsRunning(false);
    }
  };`;
  
content = content.replace(oldStartResearch, newStartResearch);

// Make sure DollarSign is imported if it's not already
if (!content.includes('DollarSign')) {
  content = content.replace('import { Search, History, CheckCircle2, ChevronRight, Play, FastForward, PlayCircle, Plus, Upload, FileText, X, ArrowRight } from "lucide-react";', 'import { Search, History, CheckCircle2, ChevronRight, Play, FastForward, PlayCircle, Plus, Upload, FileText, X, ArrowRight, DollarSign } from "lucide-react";');
}

fs.writeFileSync('src/components/publicidade/ProjectManager.tsx', content, 'utf8');
