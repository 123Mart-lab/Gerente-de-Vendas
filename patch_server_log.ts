import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "console.error('Erro na orquestração:', err);",
  "console.error('Erro na orquestração:', err); fs.writeFileSync('orchestration_error.log', String(err.stack || err), 'utf8');"
);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('patched log');
