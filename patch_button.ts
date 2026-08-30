import fs from 'fs';

const filePath = 'src/components/marketing/ProductOptimizer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The original button
const searchButtonCode = `<button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
          >
            {isOptimizing ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Analisando...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Gerar Otimização Profissional</>
            )}
          </button>`;

const newButtons = `<button 
            onClick={handleOptimize}
            disabled={isOptimizing || autoPilot}
            className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
          >
            {isOptimizing && !autoPilot ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Analisando...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Gerar Otimização Individual</>
            )}
          </button>
          
          <button 
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

content = content.replace(searchButtonCode, newButtons);
fs.writeFileSync(filePath, content, 'utf8');
