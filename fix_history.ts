import fs from 'fs';

let content = fs.readFileSync('src/components/publicidade/ProjectManager.tsx', 'utf8');

// Remove from OtimizacaoAnuncios
content = content.replace(
  'const [progress, setProgress] = useState(0);\n  const [pesquisaHistory, setPesquisaHistory] = useState<AuditTask[]>([]);',
  'const [progress, setProgress] = useState(0);'
);

// Add to PesquisaMercado
content = content.replace(
  'function PesquisaMercado() {\n  const [links, setLinks] = useState',
  'function PesquisaMercado() {\n  const [pesquisaHistory, setPesquisaHistory] = useState<AuditTask[]>([]);\n  const [links, setLinks] = useState'
);

fs.writeFileSync('src/components/publicidade/ProjectManager.tsx', content, 'utf8');
console.log('fixed history state location');
