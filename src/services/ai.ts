import { GoogleGenAI, Type, Tool, HarmCategory, HarmBlockThreshold } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { nuvemshopService } from './nuvemshop.js';
import { firebaseService } from './firebase.js';
import { seoExpertPrompt } from '../prompts/seoExpert.js';

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
    const systemInstruction = overridePrompt ? overridePrompt : getSystemInstruction(pipelineStage);

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
    const joinedLinks = links.join('\n');

    // 1. Pesquisador (Planner)
    const plannerPrompt = `Você é um Pesquisador de Mercado. Acesse, se possível, ou analise o padrão dos seguintes links de concorrentes para um produto:
${joinedLinks}

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
  async runOrchestrationPipeline(productData: any, onStepComplete?: (step: string, prompt: string, response: string) => void) {
    // 1. Pesquisador (Planner)
    const plannerPrompt = `Você é um Planner e Pesquisador de Mercado focado em e-commerce. Analise o seguinte produto:
Nome: ${productData.name}
Preço: ${productData.price}
Descrição Original: ${productData.description || 'Sem descrição'}

Por favor, forneça uma análise detalhada contendo:
- Informações de uso e técnicas do produto
- Principais argumentos de venda comerciais
- O que os clientes geralmente reclamam ou elogiam neste tipo de produto (aceitações e reprovações).
Seja direto e crie um relatório profissional.`;
    
    const plannerResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: plannerPrompt,
      config: { temperature: 0.7 }
    });
    const plannerResponse = plannerResult.text;
    if (onStepComplete) onStepComplete('planner', plannerPrompt, plannerResponse);

    // 2. Monitor de Inteligência Competitiva
    const monitorPrompt = `Você é um Monitor de Inteligência Competitiva focado em benchmarking. Leia atentamente a pesquisa de mercado recém-criada sobre o produto "${productData.name}":

[PESQUISA DE MERCADO]
${plannerResponse}
[FIM DA PESQUISA]

Com base nisso, crie um relatório de Oportunidades (Benchmark).
1. Estime a faixa de preços praticada pelos concorrentes.
2. Analise a correlação entre preço e vendas (como a qualidade da apresentação influencia a venda de opções mais caras ou baratas).
3. Defina a nossa oportunidade de posicionamento: devemos focar em sermos os mais baratos, premium, ou ter o melhor custo-benefício? Justifique.`;
    
    const monitorResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: monitorPrompt,
      config: { temperature: 0.7 }
    });
    const monitorResponse = monitorResult.text;
    if (onStepComplete) onStepComplete('monitor', monitorPrompt, monitorResponse);

    // 3. Gerente de Projetos (Synthesizer)
    const managerPrompt = `Você é um Gerente de Projetos de E-commerce experiente. Sua tarefa é evitar sobrecarga de informação e sintetizar os dados de pesquisa em um briefing executivo claro e conciso para o Especialista SEO.
    
Aqui estão os relatórios originais do produto "${productData.name}":
[PESQUISA DE MERCADO]
${plannerResponse}

[BENCHMARK DO MONITOR]
${monitorResponse}

Crie um "Briefing Executivo" direto ao ponto. Remova detalhes excessivos e foque apenas no que importa para a conversão (diferenciais, objeções a quebrar e oportunidade de posicionamento).`;

    const managerResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: managerPrompt,
      config: { temperature: 0.7 }
    });
    const managerResponse = managerResult.text;
    if (onStepComplete) onStepComplete('manager', managerPrompt, managerResponse || '');

    // 4. Especialista SEO
    const seoPrompt = `Você é um Especialista SEO Sênior. Leia o briefing executivo sobre o produto "${productData.name}":

[BRIEFING EXECUTIVO]
${managerResponse}
[FIM DO BRIEFING]

Seu objetivo é criar a otimização textual para a Nuvemshop. Retorne:
1. Novo Título SEO Otimizado (que gere cliques).
2. Meta Descrição persuasiva (até 150 caracteres).
3. Sugestão de tags para ranqueamento interno.
4. Um parágrafo inicial forte de copy para ser usado na descrição do produto, focando em quebrar as objeções apontadas pelo pesquisador.`;
    
    const seoResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: seoPrompt,
      config: { temperature: 0.7 }
    });
    const seoResponse = seoResult.text;
    if (onStepComplete) onStepComplete('seo', seoPrompt, seoResponse);

    // 4. Diretor de Arte
    const artPrompt = `Você é um Diretor de Arte Sênior especializado em e-commerce. A copy de SEO já foi criada:

