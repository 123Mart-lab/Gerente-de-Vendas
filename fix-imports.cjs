const fs = require('fs');
let content = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

content = content.replace(
  "import { Search, Sparkles, RefreshCw, LayoutTemplate, Save } from 'lucide-react';",
  "import { Search, Sparkles, RefreshCw, LayoutTemplate, Save, CheckCircle2 } from 'lucide-react';"
);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', content);
