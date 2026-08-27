const fs = require('fs');
const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');
const mockLines = lines.filter((_, i) => i > 175 && i < 235);
console.log(mockLines.join('\n'));
