const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

code = code.replace(/alert\('Erro ao otimizar produto. Verifique se a loja possui esse produto ou se as credenciais são válidas.'\);/, "console.error('API Error');\n      setOptimized(false);");

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
