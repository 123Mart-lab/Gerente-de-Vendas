import fs from 'fs';

const filePath = 'src/components/publicidade/ProjectManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import { Briefcase, Search, Sparkles, Plus, ArrowRight, CheckCircle2, Upload, File, X, Image as ImageIcon, DollarSign } from 'lucide-react';",
  "import { Briefcase, Search, Sparkles, Plus, ArrowRight, CheckCircle2, Upload, File, X, Image as ImageIcon, DollarSign, Play, StopCircle, RefreshCw } from 'lucide-react';"
);

// Add the states
const stateInsert = `  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const autoPilotRef = useRef(false);`;

content = content.replace(
  `  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);`,
  stateInsert
);

// Add startAutoPilot function
const funcInsert = `  const startAutoPilot = async () => {
    const newState = !isAutoPilotRunning;
    setIsAutoPilotRunning(newState);
    autoPilotRef.current = newState;
    
    if (newState) {
      try {
        const response = await axios.get('/api/marketing/products?limit=50&page=1');
        const catalog = response.data || [];
        
        for (const p of catalog) {
          if (!autoPilotRef.current) break;
          
          if (seoFiltersEnabled) {
            const isKit = (p.name?.pt || p.name || '').toLowerCase().includes('kit');
            if (ignoreKits && isKit) continue;
          }
          
          setSelectedProductId(p.id);
          setSearchTerm(p.name?.pt || p.name);
          setIsRunning(true);
          setProgress(0);
          
          let pVal = 0;
          const interval = setInterval(() => {
            pVal++;
            if(pVal < 4) setProgress(pVal);
          }, 2000);
          
          try {
            await axios.post('/api/marketing/orchestrate-optimization', { 
              productId: p.id,
              query: p.name?.pt || p.name
            });
            setProgress(4);
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (err) {
            console.error(err);
          } finally {
            clearInterval(interval);
            setIsRunning(false);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAutoPilotRunning(false);
        autoPilotRef.current = false;
      }
    }
  };

  const startOptimization = async () => {`;

content = content.replace('  const startOptimization = async () => {', funcInsert);

// Replace button HTML
const btnCode = `<button 
            onClick={startOptimization}
            disabled={!selectedProductId || isRunning || isAutoPilotRunning}
            className="px-6 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            {isRunning && !isAutoPilotRunning ? 'Orquestrando...' : 'Melhorar Anúncio'}
          </button>
          
          <button 
            onClick={startAutoPilot}
            disabled={isRunning && !isAutoPilotRunning}
            className={\`px-6 py-2.5 \${isAutoPilotRunning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap\`}
          >
            {isAutoPilotRunning ? (
              <><StopCircle className="w-4 h-4 animate-pulse" /> Interromper Orquestração</>
            ) : (
              <><Play className="w-4 h-4" /> Orquestrar Todos os Anúncios</>
            )}
          </button>`;

content = content.replace(
  `<button 
            onClick={startOptimization}
            disabled={!selectedProductId || isRunning}
            className="px-6 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            {isRunning ? 'Orquestrando...' : 'Melhorar Anúncio'}
          </button>`,
  btnCode
);

fs.writeFileSync(filePath, content, 'utf8');