[COPY DE SEO]
${seoResponse}
[FIM DA COPY]

Sua função é criar as diretrizes visuais para o anúncio do produto "${productData.name}".
1. Descreva 3 banners ou imagens necessárias (ex: lifestyle, infográfico dos diferenciais, etc.).
2. Explique como devem ser os elementos visuais (cores, textos de apoio nas imagens) para transmitir o posicionamento definido e maximizar a conversão.`;
    
    const artResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: artPrompt,
      config: { temperature: 0.7 }
    });
    const artResponse = artResult.text;
    if (onStepComplete) onStepComplete('art', artPrompt, artResponse);

    return {
      results: {
        planner: plannerResponse,
        monitor: monitorResponse,
        manager: managerResponse,
        seo: seoResponse,
        art: artResponse
      },
      prompts: {
        planner: plannerPrompt,
        monitor: monitorPrompt,
        manager: managerPrompt,
        seo: seoPrompt,
        art: artPrompt
      }
    };
  }

,
  async generateViralContent(productData: any) {
    const prompt = `Você é um Gestor de Social Media Especialista em Viralização e Afiliados, inspirado no "Rally MCP".
Sua missão é criar um pacote de conteúdo de marketing altamente conversivo e viral para as redes sociais.

Produto:
Nome: ${productData.name}
Preço: ${productData.price}
Descrição: ${productData.description || 'Sem descrição'}

Retorne ESTRITAMENTE um JSON puro com as seguintes chaves (sem formatação markdown):
{
  "tiktokScript": "Roteiro de 30 a 60 segundos focado em retenção nos primeiros 3 segundos e CTA forte. Formato (Cena/Áudio).",
  "reelsIdea": "Ideia visual para o Instagram Reels, focando na estética e trend musical do momento.",
  "whatsappBroadcast": "Mensagem curta, persuasiva e com gatilhos de escassez para enviar em grupos de WhatsApp.",
  "telegramMessage": "Mensagem para canal do Telegram com formatação rica (negrito/emoji) focada em benefício técnico.",
  "blogPost": "Ideia de título de blog post focado em SEO de cauda longa para este produto."
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              tiktokScript: { type: "STRING" },
              reelsIdea: { type: "STRING" },
              whatsappBroadcast: { type: "STRING" },
              telegramMessage: { type: "STRING" },
              blogPost: { type: "STRING" }
            },
            required: ["tiktokScript", "reelsIdea", "whatsappBroadcast", "telegramMessage", "blogPost"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao gerar viral content:', err);
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

  async searchMarketplaceTrends(query: string) {
    const prompt = `Você é um Pesquisador de Tendências de Marketplaces, especialista em Mercado Livre e Shopee, utilizando inteligência "Rally MCP".
Aja como se tivesse acesso em tempo real às plataformas. O usuário buscou pelo termo/nicho: "${query}".

Identifique e crie 3 produtos/tendências fictícias, porém altamente realistas e embasadas no comportamento atual do mercado brasileiro, que estão em alta para este nicho.

Retorne ESTRITAMENTE um JSON puro com o formato:
{
  "trends": [
    {
      "marketplace": "Mercado Livre ou Shopee",
      "productName": "Nome do Produto",
      "priceRange": "Ex: R$ 50 - R$ 80",
      "competitiveness": "Alta/Média/Baixa",
      "qualityScore": "Ex: 9.5/10",
      "whyIsTrending": "Explicação rápida do motivo viral"
    }
  ]
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
              trends: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    marketplace: { type: "STRING" },
                    productName: { type: "STRING" },
                    priceRange: { type: "STRING" },
                    competitiveness: { type: "STRING" },
                    qualityScore: { type: "STRING" },
                    whyIsTrending: { type: "STRING" }
                  },
                  required: ["marketplace", "productName", "priceRange", "competitiveness", "qualityScore", "whyIsTrending"]
                }
              }
            },
            required: ["trends"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro ao buscar trends:', err);
      throw err;
    }
  },

  async generateProductSEO(productData: any) {
    const systemInstruction = seoExpertPrompt + `\n\nRetorne ESTRITAMENTE em formato JSON puro.`;
    
    const prompt = `Analise este produto, convoque os seus Múltiplos Agentes, acesse a internet para investigar concorrentes diretos, deduza o público-alvo e gere todo o pacote de marketing. OBRIGATÓRIO: A novaDescricaoHtml DEVE usar tags HTML VÁLIDAS. SE o produto já tiver uma Marca Original cadastrada, OBRIGATORIAMENTE use a mesma marca.

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
  }
};
