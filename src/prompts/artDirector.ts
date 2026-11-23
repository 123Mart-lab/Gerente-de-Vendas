import type { ManagerStrategicBriefing } from './manager.js';

export type ArtRenderMode = 'hybrid' | 'ai_integrated';
export type TextPlacement = 'top' | 'bottom' | 'left' | 'right' | 'none';
export type PanelTheme = 'light' | 'dark';
export type CardStyle = 'checks' | 'steps';

export interface ArtInfoCard {
  title: string;
  description: string;
}

export interface ArtSlotPlan {
  slotNumber: number;
  title: string;
  commercialGoal: string;
  sourceImageIndex: number; // 0-based index into valid Nuvemshop images
  sourceImageReason: string;
  emotion: string;
  scenarioDescription: string;
  lightingAndPalette: string;
  accentHex: string;
  panelTheme: PanelTheme;
  textPosition: TextPlacement;
  badge: string;
  headline: string;
  subtitle: string;
  cardStyle: CardStyle;
  cards: ArtInfoCard[];
  bullets: string[];
  callout: string;
  insight: string;
  hybridScenePrompt: string;
  integratedImagePrompt: string;
}

export interface ArtDirectionPlan {
  sku: string;
  officialBrand: string;
  verifiedManufacturer?: string;
  visualIdentitySummary: string;
  packagingColorsDetected: string[];
  photosAnalyzedCount: number;
  orthographyChecked: boolean;
  slots: ArtSlotPlan[];
  videoConcept9x16?: string;
}

export const ART_COPY_LIMITS = {
  badgeMax: 24,
  headlineMax: 42,
  subtitleMax: 84,
  cardTitleMax: 32,
  cardDescMax: 64,
  maxCards: 3,
  bulletMax: 64,
  maxBullets: 3,
  calloutMax: 26,
} as const;

const FORBIDDEN_STORE_TERMS = [
  /123\s*mart\s*oficial/gi,
  /123\s*mart/gi,
  /www\.123mart\.com(\.br)?/gi,
];

function stripForbiddenStoreTerms(text: string): string {
  let clean = (text || '').trim();
  for (const rx of FORBIDDEN_STORE_TERMS) {
    clean = clean.replace(rx, '');
  }
  clean = clean
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/^[\s\-–—|•:]+|[\s\-–—|•:]+$/g, '')
    .trim();
  return clean;
}

