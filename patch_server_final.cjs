const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We are going to rewrite the updatePayload construction carefully.
const oldSection = `    const updatePayload: any = {};
    if (data.novoTitulo) updatePayload.name = { pt: data.novoTitulo };
    if (data.novaDescricaoHtml) updatePayload.description = { pt: data.novaDescricaoHtml };
    if (data.metaDescription) updatePayload.seo_description = { pt: data.metaDescription };
    if (data.novoTituloSeo !== undefined) updatePayload.seo_title = { pt: data.novoTituloSeo };
    if (data.tags) updatePayload.tags = data.tags;
    if (data.urlProduto) updatePayload.handle = { pt: data.urlProduto };
    if (data.marca) updatePayload.brand = data.marca;`;

// Ensure tags is parsed as an array of strings
const newSection = `    const updatePayload: any = {};
    if (data.novoTitulo) updatePayload.name = { pt: data.novoTitulo };
    if (data.novaDescricaoHtml) updatePayload.description = { pt: data.novaDescricaoHtml };
    if (data.metaDescription) updatePayload.seo_description = { pt: data.metaDescription };
    
    // Título SEO truncado para 70 chars (limite Nuvemshop) para garantir, embora a Nuvemshop trunque silenciosamente
    if (data.novoTituloSeo !== undefined) {
      let seoTitle = data.novoTituloSeo;
      if (seoTitle.length > 70) seoTitle = seoTitle.substring(0, 70);
      updatePayload.seo_title = { pt: seoTitle };
    }
    
    // As tags NA NUVEMSHOP DEVEM ser um array de strings para atualizar corretamente!
    if (data.tags) {
      if (Array.isArray(data.tags)) {
        updatePayload.tags = data.tags;
      } else if (typeof data.tags === 'string') {
        updatePayload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    
    if (data.urlProduto) updatePayload.handle = { pt: data.urlProduto };
    
    // Marca na Nuvemshop pode ser string ou null, mas enviamos como foi mapeado.
    if (data.marca) updatePayload.brand = data.marca;`;

if (code.includes(oldSection)) {
  code = code.replace(oldSection, newSection);
  fs.writeFileSync('server.ts', code);
  console.log('Patch final SUCCESS.');
} else {
  console.log('oldSection not found! Trying manual regex.');
  // fallback if formatting differs
  code = code.replace(/const updatePayload: any = \{\};[\s\S]*?if \(data\.marca\) updatePayload\.brand = data\.marca;/, newSection);
  fs.writeFileSync('server.ts', code);
  console.log('Patch final SUCCESS via regex.');
}

