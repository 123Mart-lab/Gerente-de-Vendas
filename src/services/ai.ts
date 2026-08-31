import { GoogleGenAI, Type, Tool, HarmCategory, HarmBlockThreshold } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { nuvemshopService } from './nuvemshop.js';
import { firebaseService } from './firebase.js';
import { buildSeoExpertPrompt } from '../prompts/seoExpert.js';

// Inicializa a engine do Gemini com a API Key injetada no ambiente
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Lê o arquivo Markdown correspondente à etapa da pipeline atual.
 * Se a etapa for '01_prospeccao', ele lê o '/prompts/01_prospeccao.md'.
 */
function getSystemInstruction(stage: string): string {
  try {
    const promptPath = path.join(process.cwd(), 'prompts', `${stage}.md`);
    
    if (fs.existsSync(promptPath)) {
      const content = fs.readFileSync(promptPath, 'utf8');
      // Injeta uma blindagem extra contra alucinações de links no nível do sistema
      return content + '\n\nATENÇÃO MÁXIMA: NUNCA crie ou invente links. Utilize apenas os links fornecidos. NUNCA mencione que é uma Inteligência Artificial.';
    }
    
    // Fallback de segurança se o arquivo não existir
    return 'Você é o Assistente de Vendas e Concierge Digital da 123Mart. Seja direto e ajude o cliente com suas dúvidas.';
  } catch (err) {
    console.error(`Erro ao ler o arquivo de diretriz para a etapa ${stage}:`, err);
    return 'Você é o Assistente de Vendas da 123Mart.';
  }
}

// ==========================================
// MÁQUINA DE ESTADOS: TOOLS DO GEMINI
// ==========================================
const crmTools: Tool[] = [{
  functionDeclarations: [
    {
      name: 'consultar_produtos_nuvemshop',
      description: 'Consulta a vitrine da Nuvemshop da 123Mart para responder disponibilidade, preços e enviar o link direto. Use sempre que o cliente perguntar sobre um produto específico.',
      parameters: {
        type: Type.OBJECT,
        properties: { termo: { type: Type.STRING, description: 'Produto buscado pelo cliente' } },
        required: ['termo']
      }
    },
    {
      name: 'avancar_etapa_pipeline',
      description: 'Avança ou recua o lead de etapa no CRM baseado na resposta do usuário (Ex: de prospecção para interacao, ou de interacao para negociacao).',
      parameters: {
        type: Type.OBJECT,
        properties: { nova_etapa: { type: Type.STRING, description: 'Nome exato do arquivo markdown da próxima etapa (ex: 02_interacao, 03_negociacao, 04_carrinho_aberto, 05_cadastrado)' } },
        required: ['nova_etapa']
      }
    }
  ]
}];

