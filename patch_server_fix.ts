import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace("fs.writeFileSync('orchestration_error.log', String(err.stack || err), 'utf8');", "");
fs.writeFileSync('server.ts', content, 'utf8');
console.log('patched server fix');
