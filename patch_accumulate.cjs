const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server.ts');
let code = fs.readFileSync(filePath, 'utf8');

// Replace the scattered saveSkuBriefing calls in server.ts with an accumulated state object

// For app.post('/api/marketing/product' (line 618, 758)
// We already have `currentSteps` there. Let's not risk regex for everything.
// The easiest fix was already applied in patch_firebase.cjs (inMemoryBriefings merge).
// Let's just double check the patch_firebase.cjs result.
