const fs = require('fs');
let code = fs.readFileSync('src/services/ai.ts', 'utf8');

const systemSearch = `2. Gancho Inicial (Persuasão 20%): Uma frase objetiva informando o que é o produto. APROVEITE ESTA SEÇÃO PARA INJETAR CAUDAS LONGAS E PALAVRAS-CHAVE DE SEO DE FORMA NATURAL para agradar os algoritmos de busca.`;
const systemReplace = `2. Gancho Inicial (Persuasão 20%): Uma frase objetiva informando o que é o produto. APROVEITE ESTA SEÇÃO PARA INJETAR CAUDAS LONGAS E PALAVRAS-CHAVE DE SEO DE FORMA NATURAL para agradar os algoritmos de busca. ATENÇÃO: NÃO ESCREVA AS PALAVRAS "GANCHO INICIAL" no texto final, apenas escreva a frase diretamente no início da descrição.`;

code = code.replace(systemSearch, systemReplace);

const promptSearch = `Formato obrigatório de retorno (JSON puro):
{
  "novoTitulo": "NOME ATRATIVO COM PALAVRA CHAVE",
  "metaDescription": "Resumo persuasivo de 150 caracteres...",
  "publicoAlvo": "Descreva o público alvo principal",
  "tags": "tag1, tag2, tag longa, palavra-chave",
  "marca": "Marca do Produto",
  "urlProduto": "nome-atrativo-separado-por-hifens",
  "novaDescricaoHtml": "GANCHO INICIAL AQUI (COM PALAVRAS-CHAVE SEO)\\n\\nDESCRIÇÃO TÉCNICA E DURABILIDADE\\n\\n- Benefício 1...\\n- Benefício 2...\\n\\nINSTRUÇÕES DE USO\\n\\n1. Passo 1...\\n\\nESPECIFICAÇÕES TÉCNICAS E SEGURANÇA\\n\\n- Peso...\\n\\nGARANTIA, DEVOLUÇÃO E ENVIO\\n\\n- Garantia de fábrica...\\n- Devolução de 7 dias...\\n- Envio em 24h...\\n\\nPERGUNTAS FREQUENTES (FAQ)\\n\\n1. Pergunta 1?\\nResposta direta...",`;

const promptReplace = `Formato obrigatório de retorno (JSON puro):
{
  "novoTitulo": "NOME ATRATIVO COM PALAVRA CHAVE",
  "metaDescription": "Resumo persuasivo de 150 caracteres...",
  "publicoAlvo": "Descreva o público alvo principal",
  "tags": "tag1, tag2, tag longa, palavra-chave",
  "marca": "Marca do Produto",
  "novaDescricaoHtml": "FRASE DIRETA DE PERSUASÃO E SEO AQUI (SEM ESCREVER O TÍTULO GANCHO INICIAL)\\n\\nDESCRIÇÃO TÉCNICA E DURABILIDADE\\n\\n- Benefício 1...\\n- Benefício 2...\\n\\nINSTRUÇÕES DE USO\\n\\n1. Passo 1...\\n\\nESPECIFICAÇÕES TÉCNICAS E SEGURANÇA\\n\\n- Peso...\\n\\nGARANTIA, DEVOLUÇÃO E ENVIO\\n\\n- Garantia de fábrica...\\n- Devolução de 7 dias...\\n- Envio em 24h...\\n\\nPERGUNTAS FREQUENTES (FAQ)\\n\\n1. Pergunta 1?\\nResposta direta...",`;

code = code.replace(promptSearch, promptReplace);

fs.writeFileSync('src/services/ai.ts', code);
console.log('AI logic patched');
