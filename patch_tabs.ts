import fs from 'fs';

const files = [
  { path: 'src/components/publicidade/MarketResearcher.tsx', role: 'planner' },
  { path: 'src/components/publicidade/CompetitiveIntelligence.tsx', role: 'monitor' },
  { path: 'src/components/marketing/SeoSpecialist.tsx', role: 'seo' },
  { path: 'src/components/publicidade/ArtDirector.tsx', role: 'art' }
  // Not touching FinancialAnalyst yet as it might not be in this orchestration flow yet
];

for (const { path, role } of files) {
  let content = fs.readFileSync(path, 'utf8');
  
  // add axios import if not exists
  if (!content.includes("import axios")) {
    content = content.replace("import React", "import React, { useState, useEffect } from 'react';\nimport axios from 'axios';\n//");
    content = content.replace("import React;", "import React, { useState, useEffect } from 'react';\nimport axios from 'axios';\n//");
  }
  
  // Find the start of mockHistory
  const mockStart = content.indexOf('  const mockHistory: AuditTask[]');
  if (mockStart !== -1) {
    const mockEnd = content.indexOf('];\n', mockStart) + 3;
    const replacement = `  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.role === '${role}'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs', err);
      }
    };
    fetchLogs();
    
    // Auto refresh
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);\n`;
    content = content.substring(0, mockStart) + replacement + content.substring(mockEnd);
    fs.writeFileSync(path, content, 'utf8');
  }
}
console.log('patched tabs');
