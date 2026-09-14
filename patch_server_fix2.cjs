const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server.ts');
let code = fs.readFileSync(filePath, 'utf8');

// The initial save is outside of the callback:
code = code.replace(/firebaseService\.saveSkuBriefing\(payload\.sku, \{ sku: payload\.sku, startedAt: Date\.now\(\), steps: currentSteps \}\)/g, 
  "__INITIAL_SAVE_PAYLOAD__");
code = code.replace(/firebaseService\.saveSkuBriefing\(productData\.sku, \{ sku: productData\.sku, startedAt: Date\.now\(\), steps: currentSteps \}\)/g, 
  "__INITIAL_SAVE_PRODUCT__");
code = code.replace(/firebaseService\.saveSkuBriefing\(productData\.sku, \{ sku: productData\.sku, startedAt: Date\.now\(\), steps: currentSteps, \[step\]: response \}\)/g, 
  "__CALLBACK_SAVE_PRODUCT__");

// Put them back properly:
// The ones outside the callback:
code = code.replace(/__INITIAL_SAVE_PAYLOAD__/g, "firebaseService.saveSkuBriefing(payload.sku, { sku: payload.sku, startedAt: Date.now(), steps: currentSteps })");
// Let's just restore them correctly manually if needed. Wait.