function normalizeHex(hex: string | undefined, fallback: string): string {
  const val = (hex || '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) return val;
  return fallback;
}

function normalizePlacement(pos: string | undefined, slotNumber: number): TextPlacement {
  if (slotNumber === 1) return 'none';
  const valid: TextPlacement[] = ['top', 'bottom', 'left', 'right'];
  if (pos && valid.includes(pos as TextPlacement)) return pos as TextPlacement;
  // Variação natural por slot para evitar layout engessado repetitivo
  const defaults: TextPlacement[] = ['top', 'bottom', 'left', 'right', 'top', 'bottom', 'left'];
  return defaults[(slotNumber - 2) % defaults.length] || 'top';
}

/**
 * Sanitiza e valida um slot gerado pela IA sem truncar palavras ao meio.
 * Garante conformidade com as regras de Marketplace, Slot 1 puro e remoção de termos proibidos.
 */
export function validateAndNormalizeArtSlot(
  raw: Partial<ArtSlotPlan>,
  slotNumber: number,
  totalValidImages: number
): ArtSlotPlan {
  const safeMaxIdx = Math.max(0, totalValidImages - 1);
  const rawIdx = typeof raw.sourceImageIndex === 'number' && !Number.isNaN(raw.sourceImageIndex)
    ? Math.floor(raw.sourceImageIndex)
    : Math.min(slotNumber - 1, safeMaxIdx);
  const sourceImageIndex = Math.max(0, Math.min(rawIdx, safeMaxIdx));

  const isCover = slotNumber === 1;
  const textPosition = normalizePlacement(raw.textPosition, slotNumber);

  const badge = isCover ? '' : stripForbiddenStoreTerms(raw.badge || '');
  const headline = isCover ? '' : stripForbiddenStoreTerms(raw.headline || '');
  const subtitle = isCover ? '' : stripForbiddenStoreTerms(raw.subtitle || '');
  const cardStyle: CardStyle = raw.cardStyle === 'steps' ? 'steps' : 'checks';

  const rawCards: ArtInfoCard[] = isCover
    ? []
    : (Array.isArray(raw.cards) ? raw.cards : [])
        .map((c: any) => ({
          title: stripForbiddenStoreTerms(String(c?.title || '')),
          description: stripForbiddenStoreTerms(String(c?.description || '')),
        }))
        .filter((c) => c.title || c.description)
        .slice(0, ART_COPY_LIMITS.maxCards);

  const rawBullets = isCover
    ? []
    : (Array.isArray(raw.bullets) ? raw.bullets : [])
        .map((b) => stripForbiddenStoreTerms(String(b || '')))
        .filter(Boolean)
        .slice(0, ART_COPY_LIMITS.maxBullets);

  // Retrocompatibilidade: se vieram apenas bullets antigos, converte em cards estruturados automaticamente
  const cards: ArtInfoCard[] =
    isCover
      ? []
      : rawCards.length > 0
        ? rawCards
        : rawBullets.map((b) => {
            const sepIdx = b.indexOf(':');
            if (sepIdx > 2 && sepIdx < 34) {
              return {
                title: b.slice(0, sepIdx).trim(),
                description: b.slice(sepIdx + 1).trim(),
              };
            }
            return { title: b, description: '' };
          });

  const bullets: string[] =
    isCover
      ? []
      : rawBullets.length > 0
        ? rawBullets
        : cards.map((c) => (c.description ? `${c.title}: ${c.description}` : c.title));

  const callout = isCover ? '' : stripForbiddenStoreTerms(raw.callout || '');

  const defaultAccentBySlot = [
    '#0F172A',
    '#0284C7',
    '#F97316',
    '#10B981',
    '#0891B2',
    '#E11D48',
    '#4F46E5',
    '#0F766E',
  ];

  const hybridBase = stripForbiddenStoreTerms(raw.hybridScenePrompt || '');
  const integratedBase = stripForbiddenStoreTerms(raw.integratedImagePrompt || '');

  const safeZoneByPosition: Record<TextPlacement, string> = {
    bottom:
      'FRAMING SAFE ZONE (CRITICAL): Position the ENTIRE product packaging completely inside the UPPER 56% of the frame (from near top edge down to 56% height), scaled so 100% of the packaging sits cleanly above the lower third. Leave the ENTIRE BOTTOM 40% of the frame as clean, uncluttered negative space so the bottom typography block NEVER overlaps or covers any part of the product.',
    top:
      'FRAMING SAFE ZONE (CRITICAL): Position the ENTIRE product packaging completely inside the LOWER 58% of the frame (starting cleanly below the top 36% header area), leaving the ENTIRE TOP 36% of the frame as clean, uncluttered negative space so the top editorial header NEVER covers any part of the product.',
    left:
      'FRAMING SAFE ZONE (CRITICAL): Position the ENTIRE product packaging completely inside the RIGHT 46% of the frame, leaving the ENTIRE LEFT 52% of the frame as clean, uncluttered negative space so the left editorial stack NEVER overlaps or covers any part of the product.',
    right:
      'FRAMING SAFE ZONE (CRITICAL): Position the ENTIRE product packaging completely inside the LEFT 46% of the frame, leaving the ENTIRE RIGHT 52% of the frame as clean, uncluttered negative space so the right editorial stack NEVER overlaps or covers any part of the product.',
    none: '',
  };

  const hybridSafetyFooter = isCover
    ? ' Pure solid #FFFFFF white studio background, centered real product with soft realistic floor contact shadow. CRITICAL PACKAGING INTEGRITY: keep 100% of ALL original printed text, brand logos, colored seals/badges, weight numbers, and graphics ON THE PRODUCT PACKAGING completely sharp, intact, and untouched — NEVER erase or blank out any printed text or seal on the packaging itself. Only the surrounding pure #FFFFFF background outside the packaging must contain zero added promotional text, zero watermarks, and zero extra objects.'
    : ` Strict Compositing: preserve 100% of the exact original product packaging, printed labels, seals, brand logos, colors and shape from the reference photo (NEVER erase printed text on the packaging itself). ${safeZoneByPosition[textPosition]} CRITICAL BACKGROUND RULE: DO NOT add any promotional text, letters, numbers, badges, icons, watermarks or store names anywhere in the surrounding scene/background.`;

  return {
    slotNumber,
    title: stripForbiddenStoreTerms(raw.title || (isCover ? 'Capa Oficial Marketplace (#FFFFFF)' : `Slot ${slotNumber}`)),
    commercialGoal: stripForbiddenStoreTerms(raw.commercialGoal || ''),
    sourceImageIndex,
    sourceImageReason: stripForbiddenStoreTerms(
      raw.sourceImageReason || `Foto ${sourceImageIndex + 1} da galeria selecionada para melhor fidelidade neste ângulo.`
    ),
    emotion: stripForbiddenStoreTerms(raw.emotion || (isCover ? 'Confiança e clareza comercial' : 'Alto impacto visual')),
    scenarioDescription: stripForbiddenStoreTerms(
      raw.scenarioDescription ||
        (isCover ? 'Estúdio fotográfico comercial com fundo 100% branco puro (#FFFFFF)' : 'Ambiente fotográfico real contextualizado ao nicho do produto')
    ),
    lightingAndPalette: stripForbiddenStoreTerms(
      raw.lightingAndPalette || (isCover ? 'Iluminação comercial de 3 pontos neutra' : 'Iluminação natural editorial de estúdio')
    ),
    accentHex: normalizeHex(raw.accentHex, defaultAccentBySlot[(slotNumber - 1) % defaultAccentBySlot.length]),
    panelTheme: raw.panelTheme === 'light' ? 'light' : 'dark',
    textPosition,
    badge,
    headline,
    subtitle,
    cardStyle,
    cards,
    bullets,
    callout,
    insight: stripForbiddenStoreTerms(raw.insight || ''),
    hybridScenePrompt:
      hybridBase.includes('FRAMING SAFE ZONE') || hybridBase.includes('CRITICAL PACKAGING INTEGRITY')
        ? hybridBase
        : `${hybridBase || raw.scenarioDescription || 'Commercial studio product photograph.'}${hybridSafetyFooter}`,
    integratedImagePrompt:
      integratedBase ||
      `${hybridBase || raw.scenarioDescription || 'Commercial studio product photograph.'}${
        isCover
          ? ' Pure #FFFFFF white background preserving 100% of original printed text and seals on the packaging itself, with zero added promotional text on the white background.'
          : ` ${safeZoneByPosition[textPosition]} Include crisp, large Mobile-First Portuguese typography in the ${textPosition} negative space with EXACT spelling: Badge "${badge}", Headline "${headline}", Subtitle "${subtitle}", Cards: ${cards.map((c) => `"${c.title} - ${c.description}"`).join(' | ')}, Callout "${callout}". Zero typos, zero store logos.`
      }`,
  };
}

export function buildArtDirectorPlanPrompt(
  productData: any,
  managerBriefing: ManagerStrategicBriefing | null,
  imagesMeta: Array<{ index: number; alt: string; url: string }>
): string {
  const officialBrand = managerBriefing?.officialBrand || productData.brand || 'Marca Oficial do Produto';
  const imagesText = imagesMeta.length > 0
    ? imagesMeta.map((m) => `  - Foto Índice ${m.index} (Foto ${m.index + 1}): ${m.alt || 'Sem legenda'} (${m.url})`).join('\n')
    : '  - Nenhuma foto adicional listada (usar Foto Índice 0).';

  const briefingBlock = managerBriefing
    ? JSON.stringify(managerBriefing, null, 2)
    : JSON.stringify(
        {
          sku: productData.sku,
          officialBrand,
          productCategory: 'Identificar pelas imagens reais e nome do produto',
          targetPersona: 'Consumidor brasileiro buscando eficiência, segurança e custo-benefício',
          verifiedTechnicalFacts: [
            productData.name,
            (productData.description || '').replace(/<[^>]+>/g, ' ').slice(0, 600),
          ],
        },
        null,
        2
      );

  return `Você é o DIRETOR DE ARTE E AUDIOVISUAL SÊNIOR (Padrão Agência Editorial / Estúdio Comercial).
Você está recebendo:
1. O BRIEFING ESTRATÉGICO do Gerente de Projetos (o QUÊ vender, dores, objeções e fatos técnicos reais).
2. TODAS as fotos reais do produto cadastradas na Nuvemshop anexadas a esta mensagem em ordem (Índice 0, Índice 1, Índice 2...).

SUA MISSÃO:
Inspecionar visualmente TODAS as fotos reais anexadas (cores da embalagem, formato do frasco/pote/caixa, rótulo frontal, verso com instruções/tabela, acessórios) e criar o PLANO VISUAL E PROMPTS TÉCNICOS completos para os 8 SLOTS da galeria do anúncio.

================================================================
REGRAS INEGOCIÁVEIS DE DIREÇÃO DE ARTE (OS 4 PILARES + QUALIDADE)
================================================================
1. INSPEÇÃO MULTI-FOTOS COMPLETA & AUDITORIA VISUAL DO RÓTULO REAL:
   - Observe TODAS as imagens anexadas (total: ${imagesMeta.length}).
   - FILTRO OBRIGATÓRIO DE FOTO-PRODUTO (CRÍTICO): Inspecione cada foto anexada antes de escolher "sourceImageIndex" (0 a ${Math.max(0, imagesMeta.length - 1)}). É TERMINANTEMENTE PROIBIDO escolher em "sourceImageIndex" fotos que NÃO contenham a embalagem física real do produto — tais como: logotipos isolados da marca, fotos só de uma piscina vazia/suja sem o produto, selos isolados ou banners promocionais antigos! Só utilize outros índices além do 0 se aquela foto mostrar claramente a embalagem real (verso, lateral, dosador, conteúdo físico do produto). Se apenas a Foto Índice 0 mostrar a embalagem real, use "sourceImageIndex": 0 em TODOS os 8 slots!
   - AUDITORIA OBRIGATÓRIA DE FABRICANTE NO RÓTULO: Leia diretamente os logotipos, marcas e informações técnicas impressas NA EMBALAGEM REAL nas fotos anexadas (ex: selo "Start", "HTH", "Genco", rendimento em litros, peso, etc.). A EMBALAGEM REAL TEM AUTORIDADE ABSOLUTA sobre qualquer suposição textual do Briefing do Gerente! Se o fabricante visível na foto divergir do Briefing do Gerente (ou estiver marcado como "Confirmar no rótulo"), preencha "verifiedManufacturer" com o fabricante REAL lido na embalagem e use EXCLUSIVAMENTE esse fabricante (ou apenas a marca "${officialBrand}") nos textos dos slots. JAMAIS cite um fabricante que contradiga o rótulo real!
2. ZERO DEGRADÊ OBRIGATÓRIO, ATMOSFERA EMOCIONAL & ZONA SEGURA DE ENQUADRAMENTO:
   - É TERMINANTEMENTE PROIBIDO repetir um degradê escuro no topo de todas as fotos!
   - Varie a composição e o posicionamento do espaço negativo ("textPosition": alterne entre "top", "bottom", "left" e "right" conforme o enquadramento do produto e o cenário).
   - ZONA SEGURA ANTI-SOBREPOSIÇÃO (CRÍTICO): O produto INTEIRO (da tampa/topo à base, incluindo todos os itens/blocos da embalagem) NUNCA pode ser coberto pelo card de texto!
     * Se "textPosition" = "bottom": posicione o produto INTEIRO nos 56% SUPERIORES da imagem, deixando os 40% INFERIORES totalmente livres de produto.
     * Se "textPosition" = "top": posicione o produto INTEIRO nos 56% INFERIORES da imagem, deixando os 40% SUPERIORES totalmente livres de produto.
     * Se "textPosition" = "left": posicione o produto INTEIRO nos 46% DIREITOS da imagem, deixando os 50% ESQUERDOS totalmente livres.
     * Se "textPosition" = "right": posicione o produto INTEIRO nos 46% ESQUERDOS da imagem, deixando os 50% DIREITOS totalmente livres.
   - Escolha "panelTheme" ("light" para atmosferas claras/limpas/luminosas ou "dark" para contraste dramático/premium) e "accentHex" em harmonia e contraste com as CORES REAIS da embalagem que você viu nas fotos!
3. CENÁRIOS FOTOGRÁFICOS REAIS & INTEGRIDADE TOTAL DA EMBALAGEM NO SLOT 1:
   - Slot 1: SEMPRE Capa Oficial de Marketplace — fundo 100% branco puro (#FFFFFF), iluminação de estúdio 3 pontos, sombra suave de contato no piso, ZERO texto promocional adicionado no fundo (campos badge, headline, bullets, callout DEVEM ser strings/arrays vazios no Slot 1!). ATENÇÃO CRÍTICA NO SLOT 1: no prompt técnico do Slot 1, ordene explicitamente preservar 100% de TODOS os textos, selos coloridos, tabelas e logotipos impressos NA PRÓPRIA EMBALAGEM ORIGINAL sem apagar nada do rótulo!
   - Slots 2 a 8: CADA slot deve ter um cenário fotográfico REAL, rico, variado e 100% coerente com o nicho real do produto (cozinha iluminada, piscina ensolarada, lavanderia moderna, casa de máquinas limpa, etc.). PROIBIDO colocar o produto flutuando em card branco vazio.
4. REGRA DE OURO HÍBRIDO 2.0 — CONTEÚDO RICO E COMPLETO SEM CORTES (MOBILE-FIRST DE ALTA CONVERSÃO):
   - Não empobreça o argumento de venda! Cada slot (Slots 2 a 8) deve entregar hierarquia publicitária completa de alta conversão — clara no celular, porém rica em benefícios reais e números técnicos:
     * "badge": MÁXIMO 22 caracteres (selo de impacto, ex: "CRISTALINIDADE TOTAL", "PASSO A PASSO FÁCIL", "RENDIMENTO MÁXIMO").
     * "headline": MÁXIMO 38 caracteres (título principal forte e completo, ex: "1 BLOCO TRATA ATÉ 50.000 L", "PASSO A PASSO NO PRÉ-FILTRO").
     * "subtitle": MÁXIMO 78 caracteres (subtítulo explicativo que completa a promessa com dados reais, ex: "Cartela com 6 blocos em gel: trata até 300.000 litros com liberação lenta!").
     * "cardStyle": use "steps" (gera círculos numerados 1, 2, 3) nos slots de MODO DE USO / PASSO A PASSO; use "checks" (gera ícones vetoriais ✓) nos demais slots de benefícios, rendimento, compatibilidade e procedência.
     * "cards": 2 ou 3 cards estruturados (use 3 cards para Passo a Passo 1-2-3, e 2 cards bem completos nos demais slots!), cada card com:
       - "title": MÁXIMO 28 caracteres (ex: "6 Semanas de Água Pura", "Lave a Areia do Filtro", "Zero Ardência nos Olhos")
       - "description": MÁXIMO 58 caracteres (ex: "Economia real sem desperdício com apenas 1 cartela", "Faça a retrolavagem normal antes de aplicar")
     * "callout": MÁXIMO 24 caracteres (selo de fechamento ou prova de autoridade, ex: "ATÉ 300.000 L • SEM CLORO", "RESULTADO IMEDIATO", "PRONTO EM 2 MINUTOS").
   - Nunca sacrifique números técnicos importantes (rendimento, litros, gramas, mL, semanas, dias, compatibilidade com fibra/vinil/alvenaria, sem cloro, biodegradável).
5. TOLERÂNCIA ZERO A ERROS DE GRAFIA (REVISÃO ORTOGRÁFICA PT-BR OBRIGATÓRIA):
   - Revise CADA letra de "badge", "headline", "subtitle", "cards" e "callout" em Português do Brasil culto antes de retornar o JSON.
   - Verifique rigorosamente: acentos agudos/circunflexos/til/cedilha (ação, desinfecção, eficiência, fórmula, prático, líquido, água, higienização, econômica, segurança, família, não), concordância nominal/verbal, e unidades técnicas corretas (mL, L, kg, g, ppm, cm, min).
   - NUNCA use palavras em inglês desnecessárias nos textos voltados ao consumidor brasileiro.
   - PROIBIDO mencionar "123Mart", "123Mart Oficial", telefones, WhatsApp ou sites de loja. Use apenas a marca oficial validada: "${officialBrand}" e o fabricante confirmado visualmente no rótulo.
6. PROMPTS TÉCNICOS DE GERAÇÃO DE IMAGEM (HÍBRIDO 2.0):
   - Para cada slot, escreva DOIS prompts técnicos detalhados em INGLÊS:
     * "hybridScenePrompt": Prompt fotográfico de estúdio editorial/arquitetônico em altíssima qualidade (câmera 50mm f/2.8, iluminação natural/arquitetônica rica, profundidade de campo cinematográfica), descrevendo o CENÁRIO REAL e uma superfície limpa (borda de pedra, deck de madeira, bancada de porcelanato, casa de máquinas organizada, etc.) preparada para receber a embalagem real em primeiro plano na zona oposta a "textPosition". Ordene EXPLICITAMENTE: "DO NOT add any promotional text, letters, numbers, badges, icons or watermarks anywhere in the scene."
     * "integratedImagePrompt": Prompt fotográfico completo instruindo o modelo a renderizar cena + produto real (Strict Compositing na zona segura) + os textos exatos em Português entre aspas duplas com tipografia Mobile-First nítida no espaço negativo, sem erros de grafia.

INVENTÁRIO DAS FOTOS ANEXADAS:
${imagesText}

PRODUTO:
- SKU: ${productData.sku || 'Não informado'}
- Nome: ${productData.name || 'Produto'}
- Marca Oficial Homologada: ${officialBrand}

BRIEFING ESTRATÉGICO DO GERENTE DE PROJETOS:
${briefingBlock}

RETORNE ESTRITAMENTE UM JSON PURO COM EXATAMENTE 8 SLOTS (slotNumber de 1 a 8):
{
  "sku": "${productData.sku || ''}",
  "officialBrand": "${officialBrand}",
  "verifiedManufacturer": "Nome exato do fabricante lido visualmente no rótulo/embalagem real (ex: Start Química), ou igual a officialBrand se não houver outro fabricante impresso na embalagem",
  "visualIdentitySummary": "Resumo técnico das cores detectadas na embalagem real, fabricante confirmado no rótulo e direção de arte escolhida para destacar o produto.",
  "packagingColorsDetected": ["#HEX1", "#HEX2"],
  "photosAnalyzedCount": ${Math.max(1, imagesMeta.length)},
  "orthographyChecked": true,
  "videoConcept9x16": "Conceito conciso de vídeo vertical 9:16 (8 segundos) para retenção em Reels/TikTok.",
  "slots": [
    {
      "slotNumber": 1,
      "title": "Capa Oficial Marketplace (Fundo 100% Branco Puro #FFFFFF)",
      "commercialGoal": "Reconhecimento imediato e aprovação em todos os marketplaces",
      "sourceImageIndex": 0,
      "sourceImageReason": "Foto frontal nítida da embalagem oficial",
      "emotion": "Clareza e confiança imediata",
      "scenarioDescription": "Estúdio fotográfico comercial com fundo 100% branco puro #FFFFFF e sombra suave de piso",
      "lightingAndPalette": "Iluminação de estúdio 3 pontos neutra, branco puro #FFFFFF",
      "accentHex": "#0F172A",
      "panelTheme": "light",
      "textPosition": "none",
      "badge": "",
      "headline": "",
      "subtitle": "",
      "cardStyle": "checks",
      "cards": [],
      "bullets": [],
      "callout": "",
      "insight": "Capa obrigatória de marketplace: fundo branco puro sem texto ou ruído.",
      "hybridScenePrompt": "Commercial e-commerce hero studio photograph...",
      "integratedImagePrompt": "Commercial e-commerce hero studio photograph..."
    },
    {
      "slotNumber": 2,
      "title": "Exemplo de Slot 2 a 8 (Estrutura Rica Híbrido 2.0)",
      "commercialGoal": "Objetivo comercial específico do slot",
      "sourceImageIndex": 0,
      "sourceImageReason": "Foto limpa da embalagem",
      "emotion": "Emoção específica deste slot",
      "scenarioDescription": "Cenário fotográfico real e variado",
      "lightingAndPalette": "Iluminação e paleta em harmonia com a embalagem",
      "accentHex": "#0284C7",
      "panelTheme": "dark",
      "textPosition": "left",
      "badge": "SELO DE IMPACTO",
      "headline": "TÍTULO FORTE E COMPLETO EM PT-BR",
      "subtitle": "Subtítulo explicativo rico com dados técnicos e benefício direto.",
      "cardStyle": "checks",
      "cards": [
        { "title": "Benefício Principal", "description": "Explicação curta e concreta com dado real do produto" },
        { "title": "Segundo Benefício", "description": "Quebra direta de objeção ou prova técnica" }
      ],
      "bullets": ["Benefício Principal: Explicação curta e concreta", "Segundo Benefício: Quebra direta de objeção"],
      "callout": "PROVA NUMÉRICA CURTA",
      "insight": "Justificativa visual e estratégica deste slot",
      "hybridScenePrompt": "Editorial commercial environment photograph...",
      "integratedImagePrompt": "Editorial commercial photograph with typography..."
    }
  ]
}`;
}

export function buildArtSlotRevisionPrompt(
  currentSlot: ArtSlotPlan,
  userInstructions: string,
  productData: any,
  officialBrand: string,
  totalValidImages: number
): string {
  return `Você é o DIRETOR DE ARTE SÊNIOR revisando APENAS o Slot ${currentSlot.slotNumber} do produto "${productData.name}" (SKU: ${productData.sku}, Marca Oficial: ${officialBrand}).

ESTADO ATUAL DO SLOT ${currentSlot.slotNumber}:
${JSON.stringify(currentSlot, null, 2)}

INSTRUÇÕES DO USUÁRIO / DIRETORIA PARA AJUSTAR ESTE SLOT:
"${userInstructions}"

REGRAS OBRIGATÓRIAS NA REVISÃO (HÍBRIDO 2.0):
1. Aplique integralmente o pedido do usuário mantendo acabamento fotográfico editorial e preservação 100% fiel da embalagem real.
2. Se for Slot 1: mantenha fundo #FFFFFF puro e campos de texto VAZIOS (badge, headline, subtitle, cards, bullets, callout).
3. Para Slots 2 a 8:
   - Mantenha a estrutura rica Híbrido 2.0 completa sem cortar informações importantes:
     * badge <= 22 chars
     * headline <= 38 chars
     * subtitle <= 78 chars
     * cardStyle: "checks" ou "steps" (use "steps" para passo a passo 1-2-3)
     * cards: 2 ou 3 objetos { "title": <= 28 chars, "description": <= 58 chars }
     * callout <= 24 chars
   - REVISÃO ORTOGRÁFICA PT-BR OBRIGATÓRIA: zero erros de grafia, acentuação perfeita, unidades técnicas corretas (mL, L, kg, g, ppm).
   - ZERO "123Mart" ou marcas de revendedor.
   - Atualize "hybridScenePrompt" e "integratedImagePrompt".
   - "sourceImageIndex" deve estar entre 0 e ${Math.max(0, totalValidImages - 1)} e DEVE apontar para uma foto que contenha a embalagem real do produto (se o usuário reclamar que apareceu logotipo isolado ou piscina sem produto, mude obrigatoriamente "sourceImageIndex" para 0!).

Retorne ESTRITAMENTE o JSON atualizado deste único slot com as mesmas chaves do objeto acima.`;
}

export function formatArtPlanMarkdown(
  plan: ArtDirectionPlan,
  sku: string,
  productName: string
): string {
  const lines: string[] = [
    `# Plano de Direção de Arte Híbrido 2.0 & Galeria de Estúdio (8 Slots)`,
    ``,
    `- **SKU:** ${sku}`,
    `- **Produto:** ${productName}`,
    `- **Marca Oficial Homologada:** ${plan.officialBrand}`,
    ...(plan.verifiedManufacturer ? [`- **Fabricante Confirmado no Rótulo:** ${plan.verifiedManufacturer}`] : []),
    `- **Fotos Analisadas da Nuvemshop:** ${plan.photosAnalyzedCount} foto(s)`,
    `- **Revisão Ortográfica PT-BR:** ${plan.orthographyChecked ? 'Aprovada (Zero erros)' : 'Pendente'}`,
    `- **Cores Detectadas na Embalagem:** ${(plan.packagingColorsDetected || []).join(', ') || 'Automática'}`,
    ``,
    `## Conceito Visual Geral`,
    plan.visualIdentitySummary,
    ``,
    `## Galeria dos 8 Slots`,
    ...plan.slots.map((s) => {
      const cardsSummary = (s.cards || [])
        .map((c, idx) => `${s.cardStyle === 'steps' ? `${idx + 1}.` : '✓'} **${c.title}**${c.description ? ` — ${c.description}` : ''}`)
        .join(' | ');
      const copyBlock =
        s.slotNumber === 1
          ? `- **Tipografia:** Capa Oficial sem texto (Fundo 100% #FFFFFF)`
          : `- **Selo (Badge):** ${s.badge}\n- **Headline:** ${s.headline}\n- **Subtítulo:** ${s.subtitle}\n- **Cards (${s.cardStyle === 'steps' ? 'Passos 1-2-3' : 'Benefícios ✓'}):** ${cardsSummary || s.bullets.join(' | ')}\n- **Callout:** ${s.callout}\n- **Posição & Tema:** ${s.textPosition} (${s.panelTheme}, Destaque: ${s.accentHex})`;
      return [
        `### Slot ${s.slotNumber} — ${s.title}`,
        `- **Foto Base Selecionada:** Foto ${s.sourceImageIndex + 1} (${s.sourceImageReason})`,
        `- **Emoção & Cenário:** ${s.emotion} — ${s.scenarioDescription}`,
        `- **Iluminação & Paleta:** ${s.lightingAndPalette}`,
        copyBlock,
        `- **Prompt Híbrido 2.0 (Cenário Limpo):** \`${s.hybridScenePrompt}\``,
        ``,
      ].join('\n');
    }),
  ];

  if (plan.videoConcept9x16) {
    lines.push(`## Conceito Vídeo Vertical 9:16 (8s)`, plan.videoConcept9x16);
  }

  return lines.join('\n');
}
