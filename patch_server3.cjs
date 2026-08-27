const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'if (productId && String(productId).indexOf(\'mock-\') === -1) {',
  `console.log("Saving payload to Nuvemshop:", JSON.stringify(updatePayload, null, 2));\n    if (productId && String(productId).indexOf('mock-') === -1) {`
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts with logging');
