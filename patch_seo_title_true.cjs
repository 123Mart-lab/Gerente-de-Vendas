const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

code = code.replace(
  /const \[selectedFields, setSelectedFields\] = useState\(\{\s*title: true,\s*metaDescription: true,\s*brand: true,\s*tags: true,\s*url: false,\s*seoTitle: false,\s*description: true\s*\}\);/,
  `const [selectedFields, setSelectedFields] = useState({
    title: true,
    metaDescription: true,
    brand: true,
    tags: true,
    url: false,
    seoTitle: true,
    description: true
  });`
);

code = code.replace(
  /\/\/ Reset toggles to correct defaults when new optimization comes\s*setSelectedFields\(\{\s*title: true,\s*metaDescription: true,\s*brand: true,\s*tags: true,\s*url: false,\s*seoTitle: false,\s*description: true\s*\}\);/,
  `// Reset toggles to correct defaults when new optimization comes
      setSelectedFields({
        title: true,
        metaDescription: true,
        brand: true,
        tags: true,
        url: false,
        seoTitle: true,
        description: true
      });`
);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
console.log('seoTitle default to true');
