import fs from 'fs';

let content = fs.readFileSync('src/components/financeiro/FinancialAnalyst.tsx', 'utf8');

const replacement = `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from '../publicidade/TaskAuditPanel';

export default function FinancialAnalyst() {
  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.role === 'finance'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs', err);
      }
    };
    fetchLogs();
    
    // Auto-refresh for demo
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);`;

content = content.replace(/export default function FinancialAnalyst\(\) \{[\s\S]*?(?=return \()/m, replacement + '\n\n  ');

if (!content.includes('import axios')) {
  content = content.replace("import React from 'react';", "import React, { useState, useEffect } from 'react';\nimport axios from 'axios';");
}

fs.writeFileSync('src/components/financeiro/FinancialAnalyst.tsx', content, 'utf8');
console.log('patched finance');
