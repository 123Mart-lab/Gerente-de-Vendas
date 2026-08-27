const fs = require('fs');
let aiCode = fs.readFileSync('src/services/ai.ts', 'utf8');

const aiSearch = `"marca": "Marca do Produto",
  "novaDescricaoHtml"`;

const aiReplace = `"marca": "Marca do Produto",
  "urlProduto": "nome-atrativo-separado-por-hifens",
  "novaDescricaoHtml"`;

aiCode = aiCode.replace(aiSearch, aiReplace);
fs.writeFileSync('src/services/ai.ts', aiCode);

let uiCode = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

uiCode = uiCode.replace(
  `const [selectedFields, setSelectedFields] = useState({
    title: true,
    metaDescription: true,
    brand: true,
    tags: true,
    description: true
  });`,
  `const [selectedFields, setSelectedFields] = useState({
    title: true,
    metaDescription: true,
    brand: true,
    tags: true,
    url: false,
    description: true
  });`
);

uiCode = uiCode.replace(
  `if (selectedFields.description) finalData.novaDescricaoHtml = seoResult?.novaDescricaoHtml;`,
  `if (selectedFields.url) finalData.urlProduto = seoResult?.urlProduto;
      if (selectedFields.description) finalData.novaDescricaoHtml = seoResult?.novaDescricaoHtml;`
);

const urlBlock = `{/* Linha: URL Amigável */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-white">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">URL Original</label>
                <p className="text-sm text-slate-800 font-mono break-all">
                  .../produtos/{typeof originalProduct?.handle === 'string' ? originalProduct?.handle : (originalProduct?.handle?.pt || 'vazio')}
                </p>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col gap-4">
                <div className={\`p-3 rounded-lg border \${selectedFields.url ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}\`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('url')}>
                      {selectedFields.url ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Nova URL Amigável
                    </label>
                  </div>
                  <div className="flex items-center opacity-100">
                    <span className="text-sm text-slate-500 bg-slate-100 border border-slate-200 border-r-0 rounded-l p-2">.../produtos/</span>
                    <input
                      type="text"
                      disabled={!selectedFields.url}
                      value={seoResult?.urlProduto || ''}
                      onChange={(e) => setSeoResult({...seoResult, urlProduto: e.target.value})}
                      className="w-full text-sm text-sky-700 font-mono p-2 bg-white border border-slate-200 rounded-r focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  {!selectedFields.url && (
                    <div className="mt-2 text-[10px] text-amber-600 font-medium">
                      ⚠️ Sugestão desativada por padrão. Lembre-se de criar um redirecionamento 301 se alterar a URL.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Linha: Descrição */}`;

uiCode = uiCode.replace(`{/* Linha: Descrição */}`, urlBlock);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', uiCode);
console.log('Restored URL with default false');
