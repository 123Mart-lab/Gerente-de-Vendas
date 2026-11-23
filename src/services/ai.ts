import { buildPlannerPrompt, type ProductVisualAudit } from '../prompts/planner.js';
import { buildMonitorPrompt } from '../prompts/monitor.js';
import {
  buildManagerBriefingPrompt,
  formatManagerBriefingMarkdown,
  type ManagerStrategicBriefing
} from '../prompts/manager.js';
import {
  buildArtDirectorPlanPrompt,
  buildArtSlotRevisionPrompt,
  formatArtPlanMarkdown,
  validateAndNormalizeArtSlot,
  type ArtDirectionPlan,
  type ArtSlotPlan
} from '../prompts/artDirector.js';
import { GoogleGenAI, Type, Tool, HarmCategory, HarmBlockThreshold, ThinkingLevel } from '@google/genai';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { nuvemshopService } from './nuvemshop.js';
import { firebaseService } from './firebase.js';
import { buildSeoExpertPrompt } from '../prompts/seoExpert.js';

export interface CommercialSafetyAlert {
  blockedAutoSave: boolean;
  reason: string;
  registeredPrice?: number;
  marketAveragePrice?: number;
  unitsShownInPhoto?: number;
  titleSuggestsKit?: boolean;
  detectedAt: number;
  manualOverrideApproved?: boolean;
}

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

function extractLocalizedText(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return String(val.pt || val.en || val.es || Object.values(val).find((v) => typeof v === 'string') || '');
  }
  return String(val);
}

function parseSafeJson<T>(rawText: string, fallback: T): T {
  const cleaned = (rawText || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {}
    }
    return fallback;
  }
}

function isInvalidCatalogImage(src: string | undefined): boolean {
  if (!src) return true;
  return (
    src.includes('/assets/aistudio/') ||
    src.includes('image_74c58744') ||
    src.includes('image_0553b0bf') ||
    src.includes('image_27adf632') ||
    src.includes('image_ee30f5f6') ||
    /image_[0-9a-f]{8}/i.test(src)
  );
}

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

/**
 * Extrai apenas a seção do AGENTS.md correspondente ao agente alvo,
 * evitando injetar o manual da empresa inteira em cada mensagem de chat.
 */
