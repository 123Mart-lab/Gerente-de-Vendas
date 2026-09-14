const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server.ts');
let code = fs.readFileSync(filePath, 'utf8');

// Fix the syntax errors for the initial save calls
code = code.replace(/firebaseService\.saveSkuBriefing\(payload\.sku, \{ sku: payload\.sku, startedAt: Date\.now\(\), steps: currentSteps, \[step\]: response \}\)/, 
  "firebaseService.saveSkuBriefing(payload.sku, { sku: payload.sku, startedAt: Date.now(), steps: currentSteps })");

code = code.replace(/firebaseService\.saveSkuBriefing\(productData\.sku, \{ sku: productData\.sku, startedAt: Date\.now\(\), steps: currentSteps, \[step\]: response \}\)/, 
  "firebaseService.saveSkuBriefing(productData.sku, { sku: productData.sku, startedAt: Date.now(), steps: currentSteps })");
  
code = code.replace(/firebaseService\.saveSkuBriefing\(productData\.sku, \{ sku: productData\.sku, startedAt: Date\.now\(\), steps: currentSteps, \[step\]: response \}\)/, 
  "firebaseService.saveSkuBriefing(productData.sku, { sku: productData.sku, startedAt: Date.now(), steps: currentSteps })");

fs.writeFileSync(filePath, code);
console.log('Fixed server.ts');
