import { GoogleGenAI, Type, Tool } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { nuvemshopService } from './nuvemshop.js';
import { firebaseService } from './firebase.js';

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
        model: 'gemini-3.6-flash',
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
          model: 'gemini-3.6-flash',
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
  async generateProductSEO(productData: any) {
    const systemInstruction = `Você é um ecossistema de Múltiplos Agentes de Marketing de IA (inspirado no modelo "ai-marketing-claude"). Sua mente opera processando dados em paralelo através de 4 Especialistas Sêniores:
1. [AGENTE 1: Especialista em SEO e Pesquisa] - Acessa a internet, mapeia concorrentes (Mercado Livre, Amazon, Shopee), descobre doores nas FAQs e valida fichas técnicas.
2. [AGENTE 2: Copywriter E-commerce] - Transforma os dados técnicos em textos persuasivos, sem emojis, altamente técnicos, com foco na tríade: 20% Persuasão, 50% Informação, 30% Segurança.
3. [AGENTE 3: Estrategista de Social Media] - Cria calendários de conteúdo curto, direto e voltado à conversão.
4. [AGENTE 4: Especialista em Tráfego Pago (Ads) e Email Marketing] - Cria criativos focados em CTR (Click-Through Rate) e sequências de email de nutrição.

A sua premissa principal é: "O cliente busca informações técnicas e manuais de uso para justificar a compra, além de precisarmos gerar tração em múltiplos canais".

REGRA DE PESQUISA OBRIGATÓRIA (GROUNDING): 
Antes de gerar o conteúdo final, o [AGENTE 1] DEVE acessar a internet (Google Search) para pesquisar pelo nome do produto e seus concorrentes. Extraia ativamente: 
- Informações técnicas ocultas ou manuais que faltaram na descrição original.
- Dores dos clientes nas FAQs dos concorrentes.
- Argumentos de venda e padrões de mercado para este nicho.

REGRA ABSOLUTA 1: NENHUM EMOJI PODE SER USADO NA DESCRIÇÃO DO PRODUTO. Marketplaces (como Mercado Livre) bloqueiam integrações via API que contêm emojis.
REGRA ABSOLUTA 2: Apenas a novaDescricaoHtml deve usar HTML. Os outros campos de marketing (emails, ads, social) devem usar texto simples com espaçamentos claros.

Siga RIGOROSAMENTE a estrutura da Descrição (feita pelo Agente 2):
1. Gancho Inicial (Persuasão 20%): Frase objetiva com palavras-chave.
2. Descrição Técnica e Durabilidade (Informação 50%): O que faz, materiais, durabilidade (Enriquecido pela Web).
3. Instruções de Uso (Informação 50%): Passo a passo prático (Manuais reais da web).
4. Especificações Técnicas (Segurança 30%): Ficha técnica, medidas, FISPQ.
5. Garantia/Devolução e FAQ: Baseado nas dúvidas reais dos concorrentes.

SUA SEGUNDA TAREFA (feita pelo Agente 1): AVALIAR SEO E DAR NOTAS COMPARATIVAS (0 a 100):
- scoreTituloOriginal, scoreTituloNovo, scoreDescricaoOriginal, scoreDescricaoNova.
- dicasMelhoria (Array de Strings): Dados TÉCNICOS que faltaram no original e devem ser providenciados pelo lojista.

SUA TERCEIRA TAREFA (Agentes 3 e 4): GERAR MATERIAIS DE MARKETING
Crie uma campanha completa para este produto contendo Emails, Posts para Redes Sociais e Copys para Facebook/Instagram Ads.

Retorne ESTRITAMENTE em formato JSON puro.`;
    
    const prompt = `Analise este produto, convoque os seus Múltiplos Agentes, acesse a internet para investigar concorrentes diretos, deduza o público-alvo e gere todo o pacote de marketing. OBRIGATÓRIO: A novaDescricaoHtml DEVE usar tags HTML VÁLIDAS. SE o produto já tiver uma Marca Original cadastrada, OBRIGATORIAMENTE use a mesma marca.

Produto original a ser pesquisado:
Nome: ${productData.name}
Preço: ${productData.price}
Marca Original: ${productData.brand || 'Não cadastrada'}
Tags Originais: ${productData.tags || 'Sem tags'}
Descrição Original (geralmente pobre): ${productData.description || 'Sem descrição'}

Formato obrigatório de retorno (JSON puro):
{
  "novoTitulo": "NOME ATRATIVO COM PALAVRA CHAVE",
  "metaDescription": "Resumo persuasivo de 150 caracteres...",
  "publicoAlvo": "Descreva o público alvo principal",
  "tags": "tag1, tag2, tag longa, palavra-chave",
  "marca": "Marca do Produto",
  "urlProduto": "nome-atrativo-separado-por-hifens",
  "novaDescricaoHtml": "GANCHO INICIAL AQUI (COM PALAVRAS-CHAVE SEO)\\n\\n<h3>DESCRIÇÃO TÉCNICA E DURABILIDADE</h3>\\n\\n- Benefício 1...\\n\\n<h3>INSTRUÇÕES DE USO</h3>\\n\\n1. Passo 1...\\n\\n<h3>ESPECIFICAÇÕES TÉCNICAS E SEGURANÇA</h3>\\n\\n- Peso...\\n\\n<h3>GARANTIA, DEVOLUÇÃO E ENVIO</h3>\\n\\n- Garantia de fábrica...\\n\\n<h3>PERGUNTAS FREQUENTES (FAQ)</h3>\\n\\n1. Pergunta 1?\\nResposta direta baseada em concorrentes...",
  "scoreTituloOriginal": 40,
  "scoreTituloNovo": 98,
  "scoreDescricaoOriginal": 30,
  "scoreDescricaoNova": 100,
  "dicasMelhoria": ["Falta informar o material"],
  "emailMarketing": "ASSUNTO: ...\\n\\nCORPO DO EMAIL focado em nutrir e converter o cliente sobre este produto, citando benefícios e escassez.",
  "socialMediaPosts": ["POST 1 (Instagram): Copy do post com hashtags.", "POST 2 (TikTok): Ideia de vídeo curto e copy."],
  "facebookAds": ["AD 1 - Headline: ...\\nTexto Principal: ...", "AD 2 - Headline: ...\\nTexto Principal: ..."]
}`;

    try {
      // Usando a versão Flash estável mais recente
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json'
        }
      });
      const parsed = JSON.parse(response.text || '{}'); console.log("AI returned:", parsed); return parsed;
    } catch (err: any) {
      console.error('Erro na geração de SEO:', err);
      
      // Tratamento gracioso para o limite de cota da chave de testes
      if (err.message?.includes('429') || err.message?.includes('Quota')) {
        return {
          novoTitulo: "⚠️ [LIMITE DE REQUISIÇÕES ATINGIDO]",
          metaDescription: "O limite de uso gratuito da API do Gemini foi temporariamente excedido (Status 429).",
          publicoAlvo: "Para uso contínuo em produção, adicione sua própria GEMINI_API_KEY no painel de configurações ou aguarde 1 minuto.",
          tags: "erro, cota, api, limite",
          marca: "Google Cloud",
          urlProduto: "limite-de-requisicoes",
          novaDescricaoHtml: "<p><strong>Limite de requisições excedido.</strong></p><p>O sistema está utilizando corretamente o modelo <strong>Gemini 3.6 Flash</strong>, que é ultra-rápido, mas a chave de acesso do ambiente compartilhado atingiu o limite de consultas por minuto (Status 429).</p><p>Para continuar testando, aguarde cerca de 1 minuto e tente novamente. Para utilizar o sistema em produção sem interrupções, você precisa inserir sua própria chave de API nas configurações do sistema (ou no arquivo <code>.env</code> se estiver rodando localmente).</p>"
        };
      }
      return null;
    }
  }
};
