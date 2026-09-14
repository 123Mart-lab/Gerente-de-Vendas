const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server.ts');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/briefingData\.artDirector/g, "briefingData.art");

fs.writeFileSync(filePath, code);
console.log('Fixed pdf endpoint mapping in server.ts');
