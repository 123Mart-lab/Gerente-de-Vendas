const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    'if (data.novoTitulo) updatePayload.seo_title = data.novoTitulo;',
    'if (data.novoTituloSeo !== undefined) updatePayload.seo_title = data.novoTituloSeo;'
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts');
