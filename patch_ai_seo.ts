import fs from 'fs';

let content = fs.readFileSync('src/services/ai.ts', 'utf8');

// 1. Update runOrchestrationPipeline signature
content = content.replace(
  'async runOrchestrationPipeline(productData: any, onStepComplete?: (step: string, prompt: string, response: string) => void) {',
  'async runOrchestrationPipeline(productData: any, onStepComplete?: (step: string, prompt: string, response: string) => void, saveProductCallback?: (seoJson: any) => Promise<void>) {'
);

// 2. Update SEO step in runOrchestrationPipeline
const oldSeoStep = `    // 4. Especialista SEO
    const seoPrompt = \`Você é um Especialista SEO Sênior focado em conversão, e você OBEDECE ao briefing do Gerente.
[BRIEFING EXECUTIVO]
\${managerResponse}

Sua missão é otimizar o produto "\${productData.name}".
Retorne:
1. NOVO TÍTULO: (Máximo 60 caracteres, contendo a principal palavra-chave).
2. META DESCRIÇÃO: (Máximo 150 caracteres, altamente persuasiva, focada no ângulo de venda principal).
3. LEAD DA DESCRIÇÃO: (Escreva o PRIMEIRO PARÁGRAFO da descrição do produto. Ele deve quebrar a objeção principal apontada no briefing nas primeiras linhas e ancorar o valor do preço).
Seja persuasivo e agressivo comercialmente.\`;
    
    const seoResult = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: seoPrompt, config: { temperature: 0.7 } });
    const seoResponse = seoResult.text;
    if (onStepComplete) onStepComplete('seo', seoPrompt, seoResponse || '');`;

const newSeoStep = `    // 4. Especialista SEO
    const seoPrompt = \`Você é um Especialista SEO Sênior focado em conversão.
Sua atitude: Salvar tudo que produz no anúncio. Você recebe o briefing do Gerente, gera todos os campos a serem preenchidos no produto (Título, Descrição, Meta tags, HTML válido), salva na Nuvemshop e responde ao Gerente apresentando um comparativo claro do Antes e Depois.

[BRIEFING EXECUTIVO]
\${managerResponse}\`;
    
    // Calls the existing logic but injects the briefing
    const seoJson = await this.generateProductSEO(productData, managerResponse);
    
    // Save to Nuvemshop if callback is provided
    let saveMessage = "Não foi possível salvar o anúncio (nenhum callback fornecido).";
    if (saveProductCallback) {
      try {
        await saveProductCallback(seoJson);
        saveMessage = "Anúncio otimizado e salvo na Nuvemshop com sucesso!";
      } catch (err) {
        saveMessage = "Falha ao salvar o anúncio na Nuvemshop.";
        console.error(err);
      }
    }

    const seoResponsePayload = JSON.stringify({
      message: saveMessage,
      before: {
        titulo: productData.name,
        descricao: productData.description || '',
        meta: productData.seo_description || '',
        seoTitle: productData.seo_title || ''
      },
      after: {
        titulo: seoJson.novoTitulo,
        descricao: seoJson.novaDescricaoHtml,
        meta: seoJson.novaMetaDescription,
        seoTitle: seoJson.novoTituloSeo
      }
    }, null, 2);

    if (onStepComplete) onStepComplete('seo', seoPrompt, seoResponsePayload);`;

content = content.replace(oldSeoStep, newSeoStep);

// 3. Update generateProductSEO
content = content.replace(
  'async generateProductSEO(productData: any) {',
  'async generateProductSEO(productData: any, briefing?: string) {'
);

const oldPromptInGenSEO = `    const prompt = \`Analise este produto, convoque os seus Múltiplos Agentes, acesse a internet para investigar concorrentes diretos, deduza o público-alvo e gere todo o pacote de marketing. OBRIGATÓRIO: A novaDescricaoHtml DEVE usar tags HTML VÁLIDAS. SE o produto já tiver uma Marca Original cadastrada, OBRIGATORIAMENTE use a mesma marca.`;

const newPromptInGenSEO = `    let prompt = \`Analise este produto, convoque os seus Múltiplos Agentes, acesse a internet para investigar concorrentes diretos, deduza o público-alvo e gere todo o pacote de marketing. OBRIGATÓRIO: A novaDescricaoHtml DEVE usar tags HTML VÁLIDAS. SE o produto já tiver uma Marca Original cadastrada, OBRIGATORIAMENTE use a mesma marca.\`;
    
    if (briefing) {
       prompt += \`\\n\\n[AÇÃO MANDATÓRIA - ORDEM DO GERENTE DE PROJETOS]:\\nVocê DEVE obedecer ao seguinte BRIEFING EXECUTIVO na construção do SEO (Título, Copy, Meta):\\n"\${briefing}"\\nQuebre as objeções apontadas e adote o ângulo de venda sugerido.\`;
    }
    
    prompt += \`\\n\\n`;

content = content.replace(oldPromptInGenSEO, newPromptInGenSEO);

fs.writeFileSync('src/services/ai.ts', content, 'utf8');
