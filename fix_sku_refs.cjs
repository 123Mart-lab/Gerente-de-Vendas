const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Fix in app.post('/api/marketing/orchestrate-optimization')
const target1 = `sku: payload.sku ? payload.sku.toString() : payload.id.toString(),`;
const replacement1 = `sku: resolvedSku.toString(),`;
code = code.replace(target1, replacement1);

const target2 = `currentSteps[1].pdfUrl = \`/api/marketing/pdf/planner/\${payload.sku}\`;`;
const replacement2 = `currentSteps[1].pdfUrl = \`/api/marketing/pdf/planner/\${resolvedSku}\`;`;
code = code.replace(target2, replacement2);

const target3 = `currentSteps[3].pdfUrl = \`/api/marketing/pdf/monitor/\${payload.sku}\`;`;
const replacement3 = `currentSteps[3].pdfUrl = \`/api/marketing/pdf/monitor/\${resolvedSku}\`;`;
code = code.replace(target3, replacement3);

const target4 = `currentSteps[5].pdfUrl = \`/api/marketing/pdf/arte/\${payload.sku}\`;`;
const replacement4 = `currentSteps[5].pdfUrl = \`/api/marketing/pdf/arte/\${resolvedSku}\`;`;
code = code.replace(target4, replacement4);

const target5 = `currentSteps[7].pdfUrl = \`/api/marketing/pdf/seo/\${payload.sku}\`;`;
const replacement5 = `currentSteps[7].pdfUrl = \`/api/marketing/pdf/seo/\${resolvedSku}\`;`;
code = code.replace(target5, replacement5);

const target6 = `currentSteps[8].pdfUrl = \`/api/marketing/pdf/briefing/\${payload.sku}\`;`;
const replacement6 = `currentSteps[8].pdfUrl = \`/api/marketing/pdf/briefing/\${resolvedSku}\`;`;
code = code.replace(target6, replacement6);

// Fix in app.post('/api/agent/chat')
code = code.replace(/sku: actionPayload\.product_id/g, 'sku: actionPayload.product_id || actionPayload.sku');

fs.writeFileSync('server.ts', code);
console.log('Fixed sku references');
