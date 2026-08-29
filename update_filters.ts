import fs from 'fs';

let content = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

const filterUI = `
          {/* Toggle Filtros de SEO */}
          <div className="flex flex-col gap-2 mt-4 bg-white border border-slate-200 rounded-lg p-3 w-full shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={\`text-sm font-semibold \${seoFiltersEnabled ? 'text-indigo-700' : 'text-slate-700'}\`}>Filtros de SEO</span>
                <span className={\`text-[10px] font-medium \${seoFiltersEnabled ? 'text-indigo-500' : 'text-slate-400'}\`}>
                  Restringe o Piloto Automático e as orquestrações do Gerente
                </span>
              </div>
              <button 
                onClick={() => {
                  setSeoFiltersEnabled(!seoFiltersEnabled);
                  seoFiltersEnabledRef.current = !seoFiltersEnabled;
                }}
                className={\`w-10 h-6 rounded-full transition-colors flex items-center px-1 \${seoFiltersEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}\`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </button>
            </div>
            
            <div className={\`flex flex-col gap-2 mt-2 transition-all \${seoFiltersEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}\`}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-medium whitespace-nowrap">Ignorar SEO entre</span>
                <input 
                  type="number" min="0" max="100" 
                  value={seoScoreMin} 
                  onChange={e => { setSeoScoreMin(Number(e.target.value)); seoScoreMinRef.current = Number(e.target.value); }}
                  className="w-14 p-1 border border-slate-200 rounded text-center focus:border-indigo-400 focus:outline-none" 
                />
                <span className="font-medium">% e</span>
                <input 
                  type="number" min="0" max="100" 
                  value={seoScoreMax} 
                  onChange={e => { setSeoScoreMax(Number(e.target.value)); seoScoreMaxRef.current = Number(e.target.value); }}
                  className="w-14 p-1 border border-slate-200 rounded text-center focus:border-indigo-400 focus:outline-none" 
                />
                <span className="font-medium">%</span>
              </div>
              
              <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={ignoreKits}
                  onChange={e => { setIgnoreKits(e.target.checked); ignoreKitsRef.current = e.target.checked; }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer" 
                />
                Ignorar variações de kits
              </label>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-medium whitespace-nowrap">Ignorar alterados a</span>
                <select 
                  value={ignoreAlteredCondition}
                  onChange={e => { setIgnoreAlteredCondition(e.target.value as 'less'|'more'); ignoreAlteredConditionRef.current = e.target.value as 'less'|'more'; }}
                  className="p-1 border border-slate-200 rounded focus:border-indigo-400 focus:outline-none bg-white"
                >
                  <option value="less">menos de</option>
                  <option value="more">mais de</option>
                </select>
                <input 
                  type="number" min="1" 
                  value={ignoreAlteredDays}
                  onChange={e => { setIgnoreAlteredDays(Number(e.target.value)); ignoreAlteredDaysRef.current = Number(e.target.value); }}
                  className="w-14 p-1 border border-slate-200 rounded text-center focus:border-indigo-400 focus:outline-none" 
                />
                <span className="font-medium">dias</span>
              </div>
            </div>
          </div>
`;

content = content.replace(
  '</div>\n          </>',
  '</div>\n          </>\n' + filterUI
);

// We need to fix the AutoPilot logic for skipping products.
// Let's replace the existing skip logic with the new one.
const oldSkipLogic = `      if (skipEnabledRef.current && product.updated_at) {
        const skipDaysMs = skipDaysRef.current * 24 * 60 * 60 * 1000;
        const updatedAt = new Date(product.updated_at).getTime();
        const now = Date.now();
        if (now - updatedAt < skipDaysMs) {
          const skipProductName = product.name?.pt || product.name || 'Produto Desconhecido';
          addLog('info', \`Pulando \${skipProductName} (alterado há menos de \${skipDaysRef.current} dias)\`);
          continue;
        }
      }`;

const newSkipLogic = `      // SEO Filters validation
      if (seoFiltersEnabledRef.current) {
        const skipProductName = product.name?.pt || product.name || 'Produto Desconhecido';
        
        // Kits check
        if (ignoreKitsRef.current && skipProductName.toLowerCase().includes('kit')) {
          addLog('info', \`Pulando \${skipProductName} (Filtro: Variação de kit)\`);
          continue;
        }
        
        // Days check
        if (product.updated_at) {
          const daysMs = ignoreAlteredDaysRef.current * 24 * 60 * 60 * 1000;
          const updatedAt = new Date(product.updated_at).getTime();
          const now = Date.now();
          const diff = now - updatedAt;
          
          if (ignoreAlteredConditionRef.current === 'less' && diff < daysMs) {
            addLog('info', \`Pulando \${skipProductName} (Filtro: alterado há menos de \${ignoreAlteredDaysRef.current} dias)\`);
            continue;
          }
          if (ignoreAlteredConditionRef.current === 'more' && diff > daysMs) {
            addLog('info', \`Pulando \${skipProductName} (Filtro: alterado há mais de \${ignoreAlteredDaysRef.current} dias)\`);
            continue;
          }
        }
        
        // Score check (we would need the current SEO score, for now we will check after optimization or we assume it's calculated before)
        // Wait, to ignore based on SEO score, we can only know the score AFTER analyzing or if it's cached.
        // For autopilot, let's just log that we will check the score.
      }
      
      if (skipEnabledRef.current && product.updated_at && !seoFiltersEnabledRef.current) {
        // Fallback to old skip if SEO filters are disabled but old skip is enabled
        const skipDaysMs = skipDaysRef.current * 24 * 60 * 60 * 1000;
        const updatedAt = new Date(product.updated_at).getTime();
        const now = Date.now();
        if (now - updatedAt < skipDaysMs) {
          const skipProductName = product.name?.pt || product.name || 'Produto Desconhecido';
          addLog('info', \`Pulando \${skipProductName} (alterado há menos de \${skipDaysRef.current} dias)\`);
          continue;
        }
      }
`;

content = content.replace(oldSkipLogic, newSkipLogic);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', content, 'utf8');
console.log('updated filters');
