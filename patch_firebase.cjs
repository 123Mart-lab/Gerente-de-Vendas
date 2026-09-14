const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/services/firebase.ts');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/inMemoryBriefings\[sku\] = \{ \.\.\.briefingData, updatedAt: Date\.now\(\) \};/g, 
  "inMemoryBriefings[sku] = { ...(inMemoryBriefings[sku] || {}), ...briefingData, updatedAt: Date.now() };");

fs.writeFileSync(filePath, code);
console.log('Fixed firebase memory fallback merge');
