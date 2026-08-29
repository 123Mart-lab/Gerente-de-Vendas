import fs from 'fs';

let content = fs.readFileSync('src/components/publicidade/TaskAuditPanel.tsx', 'utf8');

const roleMap = `
const roleLabels: Record<string, string> = {
  planner: 'Pesquisador',
  monitor: 'Monitor',
  seo: 'Especialista SEO',
  art: 'Diretor de Arte'
};
`;

if (!content.includes("roleLabels")) {
  content = content.replace("export default function TaskAuditPanel", roleMap + "\nexport default function TaskAuditPanel");
}

if (!content.includes("task.role")) {
  content = content.replace(
    "status: 'pending' | 'completed';",
    "status: 'pending' | 'completed';\n  role?: string;"
  );
  
  content = content.replace(
    '<span className="font-semibold text-slate-700 text-sm">Alvo: {task.productName}</span>',
    '<span className="font-semibold text-slate-700 text-sm flex items-center gap-2">{task.role && <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-xs">{roleLabels[task.role] || task.role}</span>} Alvo: {task.productName}</span>'
  );
}

fs.writeFileSync('src/components/publicidade/TaskAuditPanel.tsx', content, 'utf8');
console.log('patched TaskAuditPanel');
