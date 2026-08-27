const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

// 1. Add preview mode toggle state
if (!code.includes('showHtmlPreview')) {
  code = code.replace(
    'const [selectedFields, setSelectedFields] = useState({',
    'const [showHtmlPreview, setShowHtmlPreview] = useState(true);\n  const [selectedFields, setSelectedFields] = useState({'
  );
}

// 2. Add SEO Title block
const seoTitleOriginal = `
            {/* Linha: SEO Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-white">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">Título SEO Original</label>
                <p className="text-sm text-slate-800">
                  {typeof originalProduct?.seo_title === 'string' ? originalProduct?.seo_title : (originalProduct?.seo_title?.pt || <span className="text-slate-400 italic">Vazio (Usa o Título Padrão)</span>)}
                </p>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col gap-4">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 opacity-60">
                   <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare2 className="w-4 h-4 text-emerald-600" />
                      Título SEO (Otimizado)
                    </label>
                  </div>
                  <div className="text-sm text-slate-500 italic mb-1">
                    (Nota: O Novo Título Otimizado acima será salvo tanto como Título do Produto quanto como Título SEO).
                  </div>
                </div>
              </div>
            </div>
`;

if (!code.includes('Título SEO Original')) {
  code = code.replace(
    '{/* Linha: Marca e Tags */}',
    seoTitleOriginal + '\n            {/* Linha: Marca e Tags */}'
  );
}

// 3. Fix the AI Description to have a toggle for Visual / Code
const descriptionTarget = `
                  {/* Container duplo para visual e codigo (pra ficar simples, vamos manter um textarea pra editar, mas com opcao de preview seria ideal. Como o tempo é curto, focamos no HTML limpo) */}
                  <textarea
                    disabled={!selectedFields.description}
                    value={seoResult?.novaDescricaoHtml || ''}
                    onChange={(e) => setSeoResult({...seoResult, novaDescricaoHtml: e.target.value})}
                    className="w-full flex-1 min-h-[400px] text-sm text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 font-mono resize-y disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    (Edite o código HTML acima se necessário. As tags serão renderizadas na loja.)
                  </div>
`;

const newDescription = `
                  {/* Container duplo para visual e codigo */}
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      onClick={() => setShowHtmlPreview(true)}
                      className={\`text-xs px-3 py-1 rounded \${showHtmlPreview ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-slate-100 text-slate-500'}\`}
                    >
                      Modo Visual
                    </button>
                    <button 
                      onClick={() => setShowHtmlPreview(false)}
                      className={\`text-xs px-3 py-1 rounded \${!showHtmlPreview ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-slate-100 text-slate-500'}\`}
                    >
                      Código HTML
                    </button>
                  </div>

                  {showHtmlPreview ? (
                    <div 
                      className="w-full flex-1 min-h-[400px] text-sm text-slate-800 p-4 bg-white border border-slate-200 rounded prose prose-sm max-w-none overflow-y-auto"
                      dangerouslySetInnerHTML={renderHTML(seoResult?.novaDescricaoHtml || '')} 
                    />
                  ) : (
                    <textarea
                      disabled={!selectedFields.description}
                      value={seoResult?.novaDescricaoHtml || ''}
                      onChange={(e) => setSeoResult({...seoResult, novaDescricaoHtml: e.target.value})}
                      className="w-full flex-1 min-h-[400px] text-sm text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 font-mono resize-y disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  )}
                  <div className="mt-2 text-xs text-slate-500">
                    (Alternar para Código HTML permite edição manual antes de salvar).
                  </div>
`;

code = code.replace(descriptionTarget, newDescription);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
console.log('ProductOptimizer updated!');
