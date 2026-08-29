import fs from 'fs';
let content = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

const oldHandleOptimize = `  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimized(false);
    try {
      const response = await axios.post('/api/marketing/optimize', { 
        productId: selectedProductId,
        query: searchTerm 
      });`;

const newHandleOptimize = `  const handleOptimize = async () => {
    // Check SEO Filters manually
    if (seoFiltersEnabledRef.current) {
      const isKit = searchTerm.toLowerCase().includes('kit');
      
      let blockedReason = null;
      if (ignoreKitsRef.current && isKit) {
        blockedReason = 'Variação de kit ignorada';
      }
      
      // We check updated_at if we can find the product in the dropdown list
      const productObj = products.find(p => p.id === selectedProductId);
      if (!blockedReason && productObj && productObj.updated_at) {
        const daysMs = ignoreAlteredDaysRef.current * 24 * 60 * 60 * 1000;
        const updatedAt = new Date(productObj.updated_at).getTime();
        const now = Date.now();
        const diff = now - updatedAt;
        
        if (ignoreAlteredConditionRef.current === 'less' && diff < daysMs) {
          blockedReason = \`alterado há menos de \${ignoreAlteredDaysRef.current} dias\`;
        } else if (ignoreAlteredConditionRef.current === 'more' && diff > daysMs) {
          blockedReason = \`alterado há mais de \${ignoreAlteredDaysRef.current} dias\`;
        }
      }
      
      if (blockedReason) {
         alert(\`Neste momento, os filtros aplicados impedem a alteração no anúncio (Motivo: \${blockedReason}).\`);
         return;
      }
    }

    setIsOptimizing(true);
    setOptimized(false);
    try {
      const response = await axios.post('/api/marketing/optimize', { 
        productId: selectedProductId,
        query: searchTerm 
      });`;

content = content.replace(oldHandleOptimize, newHandleOptimize);
fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', content, 'utf8');
