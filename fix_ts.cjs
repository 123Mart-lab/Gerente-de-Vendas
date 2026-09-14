const fs = require('fs');
let code = fs.readFileSync('src/components/CEOBriefing.tsx', 'utf8');

code = code.replace(/fetchPipelines\(\);/g, `
      // A UI atualiza automaticamente pelo polling (ou recarregue a página se preferir)
      window.location.reload();`);
fs.writeFileSync('src/components/CEOBriefing.tsx', code);
