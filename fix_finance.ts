import fs from 'fs';

let content = fs.readFileSync('src/components/financeiro/FinancialAnalyst.tsx', 'utf8');

const badImports = `import React from 'react';
import { DollarSign } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from '../publicidade/TaskAuditPanel';
`;

content = content.replace(badImports, '');

fs.writeFileSync('src/components/financeiro/FinancialAnalyst.tsx', content, 'utf8');
console.log('fixed finance imports');
