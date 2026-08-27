const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

const target = `            {/* Linha: Título e Meta */}`;

const replacement = `            {/* Linha: Diagnóstico de SEO (Métricas) */}
            {seoResult && seoResult.scorePersuasao !== undefined && (
              <div className="border-b border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  Diagnóstico de Qualidade (Ficha Técnica Original)
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  A Inteligência Artificial analisou a quantidade de informações presentes no produto original. 
                  Para um anúncio de alta conversão, buscamos a proporção áurea: <strong>20% Persuasão, 50% Informação, 30% Segurança.</strong>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-700">Persuasão (Desejo)</span>
                      <span className={\`text-xs font-bold px-2 py-1 rounded \${seoResult.scorePersuasao > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}\`}>{seoResult.scorePersuasao}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5"><div className={\`h-1.5 rounded-full \${seoResult.scorePersuasao > 70 ? 'bg-emerald-500' : 'bg-amber-500'}\`} style={{width: \`\${seoResult.scorePersuasao}%\`}}></div></div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-700">Informação Técnica</span>
                      <span className={\`text-xs font-bold px-2 py-1 rounded \${seoResult.scoreInformacao > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}\`}>{seoResult.scoreInformacao}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5"><div className={\`h-1.5 rounded-full \${seoResult.scoreInformacao > 70 ? 'bg-emerald-500' : 'bg-amber-500'}\`} style={{width: \`\${seoResult.scoreInformacao}%\`}}></div></div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-700">Segurança (Garantia/FISPQ)</span>
                      <span className={\`text-xs font-bold px-2 py-1 rounded \${seoResult.scoreSeguranca > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}\`}>{seoResult.scoreSeguranca}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5"><div className={\`h-1.5 rounded-full \${seoResult.scoreSeguranca > 70 ? 'bg-emerald-500' : 'bg-amber-500'}\`} style={{width: \`\${seoResult.scoreSeguranca}%\`}}></div></div>
                  </div>
                </div>
                
                {seoResult.dicasMelhoria && seoResult.dicasMelhoria.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Alerta de Otimização: Faltam informações no produto original</h4>
                    <p className="text-xs text-amber-700 mb-2">Para que a IA crie uma copy perfeita, considere adicionar as seguintes informações no ERP e gerar a otimização novamente:</p>
                    <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1">
                      {seoResult.dicasMelhoria.map((dica, i) => (
                        <li key={i}>{dica}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Linha: Título e Meta */}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
  console.log('ProductOptimizer patched successfully');
} else {
  console.log('Target string not found in ProductOptimizer.tsx');
}
