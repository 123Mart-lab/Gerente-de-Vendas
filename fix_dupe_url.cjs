const fs = require('fs');
let code = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

const regex = /\s*{\/\* Linha: URL \*\/}[\s\S]*?(?=\s*{\/\* Linha: URL Amigável \*\/})/;

if (regex.test(code)) {
    code = code.replace(regex, '');
    fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
    console.log('Fixed duplicate URL section');
} else {
    console.log('Did not find the duplicate pattern');
}
