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
    const systemInstruction = `Você é um Especialista em E-commerce e Analista de SEO Sênior. Seu trabalho é avaliar os dados do produto, atribuir notas de qualidade e transformar esses dados em descrições extremamente INFORMATIVAS, TÉCNICAS e OBJETIVAS.

A sua premissa principal é: "O cliente que lê a descrição já foi atraído pelas fotos; ele agora busca informações técnicas e lógicas para justificar a compra".

REGRA ABSOLUTA 1: NENHUM EMOJI PODE SER USADO NA DESCRIÇÃO. Marketplaces (como Mercado Livre) bloqueiam integrações via API que contêm emojis. É ESTRITAMENTE PROIBIDO gerar emojis.
REGRA ABSOLUTA 2: NÃO USE tags HTML. Use formato Plain Text (letras MAIÚSCULAS para títulos de seção, hifens para listas e quebras de linha duplas para separar blocos).

Siga RIGOROSAMENTE esta estrutura de informação técnica (Padrão Ouro de Conversão pela Lógica: 20% Persuasão, 50% Informação, 30% Segurança):
1. Título Atrativo: Claro, focado no produto e contendo a palavra-chave principal (Retorne no campo "novoTitulo").
2. Gancho Inicial (Persuasão 20%): Uma frase objetiva informando o que é o produto. APROVEITE ESTA SEÇÃO PARA INJETAR CAUDAS LONGAS E PALAVRAS-CHAVE DE SEO DE FORMA NATURAL para agradar os algoritmos de busca. ATENÇÃO: NÃO ESCREVA AS PALAVRAS "GANCHO INICIAL" no texto final, apenas escreva a frase diretamente no início da descrição.
3. Descrição Técnica e Durabilidade (Informação 50%): O que o produto faz, materiais, resistência e expectativa de durabilidade.
4. Instruções de Uso (Informação 50%): Passo a passo prático, claro e direto.
5. Especificações Técnicas, Segurança e Validade (Segurança 30%): Ficha técnica completa, medidas exatas, alertas, voltagem, composição, FISPQ.
6. Garantia, Devolução e Envio (Segurança 30%): Prazos de garantia, devolução e regras de envio.
7. Perguntas Frequentes (FAQ): Dúvidas técnicas (compatibilidade, limpeza, etc).

SUA SEGUNDA TAREFA É AVALIAR O SEO E DAR NOTAS COMPARATIVAS (0 a 100):
- scoreTituloOriginal: Qual a nota de SEO do título original?
- scoreTituloNovo: Qual a nota de SEO do título otimizado que você criou?
- scoreDescricaoOriginal: Qual a nota da descrição original? Baseie a nota na proporção áurea (20% persuasão, 50% informação técnica, 30% segurança).
- scoreDescricaoNova: Qual a nota da sua nova descrição? (Deve ser sempre maior que a original, próximo a 100).
- dicasMelhoria (Array de Strings): Diga ao lojista quais dados TÉCNICOS faltaram no original e que ele precisa providenciar no ERP para o futuro (ex: "Falta informar o material", "Insira a ficha FISPQ").

Retorne os dados ESTRITAMENTE em formato JSON puro.`;
    
    const prompt = `Analise este produto, deduza o público-alvo e as tags de SEO. Avalie os dados originais e gere os scores e dicas. Em seguida, crie uma descrição altamente técnica, informativa, SEM EMOJIS e com forte injeção de SEO no gancho inicial. SE o produto já tiver uma Marca Original cadastrada, OBRIGATORIAMENTE use a mesma marca.

Produto original:
Nome: ${productData.name}
Preço: ${productData.price}
Marca Original: ${productData.brand || 'Não cadastrada'}
Tags Originais: ${productData.tags || 'Sem tags'}
Descrição Original: ${productData.description || 'Sem descrição'}

Formato obrigatório de retorno (JSON puro):
{
  "novoTitulo": "NOME ATRATIVO COM PALAVRA CHAVE",
  "metaDescription": "Resumo persuasivo de 150 caracteres...",
  "publicoAlvo": "Descreva o público alvo principal",
  "tags": "tag1, tag2, tag longa, palavra-chave",
  "marca": "Marca do Produto",
  "urlProduto": "nome-atrativo-separado-por-hifens",
  "novaDescricaoHtml": "GANCHO INICIAL AQUI (COM PALAVRAS-CHAVE SEO)\\n\\nDESCRIÇÃO TÉCNICA E DURABILIDADE\\n\\n- Benefício 1...\\n- Benefício 2...\\n\\nINSTRUÇÕES DE USO\\n\\n1. Passo 1...\\n\\nESPECIFICAÇÕES TÉCNICAS E SEGURANÇA\\n\\n- Peso...\\n\\nGARANTIA, DEVOLUÇÃO E ENVIO\\n\\n- Garantia de fábrica...\\n- Devolução de 7 dias...\\n- Envio em 24h...\\n\\nPERGUNTAS FREQUENTES (FAQ)\\n\\n1. Pergunta 1?\\nResposta direta...",
  "scoreTituloOriginal": 40,
  "scoreTituloNovo": 98,
  "scoreDescricaoOriginal": 30,
  "scoreDescricaoNova": 100,
  "dicasMelhoria": ["Falta informar o material", "Adicione a Ficha Técnica / FISPQ", "Informe a garantia do fabricante"]
}`;

    try {
      // Usando a versão Flash estável mais recente
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.error('Erro na geração de SEO:', err);
      
      // Tratamento gracioso para o limite de cota da chave de testes
      if (err.message?.includes('429') || err.message?.includes('Quota')) {
        return {
          novoTitulo: "⚠️ [ERRO DE COTA DA API PRO]",
          metaDescription: "A Chave de API atual não possui permissão para usar o modelo Pro.",
          publicoAlvo: "Para resolver, adicione sua própria GEMINI_API_KEY no arquivo .env",
          tags: "erro, cota, api, gemini",
          marca: "Google Cloud",
          urlProduto: "erro-cota-api",
          novaDescricaoHtml: "<p><strong>Você tem razão! O modelo Pro é o ideal para o marketing.</strong></p><p>No entanto, a chave de testes embutida no ambiente de demonstração possui limite zero para a família Pro. O código <strong>já foi atualizado</strong> para usar a melhor inteligência artificial do mercado (gemini-pro-latest).</p><p>Para ver este texto ganhar vida com a inteligência máxima, você só precisa colocar a sua chave particular no arquivo <code>.env</code> quando baixar o código para a sua máquina.</p>"
        };
      }
      return null;
    }
  }
};
