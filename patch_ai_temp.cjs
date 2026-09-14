const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/services/ai.ts');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/config: \{ temperature: 0\.2 \}/g, "config: { temperature: 0.5 }");

fs.writeFileSync(filePath, code);
console.log('Patched AI temperature');
