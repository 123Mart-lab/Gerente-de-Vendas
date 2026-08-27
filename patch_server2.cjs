const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldUpdatePayload = `    const updatePayload: any = {};
    if (data.novoTitulo) updatePayload.name = { pt: data.novoTitulo };
    if (data.novaDescricaoHtml) updatePayload.description = { pt: data.novaDescricaoHtml };
    if (data.metaDescription) updatePayload.seo_description = data.metaDescription;
    if (data.novoTituloSeo !== undefined) updatePayload.seo_title = data.novoTituloSeo;
    if (data.tags) updatePayload.tags = data.tags;
    if (data.marca) updatePayload.brand = data.marca;`;

const newUpdatePayload = `    const updatePayload: any = {};
    if (data.novoTitulo) updatePayload.name = { pt: data.novoTitulo };
    if (data.novaDescricaoHtml) updatePayload.description = { pt: data.novaDescricaoHtml };
    if (data.metaDescription) updatePayload.seo_description = { pt: data.metaDescription };
    if (data.novoTituloSeo !== undefined) updatePayload.seo_title = { pt: data.novoTituloSeo };
    if (data.tags) updatePayload.tags = data.tags;
    if (data.urlProduto) updatePayload.handle = { pt: data.urlProduto };
    if (data.marca) updatePayload.brand = data.marca;`;

code = code.replace(oldUpdatePayload, newUpdatePayload);
fs.writeFileSync('server.ts', code);
console.log('Patched server.ts payload');
