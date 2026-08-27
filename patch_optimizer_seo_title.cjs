const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

// 1. Add seoTitle to selectedFields
code = code.replace(
  `const [selectedFields, setSelectedFields] = useState({
    title: true,
    metaDescription: true,
    brand: true,
    tags: true,
    url: false,
    description: true
  });`,
  `const [selectedFields, setSelectedFields] = useState({
    title: true,
    metaDescription: true,
    brand: true,
    tags: true,
    url: false,
    seoTitle: false,
    description: true
  });`
);

// 2. Add to handleSave
code = code.replace(
  `if (selectedFields.title) finalData.novoTitulo = seoResult?.novoTitulo;`,
  `if (selectedFields.title) finalData.novoTitulo = seoResult?.novoTitulo;
      if (selectedFields.seoTitle) finalData.novoTituloSeo = seoResult?.novoTitulo;`
);

// 3. Update the UI for Título SEO to include the checkbox
const oldHtml = `<div className="p-3 rounded-lg border border-slate-200 bg-slate-50 opacity-60">
                   <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare2 className="w-4 h-4 text-emerald-600" />
                      Título SEO (Otimizado)
                    </label>
                  </div>
                  <div className="text-sm text-slate-500 italic mb-1">
                    (Nota: O Novo Título Otimizado acima será salvo tanto como Título do Produto quanto como Título SEO).
                  </div>
                </div>`;

const newHtml = `<div className={\`p-3 rounded-lg border \${selectedFields.seoTitle ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}\`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('seoTitle')}>
                      {selectedFields.seoTitle ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Título SEO (Otimizado)
                    </label>
                  </div>
                  <div className="text-sm text-slate-500 italic mb-1">
                    Ao marcar esta opção, o novo título otimizado gerado pela IA (visto acima) também será aplicado como o Título SEO do produto na Nuvemshop.
                  </div>
                </div>`;

if(code.includes(oldHtml)) {
    code = code.replace(oldHtml, newHtml);
    console.log("Replaced exactly!");
} else {
    // If formatting was slightly different, let's use a regex
    const regex = /<div className="p-3 rounded-lg border border-slate-200 bg-slate-50 opacity-60">[\s\S]*?\(Nota: O Novo Título Otimizado acima será salvo tanto como Título do Produto quanto como Título SEO\)\.[\s\S]*?<\/div>\s*<\/div>/;
    if(regex.test(code)) {
        code = code.replace(regex, newHtml);
        console.log("Replaced with regex!");
    } else {
        console.log("Could not find block!");
    }
}

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
