const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "description: { pt: '' }",
  "description: { pt: 'Experimente a Faca de Aço Inoxidável 12\" Top Chef com lâmina de alta qualidade e cabo ergonômico. Adicione ao carrinho e eleve seu churrasco!' }, brand: { pt: 'Home&More' }, tags: 'Faca Inox, Faca Churrasco', handle: { pt: 'faca-de-aco-inoxidavel-c-cabo-plastico-12-linha-top-chef-48-pcs-p-cx' }, seo_title: { pt: 'Faca de Aço Inoxidável 12\" Top Chef - Corte Perfeito' }"
);

fs.writeFileSync('server.ts', content);
