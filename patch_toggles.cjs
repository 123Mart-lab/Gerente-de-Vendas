const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

const oldReset = `      // Reset toggles to all true when new optimization comes
      setSelectedFields({
        title: true,
        metaDescription: true,
        brand: true,
        tags: true,
        url: true,
        description: true
      });`;

const newReset = `      // Reset toggles to correct defaults when new optimization comes
      setSelectedFields({
        title: true,
        metaDescription: true,
        brand: true,
        tags: true,
        url: false,
        seoTitle: false,
        description: true
      });`;

code = code.replace(oldReset, newReset);
fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
console.log('Toggles reset patched');
