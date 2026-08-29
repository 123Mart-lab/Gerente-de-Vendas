import fs from 'fs';

let content = fs.readFileSync('src/components/publicidade/TaskAuditPanel.tsx', 'utf8');

content = content.replace(
  "art: 'Diretor de Arte'",
  "art: 'Diretor de Arte',\n  finance: 'Analista Financeiro'"
);

fs.writeFileSync('src/components/publicidade/TaskAuditPanel.tsx', content, 'utf8');
console.log('fixed roleLabels');
