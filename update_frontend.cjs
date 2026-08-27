const fs = require('fs');

let content = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

const regexImport = /import React, { useState } from 'react';/;
content = content.replace(regexImport, "import React, { useState } from 'react';\nimport axios from 'axios';");

const newComponentLogic = `
  const [searchTerm, setSearchTerm] = useState('FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12');
  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [seoResult, setSeoResult] = useState<any>(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimized(false);
    try {
      const response = await axios.post('/api/marketing/optimize', { query: searchTerm });
      setOriginalProduct(response.data.original);
      setSeoResult(response.data.otimizado);
      setOptimized(true);
    } catch (error) {
      console.error('Erro na otimização:', error);
      alert('Erro ao otimizar produto. Verifique se a loja possui esse produto ou se as credenciais são válidas.');
    } finally {
      setIsOptimizing(false);
    }
  };
`;

const stateRegex = /const \[isOptimizing, setIsOptimizing\] = useState\(false\);\n  const \[optimized, setOptimized\] = useState\(false\);\n\n  const handleOptimize = \(\) => {\n    setIsOptimizing\(true\);\n    setTimeout\(\(\) => {\n      setIsOptimizing\(false\);\n      setOptimized\(true\);\n    }, 2000\); \/\/ Simulando o tempo de processamento da IA\n  };/;

content = content.replace(stateRegex, "const [isOptimizing, setIsOptimizing] = useState(false);\n  const [optimized, setOptimized] = useState(false);\n" + newComponentLogic);

// update the input value
content = content.replace(/defaultValue="FACA DE ACO INOXIDAVEL C\/ CABO PLASTICO 12"/, 'value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}');

// update title and description displaying original
content = content.replace(/FACA DE ACO INOXIDAVEL C\/ CABO PLASTICO 12" LINHA TOP CHEF/, '{originalProduct?.name || "..."}');
content = content.replace(/\[Vazia\]/, '{originalProduct?.description || "..."}');

// update preview and optimized results
content = content.replace(/Faca de Aço Inox 12" Cabo Plástico Linha Top Chef \| 123Mart/, '{seoResult?.novoTitulo || "Titulo Gerado..."}');
content = content.replace(/Eleve o nível da sua cozinha com a Faca Top Chef de 12 polegadas. Lâmina em aço inox de altíssima durabilidade. <span className="font-bold text-slate-800">Despacho em 24h<\/span> com o <span className="font-bold text-slate-800">melhor preço!<\/span>/, '{seoResult?.metaDescription || "..."}');
content = content.replace(/Faca de Aço Inox Profissional 12" Top Chef/, '{seoResult?.novoTitulo || "..."}');
content = content.replace(/Cozinheiros amadores, Chefs, Entusiastas da culinária\./, '{seoResult?.publicoAlvo || "..."}');

const descHtmlRegex = /<div className="text-sm text-slate-700 mt-1 p-4 bg-slate-50 rounded border border-slate-200 space-y-3 h-48 overflow-y-auto prose prose-sm">[\s\S]*?<\/div>/;

content = content.replace(descHtmlRegex, `<div className="text-sm text-slate-700 mt-1 p-4 bg-slate-50 rounded border border-slate-200 h-48 overflow-y-auto prose prose-sm" dangerouslySetInnerHTML={{ __html: seoResult?.novaDescricaoHtml || '...' }}></div>`);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', content);
