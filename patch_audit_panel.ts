import fs from 'fs';

let content = fs.readFileSync('src/components/publicidade/TaskAuditPanel.tsx', 'utf8');

const target = `{task.sentResponse || <span className="text-slate-400 italic">Trabalhando na solicitação...</span>}`;

const replacement = `
              {(() => {
                if (!task.sentResponse) return <span className="text-slate-400 italic">Trabalhando na solicitação...</span>;
                
                try {
                  const data = JSON.parse(task.sentResponse);
                  if (data.before && data.after) {
                    return (
                      <div className="space-y-4">
                        <div className="font-medium text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 mb-4 flex items-center gap-2">
                           <CheckCircle2 className="w-5 h-5" />
                           {data.message || "Anúncio otimizado e salvo na Nuvemshop."}
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                             <div className="text-xs font-bold text-slate-500 uppercase mb-3 pb-2 border-b border-slate-200">Antes (Original)</div>
                             <div className="space-y-3">
                               <div>
                                 <div className="text-[10px] font-semibold text-slate-400 uppercase">Título</div>
                                 <div className="text-sm text-slate-700 font-medium">{data.before.titulo || '-'}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] font-semibold text-slate-400 uppercase">Título SEO</div>
                                 <div className="text-sm text-slate-700">{data.before.seoTitle || '-'}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] font-semibold text-slate-400 uppercase">Meta Description</div>
                                 <div className="text-xs text-slate-600 italic">{data.before.meta || '-'}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] font-semibold text-slate-400 uppercase">Descrição (HTML)</div>
                                 <div className="text-xs text-slate-500 line-clamp-3 bg-white border border-slate-100 p-2 rounded mt-1">{data.before.descricao || '-'}</div>
                               </div>
                             </div>
                          </div>

                          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                             <div className="text-xs font-bold text-blue-600 uppercase mb-3 pb-2 border-b border-blue-100 flex items-center gap-2">
                               <Sparkles className="w-3 h-3" />
                               Depois (Otimizado)
                             </div>
                             <div className="space-y-3">
                               <div>
                                 <div className="text-[10px] font-semibold text-blue-400 uppercase">Título</div>
                                 <div className="text-sm text-slate-800 font-medium">{data.after.titulo || '-'}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] font-semibold text-blue-400 uppercase">Título SEO</div>
                                 <div className="text-sm text-slate-800">{data.after.seoTitle || '-'}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] font-semibold text-blue-400 uppercase">Meta Description</div>
                                 <div className="text-xs text-slate-700 italic bg-white/60 p-2 rounded border border-blue-50 mt-1">{data.after.meta || '-'}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] font-semibold text-blue-400 uppercase">Descrição (HTML)</div>
                                 <div className="text-xs text-slate-600 line-clamp-3 bg-white/60 border border-blue-50 p-2 rounded mt-1">{data.after.descricao || '-'}</div>
                               </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  // Not JSON, just render as text
                }
                return task.sentResponse;
              })()}
`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/publicidade/TaskAuditPanel.tsx', content, 'utf8');
