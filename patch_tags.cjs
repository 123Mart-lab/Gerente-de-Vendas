const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'if (data.tags) updatePayload.tags = data.tags;',
  'if (data.tags) updatePayload.tags = data.tags;'
); // Let's check how to replace it.

console.log(code.includes('if (data.tags) updatePayload.tags = data.tags;'));
