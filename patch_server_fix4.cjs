const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server.ts');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/sku: productData \? productData\.sku : payload\.sku/g, "sku: typeof productData !== 'undefined' ? productData.sku : payload.sku");

fs.writeFileSync(filePath, code);
console.log('Fixed server.ts again');
