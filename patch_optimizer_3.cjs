const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

// Title Original Badge
const titleOrigSearch = `{typeof originalProduct?.name === 'string' ? originalProduct?.name : (originalProduct?.name?.pt || <span className="text-slate-400 italic">Vazio</span>)}
                </p>
              </div>`;
              
const titleOrigReplace = `{typeof originalProduct?.name === 'string' ? originalProduct?.name : (originalProduct?.name?.pt || <span className="text-slate-400 italic">Vazio</span>)}
                </p>
                {seoResult?.scoreTituloOriginal !== undefined && (
                  <div className="inline-flex items-center mt-2 px-2 py-1 rounded bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Nota de SEO: {seoResult.scoreTituloOriginal}%
                  </div>
                )}
              </div>`;

code = code.replace(titleOrigSearch, titleOrigReplace);

// Title New Badge
const titleNewSearch = `{selectedFields.title ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Novo Título Otimizado
                    </label>
                  </div>`;
                  
const titleNewReplace = `{selectedFields.title ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Novo Título Otimizado
                    </label>
                    {seoResult?.scoreTituloNovo !== undefined && (
                      <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Nota de SEO: {seoResult.scoreTituloNovo}%
                      </div>
                    )}
                  </div>`;
code = code.replace(titleNewSearch, titleNewReplace);

// Description Original Badge
const descOrigSearch = `typeof originalProduct?.description === 'string' ? originalProduct?.description : originalProduct?.description?.pt
                  )} 
                />
              </div>`;

const descOrigReplace = `typeof originalProduct?.description === 'string' ? originalProduct?.description : originalProduct?.description?.pt
                  )} 
                />
                {seoResult?.scoreDescricaoOriginal !== undefined && (
                  <div className="pt-4 border-t border-slate-100 mt-4">
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
                )}
              </div>`;
code = code.replace(descOrigSearch, descOrigReplace);

// Description New Badge
const descNewSearch = `{selectedFields.description ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Nova Descrição de Vendas (Copywriting)
                    </label>
                  </div>`;
                  
const descNewReplace = `{selectedFields.description ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Nova Descrição de Vendas (Copywriting)
                    </label>
                    {seoResult?.scoreDescricaoNova !== undefined && (
                      <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Nota de SEO: {seoResult.scoreDescricaoNova}%
                      </div>
                    )}
                  </div>`;
code = code.replace(descNewSearch, descNewReplace);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
console.log('Finished injecting small badges');
