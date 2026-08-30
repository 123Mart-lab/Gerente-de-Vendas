import fs from 'fs';
const filePath = 'src/components/marketing/ProductOptimizer.tsx';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace('useState<number>(5);', 'useState<number>(1);');
content = content.replace('useRef<number>(5);', 'useRef<number>(1);');
fs.writeFileSync(filePath, content, 'utf8');
