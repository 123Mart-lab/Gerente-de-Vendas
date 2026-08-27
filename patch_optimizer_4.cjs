const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

// 1. Remove `url: true` from initial state
code = code.replace(
  `const [selectedFields, setSelectedFields] = useState({
    title: true,
    metaDescription: true,
    brand: true,
    tags: true,
    url: true,
    description: true
  });`,
  `const [selectedFields, setSelectedFields] = useState({
    title: true,
    metaDescription: true,
    brand: true,
    tags: true,
    description: true
  });`
);

// 2. Remove `if (selectedFields.url) finalData.urlProduto = seoResult?.urlProduto;` from handleSave
code = code.replace(
  `if (selectedFields.url) finalData.urlProduto = seoResult?.urlProduto;`,
  ``
);

// 3. Remove the entire URL section from the UI
const urlSectionRegex = /\s*{\/\* Linha: URL Amigável \*\/}[\s\S]*?\{\/\* Linha: Descrição \*\/\}/g;
code = code.replace(urlSectionRegex, '\n            {/* Linha: Descrição */}');

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
console.log('Optimizer UI patched for URL removal');
