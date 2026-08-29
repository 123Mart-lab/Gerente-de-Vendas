import fs from 'fs';
let po = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

const target = `                  filteredAndSortedHistory.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-5 py-3 text-slate-500">{p.alteredAt}</td>
                      <td className="px-5 py-3"><ScoreBadge score={p.oldScore} /></td>
                      <td className="px-5 py-3"><ScoreBadge score={p.newScore} /></td>
                      <td className="px-5 py-3 font-bold text-emerald-600 flex items-center gap-1">
                        +{Math.max(0, p.newScore - p.oldScore)}%
                      </td>
                    </tr>
                  ))`;

const replacement = `                  filteredAndSortedHistory.map((p, i) => (
                    <React.Fragment key={i}>
                      <tr 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => {
                          const el = document.getElementById(\`history-details-\${i}\`);
                          if (el) el.classList.toggle('hidden');
                        }}
                      >
                        <td className="px-5 py-3 font-medium text-slate-900">{p.name}</td>
                        <td className="px-5 py-3 text-slate-500">{p.alteredAt || p.date}</td>
                        <td className="px-5 py-3"><ScoreBadge score={p.oldScore} /></td>
                        <td className="px-5 py-3"><ScoreBadge score={p.newScore} /></td>
                        <td className="px-5 py-3 font-bold text-emerald-600 flex items-center gap-1">
                          +{Math.max(0, p.newScore - p.oldScore)}%
                        </td>
                      </tr>
                      {p.before && p.after && (
                        <tr id={\`history-details-\${i}\`} className="hidden bg-slate-50 border-t border-slate-100">
                          <td colSpan={5} className="p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="bg-white border border-slate-200 rounded-lg p-4">
                                 <div className="text-xs font-bold text-slate-500 uppercase mb-3 pb-2 border-b border-slate-200">Antes (Original)</div>
                                 <div className="space-y-3">
                                   <div>
                                     <div className="text-[10px] font-semibold text-slate-400 uppercase">Título</div>
                                     <div className="text-sm text-slate-700 font-medium">{p.before.titulo || '-'}</div>
                                   </div>
                                   <div>
                                     <div className="text-[10px] font-semibold text-slate-400 uppercase">Título SEO</div>
                                     <div className="text-sm text-slate-700">{p.before.seoTitle || '-'}</div>
                                   </div>
                                   <div>
                                     <div className="text-[10px] font-semibold text-slate-400 uppercase">Meta Description</div>
                                     <div className="text-xs text-slate-600 italic">{p.before.meta || '-'}</div>
                                   </div>
                                   <div>
                                     <div className="text-[10px] font-semibold text-slate-400 uppercase">Descrição (HTML)</div>
                                     <div className="text-xs text-slate-500 line-clamp-3 bg-slate-50 border border-slate-100 p-2 rounded mt-1">{p.before.descricao || '-'}</div>
                                   </div>
                                 </div>
                              </div>
    
                              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
                                 <div className="text-xs font-bold text-emerald-700 uppercase mb-3 pb-2 border-b border-emerald-100 flex items-center gap-2">
                                   <Sparkles className="w-3 h-3" />
                                   Depois (Otimizado)
                                 </div>
                                 <div className="space-y-3">
                                   <div>
                                     <div className="text-[10px] font-semibold text-emerald-600 uppercase">Título</div>
                                     <div className="text-sm text-slate-800 font-medium">{p.after.titulo || '-'}</div>
                                   </div>
                                   <div>
                                     <div className="text-[10px] font-semibold text-emerald-600 uppercase">Título SEO</div>
                                     <div className="text-sm text-slate-800">{p.after.seoTitle || '-'}</div>
                                   </div>
                                   <div>
                                     <div className="text-[10px] font-semibold text-emerald-600 uppercase">Meta Description</div>
                                     <div className="text-xs text-slate-700 italic bg-white/60 p-2 rounded border border-emerald-50 mt-1">{p.after.meta || '-'}</div>
                                   </div>
                                   <div>
                                     <div className="text-[10px] font-semibold text-emerald-600 uppercase">Descrição (HTML)</div>
                                     <div className="text-xs text-slate-600 line-clamp-3 bg-white/60 border border-emerald-50 p-2 rounded mt-1">{p.after.descricao || '-'}</div>
                                   </div>
                                 </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))`;

po = po.replace(target, replacement);

// Make sure React is imported (if not already used explicitly as React.Fragment)
if (!po.includes("import React, {")) {
  po = po.replace("import { useState", "import React, { useState");
}

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', po, 'utf8');
