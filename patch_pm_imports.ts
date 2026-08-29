import fs from 'fs';
let content = fs.readFileSync('src/components/publicidade/ProjectManager.tsx', 'utf8');
content = content.replace(
  "import { Briefcase, Search, Sparkles, Plus, ArrowRight, CheckCircle2, Upload, File, X, Image as ImageIcon } from 'lucide-react';",
  "import { Briefcase, Search, Sparkles, Plus, ArrowRight, CheckCircle2, Upload, File, X, Image as ImageIcon } from 'lucide-react';\nimport TaskAuditPanel, { AuditTask } from './TaskAuditPanel';"
);
fs.writeFileSync('src/components/publicidade/ProjectManager.tsx', content, 'utf8');
console.log('patched pm imports');
