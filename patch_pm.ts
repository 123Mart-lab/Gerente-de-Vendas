import fs from 'fs';

let content = fs.readFileSync('src/components/publicidade/ProjectManager.tsx', 'utf8');

// Patch OtimizacaoAnuncios
const oldOtimizacaoFetch = `        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data);
        }`;

const newOtimizacaoFetch = `        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.productName !== 'Pesquisa de Viabilidade (Múltiplos Links)'));
        }`;

content = content.replace(oldOtimizacaoFetch, newOtimizacaoFetch);

// Patch PesquisaMercado
const oldPesquisaHistory = `const [pesquisaHistory, setPesquisaHistory] = useState<AuditTask[]>([]);`;
const newPesquisaHistory = `const [pesquisaHistory, setPesquisaHistory] = useState<AuditTask[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setPesquisaHistory(res.data.filter((task: any) => task.productName === 'Pesquisa de Viabilidade (Múltiplos Links)'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs de pesquisa', err);
      }
    };
    fetchLogs();
    
    // Auto-refresh for demo
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);`;

content = content.replace(oldPesquisaHistory, newPesquisaHistory);

fs.writeFileSync('src/components/publicidade/ProjectManager.tsx', content, 'utf8');
console.log('patched ProjectManager');
