const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

if (!code.includes('const [autoPilot, setAutoPilot]')) {
  code = code.replace(
    'const [showHtmlPreview, setShowHtmlPreview] = useState(true);',
    'const [showHtmlPreview, setShowHtmlPreview] = useState(true);\n  const [autoPilot, setAutoPilot] = useState(false);'
  );
}

const oldToggle = /\{\/\* Toggle Piloto Automático \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newToggle = `{/* Toggle Piloto Automático */}
        <div className={\`flex items-center gap-3 border px-4 py-2 rounded-lg transition-colors \${autoPilot ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 opacity-80'}\`}>
          <div className="flex flex-col text-right">
            <span className={\`text-sm font-semibold \${autoPilot ? 'text-indigo-700' : 'text-slate-700'}\`}>Piloto Automático</span>
            <span className={\`text-xs font-medium \${autoPilot ? 'text-indigo-500' : 'text-slate-400'}\`}>
              {autoPilot ? 'Ativado (Processamento em Lote)' : 'Desativado'}
            </span>
          </div>
          <button 
            onClick={() => {
              setAutoPilot(!autoPilot);
              if (!autoPilot) {
                alert('Piloto Automático Ativado! As regras de segurança (URL e Título SEO inalterados) serão rigorosamente aplicadas em otimizações em massa.');
              }
            }}
            className={\`w-10 h-6 rounded-full transition-colors flex items-center px-1 \${autoPilot ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}\`}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
          </button>
        </div>`;

code = code.replace(oldToggle, newToggle);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
console.log('Autopilot UI patched');
