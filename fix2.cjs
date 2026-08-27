const fs = require('fs');
let content = fs.readFileSync('src/services/ai.ts', 'utf8');
content = content.replace(/}\s*async generateProductSEO/, '},\n  async generateProductSEO');
fs.writeFileSync('src/services/ai.ts', content);
