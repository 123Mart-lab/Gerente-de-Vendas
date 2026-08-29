import fs from 'fs';

let content = fs.readFileSync('src/components/publicidade/ProjectManager.tsx', 'utf8');

const newStartOpt = `  const startOptimization = async () => {
    if (!selectedProductId) return;
    setIsRunning(true);
    setProgress(0);

    // Mock progress visualizer that moves along while waiting
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p < 3) return p + 1;
        return p;
      });
    }, 4000);

    try {
      await axios.post('/api/marketing/orchestrate-optimization', { 
        productId: selectedProductId,
        query: searchTerm
      });
      setProgress(4);
    } catch (err) {
      console.error('Erro na orquestração:', err);
    } finally {
      clearInterval(progressInterval);
      setIsRunning(false);
    }
  };`;

content = content.replace(/  const startOptimization = \(\) => \{[\s\S]*?  \};\n/, newStartOpt + '\n');

fs.writeFileSync('src/components/publicidade/ProjectManager.tsx', content, 'utf8');
console.log('patched frontend');
