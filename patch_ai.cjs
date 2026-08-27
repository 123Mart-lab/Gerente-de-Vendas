const fs = require('fs');
let code = fs.readFileSync('src/services/ai.ts', 'utf8');

const oldPromptFormat = `"novaDescricaoHtml": "GANCHO INICIAL AQUI (COM PALAVRAS-CHAVE SEO)\\n\\nDESCRIÇÃO TÉCNICA E DURABILIDADE\\n\\n- Benefício 1...\\n- Benefício 2...\\n\\nINSTRUÇÕES DE USO\\n\\n1. Passo 1...\\n\\nESPECIFICAÇÕES TÉCNICAS E SEGURANÇA\\n\\n- Peso...\\n\\nGARANTIA, DEVOLUÇÃO E ENVIO\\n\\n- Garantia de fábrica...\\n- Devolução de 7 dias...\\n- Envio em 24h...\\n\\nPERGUNTAS FREQUENTES (FAQ)\\n\\n1. Pergunta 1?\\nResposta direta...",`;

const newPromptFormat = `"novaDescricaoHtml": "<p>GANCHO INICIAL AQUI (COM PALAVRAS-CHAVE SEO)</p><br><h3>DESCRIÇÃO TÉCNICA E DURABILIDADE</h3><ul><li>Benefício 1...</li><li>Benefício 2...</li></ul><br><h3>INSTRUÇÕES DE USO</h3><ol><li>Passo 1...</li></ol><br><h3>ESPECIFICAÇÕES TÉCNICAS E SEGURANÇA</h3><ul><li>Peso...</li></ul><br><h3>GARANTIA, DEVOLUÇÃO E ENVIO</h3><ul><li>Garantia de fábrica...</li><li>Devolução de 7 dias...</li><li>Envio em 24h...</li></ul><br><h3>PERGUNTAS FREQUENTES (FAQ)</h3><p><strong>1. Pergunta 1?</strong><br>Resposta direta...</p>",`;

code = code.replace(oldPromptFormat, newPromptFormat);

// Fix AI prompt instructions about scoring
const oldScoring = `- scoreTituloOriginal: Qual a nota de SEO do título original?
- scoreTituloNovo: Qual a nota de SEO do título otimizado que você criou?
- scoreDescricaoOriginal: Qual a nota da descrição original? Baseie a nota na proporção áurea (20% persuasão, 50% informação técnica, 30% segurança).
- scoreDescricaoNova: Qual a nota da sua nova descrição? (Deve ser sempre maior que a original, próximo a 100).
- dicasMelhoria (Array de Strings): Diga ao lojista quais dados TÉCNICOS faltaram no original e que ele precisa providenciar no ERP para o futuro (ex: "Falta informar o material", "Insira a ficha FISPQ").`;

const newScoring = `- scoreTituloOriginal: Qual a nota de SEO do título original? (Se o original já estiver perfeito, dê 95 a 100).
- scoreTituloNovo: Qual a nota de SEO do título otimizado que você criou?
- scoreDescricaoOriginal: Qual a nota da descrição original? Baseie a nota na proporção áurea (20% persuasão, 50% informação técnica, 30% segurança). ATENÇÃO: Se a descrição original já estiver EXCELENTE, rica em HTML, técnica e bem formatada (pois pode já ter sido otimizada por você antes), você DEVE dar uma nota de 90 a 100 e reconhecer a alta qualidade, sem forçar notas baixas artificialmente.
- scoreDescricaoNova: Qual a nota da sua nova descrição? (Deve ser sempre maior ou igual à original, próximo a 100).
- dicasMelhoria (Array de Strings): Diga ao lojista quais dados TÉCNICOS faltaram no original e que ele precisa providenciar no ERP para o futuro (ex: "Falta informar o material", "Insira a ficha FISPQ"). Se a descrição original já estiver nota 100 e não faltar nada, retorne um array vazio [].`;

code = code.replace(oldScoring, newScoring);

const oldPromptInstruction = `Analise este produto, deduza o público-alvo e as tags de SEO. Avalie os dados originais e gere os scores e dicas. Em seguida, crie uma descrição altamente técnica, informativa, SEM EMOJIS e com forte injeção de SEO no gancho inicial. SE o produto já tiver uma Marca Original cadastrada, OBRIGATORIAMENTE use a mesma marca.`;
const newPromptInstruction = `Analise este produto, deduza o público-alvo e as tags de SEO. Avalie os dados originais e gere os scores e dicas. Em seguida, crie uma descrição altamente técnica, informativa, SEM EMOJIS e com forte injeção de SEO no gancho inicial. OBRIGATÓRIO: A novaDescricaoHtml DEVE usar tags HTML VÁLIDAS (<p>, <h3>, <ul>, <li>, <strong>, <br>) para formatação correta de parágrafos, subtítulos e listas. NUNCA use \\n para quebra de linha. SE o produto já tiver uma Marca Original cadastrada, OBRIGATORIAMENTE use a mesma marca.`;
code = code.replace(oldPromptInstruction, newPromptInstruction);

fs.writeFileSync('src/services/ai.ts', code);
console.log('Patched AI Service');
