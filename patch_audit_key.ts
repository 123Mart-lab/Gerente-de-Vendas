import fs from 'fs';
let content = fs.readFileSync('src/components/publicidade/TaskAuditPanel.tsx', 'utf8');
content = content.replace(
  "function AuditTaskItem({ task }: { task: AuditTask }) {",
  "function AuditTaskItem({ task }: { task: AuditTask }) {"
);
// Actually, let's just use React.FC
content = content.replace(
  "function AuditTaskItem({ task }: { task: AuditTask }) {",
  "const AuditTaskItem: React.FC<{ task: AuditTask }> = ({ task }) => {"
);
fs.writeFileSync('src/components/publicidade/TaskAuditPanel.tsx', content, 'utf8');
console.log('patched key');
