const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server.ts');
let code = fs.readFileSync(filePath, 'utf8');

const expectedCode = code.split('\n');
for (let i = 0; i < expectedCode.length; i++) {
  if (expectedCode[i].includes('firebaseService.saveSkuBriefing')) {
    if (expectedCode[i].includes('// Salva a estrutura inicial vazia no banco') || expectedCode[i-1]?.includes('// Salva a estrutura inicial vazia no banco') || expectedCode[i-2]?.includes('let currentSteps = defaultStepsTemplate')) {
      expectedCode[i] = expectedCode[i].replace(/\{.*\}/, "{ sku: productData ? productData.sku : payload.sku, startedAt: Date.now(), steps: currentSteps }");
    } else if (expectedCode[i].includes('startedAt: Date.now()') || expectedCode[i-1]?.includes('startedAt: Date.now()')) {
      expectedCode[i] = expectedCode[i].replace(/\{.*\}/, "{ sku: productData ? productData.sku : payload.sku, startedAt: Date.now(), steps: currentSteps, [step]: response }");
    }
  }
}

fs.writeFileSync(filePath, expectedCode.join('\n'));
console.log('Fixed server.ts');
