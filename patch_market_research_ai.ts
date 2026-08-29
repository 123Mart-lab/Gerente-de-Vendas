import fs from 'fs';
let content = fs.readFileSync('src/services/ai.ts', 'utf8');

const marketResearchFunc = `  async runMarketResearchPipeline(links: string[], financialKnowledgeBase: any, onStepComplete?: (step: string, prompt: string, response: string) => void) {
    const joinedLinks = links.join('\\n');

    // 1. Pesquisador (Planner)
    const plannerPrompt = \`Você é um Pesquisador de Mercado. Acesse, se possível, ou analise o padrão dos seguintes links de concorrentes para um produto:
\${joinedLinks}

Por favor, faça um levantamento sobre:
- Preços praticados (mínimo, máximo, médio).
- Como eles estão agrupando ou vendendo este produto.
- Informações sobre frete e condições de pagamento oferecidas.\`;

    const plannerResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: plannerPrompt,
      config: { temperature: 0.5 }
    });
    const plannerResponse = plannerResult.text;
    if (onStepComplete) onStepComplete('planner', plannerPrompt, plannerResponse || '');

    // 2. Monitor de Concorrência
    const monitorPrompt = \`Você é o Monitor de Concorrência. Leia a pesquisa de mercado abaixo:
[PESQUISA DE MERCADO]
\${plannerResponse}
[FIM DA PESQUISA]

Defina uma estratégia de benchmark:
- Qual deve ser nosso preço alvo para sermos competitivos?
- Quais diferenciais devemos oferecer (ex: frete expresso, brindes) para superar essa concorrência?\`;

    const monitorResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: monitorPrompt,
      config: { temperature: 0.5 }
    });
    const monitorResponse = monitorResult.text;
    if (onStepComplete) onStepComplete('monitor', monitorPrompt, monitorResponse || '');

    // 3. Analista Financeiro
    const financePrompt = \`Você é um Analista Financeiro Sênior de E-commerce. Analise a estratégia proposta pelo Monitor de Concorrência:

[ESTRATÉGIA DO MONITOR]
\${monitorResponse}
[FIM DA ESTRATÉGIA]

Para validar essa estratégia e chegar ao preço mínimo de venda viável (Break-even e Margem de Lucro Desejada), utilize as seguintes variáveis do nosso Knowledge Base de Operação:
- Taxa da Plataforma de Venda: \${financialKnowledgeBase?.platformFee || '10%'}
- Alíquota Média de ICMS: \${financialKnowledgeBase?.icms || '18%'}
- Outros Impostos / Simples Nacional: \${financialKnowledgeBase?.taxes || '6%'}
- Custo de Embalagem/Logística Fixa: \${financialKnowledgeBase?.logisticsCost || 'R$ 5,00'}
- Margem de Lucro Desejada (Líquida): \${financialKnowledgeBase?.desiredMargin || '20%'}

Faça os cálculos de viabilidade (markup/markdown) com base nessas premissas financeiras reais. Diga se a estratégia de preço proposta pelo Monitor de Concorrência é viável financeiramente, ou sugira qual deve ser o preço exato para atingir a margem desejada.\`;

    const financeResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: financePrompt,
      config: { temperature: 0.2 }
    });
    const financeResponse = financeResult.text;
    if (onStepComplete) onStepComplete('finance', financePrompt, financeResponse || '');

    return {
      planner: plannerResponse,
      monitor: monitorResponse,
      finance: financeResponse
    };
  },
`;

if (!content.includes('runMarketResearchPipeline')) {
  content = content.replace('async runOrchestrationPipeline', marketResearchFunc + '  async runOrchestrationPipeline');
}

fs.writeFileSync('src/services/ai.ts', content, 'utf8');