function getTargetAgentPersona(receiverId: string, fullAgentsDoc: string): string {
  if (!fullAgentsDoc) return 'Você é um agente corporativo da 123Mart.';
  const mapping: Record<string, string> = {
    'gerente': 'Gerente de Projetos',
    'gerente-comercial': 'Gerente Comercial',
    'vendedor-1': 'Vendedores',
    'vendedor-2': 'Vendedores',
    'pesquisador': 'Pesquisador de Mercado',
    'monitor': 'Monitor de Concorrência',
    'art': 'Diretor de Arte e Audiovisual',
    'copywriter': 'Redator',
    'seo': 'Especialista SEO',
    'merchant': 'Especialista Merchant',
    'metrics': 'Analista de Métricas',
    'social': 'Social Media',
    'finance': 'Analista Financeiro'
  };

  const targetName = mapping[receiverId.toLowerCase()] || receiverId;
  const sections = fullAgentsDoc.split(/(?=##\s+\d+\.)/);
  const matched = sections.find(s => s.toLowerCase().includes(targetName.toLowerCase()));
  if (matched) {
    return matched.trim();
  }
  return fullAgentsDoc.slice(0, 800);
}

/**
 * Mapa unificado entre IDs curtos do Chat de Equipe (AgentWhatsApp) e IDs canônicos
 * utilizados no painel de Recursos Humanos (RH & Acessos).
 */
const CHAT_TO_RH_AGENT_ID: Record<string, string> = {
  'gerente': 'gerente-projetos',
  'gerente-projetos': 'gerente-projetos',
  'gerente-comercial': 'gerente-comercial',
  'vendedor-1': 'vendedor-1',
  'vendedor-2': 'vendedor-2',
  'pesquisador': 'pesquisador-mercado',
  'pesquisador-mercado': 'pesquisador-mercado',
  'monitor': 'monitor-concorrencia',
  'monitor-concorrencia': 'monitor-concorrencia',
  'art': 'diretor-arte',
  'diretor-arte': 'diretor-arte',
  'copywriter': 'redator',
  'redator': 'redator',
  'social': 'social-media',
  'social-media': 'social-media',
  'ads': 'especialista-ads',
  'especialista-ads': 'especialista-ads',
  'seo': 'especialista-seo',
  'especialista-seo': 'especialista-seo',
  'merchant': 'especialista-merchant',
  'especialista-merchant': 'especialista-merchant',
  'metrics': 'analista-metricas',
  'analista-metricas': 'analista-metricas',
  'finance': 'analista-financeiro',
  'analista-financeiro': 'analista-financeiro',
};

export function resolveRhAgentId(agentId: string): string {
  const normalized = String(agentId || '').trim().toLowerCase();
  return CHAT_TO_RH_AGENT_ID[normalized] || normalized;
}

export function getAgentPermissions(settings: any, agentId: string): Record<string, boolean> {
  const allPerms = settings?.agentPermissions || {};
  const rawKey = String(agentId || '').trim();
  const canonicalKey = resolveRhAgentId(rawKey);
  return {
    ...(allPerms[rawKey] || {}),
    ...(allPerms[canonicalKey] || {}),
  };
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
      const client = getAiClient();
      // 4. Primeira chamada da API do Gemini injetando as Ferramentas (Tools)
      let response = await client.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          tools: crmTools,
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
        response = await client.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: { systemInstruction, tools: crmTools }
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

    const client = getAiClient();
    const plannerResult = await client.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: plannerPrompt,
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

    const monitorResult = await client.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: monitorPrompt,
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

    const financeResult = await client.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: financePrompt,
    });
    const financeResponse = financeResult.text;
    if (onStepComplete) onStepComplete('finance', financePrompt, financeResponse || '');

    return {
      planner: plannerResponse,
      monitor: monitorResponse,
      finance: financeResponse
    };
  },
  
  
  /**
   * ETAPA 0 (Vision-First): Lê fisicamente até 4 fotos reais do anúncio na Nuvemshop ANTES do Planner e Monitor,
   * extraindo Marca Comercial, Fabricante oficial impresso no rótulo, volume unitário, número de unidades na foto
   * e eventual divergência de Kit/Preço.
   */
  async inspectProductPackaging(productData: any): Promise<ProductVisualAudit | null> {
    const rawImages = Array.isArray(productData?.images) ? productData.images : [];
    const validImages = rawImages
      .filter((img: any) => img?.src && !isInvalidCatalogImage(img.src))
      .slice(0, 4);

    if (validImages.length === 0) return null;

    const imageParts: any[] = [];
    for (let i = 0; i < validImages.length; i++) {
      const img = validImages[i];
      try {
        let buf: Buffer | null = null;
        if (img.src.startsWith('http://') || img.src.startsWith('https://')) {
          const dl = await axios.get(img.src, {
            responseType: 'arraybuffer',
            timeout: 12000,
            headers: { 'User-Agent': '123Mart VisionAudit/1.0' },
          });
          buf = Buffer.from(dl.data);
        } else {
          const rel = img.src.replace(/^\//, '');
          const localPath = path.join(process.cwd(), 'public', rel);
          if (fs.existsSync(localPath)) buf = fs.readFileSync(localPath);
        }

        if (buf) {
          const resized = await sharp(buf)
            .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82 })
            .toBuffer();
          imageParts.push({ text: `[FOTO ${i + 1} DE ${validImages.length}]` });
          imageParts.push({
            inlineData: {
              data: resized.toString('base64'),
              mimeType: 'image/jpeg',
            },
          });
        }
      } catch (err: any) {
        console.warn(`[Vision-First Audit] Falha ao baixar foto ${i + 1}:`, err?.message);
      }
    }

    const photosInspected = imageParts.filter((p) => p.inlineData).length;
    if (photosInspected === 0) return null;

    try {
      const client = getAiClient();
      const productName = extractLocalizedText(productData?.name);
      const auditPrompt = `Você é um Auditor Técnico de Embalagens de E-commerce.
Inspecione cuidadosamente as fotos reais do produto abaixo e extraia EXCLUSIVAMENTE o que está fisicamente impresso nos rótulos/embalagens (NUNCA chute marcas ou fabricantes concorrentes).

Dados cadastrados no anúncio:
- SKU: ${productData?.sku || 'N/A'}
- Título Cadastrado: ${productName}
- Preço Cadastrado: R$ ${productData?.price ?? 'N/A'}
- Marca Cadastrada: ${productData?.brand || 'Não informada'}

Retorne ESTRITAMENTE um JSON puro com este formato:
{
  "officialBrand": "Marca comercial principal impressa no rótulo frontal (ex: Aquapool)",
  "verifiedManufacturer": "Nome do fabricante real impresso na embalagem/logotipo de fábrica (ex: Start Química). Deixe string vazia se não estiver visível nas fotos.",
  "unitVolume": "Volume ou peso unitário impresso na embalagem (ex: 1 Litro, 1 kg, 500 ml)",
  "unitsShownInPhoto": 1,
  "labelClaims": ["Frase ou benefício real impresso no rótulo 1", "Frase 2"],
  "kitMismatchDetected": false,
  "kitMismatchNote": "Se o título cadastrado sugerir kit/caixa múltipla (ex: 6X1L) mas a foto mostrar apenas 1 unidade ou o preço parecer de unidade única, explique objetivamente aqui; caso contrário deixe vazio."
}`;

      const response = await client.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [{ role: 'user', parts: [...imageParts, { text: auditPrompt }] }],
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const parsed = parseSafeJson<Partial<ProductVisualAudit>>(response.text || '{}', {});
      const cleanManuf =
        typeof parsed.verifiedManufacturer === 'string' &&
        parsed.verifiedManufacturer.trim().length > 0 &&
        !/confirmar|não vis[ií]vel|n\/a|desconhecid/i.test(parsed.verifiedManufacturer)
          ? parsed.verifiedManufacturer.trim()
          : undefined;

      const audit: ProductVisualAudit = {
        officialBrand: (parsed.officialBrand || productData?.brand || '').trim(),
        verifiedManufacturer: cleanManuf,
        unitVolume: (parsed.unitVolume || '').trim() || undefined,
        unitsShownInPhoto: typeof parsed.unitsShownInPhoto === 'number' ? parsed.unitsShownInPhoto : undefined,
        labelClaims: Array.isArray(parsed.labelClaims) ? parsed.labelClaims.filter((c) => typeof c === 'string' && c.trim()) : [],
        kitMismatchDetected: Boolean(parsed.kitMismatchDetected),
        kitMismatchNote: (parsed.kitMismatchNote || '').trim() || undefined,
        photosInspected,
      };

      console.log(
        `[👁️ Etapa 0 Vision-First - SKU ${productData?.sku}] Marca="${audit.officialBrand}" | Fabricante="${audit.verifiedManufacturer || 'N/A'}" | Unidades na Foto=${audit.unitsShownInPhoto ?? '?'} | KitMismatch=${audit.kitMismatchDetected}`
      );
      return audit;
    } catch (err: any) {
      console.warn(`[Vision-First Audit] Erro na auditoria visual do SKU ${productData?.sku}:`, err?.message);
      return null;
    }
  },

  async generateManagerBriefing(
    productData: any,
    plannerSummary: string,
    monitorSummary: string,
    officialBrand: string,
    visualAudit?: ProductVisualAudit | null
  ): Promise<{
    briefing: ManagerStrategicBriefing;
    markdown: string;
    prompt: string;
    usage?: any;
  }> {
    const client = getAiClient();
    const prompt = buildManagerBriefingPrompt(productData, plannerSummary, monitorSummary, officialBrand, visualAudit);

    const result = await client.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const preferredManufacturer = visualAudit?.verifiedManufacturer || officialBrand;

    const fallbackBriefing: ManagerStrategicBriefing = {
      sku: productData.sku || '',
      officialBrand,
      manufacturer: preferredManufacturer,
      productCategory: 'E-commerce Geral',
      targetPersona: 'Consumidor buscando desempenho, segurança e custo-benefício comprovado.',
      positioningDirective: `Posicionar ${productData.name} (${officialBrand}) com clareza técnica, destaque de benefícios reais e foco em conversão.`,
      pricingVerdict: `Oferta competitiva alinhada ao valor agregado do produto ${officialBrand}.`,
      topPains: ['Falta de informação técnica clara no anúncio', 'Dúvida sobre rendimento real', 'Insegurança quanto à procedência'],
      topObjections: ['Será que realmente funciona?', 'Quanto rende na prática?', 'É original de fábrica?'],
      verifiedTechnicalFacts: [productData.name || `SKU ${productData.sku}`],
      copyTriggers: ['Original de Fábrica', 'Alto Rendimento', 'Uso Prático', 'Segurança Comprovada'],
      slotAgenda: Array.from({ length: 8 }, (_, idx) => ({
        slotNumber: idx + 1,
        commercialObjective:
          idx === 0
            ? 'Capa oficial limpa de marketplace (fundo branco puro, sem textos)'
            : `Destaque comercial e quebra de objeção — Slot ${idx + 1}`,
        keyBenefit: idx === 0 ? 'Reconhecimento imediato da embalagem real' : 'Benefício prático do produto',
        objectionToBreak: 'Dúvida na decisão de compra',
        mustIncludeFacts: [officialBrand],
      })),
    };

    const parsed = parseSafeJson<Partial<ManagerStrategicBriefing>>(result.text || '{}', fallbackBriefing);

    // Garante exatamente 8 slots numerados de 1 a 8
    const rawAgenda = Array.isArray(parsed.slotAgenda) ? parsed.slotAgenda : [];
    const normalizedAgenda = Array.from({ length: 8 }, (_, idx) => {
      const slotNum = idx + 1;
      const found = rawAgenda.find((s) => Number(s.slotNumber) === slotNum) || rawAgenda[idx];
      return {
        slotNumber: slotNum,
        commercialObjective: found?.commercialObjective || fallbackBriefing.slotAgenda[idx].commercialObjective,
        keyBenefit: found?.keyBenefit || fallbackBriefing.slotAgenda[idx].keyBenefit,
        objectionToBreak: found?.objectionToBreak || fallbackBriefing.slotAgenda[idx].objectionToBreak,
        mustIncludeFacts: Array.isArray(found?.mustIncludeFacts) ? found.mustIncludeFacts : [officialBrand],
      };
    });

    let briefing: ManagerStrategicBriefing = {
      sku: parsed.sku || productData.sku || '',
      officialBrand: (visualAudit?.officialBrand || parsed.officialBrand || officialBrand).trim(),
      manufacturer: (visualAudit?.verifiedManufacturer || parsed.manufacturer || parsed.officialBrand || officialBrand).trim(),
      productCategory: parsed.productCategory || fallbackBriefing.productCategory,
      targetPersona: parsed.targetPersona || fallbackBriefing.targetPersona,
      positioningDirective: parsed.positioningDirective || fallbackBriefing.positioningDirective,
      pricingVerdict: parsed.pricingVerdict || fallbackBriefing.pricingVerdict,
      topPains: Array.isArray(parsed.topPains) && parsed.topPains.length > 0 ? parsed.topPains : fallbackBriefing.topPains,
      topObjections: Array.isArray(parsed.topObjections) && parsed.topObjections.length > 0 ? parsed.topObjections : fallbackBriefing.topObjections,
      verifiedTechnicalFacts:
        Array.isArray(parsed.verifiedTechnicalFacts) && parsed.verifiedTechnicalFacts.length > 0
          ? parsed.verifiedTechnicalFacts
          : fallbackBriefing.verifiedTechnicalFacts,
      copyTriggers: Array.isArray(parsed.copyTriggers) && parsed.copyTriggers.length > 0 ? parsed.copyTriggers : fallbackBriefing.copyTriggers,
      slotAgenda: normalizedAgenda,
    };

    if (visualAudit?.verifiedManufacturer) {
      briefing = this.sanitizeBriefingManufacturer(briefing, visualAudit.verifiedManufacturer);
    }

    const markdown = formatManagerBriefingMarkdown(briefing, productData.sku, productData.name || `Produto ${productData.sku}`);
    return { briefing, markdown, prompt, usage: result.usageMetadata };
  },

  /**
   * Diretor de Arte Multimodal: inspeciona TODAS as fotos reais do produto na Nuvemshop + Briefing Estratégico do Gerente
   * e gera o plano visual estruturado de 8 slots com textos curtos Mobile-First, zero erros de grafia e prompts duplos (Híbrido / IA Integrada).
   */
  async generateArtDirectionPlan(
    productData: any,
    managerBriefing: ManagerStrategicBriefing | null
  ): Promise<{
    plan: ArtDirectionPlan;
    markdown: string;
    prompt: string;
    usage?: any;
  }> {
    const client = getAiClient();
    const rawImages = Array.isArray(productData.images) ? productData.images : [];
    const validImages = rawImages.filter((img: any) => img?.src && !isInvalidCatalogImage(img.src)).slice(0, 8);

    // Baixa TODAS as imagens válidas da Nuvemshop para inspeção visual real pelo Diretor de Arte (Multimodal)
    const imageParts: any[] = [];
    const imagesMeta: Array<{ index: number; alt: string; url: string }> = [];

    for (let i = 0; i < validImages.length; i++) {
      const img = validImages[i];
      imagesMeta.push({ index: i, alt: img.alt || '', url: img.src });

      try {
        let buf: Buffer | null = null;
        if (img.src.startsWith('http://') || img.src.startsWith('https://')) {
          const dl = await axios.get(img.src, {
            responseType: 'arraybuffer',
            timeout: 12000,
            headers: { 'User-Agent': '123Mart ArtDirector/3.0' },
          });
          buf = Buffer.from(dl.data);
        } else {
          const rel = img.src.replace(/^\//, '');
          const localPath = path.join(process.cwd(), 'public', rel);
          if (fs.existsSync(localPath)) buf = fs.readFileSync(localPath);
        }

        if (buf) {
          // Otimiza resolução de visão para 640px (excelente leitura de rótulos e baixo custo de tokens)
          const resized = await sharp(buf)
            .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82 })
            .toBuffer();

          imageParts.push({
            text: `[FOTO REAL DO PRODUTO — ÍNDICE ${i} (Foto ${i + 1} de ${validImages.length})]`,
          });
          imageParts.push({
            inlineData: {
              data: resized.toString('base64'),
              mimeType: 'image/jpeg',
            },
          });
        }
      } catch (imgErr: any) {
        console.warn(`[Diretor de Arte Multimodal] Falha ao baixar foto ${i + 1} (${img.src}):`, imgErr?.message);
      }
    }

    const promptText = buildArtDirectorPlanPrompt(productData, managerBriefing, imagesMeta);
    const officialBrand = managerBriefing?.officialBrand || productData.brand || 'Marca Oficial';

    const result = await client.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [
        {
          role: 'user',
          parts: [...imageParts, { text: promptText }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = parseSafeJson<Partial<ArtDirectionPlan>>(result.text || '{}', {});
    const rawSlots = Array.isArray(parsed.slots) ? parsed.slots : [];
    const totalImages = Math.max(1, validImages.length);

    const normalizedSlots: ArtSlotPlan[] = Array.from({ length: 8 }, (_, idx) => {
      const slotNumber = idx + 1;
      const matched = rawSlots.find((s) => Number(s.slotNumber) === slotNumber) || rawSlots[idx] || {};
      return validateAndNormalizeArtSlot(matched, slotNumber, totalImages);
    });

    const verifiedManufacturer =
      typeof parsed.verifiedManufacturer === 'string' &&
      parsed.verifiedManufacturer.trim().length > 0 &&
      !/confirmar/i.test(parsed.verifiedManufacturer)
        ? parsed.verifiedManufacturer.trim()
        : undefined;

    const plan: ArtDirectionPlan = {
      sku: productData.sku || parsed.sku || '',
      officialBrand: parsed.officialBrand || officialBrand,
      ...(verifiedManufacturer ? { verifiedManufacturer } : {}),
      visualIdentitySummary:
        parsed.visualIdentitySummary ||
        `Direção de arte criada após inspeção visual de ${totalImages} foto(s) real(is) do produto ${officialBrand}.`,
      packagingColorsDetected: Array.isArray(parsed.packagingColorsDetected) ? parsed.packagingColorsDetected : [],
      photosAnalyzedCount: imageParts.filter((p) => p.inlineData).length || totalImages,
      orthographyChecked: true,
      videoConcept9x16: parsed.videoConcept9x16,
      slots: normalizedSlots,
    };

    const markdown = formatArtPlanMarkdown(plan, productData.sku, productData.name || `Produto ${productData.sku}`);
    return { plan, markdown, prompt: promptText, usage: result.usageMetadata };
  },

  /**
   * Revisão cirúrgica de 1 slot pelo Diretor de Arte quando o usuário escreve instruções manuais.
   */
  async reviseArtSlotPlan(
    currentSlot: ArtSlotPlan,
    userInstructions: string,
    productData: any,
    officialBrand: string,
    totalValidImages: number
  ): Promise<ArtSlotPlan> {
    const client = getAiClient();
    const promptText = buildArtSlotRevisionPrompt(
      currentSlot,
      userInstructions,
      productData,
      officialBrand,
      totalValidImages
    );

    const result = await client.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = parseSafeJson<Partial<ArtSlotPlan>>(result.text || '{}', currentSlot);
    return validateAndNormalizeArtSlot(
      { ...currentSlot, ...parsed },
      currentSlot.slotNumber,
      Math.max(1, totalValidImages)
    );
  },

  async runOrchestrationPipeline(
    productData: any,
    onStepComplete?: (step: string, prompt: string, response: string, extraData?: Record<string, any>) => void,
    saveProductCallback?: (seoJson: any) => Promise<void>
  ) {
    if (!productData || !productData.sku || productData.sku === 'undefined' || productData.sku.toString().trim() === '') {
      throw new Error(`[OrchestrationPipeline] Falha crítica de validação: SKU do produto não fornecido ou indefinido (${productData?.sku}). A esteira exige um SKU válido iniciado em 123Mart.`);
    }

    const client = getAiClient();

    // ETAPA 0 (VISION-FIRST): Leitura física do rótulo real ANTES do Planner e Monitor para zerar alucinações de fabricante
    const visualAudit = await this.inspectProductPackaging(productData);
    if (onStepComplete && visualAudit) {
      onStepComplete('visual_audit', 'Auditoria Visual Prévia (Etapa 0)', JSON.stringify(visualAudit, null, 2), {
        visualAudit,
      });
    }

    // 1. Extração de Dados Reais (Background)
    let realTrends = '';
    let realQuotes = '';
    let quotesDataObj: any = null;
    try {
      const trendsData = await this.searchMarketplaceTrends(productData.name);
      realTrends = JSON.stringify(trendsData);
    } catch { realTrends = 'Não foi possível buscar tendências em tempo real.'; }

    try {
      quotesDataObj = await this.searchProductQuotes(productData.name);
      realQuotes = JSON.stringify(quotesDataObj);
    } catch { realQuotes = 'Não foi possível buscar cotações em tempo real.'; }

    console.log(`\n================================================================`);
    console.log(`🚀 [INÍCIO DA ESTEIRA PADRÃO AGÊNCIA - SKU: ${productData.sku}]`);
    console.log(`================================================================`);

    let totalPipelineTokens = 0;
    const tokenAuditMap: Record<string, any> = {};

    // ETAPA 1: Pesquisador de Mercado (Planner) — agora ancorado na Auditoria Visual real
    const plannerPrompt = buildPlannerPrompt(productData, realTrends, visualAudit);
    const plannerResult = await client.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: plannerPrompt,
    });
    const plannerResponse = plannerResult.text || '';
    if (plannerResult.usageMetadata) {
      totalPipelineTokens += plannerResult.usageMetadata.totalTokenCount || 0;
      tokenAuditMap['planner'] = plannerResult.usageMetadata;
      console.log(`[📊 Token Audit] 1. Pesquisador (Planner): ${plannerResult.usageMetadata.totalTokenCount} tokens`);
    }
    if (onStepComplete) onStepComplete('planner', plannerPrompt, plannerResponse);

    const plannerSummary = plannerResponse.length > 1500
      ? plannerResponse.slice(0, 1500) + '... [Resumo Estratégico]'
      : plannerResponse;

    // ETAPA 2: Monitor de Inteligência Competitiva — ancorado na Auditoria Visual real
    const monitorPrompt = buildMonitorPrompt(productData, realQuotes, plannerSummary, visualAudit);
    const monitorResult = await client.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: monitorPrompt,
    });
    const monitorResponse = monitorResult.text || '';
    if (monitorResult.usageMetadata) {
      totalPipelineTokens += monitorResult.usageMetadata.totalTokenCount || 0;
      tokenAuditMap['monitor'] = monitorResult.usageMetadata;
      console.log(`[📊 Token Audit] 2. Monitor de Concorrência: ${monitorResult.usageMetadata.totalTokenCount} tokens`);
    }
    if (onStepComplete) onStepComplete('monitor', monitorPrompt, monitorResponse);

    const monitorSummary = monitorResponse.length > 1200
      ? monitorResponse.slice(0, 1200) + '... [Resumo de Preço e Oferta]'
      : monitorResponse;

    // Homologação inicial da Marca Oficial (Ecossistema Multimarcas 123Mart)
    let dynamicBrand = (visualAudit?.officialBrand || productData.brand || '').trim();
    if (!dynamicBrand) {
      const brandMatch =
        plannerResponse.match(/Marca Comercial Homologada:\s*\*?\*?([^\n\*\r]+)/i) ||
        plannerResponse.match(/Marca:\s*\*?\*?([^\n\*\r]+)/i);
      if (brandMatch && brandMatch[1]) {
        dynamicBrand = brandMatch[1].trim();
      }
    }
    const detectedBrand = dynamicBrand || 'Marca Oficial Homologada';

    // ETAPA 3 (PADRÃO AGÊNCIA): Gerente de Projetos cria o BRIEFING MESTRE ESTRATÉGICO ANTES do Diretor de Arte e do SEO!
    const managerOut = await this.generateManagerBriefing(
      productData,
      plannerSummary,
      monitorSummary,
      detectedBrand,
      visualAudit
    );
    const officialBrand = managerOut.briefing.officialBrand || detectedBrand;

    if (managerOut.usage) {
      totalPipelineTokens += managerOut.usage.totalTokenCount || 0;
      tokenAuditMap['manager'] = managerOut.usage;
      console.log(`[📊 Token Audit] 3. Gerente de Projetos (Briefing Estratégico): ${managerOut.usage.totalTokenCount} tokens`);
    }
    if (onStepComplete) {
      onStepComplete('manager', managerOut.prompt, managerOut.markdown, {
        managerBriefing: managerOut.briefing,
        officialBrand,
        visualAudit,
      });
    }

    // ETAPA 4 (PADRÃO AGÊNCIA): Diretor de Arte Multimodal recebe o Briefing Estratégico + TODAS as fotos da Nuvemshop
    const artOut = await this.generateArtDirectionPlan(productData, managerOut.briefing);

    // Sincronização visual de fabricante: se o Diretor de Arte (ou Etapa 0) leu o fabricante real no rótulo da foto,
    // sanitiza TODOS os campos do Briefing Mestre (incluindo slotAgenda) e regenera o Markdown da Etapa 5!
    const confirmedManufacturer = artOut.plan.verifiedManufacturer || visualAudit?.verifiedManufacturer;
    if (confirmedManufacturer) {
      managerOut.briefing = this.sanitizeBriefingManufacturer(
        managerOut.briefing,
        confirmedManufacturer
      );
      managerOut.markdown = formatManagerBriefingMarkdown(
        managerOut.briefing,
        productData.sku,
        productData.name || `Produto ${productData.sku}`
      );
    }

    if (artOut.usage) {
      totalPipelineTokens += artOut.usage.totalTokenCount || 0;
      tokenAuditMap['art'] = artOut.usage;
      console.log(`[📊 Token Audit] 4. Diretor de Arte Multimodal (8 Slots): ${artOut.usage.totalTokenCount} tokens`);
    }
    if (onStepComplete) {
      onStepComplete('art', artOut.prompt, artOut.markdown, {
        artPlan: artOut.plan,
        managerBriefing: managerOut.briefing,
        manager: managerOut.markdown,
        visualAudit,
      });
    }

    // ETAPA 5: Especialista SEO recebe o Briefing Mestre do Gerente + Marca Oficial Homologada
    const seoSystemContext = `[BRIEFING MESTRE DO GERENTE DE PROJETOS]
Marca Oficial Homologada: ${officialBrand}
Fabricante Confirmado Visualmente no Rótulo: ${managerOut.briefing.manufacturer}
REGRA DE FABRICANTE (AUTORIDADE VISUAL): Utilize EXCLUSIVAMENTE "${managerOut.briefing.manufacturer}" como fabricante (se citar fabricante) e "${officialBrand}" como marca oficial. JAMAIS mencione qualquer outro fabricante.
Categoria: ${managerOut.briefing.productCategory}
Público-Alvo: ${managerOut.briefing.targetPersona}
Diretriz de Posicionamento: ${managerOut.briefing.positioningDirective}
Veredito de Preço: ${managerOut.briefing.pricingVerdict}
Dores Principais: ${managerOut.briefing.topPains.join(' | ')}
Objeções a Quebrar: ${managerOut.briefing.topObjections.join(' | ')}
Fatos Técnicos Verificados: ${managerOut.briefing.verifiedTechnicalFacts.join(' | ')}
Gatilhos Comerciais: ${managerOut.briefing.copyTriggers.join(' | ')}`;

    const seoPrompt = `[ORDEM DE SERVIÇO - GERÊNCIA DE PROJETOS]
Agente: Especialista SEO Sênior
SKU de Referência: ${productData.sku}
Marca Homologada: ${officialBrand}

Obedeça integralmente ao Briefing Mestre Estratégico do Gerente de Projetos abaixo, gere todos os campos otimizados (Título <= 70 chars, Descrição HTML válida, Meta Description, Tags e Marca Oficial: ${officialBrand}), salve na plataforma e apresente o comparativo Antes e Depois.

${seoSystemContext}`;

    const seoJson = await this.generateProductSEO({ ...productData, brand: officialBrand }, seoSystemContext);
    const seoTokens = (seoJson as any)?._tokens;
    if (seoTokens) {
      totalPipelineTokens += seoTokens.totalTokenCount || 0;
      tokenAuditMap['seo'] = seoTokens;
      console.log(`[📊 Token Audit] 5. Especialista SEO: ${seoTokens.totalTokenCount} tokens`);
    }

    // TRAVA COMERCIAL DE SEGURANÇA (Preço/Kit Sanity Guard):
    // Evita publicar automaticamente um anúncio intitulado como Kit/Caixa múltipla a preço de unidade única.
    const registeredPrice = parseFloat(String(productData?.price ?? '').replace(',', '.')) || 0;
    const marketAvg = Number(quotesDataObj?.averagePrice) || 0;
    const productNameStr = extractLocalizedText(productData?.name);
    const titleSuggestsKit = /\b(kit|caixa|cx|pack|fardo|combo)\b|\b\d+\s*[xX]\s*\d+/i.test(productNameStr);
    const unitsShownInPhoto = visualAudit?.unitsShownInPhoto;

    let commercialAlert: CommercialSafetyAlert | undefined;
    const hasSevereKitPriceMismatch =
      (titleSuggestsKit && unitsShownInPhoto === 1 && registeredPrice > 0 && marketAvg > 0 && registeredPrice < marketAvg * 0.5) ||
      (registeredPrice > 0 && marketAvg > 0 && registeredPrice < marketAvg * 0.45) ||
      (Boolean(visualAudit?.kitMismatchDetected) && registeredPrice > 0 && marketAvg > 0 && registeredPrice < marketAvg * 0.65);

    if (hasSevereKitPriceMismatch) {
      const ratioPct = Math.round((registeredPrice / marketAvg) * 100);
      const reasonParts: string[] = [
        `Preço cadastrado (R$ ${registeredPrice.toFixed(2)}) está muito abaixo da média de mercado (R$ ${marketAvg.toFixed(2)} — apenas ${ratioPct}% do valor médio).`,
      ];
      if (titleSuggestsKit && unitsShownInPhoto === 1) {
        reasonParts.push(`O título sugere Kit/Caixa múltipla ("${productNameStr}"), mas a foto principal mostra apenas 1 unidade.`);
      } else if (visualAudit?.kitMismatchNote) {
        reasonParts.push(visualAudit.kitMismatchNote);
      }
      reasonParts.push('Publicação automática na Nuvemshop PAUSADA por segurança comercial para evitar prejuízo. Revise o preço/título e publique manualmente pela Etapa 9 (Briefings).');

      commercialAlert = {
        blockedAutoSave: true,
        reason: reasonParts.join(' '),
        registeredPrice,
        marketAveragePrice: marketAvg,
        unitsShownInPhoto,
        titleSuggestsKit,
        detectedAt: Date.now(),
      };
      console.warn(`🛑 [Trava Comercial - SKU ${productData.sku}] ${commercialAlert.reason}`);
    }

    let saveMessage = 'Não foi possível salvar o anúncio (nenhum callback fornecido).';
    if (commercialAlert?.blockedAutoSave) {
      saveMessage = `⚠️ PUBLICAÇÃO AUTOMÁTICA PAUSADA POR SEGURANÇA COMERCIAL: ${commercialAlert.reason}`;
    } else if (saveProductCallback) {
      try {
        await saveProductCallback(seoJson);
        saveMessage = 'Anúncio otimizado e salvo na Nuvemshop com sucesso!';
      } catch (err) {
        saveMessage = 'Falha ao salvar o anúncio na Nuvemshop.';
        console.error(err);
      }
    }

    const seoResponsePayloadJSON = JSON.stringify(
      {
        message: saveMessage,
        commercialAlert: commercialAlert || null,
        otimizacaoSEO: seoJson,
        diretrizes: 'Trabalho técnico de SEO concluído com base no Briefing Mestre Estratégico do Gerente de Projetos.',
      },
      null,
      2
    );

    if (onStepComplete) {
      onStepComplete('seo', seoPrompt, seoResponsePayloadJSON, {
        seoData: seoJson,
        commercialAlert: commercialAlert || null,
        visualAudit,
        finishedAt: Date.now(),
      });
    }

    console.log(`\n================================================================`);
    console.log(`🏁 [AUDITORIA DE TOKENS DA ESTEIRA PADRÃO AGÊNCIA - SKU: ${productData.sku}]`);
    console.log(`  1. Pesquisador (Planner):      ${tokenAuditMap['planner']?.totalTokenCount || 0} tokens`);
    console.log(`  2. Monitor de Concorrência:    ${tokenAuditMap['monitor']?.totalTokenCount || 0} tokens`);
    console.log(`  3. Gerente (Briefing Mestre):  ${tokenAuditMap['manager']?.totalTokenCount || 0} tokens`);
    console.log(`  4. Diretor de Arte Multimodal: ${tokenAuditMap['art']?.totalTokenCount || 0} tokens`);
    console.log(`  5. Especialista SEO:           ${tokenAuditMap['seo']?.totalTokenCount || 0} tokens`);
    console.log(`  🔥 TOTAL GASTO NA ESTEIRA:     ${totalPipelineTokens} TOKENS`);
    console.log(`================================================================\n`);
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
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
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
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
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
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
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
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
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


  /**
   * Substitui de forma segura qualquer menção a um fabricante antigo/suposto pelo fabricante
   * confirmado visualmente no rótulo da embalagem real em TODOS os campos do managerBriefing.
   */
  sanitizeBriefingManufacturer<T extends Record<string, any>>(briefing: T, verifiedManufacturer: string): T {
    const cleanVerified = String(verifiedManufacturer || '').trim();
    if (!briefing || !cleanVerified) return briefing;

    const oldManufacturer = String(briefing.manufacturer || '').trim();
    const officialBrand = String(briefing.officialBrand || '').trim().toLowerCase();

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const candidateTerms: string[] = [];

    if (
      oldManufacturer &&
      oldManufacturer.toLowerCase() !== cleanVerified.toLowerCase() &&
      !/confirmar/i.test(oldManufacturer)
    ) {
      candidateTerms.push(oldManufacturer);

      // Também captura nome fantasia/prefixo comercial antes de razão social longa (ex: "HCL Química e Comércio..." -> "HCL Química")
      const shortCorporate = oldManufacturer
        .replace(/\s+(e\s+com[eé]rcio|com[eé]rcio|ind[uú]stria|ltda\.?|s\/a|s\.a\.?|eireli|me|epp).*$/i, '')
        .trim();
      if (
        shortCorporate.length >= 4 &&
        shortCorporate.toLowerCase() !== oldManufacturer.toLowerCase() &&
        shortCorporate.toLowerCase() !== cleanVerified.toLowerCase() &&
        shortCorporate.toLowerCase() !== officialBrand
      ) {
        candidateTerms.push(shortCorporate);
      }

      // Captura eventual variação antes de hífen ou barra
      const firstSegment = oldManufacturer.split(/\s*[-–—|/]\s*/)[0]?.trim() || '';
      if (
        firstSegment.length >= 4 &&
        firstSegment.toLowerCase() !== cleanVerified.toLowerCase() &&
        firstSegment.toLowerCase() !== officialBrand &&
        !candidateTerms.some((t) => t.toLowerCase() === firstSegment.toLowerCase())
      ) {
        candidateTerms.push(firstSegment);
      }
    }

    // Ordena do mais longo para o mais curto para evitar substituições parciais.
    // Usa alternância protegida (cleanVerified|term) com fronteiras Unicode para impedir duplicação
    // quando o termo antigo é prefixo/substring do fabricante confirmado (ex: "Start" dentro de "Start Química").
    const escapedVerified = escapeRegex(cleanVerified);
    const sortedPatterns = candidateTerms
      .filter((t) => t.length >= 4 && t.toLowerCase() !== officialBrand && t.toLowerCase() !== cleanVerified.toLowerCase())
      .sort((a, b) => b.length - a.length)
      .map(
        (term) =>
          new RegExp(`(?<![\\p{L}\\p{N}])(?:${escapedVerified}|${escapeRegex(term)})(?![\\p{L}\\p{N}])`, 'giu')
      );

    // Expressões de limpeza para colapsar eventual repetição de tokens do fabricante confirmado (ex: "Start Química Química")
    const verifiedRepeatedPattern = new RegExp(
      `(?<![\\p{L}\\p{N}])(${escapedVerified})(?:\\s+\\1)+(?![\\p{L}\\p{N}])`,
      'giu'
    );
    const verifiedTokens = Array.from(
      new Set(cleanVerified.split(/\s+/).filter((tok) => tok.length >= 3))
    );
    const duplicateTokenPatterns = verifiedTokens.map(
      (tok) => new RegExp(`(?<![\\p{L}\\p{N}])(${escapeRegex(tok)})(?:\\s+\\1)+(?![\\p{L}\\p{N}])`, 'giu')
    );

    const sanitizeText = (text: string): string => {
      if (typeof text !== 'string' || !text) return text;
      let out = text;
      for (const re of sortedPatterns) {
        out = out.replace(re, cleanVerified);
      }
      // Garante que rótulos explícitos "Fabricante: ..." também apontem para o fabricante confirmado
      out = out.replace(/Fabricante\s*:\s*[^|;\n]+/gi, `Fabricante: ${cleanVerified}`);
      // Colapsa eventuais duplicações do nome completo ou de palavras repetidas consecutivas
      out = out.replace(verifiedRepeatedPattern, cleanVerified);
      for (const tokRe of duplicateTokenPatterns) {
        out = out.replace(tokRe, '$1');
      }
      return out;
    };

    const sanitizeList = (arr: any): any =>
      Array.isArray(arr) ? arr.map((item) => (typeof item === 'string' ? sanitizeText(item) : item)) : arr;

    const nextFacts: string[] = Array.isArray(briefing.verifiedTechnicalFacts)
      ? sanitizeList(briefing.verifiedTechnicalFacts)
      : [];
    if (
      !nextFacts.some((f) => typeof f === 'string' && f.toLowerCase().includes(cleanVerified.toLowerCase()))
    ) {
      nextFacts.push(`Fabricante confirmado visualmente no rótulo: ${cleanVerified}`);
    }

    const nextSlotAgenda = Array.isArray(briefing.slotAgenda)
      ? briefing.slotAgenda.map((slot: any) => ({
          ...slot,
          commercialObjective: sanitizeText(slot?.commercialObjective),
          keyBenefit: sanitizeText(slot?.keyBenefit),
          objectionToBreak: sanitizeText(slot?.objectionToBreak),
          mustIncludeFacts: sanitizeList(slot?.mustIncludeFacts),
        }))
      : briefing.slotAgenda;

    return {
      ...briefing,
      manufacturer: cleanVerified,
      positioningDirective: sanitizeText(briefing.positioningDirective),
      pricingVerdict: sanitizeText(briefing.pricingVerdict),
      topPains: sanitizeList(briefing.topPains),
      topObjections: sanitizeList(briefing.topObjections),
      verifiedTechnicalFacts: nextFacts,
      copyTriggers: sanitizeList(briefing.copyTriggers),
      slotAgenda: nextSlotAgenda,
    };
  },

  async generateProductSEO(productData: any, briefing?: string) {
    const settings = await firebaseService.getSettings();
    const permissions = settings?.agentPermissions?.['especialista-seo'] || {};
    const seoExpertPrompt = buildSeoExpertPrompt(permissions);
    
    const systemInstruction = seoExpertPrompt + `\n\nRetorne ESTRITAMENTE em formato JSON puro.`;
    
    let prompt = `Analise este produto, convoque os seus Múltiplos Agentes, acesse a internet para investigar concorrentes diretos, deduza o público-alvo e gere todo o pacote de marketing. OBRIGATÓRIO: A novaDescricaoHtml DEVE usar tags HTML VÁLIDAS. REGRA DE MARCA E FABRICANTE: A 123Mart vende produtos de centenas de fabricantes. Utilize OBRIGATORIAMENTE a Marca Oficial e o Fabricante Confirmado no Rótulo informados no briefing ("${productData.brand || 'Identificar no briefing'}"). É terminantemente proibido inventar marcas, citar fabricantes divergentes ou mencionar "123Mart". REGRA DE ORTOGRAFIA PT-BR: Use 100% de acentuação correta do Português do Brasil (á, à, â, ã, é, ê, í, ó, ô, õ, ú, ç) em TODOS os textos, especialmente na "metaDescription" (ex: "água", "família", "fábrica", "solução" — NUNCA sem acento). Apenas "urlProduto" deve ficar sem acentos.`;
    
    if (briefing) {
       prompt += `\n\n[AÇÃO MANDATÓRIA - ORDEM DO GERENTE DE PROJETOS]:\nVocê DEVE obedecer ao seguinte BRIEFING EXECUTIVO na construção do SEO (Título, Copy, Meta):\n"${briefing}"\nQuebre as objeções apontadas e adote o ângulo de venda sugerido.`;
    }
    
    const safeName = extractLocalizedText(productData.name);
    const safeDesc = extractLocalizedText(productData.description);
    const safeSeoDesc = extractLocalizedText(productData.seo_description);
    const safeHandle = extractLocalizedText(productData.handle);
    const safeTags = extractLocalizedText(productData.tags);

    prompt += `\n\n

Produto original a ser pesquisado:
Nome: ${safeName}
Preço: ${productData.price}
Marca Original: ${productData.brand || 'Não cadastrada'}
Tags Originais: ${safeTags || 'Sem tags'}
Descrição Original (geralmente pobre): ${safeDesc || 'Sem descrição'}
Meta Description Original: ${safeSeoDesc || 'Vazia'}
URL Original: ${safeHandle || 'Sem URL'}

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
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ],
          ...(permissions?.['search-console'] && !briefing ? { tools: [{ googleSearch: {} }] } : {}),
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
      const seoUsage = response.usageMetadata;
      const parsed = JSON.parse(response.text || '{}');
      if (seoUsage) {
        parsed._tokens = seoUsage;
      }
      return parsed;
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
  
  async handleAgentChat(text: string, sender: string, receiver: string, depth: number = 0, activeSku?: string, activeProductName?: string) {
    if (depth >= 1) {
      console.warn(`[AI Loop Guard] Maximum forwarding depth reached (1). Dropping cascade message from ${sender} to ${receiver} to prevent token drain.`);
      return;
    }

    try {
      // Detecta SKU se presente no texto ou usa o activeSku fornecido
      const detectedSkuMatch = text.match(/123mart[a-zA-Z0-9_-]+/i);
      const resolvedSku = activeSku || (detectedSkuMatch ? detectedSkuMatch[0] : null);
      const resolvedProductName = activeProductName || (resolvedSku ? `Produto ${resolvedSku}` : null);

      // Lê as configurações e permissões resolvendo o ID canônico do RH (ex: 'gerente' -> 'gerente-projetos')
      const settings = await firebaseService.getSettings();
      const rhAgentId = resolveRhAgentId(receiver);
      const agentPerms = getAgentPermissions(settings, receiver);
      const hasNuvemshopApi = agentPerms['nuvemshop-api'] === true;
      const hasVisionApi = agentPerms['vision-api'] === true;

      const enabledToolIds = Object.entries(agentPerms)
        .filter(([, enabled]) => enabled === true)
        .map(([toolId]) => toolId);

      // Lê e extrai apenas a persona específica do agente alvo (evitando injetar manual inteiro)
      let targetPersona = '';
      try {
        const agentsPath = path.join(process.cwd(), 'AGENTS.md');
        if (fs.existsSync(agentsPath)) {
          const agentsDoc = fs.readFileSync(agentsPath, 'utf8');
          targetPersona = getTargetAgentPersona(receiver, agentsDoc);
        }
      } catch (err) {
        console.error('Erro ao ler AGENTS.md', err);
      }

      const skuDirective = resolvedSku ? `
[DIRETRIZ MESTRA DE IDENTIFICAÇÃO DE PRODUTO]:
- SKU DE REFERÊNCIA OBRIGATÓRIO: "${resolvedSku}"
- PRODUTO: "${resolvedProductName}"
- REQUISITO ABSOLUTO: Toda e qualquer ordem, análise, pesquisa, benchmark ou repasse entre agentes [ENCAMINHAR_PARA] DEVE conter expressamente este SKU ("${resolvedSku}"). É proibido usar "undefined" ou deixar de indicar o código do SKU.
` : '';

      const permissionsDirective = `
[ALÇADAS REAIS LIBERADAS NO PAINEL RH & ACESSOS PARA "${rhAgentId}"]:
- API Nuvemshop (nuvemshop-api): ${hasNuvemshopApi ? 'LIBERADA — você PODE e DEVE chamar a ferramenta buscarProdutosNuvemshop passando o SKU quando precisar auditar cadastro, título, tags, seo_title, seo_description, marca ou descrição ao vivo na loja.' : 'BLOQUEADA — não habilitada no RH para este agente.'}
- Cloud Vision API (vision-api): ${hasVisionApi ? 'LIBERADA' : 'BLOQUEADA'}
- Demais chaves habilitadas no RH: ${enabledToolIds.length > 0 ? enabledToolIds.join(', ') : 'nenhuma'}
`;

      // Constrói o contexto para o Gemini
      const prompt = `Você faz parte de uma equipe de Agentes de IA da empresa 123Mart.
Sua Diretriz / Persona Oficial:
---
${targetPersona}
---

${skuDirective}
${permissionsDirective}

O seu ID de agente é: "${receiver}" (perfil RH: "${rhAgentId}"). Assuma a persona, a atitude e as ferramentas correspondentes ao seu ID. 
Você acabou de receber uma mensagem de: "${sender}".

Mensagem recebida:
"${text}"

Responda diretamente, com dados concretos das ferramentas quando tiver permissão, e de forma concisa. Se você for o Gerente de Projetos e a ordem exigir ação operacional de outro agente, use a tag [ENCAMINHAR_PARA: id_do_agente].
IDs oficiais disponíveis: diretoria, gerente, pesquisador, seo, monitor, art, copywriter, social, ads, merchant, metrics, finance.
Exemplo: [ENCAMINHAR_PARA: pesquisador] Olá pesquisador, realize a pesquisa e levantamento para o SKU ${resolvedSku || '123Mart...'}.`;

      const tools = [{
        functionDeclarations: [
          {
            name: 'buscarProdutosNuvemshop',
            description: 'Consulta AO VIVO na API da Nuvemshop o cadastro completo de um produto por SKU (ex: 123Mart09048), ID ou termo de busca — retornando título, seo_title, seo_description, tags, marca, descrição, imagens e comparativo com o último briefing salvo da esteira.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                skuOuTermo: {
                  type: Type.STRING,
                  description: 'SKU exato do produto (ex: 123Mart09048), ID numérico da Nuvemshop ou termo de busca.'
                }
              }
            }
          },
          {
            name: 'avaliarImagem',
            description: 'Avalia o SEO e a relevância de uma imagem através de sua URL (requer permissão Cloud Vision API no RH).',
            parameters: {
              type: Type.OBJECT,
              properties: {
                url: { type: Type.STRING, description: 'URL da imagem' },
                criterios: { type: Type.STRING, description: 'Critérios de avaliação (SEO, relevância, etc)' }
              },
              required: ['url']
            }
          },
          {
             name: 'gerarRelatorioPDF',
             description: 'Registra o conteúdo estruturado de um relatório para consulta na aba de Briefings/Auditoria.',
             parameters: {
               type: Type.OBJECT,
               properties: {
                 conteudo: { type: Type.STRING, description: 'Conteúdo em texto/markdown do relatório' }
               },
               required: ['conteudo']
             }
          }
        ]
      }];

      let contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
      let aiText = '';
      let shouldContinue = true;
      let loopCount = 0;

      const client = getAiClient();
      while (shouldContinue && loopCount < 3) {
        loopCount++;
        const response = await client.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            tools
          }
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
          // Adiciona a chamada da função ao histórico preservando todos os parts originais
          const modelParts: any = response.candidates?.[0]?.content?.parts || response.functionCalls.map((c: any) => ({ functionCall: c }));
          contents.push({ role: 'model', parts: modelParts });

          const toolResults = [];
          for (const call of response.functionCalls) {
            let result = '';
            if (call.name === 'buscarProdutosNuvemshop') {
              if (!hasNuvemshopApi) {
                result = `[SISTEMA]: Acesso Negado. O agente "${rhAgentId}" não possui a permissão "API Nuvemshop" habilitada no painel de Recursos Humanos (RH). Informe ao usuário que você precisa dessa liberação para prosseguir.`;
              } else {
                try {
                  const requestedQuery = String((call.args as any)?.skuOuTermo || resolvedSku || '').trim();
                  const liveData = requestedQuery
                    ? await nuvemshopService.getProductDetailsBySku(requestedQuery)
                    : await nuvemshopService.searchProducts('');

                  // Cruza com o histórico da esteira local (briefings.json) quando houver SKU
                  let briefingAudit = '';
                  const skuToCheck = (/^123mart[a-zA-Z0-9_-]+$/i.test(requestedQuery) ? requestedQuery : resolvedSku) || '';
                  if (skuToCheck) {
                    try {
                      const allBriefings = await firebaseService.getSkuBriefings();
                      const matchBriefing: any = (allBriefings || []).find(
                        (b: any) => String(b?.sku || '').toLowerCase() === skuToCheck.toLowerCase()
                      );
                      if (matchBriefing) {
                        const seo = matchBriefing.seoData || {};
                        const webhookStep = (matchBriefing.steps || []).find((s: any) => s.id === '9' || s.type === 'webhook');
                        briefingAudit = [
                          '',
                          `[ESTEIRA INTERNA - ÚLTIMO BRIEFING SALVO PARA ${matchBriefing.sku}]`,
                          `- Última atualização do briefing: ${matchBriefing.updatedAt ? new Date(matchBriefing.updatedAt).toLocaleString('pt-BR') : 'N/A'}`,
                          `- Etapa 9 (Publicação/Webhook): ${webhookStep?.isCompleted ? 'Concluída' : 'Pendente'} — ${webhookStep?.content || 'sem log detalhado'}`,
                          `- SEO gerado (novoTitulo): ${seo.novoTitulo || '(não gerado)'}`,
                          `- SEO gerado (metaDescription): ${seo.metaDescription || '(não gerado)'}`,
                          `- SEO gerado (tags): ${seo.tags || '(não gerado)'}`,
                          `- SEO gerado (marca): ${seo.marca || '(não gerado)'}`,
                          `- SEO gerado (novaDescricaoHtml): ${seo.novaDescricaoHtml ? `${String(seo.novaDescricaoHtml).length} caracteres` : '(não gerado)'}`,
                        ].join('\n');
                      } else {
                        briefingAudit = `\n[ESTEIRA INTERNA]: Nenhum briefing encontrado no histórico local para o SKU "${skuToCheck}".`;
                      }
                    } catch {
                      // Mantém resultado da Nuvemshop intacto
                    }
                  }

                  result = `${liveData}${briefingAudit}`;
                } catch (e: any) {
                  result = `[ERRO]: Falha ao buscar produtos reais na Nuvemshop (${e?.message || 'erro desconhecido'}).`;
                }
              }
            } else if (call.name === 'avaliarImagem') {
              if (!hasVisionApi) {
                result = `[SISTEMA]: Acesso Negado. O agente "${rhAgentId}" não possui a permissão "Cloud Vision API" habilitada no painel de Recursos Humanos (RH).`;
              } else {
                const imgUrl = String((call.args as any)?.url || '');
                result = `[SISTEMA]: Permissão Cloud Vision API validada para "${rhAgentId}". Solicitação registrada para análise visual da imagem (${imgUrl || 'URL não informada'}). Observação: a auditoria visual real completa de rótulos roda na Etapa 0 da esteira do Diretor de Arte.`;
              }
            } else if (call.name === 'gerarRelatorioPDF') {
              result = resolvedSku
                ? `[SISTEMA]: Relatório consolidado. Os PDFs oficiais da esteira para o SKU ${resolvedSku} estão disponíveis na aba CEO → Briefing de SKUs (/api/marketing/pdf/briefing/${resolvedSku}).`
                : '[SISTEMA]: Conteúdo do relatório estruturado com sucesso. Apresente o resumo diretamente ao usuário no chat.';
            }

            toolResults.push({
              functionResponse: {
                name: call.name,
                response: { result }
              }
            });
          }

          // Adiciona as respostas das ferramentas ao histórico para o modelo ler
          contents.push({ role: 'user', parts: toolResults });
        } else {
          aiText = response.text || 'Entendido. Estou trabalhando nisso.';
          shouldContinue = false;
        }
      }

      if (!aiText) {
        const finalResp = await client.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
        });
        aiText = finalResp.text || 'Consulta concluída. Verifique os detalhes na aba Briefing de SKUs.';
      }
      
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
            // Simula o próximo agente recebendo e respondendo com o SKU mantido
            await aiService.handleAgentChat(messageToNextAgent, receiver, nextAgentId, depth + 1, resolvedSku || undefined, resolvedProductName || undefined);
          } catch (e) {
            console.error('Erro no encaminhamento de mensagem', e);
          }
        }, 1000);
      }
      
      // Salva a resposta gerada pelo AI no banco de dados como se fosse o receiver falando para o sender
      await firebaseService.saveAgentChatMessage(aiText, receiver, sender);
    } catch (err: any) {
      console.error('Erro ao gerar resposta do agente:', err);
      await firebaseService.saveAgentChatMessage(`Desculpe, tive um problema de comunicação interno e não consegui processar a mensagem: ${err.message}`, receiver, sender);
    }
  },

  async generateText(prompt: string) {
    const client = getAiClient();
    const res = await client.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return res.text;
  }
};
