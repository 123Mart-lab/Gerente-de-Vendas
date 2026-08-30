import fs from 'fs';

const filePath = 'src/components/marketing/ProductOptimizer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldButton = `<button 
            onClick={toggleAutoPilot}
            disabled={isOptimizing && !autoPilot}
            className={\`w-full md:w-auto \${autoPilot ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm\`}
          >
            {autoPilot ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Parar Automação</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> Automatizar Gerente (Otimizar Todos)</>
            )}
          </button>`;

const newButton = `<button 
            onClick={toggleAutoPilot}
            disabled={isOptimizing && !autoPilot}
            className={\`w-full md:w-auto \${autoPilot ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm\`}
          >
            {autoPilot ? (
              <><StopCircle className="w-4 h-4 animate-pulse" /> Interromper Otimização em Massa</>
            ) : (
              <><Play className="w-4 h-4" /> Orquestrar Todos os Anúncios</>
            )}
          </button>`;

content = content.replace(oldButton, newButton);
fs.writeFileSync(filePath, content, 'utf8');