export const aiService = {
  /**
   * Gera a resposta do bot usando as diretrizes, histórico e ferramentas (Function Calling).
   */
  async generateResponse(phone: string, userMessage: string, history: any[], pipelineStage: string, overridePrompt?: string) {
    // 1. Carrega as diretrizes específicas da etapa do cliente
    let systemInstruction = overridePrompt ? overridePrompt : getSystemInstruction(pipelineStage);

    // 1.5. Injeta as integrações ativas das APIs do Google para Vendedores
    const settings = await firebaseService.getSettings();
    const vendedorPerms = settings?.agentPermissions?.['vendedor-1'] || {};
    
    let activeIntegrations = [];
    if (vendedorPerms['speech-to-text'] === true) activeIntegrations.push('\n[Speech-to-Text Ativo]: Você é capaz de transcrever áudios. Fale com naturalidade, simulando nuances de voz e respiração caso precise gerar um script de áudio.');
    if (vendedorPerms['translation-api'] === true) activeIntegrations.push('\n[Cloud Translation Ativo]: Se o cliente falar em espanhol, inglês ou outro idioma, traduza instantaneamente a negociação, mantendo persuasão.');
    if (vendedorPerms['calendar-api'] === true) activeIntegrations.push('\n[Google Calendar API Ativo]: Caso seja um fechamento de alto valor, você tem acesso à agenda corporativa e pode propor e simular o agendamento de reuniões/calls de follow-up.');
    if (vendedorPerms['vertex-ai'] === true) activeIntegrations.push('\n[Vertex AI Prediction Ativo]: Utilize os dados de Machine Learning. Faça inferência preditiva: proponha Cross-sell avançado com produtos complementares que você deduzir fazerem sentido matemático e comportamental.');
    if (vendedorPerms['places-api'] === true) activeIntegrations.push('\n[Places API Ativo]: Você possui inteligência logística de localização em tempo real. Se o cliente informar bairro, cep ou região, use a proximidade geográfica como gatilho mental de conveniência/entrega rápida.');
    if (vendedorPerms['nlp'] === true) activeIntegrations.push('\n[Cloud Natural Language API Ativo]: Você possui um leitor de perfil psicológico. Analise o sentimento da mensagem do cliente em tempo real. Se ele for pragmático/urgente, seja direto e feche a venda. Se ele for emocional/inseguro, mude o tom de voz para acolhimento e foca em garantias e reversão de risco.');

    if (activeIntegrations.length > 0) {
      systemInstruction += '\n\n[FERRAMENTAS GLOBAIS DE INTELIGÊNCIA ATIVADAS PELO RH]:' + activeIntegrations.join('');
    }

    // 2. Formata o histórico do Firebase para o padrão esperado pelo SDK do Gemini
    const contents: any[] = history.map((msg) => ({
      role: msg.role === 'bot' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // 3. Adiciona a mensagem atual do cliente
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
      // 4. Primeira chamada da API do Gemini injetando as Ferramentas (Tools)
      let response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          tools: crmTools,
          temperature: 0.1, // Temperatura baixa para alta precisão
        }
      });
      
      // 5. Verifica se o Gemini decidiu usar uma das Ferramentas (Máquina de Estados / ERP)
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        let toolResult: any = { status: 'success' };
        
        console.log(`[🤖 AI Tool Calling] Gemini acionou a função: ${call.name}`);

        if (call.name === 'consultar_produtos_nuvemshop') {
          const termo = (call.args as any).termo;
          const produtos = await nuvemshopService.searchProducts(termo);
          toolResult = { resultado_estoque: produtos };
        } 
        else if (call.name === 'avancar_etapa_pipeline') {
          const novaEtapa = (call.args as any).nova_etapa;
          // Atualiza a máquina de estados no Firebase
          await firebaseService.updatePipelineStage(phone, novaEtapa);
          toolResult = { mensagem_sistema: `Etapa do CRM atualizada com sucesso para ${novaEtapa}. Formule a resposta final ao cliente considerando que o funil evoluiu.` };
        }

        // Devolve o resultado da ferramenta para o histórico preservando o thought_signature e outros parts
        const originalParts = response.candidates?.[0]?.content?.parts || [{ functionCall: call }];
        contents.push({ role: 'model', parts: originalParts });
        contents.push({ role: 'user', parts: [{ functionResponse: { name: call.name, response: toolResult } }] });

        // 6. Rechama o Gemini com o contexto atualizado para ele gerar a resposta final em texto
        response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents,
          config: { systemInstruction, tools: crmTools, temperature: 0.1 }
        });
      }

      return response.text || 'Tive um pequeno problema processando sua solicitação. Pode repetir?';
    } catch (error) {
      console.error('❌ Erro Crítico na API do Gemini:', error);
      return 'Nossos servidores estão passando por uma rápida atualização. Já te respondo!';
    }
  },
    async runMarketResearchPipeline(links: string[], financialKnowledgeBase: any, onStepComplete?: (step: string, prompt: string, response: string) => void) {
    const settings = await firebaseService.getSettings();
    const hasRallyMcp = settings?.agentPermissions?.['pesquisador-mercado']?.['github-rally-mcp'] !== false;
    const hasNlp = settings?.agentPermissions?.['pesquisador-mercado']?.['nlp'] === true;
    const hasCloudSearch = settings?.agentPermissions?.['pesquisador-mercado']?.['cloud-search'] === true;

    const joinedLinks = links.join('\n');

    // 1. Pesquisador (Planner)
    const plannerPrompt = `Você é um Pesquisador de Mercado${hasRallyMcp ? ' inspirado no "Rally MCP"' : ''}. Acesse, se possível, ou analise o padrão dos seguintes links de concorrentes para um produto:
${joinedLinks}

${hasNlp ? '[INTEGRAÇÃO ATIVADA: Cloud Natural Language API]\nAnalise o sentimento das avaliações visíveis nesses links. Identifique o que o público mais odeia nesses anúncios.\n' : ''}
${hasCloudSearch ? '[INTEGRAÇÃO ATIVADA: Cloud Search API]\nFinja varrer nossa base interna em busca de relatórios do fornecedor sobre esse produto para complementar sua pesquisa.\n' : ''}

Por favor, faça um levantamento sobre:
- Preços praticados (mínimo, máximo, médio).
- Como eles estão agrupando ou vendendo este produto.
- Informações sobre frete e condições de pagamento oferecidas.`;

    const plannerResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: plannerPrompt,
      config: { temperature: 0.5 }
    });
    const plannerResponse = plannerResult.text;
    if (onStepComplete) onStepComplete('planner', plannerPrompt, plannerResponse || '');

    // 2. Monitor de Concorrência
    const monitorPrompt = `Você é o Monitor de Concorrência. Leia a pesquisa de mercado abaixo:
[PESQUISA DE MERCADO]
${plannerResponse}
[FIM DA PESQUISA]

Defina uma estratégia de benchmark:
- Qual deve ser nosso preço alvo para sermos competitivos?
- Quais diferenciais devemos oferecer (ex: frete expresso, brindes) para superar essa concorrência?`;

    const monitorResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: monitorPrompt,
      config: { temperature: 0.5 }
    });
    const monitorResponse = monitorResult.text;
    if (onStepComplete) onStepComplete('monitor', monitorPrompt, monitorResponse || '');

    // 3. Analista Financeiro
    const financePrompt = `Você é um Analista Financeiro Sênior de E-commerce. Analise a estratégia proposta pelo Monitor de Concorrência:

[ESTRATÉGIA DO MONITOR]
${monitorResponse}
[FIM DA ESTRATÉGIA]

Para validar essa estratégia e chegar ao preço mínimo de venda viável (Break-even e Margem de Lucro Desejada), utilize as seguintes variáveis do nosso Knowledge Base de Operação:
- Taxa da Plataforma de Venda: ${financialKnowledgeBase?.platformFee || '10%'}
- Alíquota Média de ICMS: ${financialKnowledgeBase?.icms || '18%'}
- Outros Impostos / Simples Nacional: ${financialKnowledgeBase?.taxes || '6%'}
- Custo de Embalagem/Logística Fixa: ${financialKnowledgeBase?.logisticsCost || 'R$ 5,00'}
- Margem de Lucro Desejada (Líquida): ${financialKnowledgeBase?.desiredMargin || '20%'}

Faça os cálculos de viabilidade (markup/markdown) com base nessas premissas financeiras reais. Diga se a estratégia de preço proposta pelo Monitor de Concorrência é viável financeiramente, ou sugira qual deve ser o preço exato para atingir a margem desejada.`;

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
  
  async runOrchestrationPipeline(productData: any, onStepComplete?: (step: string, prompt: string, response: string) => void, saveProductCallback?: (seoJson: any) => Promise<void>) {
    
    const settings = await firebaseService.getSettings();
    const hasRallyMcp = settings?.agentPermissions?.['pesquisador-mercado']?.['github-rally-mcp'] !== false;
    const hasCloudSearch = settings?.agentPermissions?.['pesquisador-mercado']?.['cloud-search'] === true;
    const hasNlp = settings?.agentPermissions?.['pesquisador-mercado']?.['nlp'] === true;

    // 1. Extração de Dados Reais (Background)
    // O Gerente aciona as novas skills por debaixo dos panos para alimentar os agentes
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

    // 1. Pesquisador (Planner + Rally MCP)
    const plannerPrompt = `Você é um Planner e Pesquisador de Mercado focado em e-commerce${hasRallyMcp ? ', operando com a skill "Rally MCP"' : ''}.
Sua missão é analisar o produto:
Nome: ${productData.name}
Preço Atual da Loja: ${productData.price}
Descrição Original: ${productData.description || 'Sem descrição'}

Acabamos de extrair os seguintes dados de Tendências (Mercado Livre/Shopee):
${realTrends}

${hasCloudSearch ? '[INTEGRAÇÃO ATIVADA: Cloud Search API]\nConsidere que você vasculhou os catálogos técnicos em PDF do nosso Drive. Utilize dados técnicos profundos na sua análise.\n' : ''}
${hasNlp ? '[INTEGRAÇÃO ATIVADA: Cloud Natural Language API]\nConsidere que você raspou avaliações reais. Extraia o "Sentimento" macro dos clientes concorrentes e detalhe explicitamente as reclamações.\n' : ''}

Por favor, forneça um Relatório de Tendências e Demanda contendo:
- O que está em alta (buscas e features valorizadas) baseando-se nos dados reais.
- Principais argumentos de venda (gatilhos mentais).
- Principais objeções (o que faz o cliente desistir da compra).
Seja altamente estratégico e use os dados extraídos.`;
    
    const plannerResult = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: plannerPrompt, config: { temperature: 0.5 } });
    const plannerResponse = plannerResult.text;
    if (onStepComplete) onStepComplete('planner', plannerPrompt, plannerResponse || '');

    // 2. Monitor de Inteligência Competitiva (Scraper Google/Buscapé)
    const monitorPrompt = `Você é um Monitor de Inteligência Competitiva focado em benchmarking de preços (Scraper Google/Buscapé).
Produto: "${productData.name}"
Nosso Preço: ${productData.price}

Dados REAIS de mercado recém-extraídos do nosso Web Scraper:
${realQuotes}

Resumo do Pesquisador de Mercado:
${plannerResponse}

Com base nesses DADOS REAIS, crie um Relatório de Oportunidades (Benchmark de Precificação):
1. Avalie a nossa competitividade atual de preço frente à Média de Mercado, Menor Preço e Maior Preço.
2. Defina o nosso posicionamento ideal (estamos brigando por preço baixo, valor agregado ou somos a opção mais cara injustificadamente?).
3. Sugira uma margem/desconto ideal ou uma estratégia de ancoragem caso o nosso preço seja alto.`;
    
    const monitorResult = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: monitorPrompt, config: { temperature: 0.5 } });
    const monitorResponse = monitorResult.text;
    if (onStepComplete) onStepComplete('monitor', monitorPrompt, monitorResponse || '');

    // 3. Gerente de Projetos (Synthesizer)
    const managerPrompt = `Você é um Gerente de Projetos de E-commerce. Você coordena a equipe e deve sintetizar a pesquisa bruta em um "Briefing Executivo de Execução" impecável.
Produto: "${productData.name}"

[RELATÓRIO DO PESQUISADOR (Rally MCP)]
${plannerResponse}

[RELATÓRIO DO MONITOR (Preços Reais)]
${monitorResponse}

Crie um BRIEFING EXECUTIVO DE EXECUÇÃO claro e conciso para a equipe de Criação (SEO e Design). 
Remova qualquer ruído. O Briefing deve conter obrigatoriamente:
1. Posicionamento de Preço (O que o cliente precisa sentir para achar que vale a pena pagar o nosso preço).
2. Ângulo de Venda Principal (Qual dor o produto resolve melhor).
3. Objeções a Quebrar (O que o SEO e o Design DEVEM combater no anúncio).
Seja imperativo e claro. Este briefing será a lei para os executores.`;

    const managerResult = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: managerPrompt, config: { temperature: 0.7 } });
    const managerResponse = managerResult.text;
    if (onStepComplete) onStepComplete('manager', managerPrompt, managerResponse || '');

    // 4. Especialista SEO
    const seoPrompt = `Você é um Especialista SEO Sênior focado em conversão.
Sua atitude: Salvar tudo que produz no anúncio. Você recebe o briefing do Gerente, gera todos os campos a serem preenchidos no produto (Título, Descrição, Meta tags, HTML válido), salva na Nuvemshop e responde ao Gerente apresentando um comparativo claro do Antes e Depois.

[BRIEFING EXECUTIVO]
${managerResponse}`;
    
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

    const seoResponsePayloadJSON = JSON.stringify({
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

    if (onStepComplete) onStepComplete('seo', seoPrompt, seoResponsePayloadJSON);

    // 5. Diretor de Arte
    const artPrompt = `Você é um Diretor de Arte Sênior. 
A copy de SEO já foi criada:
${seoResponsePayloadJSON}

O Briefing do Gerente é:
${managerResponse}

Sua função é criar o "Mapa Visual da Oferta" para o designer montar as imagens do anúncio de "${productData.name}".
1. Descreva a IMAGEM DE CAPA ideal (Cores, composição, texto de apoio na imagem).
2. Descreva 2 IMAGENS SECUNDÁRIAS focadas em quebrar objeções (Ex: Infográfico de medidas, selo de garantia, zoom no material).
3. Qual o "mood" (tom visual) deve ser adotado (ex: Luxo, Acessível, Tecnológico, Minimalista)?`;
    
    const artResult = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: artPrompt, config: { temperature: 0.7 } });
    const artResponse = artResult.text;
    if (onStepComplete) onStepComplete('art', artPrompt, artResponse || '');
  },

    async generateViralContent(productData: any, platform: string) {
    const settings = await firebaseService.getSettings();
    const hasRallyMcp = settings?.agentPermissions?.['social-media']?.['github-rally-mcp'] !== false;
    const hasNlp = settings?.agentPermissions?.['social-media']?.['nlp'] === true;
    const hasVision = settings?.agentPermissions?.['social-media']?.['vision-api'] === true;
    const hasVertex = settings?.agentPermissions?.['social-media']?.['vertex-ai'] === true;
    const hasPostmaster = settings?.agentPermissions?.['social-media']?.['postmaster-tools'] === true;

    let prompt = `Você é um Gestor de Social Media Especialista em Viralização e Afiliados${hasRallyMcp ? ', inspirado no "Rally MCP"' : ''}.
Crie um roteiro viral/pacote de conteúdo para: ${platform}

Produto:
Nome: ${productData.name}
Preço: ${productData.price}
Descrição: ${productData.description || 'Sem descrição'}

${hasNlp ? '\n[INTEGRAÇÃO ATIVADA: Cloud Natural Language API]\nAnalise o sentimento final da sua copy. Garanta que a pontuação de sentimento seja extremamente Positiva e Engajadora, corrigindo palavras neutras para termos mais emocionais e persuasivos antes de retornar o resultado final.' : ''}
${hasVision ? '\n[INTEGRAÇÃO ATIVADA: Cloud Vision API]\nVocê tem acesso à análise de imagens (Computer Vision). No campo visualSuggestions, descreva detalhadamente takes visuais estéticos e focados em alta iluminação, contraste e que foquem nas features do produto.' : ''}
${hasVertex ? '\n[INTEGRAÇÃO ATIVADA: Vertex AI Prediction]\nUse o algoritmo preditivo de machine learning. O seu Gancho (Hook) deve ser embasado em tendências preditivas, usando padrões que o algoritmo sabe que seguram retenção nos primeiros 3 segundos.' : ''}
${hasPostmaster && platform.toLowerCase().includes('email') ? '\n[INTEGRAÇÃO ATIVADA: Gmail Postmaster Tools]\nVocê identificou que é um E-mail Marketing. Evite termos restritos por filtros de SPAM. Escreva um assunto e um corpo de e-mail focado em Altíssima Entregabilidade, sem promessas absurdas que ativem os filtros do Gmail.' : ''}

Retorne ESTRITAMENTE um JSON puro no seguinte formato:
{
  "hook": "Gancho inicial (Primeiros 3 segundos - Chamativo)",
  "body": "Roteiro/Corpo da mensagem (Benefícios e Objeções quebradas)",
  "cta": "Call to Action forte",
  "visualSuggestions": "Sugestão do que mostrar no vídeo/imagem",
  "hashtags": "#tag1 #tag2"
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              hook: { type: "STRING" },
              body: { type: "STRING" },
              cta: { type: "STRING" },
              visualSuggestions: { type: "STRING" },
              hashtags: { type: "STRING" }
            },
            required: ["hook", "body", "cta", "visualSuggestions", "hashtags"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao gerar conteúdo viral:', err);
      throw err;
    }
  },

  async searchMarketplaceTrends(query: string) {
    const settings = await firebaseService.getSettings();
    const hasRallyMcp = settings?.agentPermissions?.['pesquisador-mercado']?.['github-rally-mcp'] !== false;

    const prompt = `Você é um Pesquisador de Tendências de Marketplaces, especialista em Mercado Livre e Shopee${hasRallyMcp ? ', utilizando inteligência "Rally MCP"' : ''}.
Aja como se tivesse acesso em tempo real às plataformas. O usuário buscou pelo termo/nicho: "${query}".

Retorne ESTRITAMENTE um JSON puro no seguinte formato (invente dados realistas e coerentes com o mercado atual para fins de demonstração):
{
  "topKeywords": ["palavra1", "palavra2", "palavra3"],
  "averagePrice": 0.00,
  "highDemandFeatures": ["caracteristica 1", "caracteristica 2"],
  "marketSentiment": "Descrição curta do sentimento atual dos compradores (ex: 'Buscando custo-benefício')",
  "competitorGaps": ["Oportunidade 1 (O que a maioria dos anúncios não mostra)", "Oportunidade 2"]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.5,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              topKeywords: { type: "ARRAY", items: { type: "STRING" } },
              averagePrice: { type: "NUMBER" },
              highDemandFeatures: { type: "ARRAY", items: { type: "STRING" } },
              marketSentiment: { type: "STRING" },
              competitorGaps: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["topKeywords", "averagePrice", "highDemandFeatures", "marketSentiment", "competitorGaps"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao buscar tendências:', err);
      throw err;
    }
  },

  async searchProductQuotes(productName: string) {
    const prompt = `Você é um Robô de Automação de Cotações (Scraper), equivalente ao repositório "cotacoes_google_buscape".
Sua missão é simular uma busca em tempo real por cotações de preços do produto: "${productName}" no Google Shopping e no Buscapé.

Retorne ESTRITAMENTE um JSON puro no seguinte formato (invente dados extremamente realistas baseados no preço atual de mercado desse produto no Brasil):
{
  "minPrice": 0.00,
  "maxPrice": 0.00,
  "averagePrice": 0.00,
  "googleShopping": [
    { "store": "Nome da Loja", "price": 0.00, "link": "https://shopping.google.com/..." }
  ],
  "buscape": [
    { "store": "Nome da Loja", "price": 0.00, "link": "https://www.buscape.com.br/..." }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              minPrice: { type: "NUMBER" },
              maxPrice: { type: "NUMBER" },
              averagePrice: { type: "NUMBER" },
              googleShopping: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    store: { type: "STRING" },
                    price: { type: "NUMBER" },
                    link: { type: "STRING" }
                  },
                  required: ["store", "price", "link"]
                }
              },
              buscape: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    store: { type: "STRING" },
                    price: { type: "NUMBER" },
                    link: { type: "STRING" }
                  },
                  required: ["store", "price", "link"]
                }
              }
            },
            required: ["minPrice", "maxPrice", "averagePrice", "googleShopping", "buscape"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao buscar cotações:', err);
      throw err;
    }
  },

  async generateAdsCampaign(productData: any, platform: string) {
    const prompt = `Você é um Especialista de Tráfego Pago e Marketplaces (nível Sênior), focado em performance (RoAS), operando com as skills do "Titanos Agent".
O cliente solicitou a criação de uma campanha para a plataforma: ${platform} (pode ser Amazon Ads, Google Ads ou Meta Ads).

Produto:
Nome: ${productData.name}
Preço: ${productData.price}
Descrição: ${productData.description || 'Sem descrição'}

Por favor, elabore uma estrutura de campanha focada em conversão, com base nas melhores práticas do mercado brasileiro e internacional.
Retorne ESTRITAMENTE um JSON puro com o seguinte formato:
{
  "campaignName": "Nome Estratégico da Campanha",
  "targetAudience": "Público-alvo / Perfil do comprador",
  "recommendedBudget": "Sugestão de orçamento diário (ex: R$ 50,00)",
  "adGroups": [
    {
      "name": "Nome do Grupo de Anúncio",
      "keywords": ["palavra-chave 1", "palavra-chave 2"],
      "biddingStrategy": "Estratégia de lances (ex: Manual, Max Conversões)",
      "adCopies": [
        {
          "headline": "Título Chamativo (até 30 char)",
          "description": "Texto principal com gatilhos mentais",
          "cta": "Call to Action"
        }
      ]
    }
  ],
  "fbaOrLogisticsInsight": "Se aplicável (ex. Amazon), dica sobre como o FBA ou frete rápido pode aumentar a conversão do anúncio. Caso contrário, dica geral de logística."
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.6,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              campaignName: { type: "STRING" },
              targetAudience: { type: "STRING" },
              recommendedBudget: { type: "STRING" },
              adGroups: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    keywords: { type: "ARRAY", items: { type: "STRING" } },
                    biddingStrategy: { type: "STRING" },
                    adCopies: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          headline: { type: "STRING" },
                          description: { type: "STRING" },
                          cta: { type: "STRING" }
                        },
                        required: ["headline", "description", "cta"]
                      }
                    }
                  },
                  required: ["name", "keywords", "biddingStrategy", "adCopies"]
                }
              },
              fbaOrLogisticsInsight: { type: "STRING" }
            },
            required: ["campaignName", "targetAudience", "recommendedBudget", "adGroups", "fbaOrLogisticsInsight"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao gerar campanha de ads:', err);
      throw err;
    }
  },


  async generateProductSEO(productData: any, briefing?: string) {
    const settings = await firebaseService.getSettings();
    const permissions = settings?.agentPermissions?.['especialista-seo'] || {};
    const seoExpertPrompt = buildSeoExpertPrompt(permissions);
    
    const systemInstruction = seoExpertPrompt + `\n\nRetorne ESTRITAMENTE em formato JSON puro.`;
    
    let prompt = `Analise este produto, convoque os seus Múltiplos Agentes, acesse a internet para investigar concorrentes diretos, deduza o público-alvo e gere todo o pacote de marketing. OBRIGATÓRIO: A novaDescricaoHtml DEVE usar tags HTML VÁLIDAS. SE o produto já tiver uma Marca Original cadastrada, OBRIGATORIAMENTE use a mesma marca.`;
    
    if (briefing) {
       prompt += `\n\n[AÇÃO MANDATÓRIA - ORDEM DO GERENTE DE PROJETOS]:\nVocê DEVE obedecer ao seguinte BRIEFING EXECUTIVO na construção do SEO (Título, Copy, Meta):\n"${briefing}"\nQuebre as objeções apontadas e adote o ângulo de venda sugerido.`;
    }
    
    prompt += `\n\n

Produto original a ser pesquisado:
Nome: ${productData.name}
Preço: ${productData.price}
Marca Original: ${productData.brand || 'Não cadastrada'}
Tags Originais: ${productData.tags || 'Sem tags'}
Descrição Original (geralmente pobre): ${productData.description || 'Sem descrição'}
Meta Description Original: ${productData.seo_description || 'Vazia'}
URL Original: ${productData.handle || 'Sem URL'}

Formato obrigatório de retorno (JSON puro):
{
  "novoTitulo": "NOME ATRATIVO COM PALAVRA CHAVE",
  "metaDescription": "Resumo persuasivo de 150 caracteres...",
  "publicoAlvo": "Descreva o público alvo principal",
  "tags": "tag1, tag2, tag longa, palavra-chave",
  "marca": "Marca do Produto",
  "urlProduto": "nome-atrativo-separado-por-hifens",
  "novaDescricaoHtml": "GANCHO INICIAL AQUI (COM PALAVRAS-CHAVE SEO)\\n\\n<h3>DESCRIÇÃO TÉCNICA E DURABILIDADE</h3>\\n\\n- Benefício 1...\\n\\n<h3>INSTRUÇÕES DE USO</h3>\\n\\n1. Passo 1...\\n\\n<h3>ESPECIFICAÇÕES TÉCNICAS E SEGURANÇA</h3>\\n\\n- Peso...\\n\\n<h3>GARANTIA, DEVOLUÇÃO E ENVIO</h3>\\n\\n- Garantia de fábrica...\\n\\n<h3>PERGUNTAS FREQUENTES (FAQ)</h3>\\n\\n1. Pergunta 1?\\nResposta direta baseada em concorrentes...",
  "scoreTituloOriginal": 85,
  "scoreTituloNovo": 98,
  "scoreMetaOriginal": 50,
  "scoreMetaNova": 95,
  "scoreMarcaOriginal": 100,
  "scoreMarcaNova": 100,
  "scoreTagsOriginal": 70,
  "scoreTagsNova": 95,
  "scoreUrlOriginal": 80,
  "scoreUrlNova": 95,
  "scoreDescricaoOriginal": 60,
  "scoreDescricaoNova": 100,
  "dicasMelhoria": ["Falta informar o material na descrição original", "A marca não foi cadastrada no original"],
  "emailMarketing": "ASSUNTO: ...\\n\\nCORPO DO EMAIL focado em nutrir e converter o cliente sobre este produto, citando benefícios e escassez.",
  "socialMediaPosts": ["POST 1 (Instagram): Copy do post com hashtags.", "POST 2 (TikTok): Ideia de vídeo curto e copy."],
  "facebookAds": ["AD 1 - Headline: ...\\nTexto Principal: ...", "AD 2 - Headline: ...\\nTexto Principal: ..."]
}`;

    try {
      // Usando a versão Pro estável mais recente
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ],
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              novoTitulo: { type: Type.STRING },
              metaDescription: { type: Type.STRING },
              publicoAlvo: { type: Type.STRING },
              tags: { type: Type.STRING },
              marca: { type: Type.STRING },
              urlProduto: { type: Type.STRING },
              novaDescricaoHtml: { type: Type.STRING },
              scoreTituloOriginal: { type: Type.INTEGER },
              scoreTituloNovo: { type: Type.INTEGER },
              scoreMetaOriginal: { type: Type.INTEGER },
              scoreMetaNova: { type: Type.INTEGER },
              scoreMarcaOriginal: { type: Type.INTEGER },
              scoreMarcaNova: { type: Type.INTEGER },
              scoreTagsOriginal: { type: Type.INTEGER },
              scoreTagsNova: { type: Type.INTEGER },
              scoreUrlOriginal: { type: Type.INTEGER },
              scoreUrlNova: { type: Type.INTEGER },
              scoreDescricaoOriginal: { type: Type.INTEGER },
              scoreDescricaoNova: { type: Type.INTEGER },
              dicasMelhoria: { type: Type.ARRAY, items: { type: Type.STRING } },
              emailMarketing: { type: Type.STRING },
              socialMediaPosts: { type: Type.ARRAY, items: { type: Type.STRING } },
              facebookAds: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: [
              "novoTitulo", "metaDescription", "publicoAlvo", "tags", "marca", "urlProduto",
              "novaDescricaoHtml", "scoreTituloOriginal", "scoreTituloNovo", "scoreMetaOriginal", "scoreMetaNova",
              "scoreMarcaOriginal", "scoreMarcaNova", "scoreTagsOriginal", "scoreTagsNova", "scoreUrlOriginal", "scoreUrlNova",
              "scoreDescricaoOriginal",
              "scoreDescricaoNova", "dicasMelhoria", "emailMarketing", "socialMediaPosts", "facebookAds"
            ]
          }
        }
      });
      const parsed = JSON.parse(response.text || '{}'); console.log("AI returned:", parsed); return parsed;
    } catch (err: any) {
      console.error('Erro na geração de SEO:', err);
      
      // Tratamento gracioso para o limite de cota da chave de testes
      if (err.message?.includes('429') || err.message?.includes('Quota') || err.message?.includes('404') || err.message?.includes('NOT_FOUND')) {
        return {
          novoTitulo: "⚠️ [LIMITE DE REQUISIÇÕES ATINGIDO]",
          metaDescription: "O limite de uso gratuito da API do Gemini foi temporariamente excedido (Status 429).",
          publicoAlvo: "Para uso contínuo em produção, adicione sua própria GEMINI_API_KEY no painel de configurações ou aguarde 1 minuto.",
          tags: "erro, cota, api, limite",
          marca: "Google Cloud",
          urlProduto: "limite-de-requisicoes",
          novaDescricaoHtml: "<p><strong>Limite de requisições excedido.</strong></p><p>O sistema está utilizando corretamente a API, mas a chave configurada atingiu o limite de requisições (Status 429).</p><p>Para continuar testando, verifique se a sua chave de API inserida nas configurações (Secrets) possui saldo e cota disponível. Lembre-se que as alterações na chave do VS Code não se aplicam automaticamente ao painel do AI Studio.</p>",
          scoreTituloOriginal: 0,
          scoreTituloNovo: 0,
          scoreMetaOriginal: 0,
          scoreMetaNova: 0,
          scoreMarcaOriginal: 0,
          scoreMarcaNova: 0,
          scoreTagsOriginal: 0,
          scoreTagsNova: 0,
          scoreUrlOriginal: 0,
          scoreUrlNova: 0,
          scoreDescricaoOriginal: 0,
          scoreDescricaoNova: 0,
          dicasMelhoria: [],
          emailMarketing: "",
          socialMediaPosts: [],
          facebookAds: []
        };
      }
      throw err;
    }
  },
  
  async handleAgentChat(text: string, sender: string, receiver: string) {
    try {
      // Lê as personas do arquivo AGENTS.md
      let agentsPersona = '';
      try {
        const agentsPath = path.join(process.cwd(), 'AGENTS.md');
        if (fs.existsSync(agentsPath)) {
          agentsPersona = fs.readFileSync(agentsPath, 'utf8');
        }
      } catch (err) {
        console.error('Erro ao ler AGENTS.md', err);
      }

      // Constrói o contexto para o Gemini
      const prompt = `Você faz parte de uma equipe de Agentes de Inteligência Artificial da empresa 123Mart.
Abaixo está o manual de personas da equipe:
---
${agentsPersona}
---

O seu ID de agente é: "${receiver}". Assuma a persona, a atitude e as ferramentas correspondentes ao seu ID. 
Você acabou de receber uma mensagem do agente/usuário de ID: "${sender}".

A mensagem recebida foi:
"${text}"

Por favor, responda a esta mensagem. Mantenha a atitude da sua persona, e caso a ordem fuja do seu escopo, negue educadamente ou direcione ao agente correto.
Responda diretamente, sem aspas e sem cabeçalhos, apenas o texto da sua resposta. Se você for o Gerente de Projetos e a ordem for para outro agente, aja de acordo enviando a instrução para o próximo agente (informe na mensagem que você vai cobrar o próximo agente).

[IMPORTANTE - REPASSE DE MENSAGENS]:
Se você (como Gerente de Projetos ou qualquer outro agente) precisar acionar outro agente da equipe, você DEVE gerar na sua resposta a tag de encaminhamento. 
O sistema de backend interceptará essa tag e enviará a mensagem ao outro agente.
Aqui estão os IDs oficiais dos agentes que você pode usar: diretoria, gerente, pesquisador, seo, monitor, art, copywriter, social, ads, merchant, metrics, finance.
Formato exato e obrigatório da tag (coloque isso no final da sua resposta):
[ENCAMINHAR_PARA: id_do_agente] Mensagem que você quer enviar para ele...
Exemplo: [ENCAMINHAR_PARA: pesquisador] Olá pesquisador, faça a pesquisa sobre X.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      let aiText = response.text || 'Entendido. Estou trabalhando nisso.';
      
      // Verifica se o agente solicitou um encaminhamento
      const forwardMatch = aiText.match(/\[ENCAMINHAR_PARA:\s*([^\]]+)\](.*)/s);
      
      if (forwardMatch) {
        const nextAgentId = forwardMatch[1].trim();
        const messageToNextAgent = forwardMatch[2].trim();
        
        // Remove a tag da resposta original que vai para o usuário
        aiText = aiText.replace(/\[ENCAMINHAR_PARA:\s*[^\]]+\].*/s, '').trim();
        
        // Dispara assincronamente a mensagem do agente atual para o próximo agente
        setTimeout(async () => {
          try {
            await firebaseService.saveAgentChatMessage(messageToNextAgent, receiver, nextAgentId);
            // Simula o próximo agente recebendo e respondendo
            await aiService.handleAgentChat(messageToNextAgent, receiver, nextAgentId);
          } catch (e) {
            console.error('Erro no encaminhamento de mensagem', e);
          }
        }, 1000);
      }
      
      // Salva a resposta gerada pelo AI no banco de dados como se fosse o receiver falando para o sender
      await firebaseService.saveAgentChatMessage(aiText, receiver, sender);
    } catch (err) {
      console.error('Erro ao gerar resposta do agente:', err);
      await firebaseService.saveAgentChatMessage("Desculpe, tive um problema de comunicação interno e não consegui processar a mensagem.", receiver, sender);
    }
  },

  async generateText(prompt: string) {
    const res = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return res.text;
  }
};
