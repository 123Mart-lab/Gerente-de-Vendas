import fs from 'fs';
let content = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

const oldRunAutoPilot = `  const runAutoPilot = async () => {
    addLog('info', 'Iniciando Piloto Automático... Buscando catálogo da Nuvemshop.');
    
    let catalog = [];
    try {
      const response = await axios.get('/api/marketing/products?q=');
      catalog = response.data || [];
    } catch (e) {
      addLog('warning', 'Erro ao buscar catálogo da Nuvemshop.');
      setAutoPilot(false);
      autoPilotActive.current = false;
      return;
    }

    if (catalog.length === 0) {
      addLog('warning', 'Nenhum produto retornado da loja.');
      setAutoPilot(false);
      autoPilotActive.current = false;
      return;
    }

    addLog('success', \`\${catalog.length} produtos encontrados na fila.\`);

    for (const product of catalog) {`;

const newRunAutoPilot = `  const runAutoPilot = async () => {
    addLog('info', 'Iniciando Piloto Automático... Buscando catálogo da Nuvemshop.');
    
    let page = 1;
    let hasMorePages = true;
    let totalProcessed = 0;

    while (hasMorePages && autoPilotActive.current) {
      let catalog = [];
      try {
        const response = await axios.get(\`/api/marketing/products?q=&page=\${page}&limit=50\`);
        catalog = response.data || [];
      } catch (e) {
        addLog('warning', 'Erro ao buscar catálogo da Nuvemshop.');
        setAutoPilot(false);
        autoPilotActive.current = false;
        return;
      }

      if (catalog.length === 0) {
        if (page === 1) addLog('warning', 'Nenhum produto retornado da loja.');
        break;
      }

      if (page === 1) addLog('success', \`Página \${page} carregada com \${catalog.length} produtos.\`);
      else addLog('info', \`Página \${page} carregada com \${catalog.length} produtos. Continuando...\`);

      for (const product of catalog) {`;

content = content.replace(oldRunAutoPilot, newRunAutoPilot);

// We need to find the end of the `runAutoPilot` function and close the while loop.
const oldRunAutoPilotEnd = `    }

    if (autoPilotActive.current) {
      addLog('success', 'Varredura de todo o catálogo concluída!');
      setAutoPilot(false);
      autoPilotActive.current = false;
    }
  };`;

const newRunAutoPilotEnd = `    }

      if (catalog.length < 50) {
        hasMorePages = false;
      } else {
        page++;
      }
    }

    if (autoPilotActive.current) {
      addLog('success', 'Varredura de todo o catálogo concluída!');
      setAutoPilot(false);
      autoPilotActive.current = false;
    }
  };`;

content = content.replace(oldRunAutoPilotEnd, newRunAutoPilotEnd);
fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', content, 'utf8');
