const fs = require('fs');

// Fix server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
  /description: produto\.description\?\.pt \|\| produto\.description \|\| ''/,
  "description: produto.description?.pt ?? (typeof produto.description === 'string' ? produto.description : '')"
);
serverCode = serverCode.replace(
  /name: produto\.name\?\.pt \|\| produto\.name/,
  "name: produto.name?.pt ?? (typeof produto.name === 'string' ? produto.name : '')"
);
fs.writeFileSync('server.ts', serverCode);

// Fix ProductOptimizer.tsx just in case
let uiCode = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');
uiCode = uiCode.replace(
  /\{originalProduct\?\.description \|\| "\.\.\."\}/,
  "{typeof originalProduct?.description === 'string' ? originalProduct?.description : (originalProduct?.description?.pt || '...')}"
);
uiCode = uiCode.replace(
  /\{originalProduct\?\.name \|\| "\.\.\."\}/,
  "{typeof originalProduct?.name === 'string' ? originalProduct?.name : (originalProduct?.name?.pt || '...')}"
);
fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', uiCode);

