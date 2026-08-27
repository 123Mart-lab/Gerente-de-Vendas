const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

// Remove the large block
const blockToRemoveStart = `            {/* Linha: Diagnóstico de SEO (Métricas) */}`;
const blockToRemoveEnd = `            {/* Linha: Título e Meta */}`;

if (code.includes(blockToRemoveStart) && code.includes(blockToRemoveEnd)) {
  const startIdx = code.indexOf(blockToRemoveStart);
  const endIdx = code.indexOf(blockToRemoveEnd);
  code = code.substring(0, startIdx) + code.substring(endIdx);
}

// Add original title score badge
code = code.replace(
  `<p className="text-sm text-slate-800 mb-6">
                  {typeof originalProduct?.name === 'string' ? originalProduct?.name : (originalProduct?.name?.pt || <span className="text-slate-400 italic">Vazio</span>)}
                </p>`,
  `<p className="text-sm text-slate-800 mb-2">
                  {typeof originalProduct?.name === 'string' ? originalProduct?.name : (originalProduct?.name?.pt || <span className="text-slate-400 italic">Vazio</span>)}
                </p>
                {seoResult?.scoreTituloOriginal !== undefined && (
                  <div className="inline-flex items-center mt-2 px-2 py-1 rounded bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Nota de SEO: {seoResult.scoreTituloOriginal}%
                  </div>
                )}`
);

// Add new title score badge
code = code.replace(
  `{selectedFields.title ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Novo Título Otimizado
                    </label>
                  </div>`,
  `{selectedFields.title ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Novo Título Otimizado
                    </label>
                    {seoResult?.scoreTituloNovo !== undefined && (
                      <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Nota de SEO: {seoResult.scoreTituloNovo}%
                      </div>
                    )}
                  </div>`
);

// Add original description score and tips
code = code.replace(
  `<div className="text-sm text-slate-600 prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={renderHTML(originalProduct?.description?.pt || originalProduct?.description || '<span class="text-slate-400 italic">Vazio</span>')} />`,
  `<div className="text-sm text-slate-600 prose prose-sm max-w-none break-words mb-4" dangerouslySetInnerHTML={renderHTML(originalProduct?.description?.pt || originalProduct?.description || '<span class="text-slate-400 italic">Vazio</span>')} />
                
                {seoResult?.scoreDescricaoOriginal !== undefined && (
                  <div className="pt-4 border-t border-slate-100 mt-auto">
                    <div className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Nota de SEO (Qualidade Técnica): {seoResult.scoreDescricaoOriginal}%
                    </div>
                    {seoResult.dicasMelhoria && seoResult.dicasMelhoria.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                        <p className="font-semibold mb-1">⚠️ Faltam dados técnicos no ERP:</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-90">
                          {seoResult.dicasMelhoria.map((dica: string, i: number) => <li key={i}>{dica}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}`
);

// Add new description score
code = code.replace(
  `{selectedFields.description ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Nova Descrição Otimizada
                    </label>`,
  `{selectedFields.description ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Nova Descrição Otimizada
                    </label>
                    {seoResult?.scoreDescricaoNova !== undefined && (
                      <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Nota de SEO: {seoResult.scoreDescricaoNova}%
                      </div>
                    )}`
);


fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
console.log('Done patching optimizer UI');
