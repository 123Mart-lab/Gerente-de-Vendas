const fs = require('fs');
let content = fs.readFileSync('src/services/ai.ts', 'utf8');
content = content.replace(/model: 'gemini-2.5-flash'/g, "model: 'gemini-3.6-flash'");
fs.writeFileSync('src/services/ai.ts', content);
