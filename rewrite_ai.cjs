const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'src/services/ai.ts');
let code = fs.readFileSync(filePath, 'utf8');

const newPipeline = `
  async runOrchestrationPipeline(productData: any, onStepComplete?: (step: string, prompt: string, response: string) => void, saveProductCallback?: (seoJson: any) => Promise<void>) {
    const settings = await firebaseService.getSettings();
    const hasRallyMcp = settings?.agentPermissions?.['pesquisador-mercado']?.['github-rally-mcp'] !== false;
    const hasCloudSearch = settings?.agentPermissions?.['pesquisador-mercado']?.['cloud-search'] === true;
    const hasNlp = settings?.agentPermissions?.['pesquisador-mercado']?.['nlp'] === true;

    // 1. Extração de Dados Reais (Background)
    let realTrends = '';
    let realQuotes = '';
    try {
      const trendsData = await this.searchMarketplaceTrends(productData.name);
      realTrends = JSON.stringify(trendsData);
    } catch(e) { realTrends = 'Não foi possível buscar tendências em tempo real.'; }
    
    try {
      const quotesData = await this.searchProductQuotes(productData.name);
      realQuotes = JSON.stringify(quotesData);
    } catch(e) { realQuotes = 'Não foi possível buscar cotações em tempo real.'; }

    // 1. Pesquisador (Planner)
    const plannerPrompt = buildPlannerPrompt(productData, realTrends);
    const plannerResult = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: plannerPrompt, config: { temperature: 0.5 } });
    const plannerResponse = plannerResult.text;
    if (onStepComplete) onStepComplete('planner', plannerPrompt, plannerResponse || '');

    // 2. Monitor de Inteligência Competitiva
    const monitorPrompt = buildMonitorPrompt(productData, realQuotes, plannerResponse);
    const monitorResult = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: monitorPrompt, config: { temperature: 0.5 } });
    const monitorResponse = monitorResult.text;
    if (onStepComplete) onStepComplete('monitor', monitorPrompt, monitorResponse || '');

    // 3. Diretor de Arte
    const artPrompt = \`[ORDEM DE SERVIÇO - GERÊNCIA DE PROJETOS]
Agente: Diretor de Arte Sênior
SKU de Referência: \${productData.sku}

Você é um Diretor de Arte Sênior. A sua missão é criar a identidade visual do anúncio focada em altíssima taxa de cliques (CTR) e retenção.
Os dados da Pesquisa e Concorrência que devem guiar seu visual:
[PLANNER]
\${plannerResponse}
[MONITOR]
\${monitorResponse}

SUA MISSÃO:
Crie o "Mapa Visual da Oferta" para nortear a produção das imagens e vídeos do SKU \${productData.sku}.
Você DEVE respeitar rigorosamente as Regras de Ouro (Padrão 123Mart):
- A Lei Absoluta da Imagem: Strict Compositing (Fotomontagem Rigorosa). Preservar 100% da anatomia original do produto.
- Protocolo Typográfico (Nano Banana 2): Textos nunca se misturam aos pixels do produto. Usar Negative Space. Textos renderizados SEMPRE entre aspas duplas ("").

Descreva a execução exata para CADA UM dos 8 ativos obrigatórios da Galeria:
1. SLOT 1 (Hero Image): Fundo 100% branco puro. 1:1. Proibido texto.
2. SLOT 2 (Lifestyle): Contexto de uso natural.
3. SLOT 3 (Infográfico Benefício): Texto e uso do Negative Space. Max 2 bullets.
4. SLOT 4 (Zoom Técnico): Detalhe focado com linhas guia.
5. SLOT 5 (Infográfico Rendimento/Comparação).
6. SLOT 6 (Prova Social/Garantia).
7. SLOT 7 (CTA/Oferta Final).
8. VÍDEO (Motor de Retenção): Hook de 3 segundos vertical.
9. MOODBOARD: Tom visual e paleta de cores.\`;
    
    const artResult = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: artPrompt, config: { temperature: 0.7 } });
    const artResponse = artResult.text;
    if (onStepComplete) onStepComplete('art', artPrompt, artResponse || '');

    // 4. Especialista SEO
    const seoSystemContext = \`[DIRETRIZ MESTRA DE OTIMIZAÇÃO]
Dados da Pesquisa do Planner:
\${plannerResponse}

Estratégia do Monitor:
\${monitorResponse}

Direção de Arte:
\${artResponse}\`;

    const seoPrompt = \`[ORDEM DE SERVIÇO - GERÊNCIA DE PROJETOS]
Agente: Especialista SEO Sênior
SKU de Referência: \${productData.sku}

Você é um Especialista SEO Sênior focado em conversão.
Sua atitude: Você recebe a estratégia visual e de precificação da equipe, gera todos os campos otimizados (Título Estratégico max 70 chars, Descrição com Quebra de Objeções, Meta tags, HTML válido), salva na plataforma e responde com o comparativo do Antes e Depois para o SKU \${productData.sku}.

[CONTEXTO DA EQUIPE]
\${seoSystemContext}\`;

    const seoJson = await this.generateProductSEO(productData, seoSystemContext);
    
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

    const seoResponsePayloadJSON = JSON.stringify({
      message: saveMessage,
      otimizacaoSEO: seoJson,
      diretrizes: "Trabalho técnico de SEO concluído. Metadados e Copywrighting gerados com foco em alta conversão e indexação algorítmica."
    }, null, 2);

    if (onStepComplete) onStepComplete('seo', seoPrompt, seoResponsePayloadJSON);

    // 5. Gerente de Projetos (Synthesizer - Briefing Final)
    const managerPrompt = \`[SÍNTESE EXECUTIVA - GERÊNCIA DE PROJETOS]
SKU de Referência: \${productData.sku}

Você é o Gerente de Projetos de E-commerce Sênior. Sua função é orquestrar a equipe e sintetizar toda a inteligência captada em um "Briefing Mestre" impecável e profissional para o SKU: \${productData.sku}. A equipe já finalizou todo o trabalho de pesquisa, precificação, arte e SEO.

[INTELIGÊNCIA DO PLANNER]
\${plannerResponse}
[INTELIGÊNCIA DO MONITOR]
\${monitorResponse}
[ARTE]
\${artResponse}
[SEO]
\${seoResponsePayloadJSON}

SUA MISSÃO:
Crie o BRIEFING MESTRE definitivo. Este documento será empacotado e enviado via Webhook para sistemas automáticos (como o MeliAgent).
Estruture o briefing com os seguintes tópicos obrigatórios:
1. Diretriz de Posicionamento Oficial.
2. Veredito da Estratégia de Preço e Oferta.
3. Resumo da Copy e Gatilhos de SEO Ativos.
4. Framework Visual Aprovado.
5. Autorização Executiva para o Webhook.

Seja executivo, imperativo e direto. Este é o pacote final de produção.\`;

    const managerResult = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: managerPrompt, config: { temperature: 0.7 } });
    const managerResponse = managerResult.text;
    if (onStepComplete) onStepComplete('manager', managerPrompt, managerResponse || '');
  }
`;

const startIndex = code.indexOf('async runOrchestrationPipeline(');
const endIndex = code.indexOf('async generateViralContent(');

if (startIndex !== -1 && endIndex !== -1) {
  const before = code.substring(0, startIndex);
  const after = code.substring(endIndex);
  const newCode = before + newPipeline + '\n  ' + after;
  fs.writeFileSync(filePath, newCode);
  console.log('Successfully replaced runOrchestrationPipeline');
} else {
  console.error('Could not find start/end indices for replacement');
}
