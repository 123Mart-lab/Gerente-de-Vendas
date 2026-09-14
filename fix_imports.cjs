const fs = require('fs');
const filePath = 'src/components/CEOBriefing.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace("import { Cloud, Download, Loader2, Check } from 'lucide-react';\nimport { FileText, FileDown, CheckCircle2, Circle, X, Download, FileJson, Loader2 } from 'lucide-react';", 
  "import { Cloud, Check, FileText, FileDown, CheckCircle2, Circle, X, Download, FileJson, Loader2 } from 'lucide-react';");
  
fs.writeFileSync(filePath, code);
