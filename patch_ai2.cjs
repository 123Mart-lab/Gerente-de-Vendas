const fs = require('fs');
let code = fs.readFileSync('src/services/ai.ts', 'utf8');

code = code.replace(
  'return JSON.parse(response.text || \'{}\');',
  'const parsed = JSON.parse(response.text || \'{}\'); console.log("AI returned:", parsed); return parsed;'
);

fs.writeFileSync('src/services/ai.ts', code);
console.log('Patched ai.ts');
