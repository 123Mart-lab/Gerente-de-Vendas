import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Palette, Search, RefreshCw, CheckCircle2,
  Download, Sparkles, Check,
  FileText, Box, ShieldCheck, Award,
  CheckCheck, Store, Loader2, Send,
  Wand2, Layers, Type as TypeIcon, AlertTriangle,
  ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { useSku } from '../../contexts/SkuContext';

type ArtRenderMode = 'hybrid' | 'ai_integrated';
type TextPlacement = 'top' | 'bottom' | 'left' | 'right' | 'none';
type PanelTheme = 'light' | 'dark';
type CardStyle = 'checks' | 'steps';

interface ArtInfoCard {
  title: string;
  description: string;
}

interface NuvemshopImage {
  id: number;
  src: string;
  alt: string;
  position: number;
}

interface NuvemshopProductDetails {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  barcode: string;
  brand: string;
  images: NuvemshopImage[];
}

interface GeneratedSlotRecord {
  slotNumber: number;
  jpgUrl: string;
  webpUrl: string;
  cleanSceneUrl?: string;
  jpgSizeKb: string;
  webpSizeKb: string;
  modelUsed: string;
  renderMode: ArtRenderMode;
  sourceImageUsed?: string;
  userInstructions?: string;
  updatedAt?: number;
}

interface ArtSlotPlan {
  slotNumber: number;
  title: string;
  commercialGoal?: string;
  sourceImageIndex: number;
  sourceImageReason?: string;
  emotion?: string;
  scenarioDescription?: string;
  lightingAndPalette?: string;
  accentHex?: string;
  panelTheme?: PanelTheme;
  textPosition?: TextPlacement;
  badge: string;
  headline: string;
  subtitle?: string;
  cardStyle?: CardStyle;
  cards?: ArtInfoCard[];
  bullets: string[];
  callout: string;
  insight: string;
  hybridScenePrompt?: string;
  integratedImagePrompt?: string;
}

interface SkuBriefingRecord {
  sku: string;
  officialBrand?: string;
  planner?: string;
  monitor?: string;
  manager?: string;
  art?: string;
  seo?: string;
  managerBriefing?: {
    officialBrand: string;
    manufacturer: string;
    productCategory: string;
    targetPersona: string;
    positioningDirective: string;
    pricingVerdict: string;
    topPains: string[];
    topObjections: string[];
    verifiedTechnicalFacts: string[];
    copyTriggers: string[];
  };
  artPlan?: {
    officialBrand: string;
    visualIdentitySummary: string;
    packagingColorsDetected?: string[];
    photosAnalyzedCount?: number;
    orthographyChecked?: boolean;
    slots: ArtSlotPlan[];
  };
  generatedSlots?: Record<string, GeneratedSlotRecord>;
}

interface SlotDefinition {
  id: number;
  slotNumber: number;
  title: string;
  badge: string;
  badgeColor: string;
  headline: string;
  subtitle?: string;
  cardStyle?: CardStyle;
  cards?: ArtInfoCard[];
  bullets: string[];
  callout: string;
  insight: string;
  treatedImgJpg: string;
  treatedImgWebp: string;
  fileSizeJpg: string;
  fileSizeWebp: string;
  // Campos enriquecidos pelo Diretor de Arte Multimodal
  sourceImageIndex?: number;
  sourceImageReason?: string;
  emotion?: string;
  scenarioDescription?: string;
  accentHex?: string;
  panelTheme?: PanelTheme;
  textPosition?: TextPlacement;
  hybridScenePrompt?: string;
  integratedImagePrompt?: string;
  cleanSceneUrl?: string;
  modelUsed?: string;
  renderModeUsed?: ArtRenderMode;
  fromAiPlan?: boolean;
  hasGeneratedArt?: boolean;
}

interface SlotCopyDraft {
  badge: string;
  headline: string;
  subtitle: string;
  cardStyle: CardStyle;
  cards: ArtInfoCard[];
  callout: string;
  textPosition: TextPlacement;
  panelTheme: PanelTheme;
}

export default function ArtDirector() {
  const { activeSku: contextSku, setActiveSku: setContextSku } = useSku();

  // SKU ativo (inicia com o contexto global ou 123Mart09168)
  const [skuInput, setSkuInput] = useState<string>(contextSku || '123Mart09168');
  const [activeSku, setActiveSku] = useState<string>(contextSku || '123Mart09168');

  // Sincroniza com contexto global quando mudar por fora
  useEffect(() => {
    if (contextSku && contextSku !== activeSku) {
      setSkuInput(contextSku);
      setActiveSku(contextSku);
    }
  }, [contextSku]);

  // Dados reais do produto da Nuvemshop + Briefing persistido da esteira
  const [productData, setProductData] = useState<NuvemshopProductDetails | null>(null);
  const [skuBriefing, setSkuBriefing] = useState<SkuBriefingRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modo de renderização (Híbrido recomendado vs IA Integrada) e operações em lote
  const [renderMode, setRenderMode] = useState<ArtRenderMode>('hybrid');
  const [isPlanningArt, setIsPlanningArt] = useState<boolean>(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [studioFeedback, setStudioFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Estados de aprovação, imagens anteriores mantidas, edição de textos PT-BR e recriação por slot
  const [approvedSlots, setApprovedSlots] = useState<{ [key: number]: boolean }>({});
  const [keptPreviousSlots, setKeptPreviousSlots] = useState<{ [key: number]: boolean }>({});
  const [slotSuggestions, setSlotSuggestions] = useState<{ [key: number]: string }>({});
  const [slotRecreating, setSlotRecreating] = useState<{ [key: number]: boolean }>({});
  const [slotErrors, setSlotErrors] = useState<{ [key: number]: string }>({});
  const [slotVersions, setSlotVersions] = useState<{ [key: number]: number }>({
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1
  });
  const [recreatedNotes, setRecreatedNotes] = useState<{ [key: number]: string }>({});
  const [recreatedImages, setRecreatedImages] = useState<{ [key: number]: string }>({});
  const [recreatedMeta, setRecreatedMeta] = useState<{ [key: number]: { webpUrl?: string; cleanSceneUrl?: string; fileSizeJpg?: string; fileSizeWebp?: string; modelUsed?: string; renderMode?: ArtRenderMode } }>({});
  const [appliedUserInstructions, setAppliedUserInstructions] = useState<{ [key: number]: string }>({});
  const [selectedSlotImage, setSelectedSlotImage] = useState<{ [key: number]: string }>({});
  const [slotCopyDrafts, setSlotCopyDrafts] = useState<{ [key: number]: SlotCopyDraft }>({});
  const [expandedPromptSlot, setExpandedPromptSlot] = useState<{ [key: number]: boolean }>({});
  const [isSavingApproval, setIsSavingApproval] = useState<boolean>(false);

  // Seleção de slot na Nuvemshop (1 a 8) e estado de salvamento por imagem
  const [targetPositions, setTargetPositions] = useState<{ [key: number]: number }>({
    1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8
  });
  const [isSavingSlot, setIsSavingSlot] = useState<{ [key: number]: boolean }>({});
  const [savedSlotStatus, setSavedSlotStatus] = useState<{ [key: number]: { saved: boolean; position: number; imageId?: number } }>({});
  const [managerNotified, setManagerNotified] = useState<boolean>(false);

  // Carrega briefing real persistido para o SKU ativo
  const fetchSkuBriefing = useCallback(async (skuToLoad: string) => {
    try {
      const res = await axios.get(`/api/marketing/sku-briefings/${encodeURIComponent(skuToLoad)}`);
      if (res.data?.found && res.data.briefing) {
        setSkuBriefing(res.data.briefing);
        setSlotCopyDrafts({});
      } else {
        setSkuBriefing(null);
      }
    } catch {
      setSkuBriefing(null);
    }
  }, []);

  // Carrega aprovações (novas salvas + anteriores mantidas) do backend
  useEffect(() => {
    axios.get(`/api/marketing/art-approvals/${activeSku}`)
      .then(res => {
        if (res.data && Array.isArray(res.data.approvedSlots)) {
          const map: { [key: number]: boolean } = {};
          res.data.approvedSlots.forEach((slotId: number) => {
            map[slotId] = true;
          });
          setApprovedSlots(map);
        } else {
          setApprovedSlots({});
        }
        if (res.data && Array.isArray(res.data.keptPreviousSlots)) {
          const keptMap: { [key: number]: boolean } = {};
          res.data.keptPreviousSlots.forEach((slotId: number) => {
            keptMap[slotId] = true;
          });
          setKeptPreviousSlots(keptMap);
        } else {
          setKeptPreviousSlots({});
        }
        setManagerNotified(Boolean(res.data?.allApproved));
      })
      .catch(() => {
        setApprovedSlots({});
        setKeptPreviousSlots({});
        setManagerNotified(false);
      });
  }, [activeSku]);

  // Carrega dados reais da Nuvemshop + Briefing do SKU ativo
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setErrorMsg(null);
      setStudioFeedback(null);
      setSlotErrors({});
      setSlotCopyDrafts({});

      await Promise.all([
        axios.get(`/api/marketing/nuvemshop/product/${encodeURIComponent(activeSku)}`)
          .then(res => {
            if (isMounted && res.data) setProductData(res.data);
            else if (isMounted) setErrorMsg(`Produto ${activeSku} não encontrado na Nuvemshop.`);
          })
          .catch(() => {
            if (isMounted) {
              setProductData(null);
              setErrorMsg(`Não foi possível carregar dados da Nuvemshop para o SKU ${activeSku}.`);
            }
          }),
        fetchSkuBriefing(activeSku)
      ]);

      if (isMounted) setLoading(false);
    };

    fetchAll();
    return () => { isMounted = false; };
  }, [activeSku, fetchSkuBriefing]);

  const resetLocalSlotState = () => {
    setRecreatedImages({});
    setRecreatedMeta({});
    setAppliedUserInstructions({});
    setRecreatedNotes({});
    setSelectedSlotImage({});
    setSlotErrors({});
    setSlotCopyDrafts({});
    setStudioFeedback(null);
  };

  const handleSearchSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (skuInput.trim()) {
      const cleanSku = skuInput.trim();
      setActiveSku(cleanSku);
      setContextSku(cleanSku);
      resetLocalSlotState();
    }
  };

  const handleSelectShortcut = (sku: string) => {
    setSkuInput(sku);
    setActiveSku(sku);
    setContextSku(sku);
    resetLocalSlotState();
  };

const isScreenshotUrl = (src: string | undefined): boolean => {
  if (!src) return false;
  return (
    src.includes('/assets/aistudio/') ||
    src.includes('image_74c58744') ||
    src.includes('image_0553b0bf') ||
    src.includes('image_27adf632') ||
    src.includes('image_ee30f5f6') ||
    /image_[0-9a-f]{8}/i.test(src)
  );
};

  // Definições dos 8 Slots dinâmicos baseados no produto e SKU selecionado
  const getSlotsForSku = (sku: string, prodData: NuvemshopProductDetails | null): SlotDefinition[] => {
    // Seleciona a imagem autêntica de catálogo na Nuvemshop, ignorando prints acidentais
    const validImagesList = (prodData?.images || []).filter(
      (img: any) => img.src && !isScreenshotUrl(img.src)
    );
    const validNuvemshopImg = validImagesList[0]?.src;
    const rawNuvemshopImg = validNuvemshopImg || prodData?.images?.[0]?.src || '';
    const cleanSku = (sku || '').toLowerCase();
    const prodName = prodData?.name || `Produto ${sku}`;
    const cleanName = prodName.toLowerCase();

    // 1. SKU 123Mart09168: Germicida Desinfetante Qualifood
    if (cleanSku.includes('09168') || cleanName.includes('qualifood')) {
      return [
        {
          id: 1,
          slotNumber: 1,
          title: 'Capa Oficial Marketplace (Fundo 100% Branco Puro #FFFFFF)',
          badge: 'Fundo 100% Branco Puro',
          badgeColor: 'bg-slate-900 text-white',
          headline: '',
          bullets: [],
          callout: 'CAPA OFICIAL',
          insight: 'Fundo 100% branco (#FFFFFF) sem ruído, sem textos e sem marcas da loja. Frasco oficial Qualifood com sombra suave de estúdio (Padrão Mercado Livre, Shopee e Nuvemshop).',
          treatedImgJpg: '/assets/slots_09168/slot_1.jpg',
          treatedImgWebp: '/assets/slots_09168/slot_1.webp',
          fileSizeJpg: '44.2 KB',
          fileSizeWebp: '30.9 KB'
        },
        {
          id: 2,
          slotNumber: 2,
          title: 'Ambiente Real de Uso: Frutas & Vegetais Frescos na Cozinha',
          badge: 'Higiene de Alimentos',
          badgeColor: 'bg-emerald-600 text-white',
          headline: 'DESINFECÇÃO TOTAL DE FRUTAS & VEGETAIS',
          bullets: [
            'Elimina agrotóxicos superficiais e bactérias',
            'Preserva a crocância e frescor dos alimentos'
          ],
          callout: 'LAVA & DESINFETA',
          insight: 'Cenário de cozinha com bancada de mármore e frutas frescas. Tipografia Mobile-First legível em telas de smartphone sem marcas da loja.',
          treatedImgJpg: '/assets/slots_09168/slot_2.jpg',
          treatedImgWebp: '/assets/slots_09168/slot_2.webp',
          fileSizeJpg: '87.4 KB',
          fileSizeWebp: '71.0 KB'
        },
        {
          id: 3,
          slotNumber: 3,
          title: 'Maternidade Segura: Mamadeiras, Chupetas & Utensílios de Bebê',
          badge: 'Maternidade & Bebê',
          badgeColor: 'bg-sky-600 text-white',
          headline: '100% SEGURO PARA MAMADEIRAS & CHUPETAS',
          bullets: [
            'Higienização hospitalar para lactação e bicos',
            'Zero resíduo tóxico: pureza total para o bebê'
          ],
          callout: 'CUIDADO MATERNO',
          insight: 'Apelo emocional e quebra de objeção para mães e famílias: esterilização segura de itens delicados sem deixar cheiro químico.',
          treatedImgJpg: '/assets/slots_09168/slot_3.jpg',
          treatedImgWebp: '/assets/slots_09168/slot_3.webp',
          fileSizeJpg: '82.6 KB',
          fileSizeWebp: '73.9 KB'
        },
        {
          id: 4,
          slotNumber: 4,
          title: 'Rendimento Máximo: 1 Frasco 350ml Rende até 58 Litros',
          badge: 'Rendimento Máximo',
          badgeColor: 'bg-amber-600 text-white',
          headline: '1 FRASCO RENDE ATÉ 58 LITROS DE SOLUÇÃO',
          bullets: [
            'Apenas 6 mL por litro de água da torneira',
            'Mais de 58 bacias de lavagem por frasco'
          ],
          callout: '6 mL = 1 LITRO',
          insight: 'Gatilho matemático forte: demonstração de economia impressionante com água da torneira.',
          treatedImgJpg: '/assets/slots_09168/slot_4.jpg',
          treatedImgWebp: '/assets/slots_09168/slot_4.webp',
          fileSizeJpg: '88.9 KB',
          fileSizeWebp: '67.2 KB'
        },
        {
          id: 5,
          slotNumber: 5,
          title: 'Eficácia Comprovada em Laboratório: Elimina E. Coli & Enterococcus',
          badge: 'Eficácia Comprovada',
          badgeColor: 'bg-rose-600 text-white',
          headline: 'ELIMINA E. COLI & ENTEROCOCCUS',
          bullets: [
            'Ação bactericida testada em laboratório',
            'Barreira definitiva contra infecções alimentares'
          ],
          callout: 'EFICÁCIA 99,9%',
          insight: 'Autoridade técnica comprovada: elimina microrganismos nocivos citados no laudo técnico do produto.',
          treatedImgJpg: '/assets/slots_09168/slot_5.jpg',
          treatedImgWebp: '/assets/slots_09168/slot_5.webp',
          fileSizeJpg: '85.7 KB',
          fileSizeWebp: '73.3 KB'
        },
        {
          id: 6,
          slotNumber: 6,
          title: 'Modo de Aplicação Fácil: Desinfecção Completa em 10 Minutos',
          badge: 'Preparo Rápido',
          badgeColor: 'bg-cyan-600 text-white',
          headline: 'DESINFECÇÃO COMPLETA EM 10 MINUTOS',
          bullets: [
            '1. Lave em água • 2. Deixe 10 min de molho',
            '3. Enxágue e pronto: praticidade diária'
          ],
          callout: 'APENAS 10 MIN',
          insight: 'Passo a passo visual imediato: reduz dúvidas operacionais do consumidor e acelera a decisão de compra.',
          treatedImgJpg: '/assets/slots_09168/slot_6.jpg',
          treatedImgWebp: '/assets/slots_09168/slot_6.webp',
          fileSizeJpg: '84.3 KB',
          fileSizeWebp: '73.0 KB'
        },
        {
          id: 7,
          slotNumber: 7,
          title: 'Pureza Sensorial: Sabor e Aroma 100% Neutros',
          badge: 'Aroma & Sabor Neutros',
          badgeColor: 'bg-emerald-700 text-white',
          headline: 'NÃO ALTERA O SABOR NEM O CHEIRO',
          bullets: [
            'Zero resíduo: frutas e legumes com sabor puro',
            'Seguro para morangos, folhas e mamadeiras'
          ],
          callout: 'SABOR NATURAL',
          insight: 'Diferencial vital contra concorrentes à base de cloro forte: os alimentos continuam com gosto e aroma naturais.',
          treatedImgJpg: '/assets/slots_09168/slot_7.jpg',
          treatedImgWebp: '/assets/slots_09168/slot_7.webp',
          fileSizeJpg: '86.2 KB',
          fileSizeWebp: '73.7 KB'
        },
        {
          id: 8,
          slotNumber: 8,
          title: 'Responsabilidade e Cuidado: Fórmula Biodegradável & Segura',
          badge: 'Eco-Friendly & Seguro',
          badgeColor: 'bg-teal-700 text-white',
          headline: 'FÓRMULA BIODEGRADÁVEL & SEGURA',
          bullets: [
            'Amiga do meio ambiente e atóxica para o lar',
            'Padrão profissional Qualifood com nota fiscal'
          ],
          callout: 'BIODEGRADÁVEL',
          insight: 'Sustentabilidade e segurança ambiental aliadas à saúde da família.',
          treatedImgJpg: '/assets/slots_09168/slot_8.jpg',
          treatedImgWebp: '/assets/slots_09168/slot_8.webp',
          fileSizeJpg: '84.6 KB',
          fileSizeWebp: '73.4 KB'
        }
      ];
    }

    // 0A. SKU 123Mart09178: AQUAPOOL CLORO GRANULADO TRIACTION 3,5KG (Balde 3,5kg)
    if (cleanSku.includes('09178') || (cleanName.includes('triaction') && (cleanName.includes('3,5') || cleanName.includes('cloro')))) {
      return [
        {
          id: 1,
          slotNumber: 1,
          title: 'Capa Oficial Marketplace: Balde 3,5kg Aquapool Cloro Triaction (Fundo 100% Branco Puro #FFFFFF)',
          badge: 'Fundo 100% Branco Puro',
          badgeColor: 'bg-slate-900 text-white',
          headline: '',
          bullets: [],
          callout: 'CAPA OFICIAL',
          insight: 'Fundo 100% branco (#FFFFFF) sem ruído, sem tarjas da loja. Balde de 3,5kg oficial com iluminação de estúdio comercial pura.',
          treatedImgJpg: '/assets/slots_09178/slot_1.jpg',
          treatedImgWebp: '/assets/slots_09178/slot_1.webp',
          fileSizeJpg: '54.6 KB',
          fileSizeWebp: '33.3 KB'
        },
        {
          id: 2,
          slotNumber: 2,
          title: 'Ambiente Real de Uso: Piscina Ensolarada de Água Cristalina & Ação 3 em 1',
          badge: 'Piscina Protegida',
          badgeColor: 'bg-cyan-600 text-white',
          headline: 'AÇÃO 3 EM 1: DESINFETA, CLARIFICA & PREVINE',
          bullets: [
            'Elimina 99,9% das bactérias e mantém a água 100% cristalina',
            'Ideal para piscinas de Fibra, Vinil, Alvenaria e Pintura'
          ],
          callout: 'AÇÃO 3 EM 1',
          insight: 'Cenário de piscina límpida em dia ensolarado com o balde de 3,5kg e infocards de alta legibilidade.',
          treatedImgJpg: '/assets/slots_09178/slot_2.jpg',
          treatedImgWebp: '/assets/slots_09178/slot_2.webp',
          fileSizeJpg: '87.2 KB',
          fileSizeWebp: '70.0 KB'
        },
        {
          id: 3,
          slotNumber: 3,
          title: 'Fórmula Orgânica Estabilizada: Proteção UV Contra o Sol Forte',
          badge: 'Estabilizado UV',
          badgeColor: 'bg-amber-600 text-white',
          headline: 'FÓRMULA ESTABILIZADA: NÃO EVAPORA AO SOL',
          bullets: [
            'Resiste aos raios UV mantendo o cloro ativo por dias',
            'Economia real: sem necessidade de reposição diária contínua'
          ],
          callout: 'PROTEÇÃO UV',
          insight: 'Gatilho de durabilidade química: não se perde no calor do verão.',
          treatedImgJpg: '/assets/slots_09178/slot_3.jpg',
          treatedImgWebp: '/assets/slots_09178/slot_3.webp',
          fileSizeJpg: '83.5 KB',
          fileSizeWebp: '74.0 KB'
        },
        {
          id: 4,
          slotNumber: 4,
          title: 'Máximo Custo-Benefício: Balde 3,5kg de Alto Rendimento por m³',
          badge: 'Mais Economia',
          badgeColor: 'bg-emerald-600 text-white',
          headline: 'BALDE 3,5KG: ALTO RENDIMENTO POR M³',
          bullets: [
            'Dura muito mais: dosagem concentrada e altamente econômica',
            'Balde reforçado com alça ergonômica e lacre seguro'
          ],
          callout: 'ALTO RENDIMENTO',
          insight: 'Contraste matemático de rendimento e economia real por litro/m³ de água.',
          treatedImgJpg: '/assets/slots_09178/slot_4.jpg',
          treatedImgWebp: '/assets/slots_09178/slot_4.webp',
          fileSizeJpg: '87.1 KB',
          fileSizeWebp: '87.5 KB'
        },
        {
          id: 5,
          slotNumber: 5,
          title: 'Especificações Técnicas: Dissolução Total Sem Resíduos ou Manchas',
          badge: 'Rápida Dissolução',
          badgeColor: 'bg-rose-600 text-white',
          headline: 'DISSOLUÇÃO TOTAL: NÃO DEIXA RESÍDUOS',
          bullets: [
            'Grânulos de alta pureza com dissolução instantânea',
            'Não mancha vinil, fibra nem acumula pó no fundo'
          ],
          callout: 'ZERO RESÍDUOS',
          insight: 'Tranquilidade e segurança para proprietários de piscinas de fibra e vinil.',
          treatedImgJpg: '/assets/slots_09178/slot_5.jpg',
          treatedImgWebp: '/assets/slots_09178/slot_5.webp',
          fileSizeJpg: '86.1 KB',
          fileSizeWebp: '73.6 KB'
        },
        {
          id: 6,
          slotNumber: 6,
          title: 'Modo de Aplicação Descomplicado: Tratamento Fácil em 3 Etapas',
          badge: 'Aplicação Fácil',
          badgeColor: 'bg-blue-600 text-white',
          headline: 'TRATAMENTO FÁCIL EM 3 ETAPAS',
          bullets: [
            '1. Meça o cloro livre • 2. Adicione 4g para cada 1.000L',
            '3. Filtre por 6 horas para homogeneização perfeita'
          ],
          callout: 'PASSO A PASSO',
          insight: 'Passo a passo didático que elimina inseguranças do comprador novato.',
          treatedImgJpg: '/assets/slots_09178/slot_6.jpg',
          treatedImgWebp: '/assets/slots_09178/slot_6.webp',
          fileSizeJpg: '84.6 KB',
          fileSizeWebp: '73.1 KB'
        },
        {
          id: 7,
          slotNumber: 7,
          title: 'Saúde & Conforto: Banho Aconchegante Sem Ardência nos Olhos',
          badge: 'Banho Seguro',
          badgeColor: 'bg-teal-600 text-white',
          headline: 'BANHO CONFORTÁVEL & SEGURO',
          bullets: [
            'Zero ardência nos olhos e sem ressecamento da pele',
            'Proteção completa para a saúde de crianças e toda a família'
          ],
          callout: 'BANHO SEGURO',
          insight: 'Apelo emocional de segurança e bem-estar para famílias e banhistas.',
          treatedImgJpg: '/assets/slots_09178/slot_7.jpg',
          treatedImgWebp: '/assets/slots_09178/slot_7.webp',
          fileSizeJpg: '80.0 KB',
          fileSizeWebp: '69.1 KB'
        },
        {
          id: 8,
          slotNumber: 8,
          title: 'Garantia de Indústria & Procedência Homologada Aquapool Start Química',
          badge: 'Garantia de Fábrica',
          badgeColor: 'bg-slate-900 text-white',
          headline: 'QUALIDADE LÍDER AQUAPOOL',
          bullets: [
            'Produto 100% autêntico fornecido diretamente de indústria',
            'Garantia total de eficácia e envio com nota fiscal'
          ],
          callout: 'ORIGINAL',
          insight: 'Autoridade de marca e reversão absoluta de risco na compra.',
          treatedImgJpg: '/assets/slots_09178/slot_8.jpg',
          treatedImgWebp: '/assets/slots_09178/slot_8.webp',
          fileSizeJpg: '86.2 KB',
          fileSizeWebp: '85.3 KB'
        }
      ];
    }

    // 0. SKU 123Mart09179: Aquapool Estojo de Teste de Alcalinidade (Estojo Verde)
    if (cleanSku.includes('09179') || (cleanName.includes('alcalinidade') && !cleanSku.includes('09180'))) {
      return [
        {
          id: 1,
          slotNumber: 1,
          title: 'Capa Oficial Marketplace: Estojo Verde Aquapool Alcalinidade (Fundo 100% Branco Puro #FFFFFF)',
          badge: 'Fundo 100% Branco Puro',
          badgeColor: 'bg-slate-900 text-white',
          headline: '',
          bullets: [],
          callout: 'CAPA OFICIAL',
          insight: 'Fundo 100% branco (#FFFFFF) sem ruído, sem textos da loja. Estojo verde oficial Aquapool Teste de Alcalinidade com iluminação de estúdio comercial pura.',
          treatedImgJpg: '/assets/slots_09179/slot_1.jpg',
          treatedImgWebp: '/assets/slots_09179/slot_1.webp',
          fileSizeJpg: '48.5 KB',
          fileSizeWebp: '26.8 KB'
        },
        {
          id: 2,
          slotNumber: 2,
          title: 'Ambiente Real de Uso: Piscina Protegida & Água Equilibrada',
          badge: 'Piscina Protegida',
          badgeColor: 'bg-emerald-600 text-white',
          headline: 'CONTROLE EXATO DA ALCALINIDADE TOTAL',
          bullets: [
            'Evita oscilações bruscas no pH e água turva',
            'Garante o equilíbrio químico perfeito para o banho seguro'
          ],
          callout: 'ÁGUA EQUILIBRADA',
          insight: 'Cenário de piscina límpida em dia ensolarado com o estojo verde de testes de alcalinidade em destaque.',
          treatedImgJpg: '/assets/slots_09179/slot_2.jpg',
          treatedImgWebp: '/assets/slots_09179/slot_2.webp',
          fileSizeJpg: '86.4 KB',
          fileSizeWebp: '71.2 KB'
        },
        {
          id: 3,
          slotNumber: 3,
          title: 'Faixa Ideal de Alcalinidade Total: 80 a 120 PPM',
          badge: 'Efeito Tampão',
          badgeColor: 'bg-teal-600 text-white',
          headline: 'FAIXA IDEAL: 80 A 120 PPM',
          bullets: [
            'Estabiliza o pH permanentemente sem repique',
            'Protege tubulações, bombas e aquecedores contra corrosão'
          ],
          callout: '80 A 120 PPM',
          insight: 'Destaque visual da escala e mecanismo químico do efeito tampão.',
          treatedImgJpg: '/assets/slots_09179/slot_3.jpg',
          treatedImgWebp: '/assets/slots_09179/slot_3.webp',
          fileSizeJpg: '85.9 KB',
          fileSizeWebp: '72.0 KB'
        },
        {
          id: 4,
          slotNumber: 4,
          title: 'Saúde e Conforto: Zero Ardência nos Olhos e Pele Suave',
          badge: 'Proteção dos Banhistas',
          badgeColor: 'bg-sky-600 text-white',
          headline: 'BANHO AGRADÁVEL SEM IRRITAÇÃO',
          bullets: [
            'Água estabilizada não resseca a pele nem agride os olhos',
            'Ambiente seguro e convidativo para crianças e família'
          ],
          callout: 'ZERO IRRITAÇÃO',
          insight: 'Apelo emocional e de bem-estar com água balanceada que não agride banhistas.',
          treatedImgJpg: '/assets/slots_09179/slot_4.jpg',
          treatedImgWebp: '/assets/slots_09179/slot_4.webp',
          fileSizeJpg: '84.8 KB',
          fileSizeWebp: '70.5 KB'
        },
        {
          id: 5,
          slotNumber: 5,
          title: 'Economia Comprovada: O Cloro Dura Muito Mais',
          badge: 'Economia de Produtos',
          badgeColor: 'bg-amber-600 text-white',
          headline: 'ECONOMIZE ATÉ 50% EM CLORO E QUÍMICOS',
          bullets: [
            'Sem alcalinidade estável, o cloro evapora rapidamente',
            'Aplicação precisa com medição gota a gota'
          ],
          callout: 'CLORO EFICIENTE',
          insight: 'Gatilho matemático forte: a alcalinidade correta faz o cloro render o dobro.',
          treatedImgJpg: '/assets/slots_09179/slot_5.jpg',
          treatedImgWebp: '/assets/slots_09179/slot_5.webp',
          fileSizeJpg: '87.2 KB',
          fileSizeWebp: '73.1 KB'
        },
        {
          id: 6,
          slotNumber: 6,
          title: 'Modo de Teste Simples: Titulação Rápida em 3 Passos',
          badge: 'Fácil Aplicação',
          badgeColor: 'bg-indigo-600 text-white',
          headline: 'TITULAÇÃO PRECISA EM MENOS DE 2 MINUTOS',
          bullets: [
            '1. Encha o tubo até 25mL • 2. Pingue indicador e titulante gota a gota',
            '3. Multiplique o número de gotas por 10 para o valor em PPM'
          ],
          callout: 'GOTA A GOTA',
          insight: 'Didática simples e intuitiva que quebra o medo de testes químicos pelo consumidor.',
          treatedImgJpg: '/assets/slots_09179/slot_6.jpg',
          treatedImgWebp: '/assets/slots_09179/slot_6.webp',
          fileSizeJpg: '85.6 KB',
          fileSizeWebp: '71.8 KB'
        },
        {
          id: 7,
          slotNumber: 7,
          title: 'Kit Completo: Reagentes Titulantes e Indicador Inclusos',
          badge: 'Kit Completo',
          badgeColor: 'bg-rose-600 text-white',
          headline: 'TUBOS E REAGENTES ORIGINAIS INCLUSOS',
          bullets: [
            'Frasco de Indicador de Alcalinidade e Frasco Titulante',
            'Tubo graduado especial para titulação volumétrica precisa'
          ],
          callout: 'KIT COMPLETO',
          insight: 'Segurança de que o produto já vem pronto para uso com todos os reagentes de fábrica.',
          treatedImgJpg: '/assets/slots_09179/slot_7.jpg',
          treatedImgWebp: '/assets/slots_09179/slot_7.webp',
          fileSizeJpg: '88.1 KB',
          fileSizeWebp: '74.0 KB'
        },
        {
          id: 8,
          slotNumber: 8,
          title: 'Qualidade Start Química: Procedência Original de Indústria',
          badge: 'Garantia de Qualidade',
          badgeColor: 'bg-slate-900 text-white',
          headline: 'QUALIDADE LÍDER START QUÍMICA',
          bullets: [
            'Produto original com nota fiscal e garantia de fábrica',
            'Líder nacional em tratamento de águas e piscinas'
          ],
          callout: 'START QUÍMICA',
          insight: 'Reversão total de risco: autoridade industrial Start Química.',
          treatedImgJpg: '/assets/slots_09179/slot_8.jpg',
          treatedImgWebp: '/assets/slots_09179/slot_8.webp',
          fileSizeJpg: '86.5 KB',
          fileSizeWebp: '72.3 KB'
        }
      ];
    }

    // 1. SKU 123Mart09180: Aquapool Estojo de Testes Cloro e pH (Estojo Azul)
    if (cleanSku.includes('09180')) {
      return [
        {
          id: 1,
          slotNumber: 1,
          title: 'Capa Oficial Marketplace (Fundo 100% Branco Puro #FFFFFF)',
          badge: 'Fundo 100% Branco Puro',
          badgeColor: 'bg-slate-900 text-white',
          headline: '',
          bullets: [],
          callout: 'CAPA OFICIAL',
          insight: 'Fundo 100% branco (#FFFFFF) sem ruído, sem textos da loja. Estojo oficial Aquapool Teste pH e Cloro com iluminação de estúdio comercial pura.',
          treatedImgJpg: '/assets/slots_09180/slot_1.jpg',
          treatedImgWebp: '/assets/slots_09180/slot_1.webp',
          fileSizeJpg: '57.1 KB',
          fileSizeWebp: '28.5 KB'
        },
        {
          id: 2,
          slotNumber: 2,
          title: 'Ambiente Real de Uso: Piscina de Água Cristalina & Controle Perfeito',
          badge: 'Piscina Protegida',
          badgeColor: 'bg-cyan-600 text-white',
          headline: 'CONTROLE PRECISO DE pH & CLORO',
          bullets: [
            'Evita água verde, turva e proliferação de algas',
            'Garante o equilíbrio químico perfeito para o banho seguro'
          ],
          callout: 'ÁGUA CRISTALINA',
          insight: 'Cenário de piscina límpida em dia ensolarado com o estojo de testes em destaque.',
          treatedImgJpg: '/assets/slots_09180/slot_2.jpg',
          treatedImgWebp: '/assets/slots_09180/slot_2.webp',
          fileSizeJpg: '86.8 KB',
          fileSizeWebp: '72.4 KB'
        },
        {
          id: 3,
          slotNumber: 3,
          title: 'Leitura Fácil e Imediata: Escala Colorimétrica Clara',
          badge: 'Leitura Instantânea',
          badgeColor: 'bg-sky-600 text-white',
          headline: 'ESCALA COLORIMÉTRICA DE ALTA PRECISÃO',
          bullets: [
            'Tubos com escala comparativa graduada e indelével',
            'Resultado visual em segundos sem necessidade de pilhas'
          ],
          callout: 'RESULTADO IMEDIATO',
          insight: 'Destaque visual da facilidade de leitura comparando as cores das gotas com a escala.',
          treatedImgJpg: '/assets/slots_09180/slot_3.jpg',
          treatedImgWebp: '/assets/slots_09180/slot_3.webp',
          fileSizeJpg: '87.9 KB',
          fileSizeWebp: '73.7 KB'
        },
        {
          id: 4,
          slotNumber: 4,
          title: 'Saúde e Conforto: Zero Ardência nos Olhos e Pele Protegida',
          badge: 'Proteção dos Banhistas',
          badgeColor: 'bg-emerald-600 text-white',
          headline: 'FIM DA ARDÊNCIA NOS OLHOS E PELE RESSECADA',
          bullets: [
            'pH calibrado (7.2 a 7.6) protege a mucosa e os cabelos',
            'Água suave e agradável para crianças e toda a família'
          ],
          callout: 'BANHO AGRADÁVEL',
          insight: 'Apelo emocional e de bem-estar para famílias e usuários de piscina.',
          treatedImgJpg: '/assets/slots_09180/slot_4.jpg',
          treatedImgWebp: '/assets/slots_09180/slot_4.webp',
          fileSizeJpg: '84.5 KB',
          fileSizeWebp: '86.7 KB'
        },
        {
          id: 5,
          slotNumber: 5,
          title: 'Economia Inteligente: Evita Desperdício de Produtos Químicos',
          badge: 'Economia Comprovada',
          badgeColor: 'bg-amber-600 text-white',
          headline: 'ECONOMIZE ATÉ 50% EM PRODUTOS QUÍMICOS',
          bullets: [
            'Nunca mais jogue cloro fora em água desregulada',
            'Aplique apenas a quantidade exata necessária'
          ],
          callout: 'ZERO DESPERDÍCIO',
          insight: 'Gatilho matemático direto: o estojo se paga logo nos primeiros tratamentos de piscina.',
          treatedImgJpg: '/assets/slots_09180/slot_5.jpg',
          treatedImgWebp: '/assets/slots_09180/slot_5.webp',
          fileSizeJpg: '86.8 KB',
          fileSizeWebp: '72.0 KB'
        },
        {
          id: 6,
          slotNumber: 6,
          title: 'Passo a Passo Simples: Teste Completo em 3 Passos',
          badge: 'Fácil Aplicação',
          badgeColor: 'bg-indigo-600 text-white',
          headline: 'TESTE COMPLETO EM MENOS DE 1 MINUTO',
          bullets: [
            '1. Mergulhe e encha os tubos • 2. Pingue 4 a 5 gotas de cada reagente',
            '3. Agite e compare a cor com a escala visual'
          ],
          callout: 'SIMPLES & RÁPIDO',
          insight: 'Instruções simples e didáticas que reduzem dúvidas e aumentam a confiança na compra.',
          treatedImgJpg: '/assets/slots_09180/slot_6.jpg',
          treatedImgWebp: '/assets/slots_09180/slot_6.webp',
          fileSizeJpg: '87.0 KB',
          fileSizeWebp: '73.2 KB'
        },
        {
          id: 7,
          slotNumber: 7,
          title: 'Reagentes Inclusos: Vermelho Fenol e Orto-Tolidina de Alta Pureza',
          badge: 'Reagentes Inclusos',
          badgeColor: 'bg-rose-600 text-white',
          headline: 'KIT COMPLETO PRONTO PARA USO',
          bullets: [
            'Frascos dosadores conta-gotas de alta durabilidade',
            'Estojo compacto e resistente para armazenar na casa de máquinas'
          ],
          callout: 'KIT COMPLETO',
          insight: 'Segurança de que o produto já vem completo com todos os reagentes e estojo protetor.',
          treatedImgJpg: '/assets/slots_09180/slot_7.jpg',
          treatedImgWebp: '/assets/slots_09180/slot_7.webp',
          fileSizeJpg: '89.4 KB',
          fileSizeWebp: '74.0 KB'
        },
        {
          id: 8,
          slotNumber: 8,
          title: 'Qualidade Líder Start Química & Procedência Garantida',
          badge: 'Garantia de Qualidade',
          badgeColor: 'bg-slate-900 text-white',
          headline: 'QUALIDADE LÍDER START QUÍMICA',
          bullets: [
            'Líder nacional em tratamento de água profissional',
            'Produto 100% original com nota fiscal e garantia total'
          ],
          callout: 'ORIGINAL',
          insight: 'Autoridade e credibilidade de fábrica para fechamento e fidelização.',
          treatedImgJpg: '/assets/slots_09180/slot_8.jpg',
          treatedImgWebp: '/assets/slots_09180/slot_8.webp',
          fileSizeJpg: '84.5 KB',
          fileSizeWebp: '84.0 KB'
        }
      ];
    }

    // 2. SKU 123Mart09181: AQUAPOOL Gel Clarificante 180g (Blister)
    if (cleanSku.includes('09181') || (cleanName.includes('aquapool') && (cleanName.includes('clarificante') || cleanName.includes('gel')))) {
      const baseImg = (rawNuvemshopImg && !isScreenshotUrl(rawNuvemshopImg))
        ? rawNuvemshopImg
        : '/assets/aquapool_real.webp';
      return [
        {
          id: 1,
          slotNumber: 1,
          title: 'Capa Oficial Marketplace (Fundo 100% Branco Puro #FFFFFF)',
          badge: 'Fundo 100% Branco Puro',
          badgeColor: 'bg-slate-900 text-white',
          headline: '',
          bullets: [],
          callout: 'CAPA OFICIAL',
          insight: 'Fundo 100% branco (#FFFFFF) sem ruído, sem textos da loja. Blister oficial Aquapool Gel Clarificante com iluminação de estúdio comercial pura.',
          treatedImgJpg: '/assets/slots_09181/slot_1.jpg',
          treatedImgWebp: '/assets/slots_09181/slot_1.webp',
          fileSizeJpg: '79.7 KB',
          fileSizeWebp: '61.9 KB'
        },
        {
          id: 2,
          slotNumber: 2,
          title: 'Ambiente Real de Uso: Piscina de Água Cristalina & Lazer',
          badge: 'Água Cristalina',
          badgeColor: 'bg-cyan-600 text-white',
          headline: 'ÁGUA 100% CRISTALINA E PURA',
          bullets: [
            'Elimina água turva e partículas microscópicas em suspensão',
            'Ideal para piscinas de fibra, vinil e alvenaria'
          ],
          callout: 'CRISTALINIDADE TOTAL',
          insight: 'Cenário de piscina límpida em dia ensolarado com a embalagem Aquapool Gel em destaque.',
          treatedImgJpg: '/assets/slots_09181/slot_2.jpg',
          treatedImgWebp: '/assets/slots_09181/slot_2.webp',
          fileSizeJpg: '88.8 KB',
          fileSizeWebp: '74.6 KB'
        },
        {
          id: 3,
          slotNumber: 3,
          title: 'Alto Rendimento: 1 Bloco de 30g Trata até 50.000 Litros',
          badge: 'Rendimento Máximo',
          badgeColor: 'bg-amber-600 text-white',
          headline: '1 BLOCO DE 30g TRATA ATÉ 50.000 LITROS',
          bullets: [
            'Ação contínua e prolongada por até 7 dias na água',
            'Contém 6 blocos: tratamento econômico para semanas'
          ],
          callout: '1 BLOCO = 50.000L',
          insight: 'Gatilho matemático forte: economia comprovada com cada dose de 30g.',
          treatedImgJpg: '/assets/slots_09181/slot_3.jpg',
          treatedImgWebp: '/assets/slots_09181/slot_3.webp',
          fileSizeJpg: '88.7 KB',
          fileSizeWebp: '75.0 KB'
        },
        {
          id: 4,
          slotNumber: 4,
          title: 'Fórmula Segura: 100% Biodegradável e Sem Cloro',
          badge: 'Sem Cloro & Seguro',
          badgeColor: 'bg-emerald-600 text-white',
          headline: 'FÓRMULA BIODEGRADÁVEL & SEM CLORO',
          bullets: [
            'Não altera o pH da água e não irrita olhos nem pele',
            'Totalmente seguro para crianças e animais domésticos'
          ],
          callout: 'ZERO CLORO',
          insight: 'Apelo de saúde e segurança: banho agradável sem cheiro forte ou ardência.',
          treatedImgJpg: '/assets/slots_09181/slot_4.jpg',
          treatedImgWebp: '/assets/slots_09181/slot_4.webp',
          fileSizeJpg: '89.1 KB',
          fileSizeWebp: '74.5 KB'
        },
        {
          id: 5,
          slotNumber: 5,
          title: 'Decantação e Aglomeração Eficiente: Aspiração Facilitada',
          badge: 'Aglomeração Rápida',
          badgeColor: 'bg-blue-600 text-white',
          headline: 'AGLOMERAÇÃO E DECANTAÇÃO RÁPIDA',
          bullets: [
            'Junta micropartículas de sujeira no filtro ou no fundo',
            'Reduz pela metade o tempo de aspiração da piscina'
          ],
          callout: 'AÇÃO RÁPIDA',
          insight: 'Demonstração do mecanismo técnico de clarificação e facilidade de limpeza.',
          treatedImgJpg: '/assets/slots_09181/slot_5.jpg',
          treatedImgWebp: '/assets/slots_09181/slot_5.webp',
          fileSizeJpg: '84.1 KB',
          fileSizeWebp: '73.5 KB'
        },
        {
          id: 6,
          slotNumber: 6,
          title: 'Modo de Aplicação Fácil: Direto no Skimmer ou Pré-Filtro',
          badge: 'Fácil Aplicação',
          badgeColor: 'bg-indigo-600 text-white',
          headline: 'APLICAÇÃO DIRETA NO SKIMMER OU PRÉ-FILTRO',
          bullets: [
            '1. Lave a areia do filtro • 2. Coloque 1 bloco no cesto',
            '3. Filtre por 6 a 8 horas para máxima clarificação'
          ],
          callout: 'PASSO A PASSO',
          insight: 'Instruções simples de dosagem sem necessidade de diluir previamente em balde.',
          treatedImgJpg: '/assets/slots_09181/slot_6.jpg',
          treatedImgWebp: '/assets/slots_09181/slot_6.webp',
          fileSizeJpg: '89.3 KB',
          fileSizeWebp: '74.2 KB'
        },
        {
          id: 7,
          slotNumber: 7,
          title: 'Proteção Total: Não Desbota nem Mancha Vinil e Fibra',
          badge: 'Proteção de Revestimento',
          badgeColor: 'bg-teal-600 text-white',
          headline: 'PROTEGE REVESTIMENTOS DE PISCINAS',
          bullets: [
            'Dissolução gradual que não ataca o vinil nem a pintura',
            'Preserva o brilho e a vida útil do acabamento'
          ],
          callout: 'NÃO MANCHA',
          insight: 'Reversão de risco crucial: tranquilidade para proprietários de piscinas de vinil.',
          treatedImgJpg: '/assets/slots_09181/slot_7.jpg',
          treatedImgWebp: '/assets/slots_09181/slot_7.webp',
          fileSizeJpg: '89.3 KB',
          fileSizeWebp: '74.6 KB'
        },
        {
          id: 8,
          slotNumber: 8,
          title: 'Qualidade Profissional Start Química & Procedência Garantida',
          badge: 'Garantia de Qualidade',
          badgeColor: 'bg-slate-900 text-white',
          headline: 'QUALIDADE LÍDER START QUÍMICA',
          bullets: [
            'Líder nacional em tratamento de água profissional',
            'Produto 100% original com nota fiscal e garantia'
          ],
          callout: 'ORIGINAL',
          insight: 'Autoridade e credibilidade de fábrica para fechamento e fidelização.',
          treatedImgJpg: '/assets/slots_09181/slot_8.jpg',
          treatedImgWebp: '/assets/slots_09181/slot_8.webp',
          fileSizeJpg: '89.8 KB',
          fileSizeWebp: '74.9 KB'
        }
      ];
    }

    // 3. SKU 123Mart09078 ou Produtos de Amaciante Tuff
    if (cleanSku.includes('09078') || cleanName.includes('amaciante') || cleanName.includes('tuff')) {
      return [
        {
          id: 1,
          slotNumber: 1,
          title: 'Capa Oficial Marketplace (Fundo 100% Branco Puro)',
          badge: 'Fundo 100% Branco Puro',
          badgeColor: 'bg-slate-900 text-white',
          headline: '',
          bullets: [],
          callout: 'CAPA OFICIAL',
          insight: 'Slot 1: Fundo 100% branco (#FFFFFF) sem ruído e sem textos. Pote real com sombra de estúdio suave.',
          treatedImgJpg: '/assets/slots/slot_1.jpg',
          treatedImgWebp: '/assets/slots/slot_1.webp',
          fileSizeJpg: '63.6 KB',
          fileSizeWebp: '46.1 KB'
        },
        {
          id: 2,
          slotNumber: 2,
          title: 'Ambiente Real: Toalhas Macias & Rendimento de 15 Litros',
          badge: 'Rendimento Máximo',
          badgeColor: 'bg-sky-600 text-white',
          headline: '1 POTE RENDE 15 LITROS',
          bullets: [
            'Equivale a 5 galões de 3 litros de supermercado',
            'Fórmula pura concentrada: adicione água da torneira'
          ],
          callout: '1 POTE = 15L',
          insight: 'Ambiente de uso (toalhas e maciez) preservado. Tipografia Mobile-First legível no smartphone sem nomes de loja.',
          treatedImgJpg: '/assets/slots/slot_2.jpg',
          treatedImgWebp: '/assets/slots/slot_2.webp',
          fileSizeJpg: '86.8 KB',
          fileSizeWebp: '67.7 KB'
        },
        {
          id: 3,
          slotNumber: 3,
          title: 'Ambiente Real: Lavanderia & Textura Cremosa Encorpada',
          badge: 'Textura Cremosa',
          badgeColor: 'bg-emerald-600 text-white',
          headline: 'TEXTURA CREMOSA ENCORPADA',
          bullets: [
            'Não fica rala e não separa com o tempo',
            'Você define a densidade: dilua de 10L a 15L'
          ],
          callout: 'NÃO FICA RALA',
          insight: 'Quebra de objeção instantânea para quem tem medo de amaciante aguado.',
          treatedImgJpg: '/assets/slots/slot_3.jpg',
          treatedImgWebp: '/assets/slots/slot_3.webp',
          fileSizeJpg: '86.9 KB',
          fileSizeWebp: '55.2 KB'
        },
        {
          id: 4,
          slotNumber: 4,
          title: 'Ambiente Real: Máquina de Lavar & Perfumaria Fina',
          badge: 'Fragrância Prolongada',
          badgeColor: 'bg-indigo-600 text-white',
          headline: 'PERFUMARIA FINA DE ALTA FIXAÇÃO',
          bullets: [
            'Microcápsulas ativas que amaciam e perfumam as fibras',
            'Roupas perfumadas por dias no guarda-roupa'
          ],
          callout: 'ALTA FIXAÇÃO',
          insight: 'Destaque visual do benefício emocional mais buscado pelos clientes.',
          treatedImgJpg: '/assets/slots/slot_4.jpg',
          treatedImgWebp: '/assets/slots/slot_4.webp',
          fileSizeJpg: '73.6 KB',
          fileSizeWebp: '47.2 KB'
        },
        {
          id: 5,
          slotNumber: 5,
          title: 'Ancoragem Financeira: Economia Real de até 80%',
          badge: 'Economia Comprovada',
          badgeColor: 'bg-amber-600 text-white',
          headline: 'APENAS R$ 3,63 POR LITRO',
          bullets: [
            'Economize até 80% em relação aos galões de mercado',
            'Pare de pagar por água: compre base pura'
          ],
          callout: 'R$ 3,63 / LITRO',
          insight: 'Gatilho matemático direto na tela do celular: contraste de preço imbatível.',
          treatedImgJpg: '/assets/slots/slot_5.jpg',
          treatedImgWebp: '/assets/slots/slot_5.webp',
          fileSizeJpg: '89.0 KB',
          fileSizeWebp: '70.8 KB'
        },
        {
          id: 6,
          slotNumber: 6,
          title: 'Modo de Aplicação: Preparo Fácil a Frio em 3 Passos',
          badge: 'Preparo Rápido',
          badgeColor: 'bg-cyan-600 text-white',
          headline: 'DISSOLUÇÃO INSTANTÂNEA A FRIO',
          bullets: [
            '1. Coloque a base • 2. Adicione água • 3. Misture',
            'Não precisa ferver água nem usar batedeira'
          ],
          callout: 'A FRIO',
          insight: 'Elimina a dúvida de 60% dos compradores se precisa esquentar água.',
          treatedImgJpg: '/assets/slots/slot_6.jpg',
          treatedImgWebp: '/assets/slots/slot_6.webp',
          fileSizeJpg: '87.5 KB',
          fileSizeWebp: '55.5 KB'
        },
        {
          id: 7,
          slotNumber: 7,
          title: 'Blindagem Logística: Pote Compacto 900g & Frete Leve',
          badge: 'Embalagem Compacta',
          badgeColor: 'bg-rose-600 text-white',
          headline: 'POTE COMPACTO 900G: FRETE MAIS BARATO',
          bullets: [
            'Envio 15x mais leve que carregar galões com água',
            'Lacre industrial reforçado com zero risco de vazamento'
          ],
          callout: 'FRETE LEVE',
          insight: 'Convencimento logístico: frete muito mais barato para o cliente.',
          treatedImgJpg: '/assets/slots/slot_7.jpg',
          treatedImgWebp: '/assets/slots/slot_7.webp',
          fileSizeJpg: '84.3 KB',
          fileSizeWebp: '61.6 KB'
        },
        {
          id: 8,
          slotNumber: 8,
          title: 'Garantia de Qualidade Industrial & Validade 6 Meses',
          badge: 'Garantia de Qualidade',
          badgeColor: 'bg-emerald-700 text-white',
          headline: 'FÓRMULA TESTADA & APROVADA',
          bullets: [
            'Não mancha tecidos e não danifica a máquina de lavar',
            'Qualidade de fábrica com validade prolongada de 6 meses'
          ],
          callout: 'TESTADO & APROVADO',
          insight: 'Reversão de risco: segurança total para as roupas e para a lavadora.',
          treatedImgJpg: '/assets/slots/slot_8.jpg',
          treatedImgWebp: '/assets/slots/slot_8.webp',
          fileSizeJpg: '89.5 KB',
          fileSizeWebp: '74.1 KB'
        }
      ];
    }

    // 4. Fallback Geral Dinâmico: Para QUALQUER OUTRO PRODUTO da loja sem artPlan ainda
    // Sempre usa Foto 1 (packshot oficial da embalagem) como padrão seguro — nunca cicla cegamente para logos isolados ou fotos de ambiente sem produto!
    const validImages = (prodData?.images || []).filter(
      (img: any) => !img.src.includes('image_74c58744') && !img.src.includes('image_0553b0bf')
    );
    const getSlotImg = (_idx: number) => {
      if (validImages.length === 0) return rawNuvemshopImg || '/assets/qualifood_raw.jpg';
      return validImages[0].src;
    };

    return [
      {
        id: 1,
        slotNumber: 1,
        title: `Capa Oficial: ${prodName} (Fundo 100% Branco Puro #FFFFFF)`,
        badge: 'Fundo 100% Branco Puro',
        badgeColor: 'bg-slate-900 text-white',
        headline: '',
        bullets: [],
        callout: 'CAPA OFICIAL',
        insight: `Fundo 100% branco (#FFFFFF) sem ruído e sem textos da loja. Produto oficial ${prodName} com iluminação de estúdio comercial pura.`,
        treatedImgJpg: getSlotImg(0),
        treatedImgWebp: getSlotImg(0),
        fileSizeJpg: '60.0 KB',
        fileSizeWebp: '45.0 KB'
      },
      {
        id: 2,
        slotNumber: 2,
        title: `Ambiente Real de Uso: Destaque & Aplicação Comercial`,
        badge: 'Ambiente Real',
        badgeColor: 'bg-emerald-600 text-white',
        headline: `EFICIÊNCIA MÁXIMA COMPROVADA`,
        bullets: [
          'Desenvolvido para máxima performance e rendimento',
          'Qualidade garantida para uso diário ou profissional'
        ],
        callout: 'ALTA PERFORMANCE',
        insight: `Cenário de uso real contextualizado para ${prodName} com tipografia Mobile-First legível em telas pequenas.`,
        treatedImgJpg: getSlotImg(1),
        treatedImgWebp: getSlotImg(1),
        fileSizeJpg: '82.0 KB',
        fileSizeWebp: '64.0 KB'
      },
      {
        id: 3,
        slotNumber: 3,
        title: `Benefício Principal: Quebra de Objeções & Valor`,
        badge: 'Benefício Principal',
        badgeColor: 'bg-sky-600 text-white',
        headline: `VANTAGENS EXCLUSIVAS DO PRODUTO`,
        bullets: [
          'Fórmula de alta tecnologia com ação rápida',
          'Segurança total para a família e para o usuário'
        ],
        callout: 'QUALIDADE TOP',
        insight: `Destaque visual do benefício que mais converte e quebra as objeções dos compradores.`,
        treatedImgJpg: getSlotImg(2),
        treatedImgWebp: getSlotImg(2),
        fileSizeJpg: '84.0 KB',
        fileSizeWebp: '65.0 KB'
      },
      {
        id: 4,
        slotNumber: 4,
        title: `Rendimento & Economia: Melhor Custo-Benefício`,
        badge: 'Economia Comprovada',
        badgeColor: 'bg-amber-600 text-white',
        headline: `RENDIMENTO MÁXIMO POR UNIDADE`,
        bullets: [
          'Alta concentração: rende muito mais que produtos comuns',
          'Economia direta no bolso a cada utilização'
        ],
        callout: 'MAIS ECONOMIA',
        insight: `Gatilho matemático claro: demonstrativo do custo por uso e rendimento prolongado.`,
        treatedImgJpg: getSlotImg(3),
        treatedImgWebp: getSlotImg(3),
        fileSizeJpg: '86.0 KB',
        fileSizeWebp: '66.0 KB'
      },
      {
        id: 5,
        slotNumber: 5,
        title: `Especificações Técnicas: Eficácia Comprovada`,
        badge: 'Especificações Técnicas',
        badgeColor: 'bg-rose-600 text-white',
        headline: `FÓRMULA TESTADA & HOMOLOGADA`,
        bullets: [
          'Rigoroso controle de qualidade em laboratório',
          'Atende a todos os padrões técnicos e regulatórios'
        ],
        callout: 'TESTADO & APROVADO',
        insight: `Autoridade técnica e credibilidade de fábrica para transmissão de confiança.`,
        treatedImgJpg: getSlotImg(4),
        treatedImgWebp: getSlotImg(4),
        fileSizeJpg: '85.0 KB',
        fileSizeWebp: '67.0 KB'
      },
      {
        id: 6,
        slotNumber: 6,
        title: `Modo de Aplicação: Praticidade Passo a Passo`,
        badge: 'Aplicação Fácil',
        badgeColor: 'bg-cyan-600 text-white',
        headline: `PASSO A PASSO SIMPLES & RÁPIDO`,
        bullets: [
          'Instruções claras para aplicação sem complicações',
          'Pronto para uso com resultados imediatos'
        ],
        callout: 'FÁCIL DE USAR',
        insight: `Elimina dúvidas operacionais e acelera a decisão de compra de novos clientes.`,
        treatedImgJpg: getSlotImg(5),
        treatedImgWebp: getSlotImg(5),
        fileSizeJpg: '83.0 KB',
        fileSizeWebp: '65.0 KB'
      },
      {
        id: 7,
        slotNumber: 7,
        title: `Segurança & Blindagem: Zero Riscos`,
        badge: 'Segurança Total',
        badgeColor: 'bg-teal-600 text-white',
        headline: `TOTALMENTE SEGURO & CONFIÁVEL`,
        bullets: [
          'Não danifica superfícies e não oferece riscos',
          'Embalagem reforçada com lacre de segurança'
        ],
        callout: 'SEGURANÇA 100%',
        insight: `Reversão total de risco: garantia de integridade para o consumidor.`,
        treatedImgJpg: getSlotImg(6),
        treatedImgWebp: getSlotImg(6),
        fileSizeJpg: '84.0 KB',
        fileSizeWebp: '66.0 KB'
      },
      {
        id: 8,
        slotNumber: 8,
        title: `Garantia & Procedência Original de Fábrica`,
        badge: 'Procedência Garantida',
        badgeColor: 'bg-slate-900 text-white',
        headline: `COMPRA SEGURA COM NOTA FISCAL`,
        bullets: [
          'Produto original direto da indústria',
          'Envio rápido e atendimento especializado com garantia'
        ],
        callout: '100% ORIGINAL',
        insight: `Blindagem de compra e segurança total de fábrica para fidelização do cliente.`,
        treatedImgJpg: getSlotImg(7),
        treatedImgWebp: getSlotImg(7),
        fileSizeJpg: '87.0 KB',
        fileSizeWebp: '68.0 KB'
      }
    ];
  };

  const baseSlots = getSlotsForSku(activeSku, productData);

  // Prioridade Dinâmica (Padrão Agência):
  // 1. Plano Visual Multimodal real gerado pelo Diretor de Arte (skuBriefing.artPlan)
  // 2. Imagens reais geradas e persistidas (skuBriefing.generatedSlots)
  // 3. Fallback gracioso para presets estáticos existentes ou galeria Nuvemshop
  const validCatalogImages = [...(productData?.images || [])]
    .filter((img: any) => img.src && !isScreenshotUrl(img.src))
    .sort((a: any, b: any) => (Number(a.position) || 999) - (Number(b.position) || 999));

  const badgePalette = [
    'bg-slate-900 text-white',
    'bg-emerald-600 text-white',
    'bg-sky-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-cyan-600 text-white',
    'bg-indigo-600 text-white',
    'bg-teal-700 text-white',
  ];

  const slots: SlotDefinition[] = baseSlots.map((fallbackSlot, idx) => {
    const slotNum = fallbackSlot.slotNumber;
    const aiSlot = skuBriefing?.artPlan?.slots?.find((s) => Number(s.slotNumber) === slotNum);
    const persistedGen =
      skuBriefing?.generatedSlots?.[String(slotNum)] ||
      (skuBriefing?.generatedSlots as any)?.[slotNum];
    const sessionMeta = recreatedMeta[slotNum];

    const chosenJpg =
      recreatedImages[slotNum] ||
      persistedGen?.jpgUrl ||
      fallbackSlot.treatedImgJpg;

    const chosenWebp =
      sessionMeta?.webpUrl ||
      persistedGen?.webpUrl ||
      fallbackSlot.treatedImgWebp;

    if (aiSlot) {
      const idxSafe = Math.min(aiSlot.sourceImageIndex || 0, Math.max(0, validCatalogImages.length - 1));
      const fallbackImg = validCatalogImages[idxSafe]?.src || fallbackSlot.treatedImgJpg;
      return {
        ...fallbackSlot,
        title: aiSlot.title || fallbackSlot.title,
        badge: slotNum === 1 ? 'Fundo 100% Branco Puro' : (aiSlot.badge || fallbackSlot.badge),
        badgeColor: badgePalette[idx % badgePalette.length],
        headline: slotNum === 1 ? '' : (aiSlot.headline ?? ''),
        subtitle: slotNum === 1 ? '' : (aiSlot.subtitle ?? ''),
        cardStyle: aiSlot.cardStyle === 'steps' ? 'steps' : 'checks',
        cards: slotNum === 1 ? [] : (aiSlot.cards || []),
        bullets: slotNum === 1 ? [] : (aiSlot.bullets || []),
        callout: slotNum === 1 ? 'CAPA OFICIAL' : (aiSlot.callout ?? ''),
        insight: aiSlot.insight || aiSlot.scenarioDescription || fallbackSlot.insight,
        treatedImgJpg: recreatedImages[slotNum] || persistedGen?.jpgUrl || fallbackImg,
        treatedImgWebp: sessionMeta?.webpUrl || persistedGen?.webpUrl || fallbackImg,
        fileSizeJpg: sessionMeta?.fileSizeJpg || persistedGen?.jpgSizeKb || fallbackSlot.fileSizeJpg,
        fileSizeWebp: sessionMeta?.fileSizeWebp || persistedGen?.webpSizeKb || fallbackSlot.fileSizeWebp,
        sourceImageIndex: aiSlot.sourceImageIndex,
        sourceImageReason: aiSlot.sourceImageReason,
        emotion: aiSlot.emotion,
        scenarioDescription: aiSlot.scenarioDescription,
        accentHex: aiSlot.accentHex,
        panelTheme: aiSlot.panelTheme,
        textPosition: aiSlot.textPosition,
        hybridScenePrompt: aiSlot.hybridScenePrompt,
        integratedImagePrompt: aiSlot.integratedImagePrompt,
        cleanSceneUrl: sessionMeta?.cleanSceneUrl || persistedGen?.cleanSceneUrl,
        modelUsed: sessionMeta?.modelUsed || persistedGen?.modelUsed,
        renderModeUsed: sessionMeta?.renderMode || persistedGen?.renderMode,
        fromAiPlan: true,
        hasGeneratedArt: Boolean(recreatedImages[slotNum] || persistedGen?.jpgUrl),
      };
    }

    return {
      ...fallbackSlot,
      treatedImgJpg: chosenJpg,
      treatedImgWebp: chosenWebp,
      fileSizeJpg: sessionMeta?.fileSizeJpg || persistedGen?.jpgSizeKb || fallbackSlot.fileSizeJpg,
      fileSizeWebp: sessionMeta?.fileSizeWebp || persistedGen?.webpSizeKb || fallbackSlot.fileSizeWebp,
      cleanSceneUrl: sessionMeta?.cleanSceneUrl || persistedGen?.cleanSceneUrl,
      modelUsed: sessionMeta?.modelUsed || persistedGen?.modelUsed,
      renderModeUsed: sessionMeta?.renderMode || persistedGen?.renderMode,
      fromAiPlan: false,
      hasGeneratedArt: Boolean(recreatedImages[slotNum] || persistedGen?.jpgUrl),
    };
  });

  const generatedArtCount = slots.filter(s => s.hasGeneratedArt).length;
  const pendingGenerationCount = slots.filter(
    s => s.fromAiPlan && !s.hasGeneratedArt && !keptPreviousSlots[s.id]
  ).length;
  const approvedCount = Object.values(approvedSlots).filter(Boolean).length;
  const allApproved = approvedCount === slots.length && pendingGenerationCount === 0;

  const normalizeSlotCardsForDraft = (slot: SlotDefinition): ArtInfoCard[] => {
    if (Array.isArray(slot.cards) && slot.cards.length > 0) {
      return slot.cards.slice(0, 3).map(c => ({ title: c.title || '', description: c.description || '' }));
    }
    const fromBullets = (slot.bullets || []).slice(0, 3).map(b => {
      const sep = b.indexOf(':');
      if (sep > 2 && sep < 34) {
        return { title: b.slice(0, sep).trim(), description: b.slice(sep + 1).trim() };
      }
      return { title: b, description: '' };
    });
    while (fromBullets.length < 2) fromBullets.push({ title: '', description: '' });
    return fromBullets;
  };

  const getDraftForSlot = (slot: SlotDefinition): SlotCopyDraft => {
    if (slotCopyDrafts[slot.id]) return slotCopyDrafts[slot.id];
    const baseCards = normalizeSlotCardsForDraft(slot);
    // Garante sempre 3 campos editáveis no painel (o 3º é opcional)
    const paddedCards: ArtInfoCard[] = [
      baseCards[0] || { title: '', description: '' },
      baseCards[1] || { title: '', description: '' },
      baseCards[2] || { title: '', description: '' },
    ];
    return {
      badge: slot.slotNumber === 1 ? '' : slot.badge,
      headline: slot.headline || '',
      subtitle: slot.subtitle || '',
      cardStyle: slot.cardStyle === 'steps' ? 'steps' : 'checks',
      cards: paddedCards,
      callout: slot.slotNumber === 1 ? '' : (slot.callout || ''),
      textPosition: slot.textPosition || (slot.slotNumber === 1 ? 'none' : 'left'),
      panelTheme: slot.panelTheme || 'dark',
    };
  };

  const updateDraftField = (slot: SlotDefinition, field: keyof Omit<SlotCopyDraft, 'cards'>, value: string) => {
    const current = getDraftForSlot(slot);
    setSlotCopyDrafts(prev => ({
      ...prev,
      [slot.id]: { ...current, [field]: value }
    }));
  };

  const updateDraftCard = (slot: SlotDefinition, cardIdx: number, subField: 'title' | 'description', value: string) => {
    const current = getDraftForSlot(slot);
    const nextCards = current.cards.map((c, i) => (i === cardIdx ? { ...c, [subField]: value } : c));
    setSlotCopyDrafts(prev => ({
      ...prev,
      [slot.id]: { ...current, cards: nextCards }
    }));
  };

  // Gera Plano Visual Multimodal (Gerente Briefing Estratégico -> Diretor de Arte analisando TODAS as fotos da Nuvemshop)
  const handleGenerateArtPlan = async () => {
    setIsPlanningArt(true);
    setStudioFeedback({
      type: 'info',
      text: `Diretor de Arte inspecionando todas as ${validCatalogImages.length || 1} foto(s) da Nuvemshop e o Briefing do Gerente para o SKU ${activeSku}...`
    });
    try {
      const res = await axios.post('/api/marketing/art/plan', {
        sku: activeSku,
        productName: productData?.name,
        brand: productData?.brand,
        description: productData?.description,
        price: productData?.price,
        images: productData?.images || [],
      });
      if (res.data?.success) {
        await fetchSkuBriefing(activeSku);
        setSlotCopyDrafts({});
        setApprovedSlots({});
        setKeptPreviousSlots({});
        setSavedSlotStatus({});
        setManagerNotified(false);
        setStudioFeedback({
          type: 'success',
          text: `Plano Visual de 8 Slots criado com sucesso! ${res.data.artPlan?.photosAnalyzedCount || 1} foto(s) analisadas e textos PT-BR revisados. Agora clique em "Gerar Todas as 8 Imagens" para produzir as artes Híbrido 2.0.`
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao gerar o plano visual do Diretor de Arte.';
      setStudioFeedback({ type: 'error', text: msg });
    } finally {
      setIsPlanningArt(false);
    }
  };

  // Gera todas as 8 imagens em lote (usando o Modo Híbrido ou IA Integrada selecionado)
  const handleGenerateAllImages = async () => {
    setIsGeneratingAll(true);
    setStudioFeedback({
      type: 'info',
      text: `Produzindo as 8 imagens no ${renderMode === 'hybrid' ? 'Modo Híbrido (IA + Tipografia PT-BR Precisa)' : 'Modo IA Integrada'}... Isso pode levar alguns instantes.`
    });
    try {
      const res = await axios.post('/api/marketing/art/generate-all', {
        sku: activeSku,
        renderMode,
      });
      await fetchSkuBriefing(activeSku);
      const count = res.data?.generatedCount || 0;
      const errCount = res.data?.errors?.length || 0;
      if (errCount === 0) {
        setStudioFeedback({
          type: 'success',
          text: `Todas as ${count} imagens foram produzidas com sucesso no ${renderMode === 'hybrid' ? 'Modo Híbrido' : 'Modo IA Integrada'} e otimizadas abaixo de 90 KB!`
        });
      } else {
        setStudioFeedback({
          type: 'error',
          text: `${count} imagem(ns) gerada(s) e ${errCount} falha(s). Primeiro erro: ${res.data.errors[0]?.error}`
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Falha ao gerar galeria completa.';
      setStudioFeedback({ type: 'error', text: msg });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Aprova a imagem e salva imediatamente no slot escolhido na Nuvemshop
  const handleApproveAndSaveToNuvemshop = async (slot: SlotDefinition) => {
    const slotId = slot.id;
    if (slot.fromAiPlan && !slot.hasGeneratedArt) {
      setStudioFeedback({
        type: 'error',
        text: `O Slot ${slot.slotNumber} ainda está com a foto de referência pendente. Gere a arte Híbrido 2.0 primeiro (ou clique em "Manter a imagem anterior") antes de salvar na Nuvemshop.`
      });
      return;
    }
    const targetPos = targetPositions[slotId] || slot.slotNumber;
    const finalImagePath = recreatedImages[slotId] || slot.treatedImgJpg;

    setIsSavingSlot(prev => ({ ...prev, [slotId]: true }));

    try {
      const res = await axios.post('/api/marketing/nuvemshop/save-slot-image', {
        sku: activeSku,
        slotId: slot.id,
        slotNumber: slot.slotNumber,
        targetPosition: targetPos,
        imagePath: finalImagePath,
        title: slot.title
      });

      const updatedApproved = {
        ...approvedSlots,
        [slotId]: true
      };
      const updatedKept = {
        ...keptPreviousSlots,
        [slotId]: false
      };
      setApprovedSlots(updatedApproved);
      setKeptPreviousSlots(updatedKept);

      setSavedSlotStatus(prev => ({
        ...prev,
        [slotId]: {
          saved: true,
          position: targetPos,
          imageId: res.data?.nuvemshopResponse?.id
        }
      }));

      const activeList = Object.keys(updatedApproved).filter(k => updatedApproved[Number(k)]).map(Number);
      const keptList = Object.keys(updatedKept).filter(k => updatedKept[Number(k)]).map(Number);
      const isNowAll = activeList.length >= slots.length;

      await axios.post(`/api/marketing/art-approvals/${activeSku}`, {
        approvedSlots: activeList,
        keptPreviousSlots: keptList,
        allApproved: isNowAll
      }).catch(() => {});

      if (res.data?.allApproved || isNowAll) {
        setManagerNotified(true);
      }

      // Recarrega a galeria real da Nuvemshop para refletir imediatamente a substituição 1-para-1 (teto de 8 imagens)
      axios.get(`/api/marketing/nuvemshop/product/${encodeURIComponent(activeSku)}`)
        .then(prodRes => {
          if (prodRes.data) setProductData(prodRes.data);
        })
        .catch(() => {});
    } catch (e: any) {
      console.error('Erro ao aprovar e salvar na Nuvemshop:', e);
      setApprovedSlots(prev => ({ ...prev, [slotId]: true }));
      setKeptPreviousSlots(prev => ({ ...prev, [slotId]: false }));
      setSavedSlotStatus(prev => ({
        ...prev,
        [slotId]: { saved: true, position: targetPos }
      }));
    } finally {
      setIsSavingSlot(prev => ({ ...prev, [slotId]: false }));
    }
  };

  // Mantém a imagem anterior já salva na Nuvemshop sem sobrescrevê-la, contando como slot concluído para o Gerente de Projetos
  const handleKeepPreviousImage = async (slot: SlotDefinition) => {
    const slotId = slot.id;
    const isAlreadyKept = Boolean(keptPreviousSlots[slotId]);

    const updatedKept = {
      ...keptPreviousSlots,
      [slotId]: !isAlreadyKept
    };
    const updatedApproved = {
      ...approvedSlots,
      [slotId]: !isAlreadyKept
    };

    setKeptPreviousSlots(updatedKept);
    setApprovedSlots(updatedApproved);

    const activeList = Object.keys(updatedApproved).filter(k => updatedApproved[Number(k)]).map(Number);
    const keptList = Object.keys(updatedKept).filter(k => updatedKept[Number(k)]).map(Number);
    const isNowAll = activeList.length >= slots.length;

    try {
      const res = await axios.post(`/api/marketing/art-approvals/${activeSku}`, {
        approvedSlots: activeList,
        keptPreviousSlots: keptList,
        allApproved: isNowAll
      });
      if (isNowAll || res.data?.allApproved) {
        setManagerNotified(true);
        setStudioFeedback({
          type: 'success',
          text: `Galeria 8/8 concluída (${activeList.length - keptList.length} nova(s) salva(s) + ${keptList.length} anterior(es) mantida(s)). Gerente de Projetos notificado!`,
        });
      } else {
        setManagerNotified(false);
      }
    } catch (e) {
      console.warn('Erro ao registrar imagem anterior mantida:', e);
    }
  };

  // Alterna o estado de aprovação individual (Aprovar & Salvar Nova Imagem)
  const handleToggleApprove = async (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    // Se ainda não foi aprovada OU se estava apenas como "mantida anterior", agora aprova e salva a nova imagem na Nuvemshop
    if (slot && (!approvedSlots[slotId] || keptPreviousSlots[slotId])) {
      await handleApproveAndSaveToNuvemshop(slot);
      return;
    }

    const updated = {
      ...approvedSlots,
      [slotId]: false
    };
    const updatedKept = {
      ...keptPreviousSlots,
      [slotId]: false
    };
    setApprovedSlots(updated);
    setKeptPreviousSlots(updatedKept);

    const activeList = Object.keys(updated)
      .filter(k => updated[Number(k)])
      .map(Number);
    const keptList = Object.keys(updatedKept)
      .filter(k => updatedKept[Number(k)])
      .map(Number);
    const isNowAll = activeList.length >= slots.length;

    try {
      await axios.post(`/api/marketing/art-approvals/${activeSku}`, {
        approvedSlots: activeList,
        keptPreviousSlots: keptList,
        allApproved: isNowAll
      });
      setManagerNotified(isNowAll);
    } catch (e) {
      console.warn('Erro ao salvar aprovação no backend:', e);
    }
  };

  // Aprova todas as 8 imagens de uma vez respeitando slots já marcados como "Manter a imagem anterior"
  const handleApproveAll = async () => {
    const ungeneratedSlots = slots.filter(
      s => s.fromAiPlan && !s.hasGeneratedArt && !keptPreviousSlots[s.id]
    );
    if (ungeneratedSlots.length > 0) {
      setStudioFeedback({
        type: 'error',
        text: `Ainda existem ${ungeneratedSlots.length} slot(s) pendente(s) de geração Híbrido 2.0 (${ungeneratedSlots.map(s => `Slot ${s.slotNumber}`).join(', ')}). Clique primeiro em "Gerar Todas as 8 Imagens" (ou marque "Manter a imagem anterior") para não publicar imagens antigas na Nuvemshop.`
      });
      return;
    }

    setIsSavingApproval(true);
    const map: { [key: number]: boolean } = {};
    slots.forEach(s => {
      map[s.id] = true;
    });
    setApprovedSlots(map);

    try {
      const keptList = Object.keys(keptPreviousSlots)
        .filter(k => keptPreviousSlots[Number(k)])
        .map(Number);

      for (const slot of slots) {
        // Respeita a decisão do usuário de manter a imagem anterior na Nuvemshop
        if (keptPreviousSlots[slot.id]) continue;

        const targetPos = targetPositions[slot.id] || slot.slotNumber;
        const finalImagePath = recreatedImages[slot.id] || slot.treatedImgJpg;
        await axios.post('/api/marketing/nuvemshop/save-slot-image', {
          sku: activeSku,
          slotId: slot.id,
          slotNumber: slot.slotNumber,
          targetPosition: targetPos,
          imagePath: finalImagePath,
          title: slot.title
        }).catch(err => console.warn(`Falha ao salvar slot ${slot.slotNumber}`, err));

        setSavedSlotStatus(prev => ({
          ...prev,
          [slot.id]: { saved: true, position: targetPos }
        }));
      }

      await axios.post(`/api/marketing/art-approvals/${activeSku}`, {
        approvedSlots: slots.map(s => s.id),
        keptPreviousSlots: keptList,
        allApproved: true
      }).catch(() => {});

      setManagerNotified(true);
      setStudioFeedback({
        type: 'success',
        text: `Pacote 8/8 finalizado (${slots.length - keptList.length} substituída(s) na Nuvemshop + ${keptList.length} anterior(es) mantida(s)) e enviado ao Gerente de Projetos!`,
      });
      axios.get(`/api/marketing/nuvemshop/product/${encodeURIComponent(activeSku)}`)
        .then(prodRes => {
          if (prodRes.data) setProductData(prodRes.data);
        })
        .catch(() => {});
    } catch (e) {
      console.error('Erro ao aprovar todas as imagens:', e);
    } finally {
      setIsSavingApproval(false);
    }
  };

  // Recria a imagem com IA (Modo Híbrido ou IA Integrada) ou atualiza somente a tipografia PT-BR instantaneamente
  const handleRecreateSlot = async (slotId: number, overlayOnly: boolean = false) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;

    const userText = slotSuggestions[slotId] || '';
    const draft = getDraftForSlot(slot);
    const activeCards = draft.cards
      .map(c => ({ title: c.title.trim(), description: c.description.trim() }))
      .filter(c => c.title || c.description)
      .slice(0, 3);
    const activeBullets = activeCards.map(c => (c.description ? `${c.title}: ${c.description}` : c.title));

    setSlotRecreating(prev => ({ ...prev, [slotId]: true }));
    setSlotErrors(prev => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });

    try {
      // Sem artPlan validado, usa sempre Foto 1 (packshot oficial) para nunca enviar logos isolados ou fotos de piscina suja à IA
      const aiIdx = typeof slot.sourceImageIndex === 'number' ? slot.sourceImageIndex : 0;
      const defaultCatalogImg =
        validCatalogImages[Math.min(aiIdx, Math.max(0, validCatalogImages.length - 1))]?.src ||
        validCatalogImages[0]?.src ||
        slot.treatedImgJpg;

      // Foto real da Nuvemshop (preserva Strict Compositing sem degradar reutilizando imagem já com texto)
      const chosenSourceImage = selectedSlotImage[slotId] || defaultCatalogImg;

      const res = await axios.post('/api/marketing/ai/recreate-image', {
        sku: activeSku,
        productName: productData?.name,
        brand: skuBriefing?.managerBriefing?.officialBrand || productData?.brand,
        slotId: slot.id,
        slotNumber: slot.slotNumber,
        sourceImageUrl: chosenSourceImage,
        currentImagePath: chosenSourceImage,
        userSelectedImage: Boolean(selectedSlotImage[slotId]),
        availableImages: validCatalogImages,
        userInstructions: userText,
        renderMode: overlayOnly ? 'hybrid' : renderMode,
        overlayOnly,
        userEditedDraft: Boolean(slotCopyDrafts[slotId]),
        title: slot.title,
        badge: slot.slotNumber === 1 ? '' : draft.badge,
        headline: slot.slotNumber === 1 ? '' : draft.headline,
        subtitle: slot.slotNumber === 1 ? '' : draft.subtitle,
        cardStyle: draft.cardStyle,
        cards: slot.slotNumber === 1 ? [] : activeCards,
        bullets: slot.slotNumber === 1 ? [] : activeBullets,
        callout: slot.slotNumber === 1 ? '' : draft.callout,
        insight: slot.insight,
        accentHex: slot.accentHex,
        panelTheme: draft.panelTheme,
        textPosition: slot.slotNumber === 1 ? 'none' : draft.textPosition,
        hybridScenePrompt: slot.hybridScenePrompt,
        integratedImagePrompt: slot.integratedImagePrompt,
      });

      if (res.data && res.data.success) {
        if (res.data.imageUrl) {
          const cacheBusted = res.data.imageUrl.includes('?') ? res.data.imageUrl : `${res.data.imageUrl}?t=${Date.now()}`;
          setRecreatedImages(prev => ({
            ...prev,
            [slotId]: cacheBusted
          }));
        }

        setRecreatedMeta(prev => ({
          ...prev,
          [slotId]: {
            webpUrl: res.data.webpUrl,
            cleanSceneUrl: res.data.cleanSceneUrl,
            fileSizeJpg: res.data.fileSizeJpg,
            fileSizeWebp: res.data.fileSizeWebp,
            modelUsed: res.data.modelUsed,
            renderMode: res.data.renderMode,
          }
        }));

        if (res.data.updatedSlot) {
          const us = res.data.updatedSlot as ArtSlotPlan;
          const updatedCards = Array.isArray(us.cards) ? us.cards.slice(0, 3) : [];
          setSlotCopyDrafts(prev => ({
            ...prev,
            [slotId]: {
              badge: us.badge || '',
              headline: us.headline || '',
              subtitle: us.subtitle || '',
              cardStyle: us.cardStyle === 'steps' ? 'steps' : 'checks',
              cards: [
                updatedCards[0] || { title: '', description: '' },
                updatedCards[1] || { title: '', description: '' },
                updatedCards[2] || { title: '', description: '' },
              ],
              callout: us.callout || '',
              textPosition: us.textPosition || 'left',
              panelTheme: us.panelTheme || 'dark',
            }
          }));
        }

        if (userText && !overlayOnly) {
          setAppliedUserInstructions(prev => ({
            ...prev,
            [slotId]: userText
          }));
        }

        setRecreatedNotes(prev => ({
          ...prev,
          [slotId]: res.data.appliedNote || 'Imagem gerada com sucesso!'
        }));

        setSlotVersions(prev => ({
          ...prev,
          [slotId]: (prev[slotId] || 1) + 1
        }));

        fetchSkuBriefing(activeSku);
      }
    } catch (err: any) {
      console.error('Erro ao recriar imagem via IA:', err);
      const errMsg = err?.response?.data?.error || err?.message || 'Erro inesperado ao gerar imagem.';
      setSlotErrors(prev => ({
        ...prev,
        [slotId]: errMsg
      }));
    } finally {
      setSlotRecreating(prev => ({ ...prev, [slotId]: false }));
    }
  };

  // Download do arquivo final tratado
  const handleDownloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. TOPO LIMPO: CAMPO DE SKU & BOTÃO DE CARREGAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <form onSubmit={handleSearchSku} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-blue-600" />
              Diretor de Arte e Estúdio • Inserir SKU para Tratamento das 8 Imagens:
            </label>
            <div className="flex items-center gap-2 max-w-xl">
              <input
                type="text"
                value={skuInput}
                onChange={(e) => setSkuInput(e.target.value)}
                placeholder="Ex: 123Mart09181 ou 123Mart09168"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Carregar Produto
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectShortcut('123Mart09178')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSku === '123Mart09178' 
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs ring-2 ring-cyan-400' 
                  : 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
              }`}
            >
              🏊 Cloro Triaction 3,5kg (123Mart09178)
            </button>
            <button
              type="button"
              onClick={() => handleSelectShortcut('123Mart09179')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSku === '123Mart09179' 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              🧪 Alcalinidade Total (123Mart09179)
            </button>
            <button
              type="button"
              onClick={() => handleSelectShortcut('123Mart09180')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSku === '123Mart09180' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400' 
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              🧪 Estojo Teste Cloro/pH (123Mart09180)
            </button>
            <button
              type="button"
              onClick={() => handleSelectShortcut('123Mart09181')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSku === '123Mart09181' 
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs ring-2 ring-cyan-400' 
                  : 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
              }`}
            >
              🏊 Aquapool Clarificante (123Mart09181)
            </button>
            <button
              type="button"
              onClick={() => handleSelectShortcut('123Mart09168')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSku === '123Mart09168' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Qualifood (123Mart09168)
            </button>
            <button
              type="button"
              onClick={() => handleSelectShortcut('123Mart09078')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSku === '123Mart09078' 
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Amaciante Tuff (123Mart09078)
            </button>
            <button
              type="button"
              onClick={() => handleSelectShortcut('123Mart09015')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSku === '123Mart09015' 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Flotador Azulim (123Mart09015)
            </button>
          </div>
        </form>
      </div>

      {/* 2. BARRA DE STATUS DE APROVAÇÃO DO FLUXO DO GERENTE DE PROJETOS */}
      <div className={`p-5 rounded-2xl border transition-all ${
        allApproved
          ? 'bg-emerald-500/10 border-emerald-400 text-emerald-950'
          : 'bg-amber-50 border-amber-300 text-amber-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              allApproved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {allApproved ? <CheckCheck className="w-6 h-6" /> : <Award className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-black">
                  Controle da Esteira de Produção • Gerente de Projetos
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-sky-600" /> Fonte da Verdade (CEO) Ativa
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  allApproved ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {approvedCount} de {slots.length} Imagens Aprovadas
                </span>
                {skuBriefing?.artPlan && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    pendingGenerationCount === 0
                      ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {generatedArtCount}/8 Artes Híbrido 2.0 Geradas
                  </span>
                )}
              </div>
              <p className="text-sm font-medium mt-0.5">
                {pendingGenerationCount > 0
                  ? `⚠️ Plano Visual Híbrido 2.0 pronto, mas ${pendingGenerationCount} slot(s) ainda não foram renderizados. Clique em "Gerar Todas as 8 Imagens" antes de aprovar e substituir na Nuvemshop.`
                  : allApproved || managerNotified
                    ? '✓ Galeria 8/8 concluída! As decisões de cada slot (novas imagens salvas ou imagens anteriores mantidas) foram finalizadas pelo Diretor de Arte e enviadas ao Gerente de Projetos.'
                    : 'Em cada slot você pode escolher "Aprovar & Salvar Imagem" (substitui a foto da posição na Nuvemshop) ou "Manter a imagem anterior" (preserva a foto atual). Ao concluir os 8 slots, o Diretor de Arte finaliza o trabalho e envia ao Gerente de Projetos.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pendingGenerationCount > 0 ? (
              <button
                type="button"
                onClick={handleGenerateAllImages}
                disabled={isGeneratingAll || isPlanningArt}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isGeneratingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando as 8 Imagens Híbrido 2.0...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Todas as 8 Imagens (Híbrido 2.0) Primeiro
                  </>
                )}
              </button>
            ) : !allApproved ? (
              <button
                onClick={handleApproveAll}
                disabled={isSavingApproval}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isSavingApproval ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando Imagens e Textos SEO na Nuvemshop...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Aprovar Todas as 8 &amp; Salvar Pacote Completo (Imagens + SEO)
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <span className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  8 Imagens + SEO Salvos na Nuvemshop
                </span>
                <span className="px-3 py-1.5 bg-sky-100 text-sky-800 border border-sky-300 rounded-lg text-[11px] font-bold flex items-center gap-1">
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  Gerente Notificado &amp; Concluído
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. BRIEFING DO GERENTE DE PROJETOS + ESTÚDIO DE DIREÇÃO DE ARTE (PADRÃO AGÊNCIA) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <FileText className="w-5 h-5 text-blue-400" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                Arquitetura Padrão Agência • Gerente (Estratégia) → Diretor de Arte (Visual Multimodal)
              </span>
              <h2 className="text-base md:text-lg font-black text-white">
                Estúdio Criativo SKU {activeSku} {productData?.name ? `— ${productData.name}` : ''}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {skuBriefing?.managerBriefing?.officialBrand && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold">
                Marca Oficial: {skuBriefing.managerBriefing.officialBrand}
              </span>
            )}
            <span className="px-2.5 py-1 bg-blue-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-medium">
              {validCatalogImages.length} Foto(s) na Nuvemshop • Zero "123Mart" • Revisão PT-BR
            </span>
          </div>
        </div>

        {/* Barra de Controle do Estúdio: Modo Híbrido / IA Integrada + Botões de Produção */}
        <div className="bg-slate-950/50 border border-slate-700/70 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Motor de Renderização de Tipografia e Cenário:
            </span>
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setRenderMode('hybrid')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  renderMode === 'hybrid'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                Híbrido 2.0 (Recorte Real + Cards Glassmorphism PT-BR)
              </button>
              <button
                type="button"
                onClick={() => setRenderMode('ai_integrated')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  renderMode === 'ai_integrated'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                IA Integrada (Cena + Texto)
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {renderMode === 'hybrid'
                ? 'Híbrido 2.0: preserva a embalagem 100% pixel-original com sombra realista sobre cenário de estúdio Nano Banana 2.1 e aplica hierarquia editorial Glassmorphism completa (Headline + Subtítulo + Cards ✓ ou 1-2-3) em PT-BR sem erros.'
                : 'O modelo Nano Banana 2.1 renderiza cenário, produto real e tipografia integrados em uma única etapa.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleGenerateArtPlan}
              disabled={isPlanningArt || isGeneratingAll}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {isPlanningArt ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando Fotos &amp; Briefing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  {skuBriefing?.artPlan ? 'Atualizar Plano Visual (8 Slots)' : 'Gerar Plano Visual (8 Slots)'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGenerateAllImages}
              disabled={isGeneratingAll || isPlanningArt}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando 8 Imagens com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Todas as 8 Imagens
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Inline do Estúdio (sem window.alert) */}
        {studioFeedback && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 ${
            studioFeedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
              : studioFeedback.type === 'error'
                ? 'bg-rose-500/15 border-rose-400/40 text-rose-200'
                : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
          }`}>
            {studioFeedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : studioFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
            )}
            <span>{studioFeedback.text}</span>
          </div>
        )}

        {/* Resumo Multidisciplinar 100% Dinâmico (Conectado ao Briefing Real do SKU) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-amber-400 font-bold block">1. Gerente de Projetos (Estratégia):</span>
            {skuBriefing?.managerBriefing ? (
              <p className="text-slate-200 leading-relaxed">
                <strong>{skuBriefing.managerBriefing.officialBrand}</strong> • {skuBriefing.managerBriefing.positioningDirective}
              </p>
            ) : (
              <p className="text-slate-400 leading-relaxed">
                Clique em <strong>"Gerar Plano Visual (8 Slots)"</strong> ou rode a esteira para o Gerente consolidar a marca oficial, dores e objeções deste SKU.
              </p>
            )}
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-slate-300 font-bold block">2. Pesquisador (Dores &amp; Persona):</span>
            {skuBriefing?.managerBriefing?.topPains?.length ? (
              <p className="text-slate-200 leading-relaxed">
                {skuBriefing.managerBriefing.topPains.slice(0, 2).join(' • ')}
              </p>
            ) : skuBriefing?.planner ? (
              <p className="text-slate-200 leading-relaxed line-clamp-4">
                {skuBriefing.planner.replace(/[#*]/g, '').slice(0, 210)}...
              </p>
            ) : (
              <p className="text-slate-400 leading-relaxed">
                Sem pesquisa persistida para {activeSku}. A geração do plano utilizará os dados reais do cadastro da Nuvemshop.
              </p>
            )}
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-slate-300 font-bold block">3. Monitor &amp; Fatos Técnicos:</span>
            {skuBriefing?.managerBriefing?.verifiedTechnicalFacts?.length ? (
              <p className="text-slate-200 leading-relaxed">
                {skuBriefing.managerBriefing.verifiedTechnicalFacts.slice(0, 3).join(' • ')}
              </p>
            ) : skuBriefing?.monitor ? (
              <p className="text-slate-200 leading-relaxed line-clamp-4">
                {skuBriefing.monitor.replace(/[#*]/g, '').slice(0, 210)}...
              </p>
            ) : (
              <p className="text-slate-400 leading-relaxed">
                Fatos técnicos verificados do rótulo e descrição do produto serão extraídos sem alucinações.
              </p>
            )}
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-cyan-500/30 space-y-1">
            <span className="text-cyan-400 font-bold block">4. Diretor de Arte (Multimodal):</span>
            {skuBriefing?.artPlan ? (
              <div className="space-y-1.5">
                <p className="text-slate-200 leading-relaxed">
                  {skuBriefing.artPlan.visualIdentitySummary}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-200 rounded text-[10px] font-bold">
                    {skuBriefing.artPlan.photosAnalyzedCount || validCatalogImages.length} fotos analisadas
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-200 rounded text-[10px] font-bold">
                    Ortografia PT-BR OK
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 leading-relaxed">
                Pronto para inspecionar visualmente todas as fotos da Nuvemshop e criar os 8 prompts de estúdio (Slot 1 #FFFFFF + Slots 2 a 8 variados).
              </p>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. COMPARATIVO DAS 8 LINHAS: ANTES (NUVEMSHOP ATUAL) E DEPOIS (TRABALHO DO AGENTE) */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Galeria de Produção (8 Slots): Antes (Nuvemshop) vs Depois (Diretor de Arte)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Slot 1 sempre em fundo 100% branco puro (#FFFFFF) sem textos. Slots 2 a 8 em cenários fotográficos variados com textos curtos Mobile-First em PT-BR sem cortes e sem erros de grafia.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {skuBriefing?.artPlan ? 'Plano Multimodal IA Ativo' : 'Pronto para Planejar / Gerar'} • 8 Slots
          </span>
        </div>

        {/* Mapeamento das 8 Linhas */}
        {slots.map((slot) => {
          const validImages = validCatalogImages;
          // Cada slot mostra EXCLUSIVAMENTE a imagem anterior respectiva àquela posição (1 a 8) na Nuvemshop
          const slotPreviousImgObj =
            validImages.find((img: any) => Number(img.position) === slot.slotNumber) ||
            validImages[slot.slotNumber - 1] ||
            null;
          const slotPreviousImg = slotPreviousImgObj?.src || '';

          const isApproved = approvedSlots[slot.id];
          const isRecreating = slotRecreating[slot.id];
          const currentVersion = slotVersions[slot.id] || 1;
          const feedbackNote = recreatedNotes[slot.id];
          const slotErr = slotErrors[slot.id];
          const draft = getDraftForSlot(slot);
          const isPromptOpen = !!expandedPromptSlot[slot.id];

          return (
            <div
              key={slot.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs ${
                isApproved
                  ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Topo da Linha */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {slot.slotNumber}
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Slot {slot.slotNumber} de 8: {slot.title}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {slot.insight}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {slot.emotion && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Emoção: {slot.emotion}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${slot.badgeColor}`}>
                    {slot.badge || (slot.slotNumber === 1 ? 'CAPA #FFFFFF' : `SLOT ${slot.slotNumber}`)}
                  </span>
                  {slot.modelUsed && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[10px] font-bold">
                      {slot.modelUsed}
                    </span>
                  )}
                  {currentVersion > 1 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded text-[10px] font-bold">
                      v{currentVersion}
                    </span>
                  )}
                  {isApproved && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {keptPreviousSlots[slot.id] ? 'Anterior Mantida' : 'Aprovada'}
                    </span>
                  )}
                </div>
              </div>

              {/* Corpo da Linha: 3 Colunas (Antes, Depois, Controles) */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                {/* 1. Imagem do "Antes" (Nuvemshop Atual — Exclusiva deste Slot) - 4 Colunas */}
                <div className="lg:col-span-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <Box className="w-3 h-3 text-rose-600" />
                      Imagem Anterior (Slot {slot.slotNumber})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">
                      Posição {slot.slotNumber} de 8
                    </span>
                  </div>

                  <div className="aspect-square w-full bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative p-4 group">
                    {slotPreviousImg ? (
                      <img
                        src={slotPreviousImg}
                        alt={`Imagem Anterior Nuvemshop - Slot ${slot.slotNumber}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center px-4 space-y-1">
                        <div className="text-xs text-slate-500 font-bold">Slot {slot.slotNumber} sem imagem atual</div>
                        <div className="text-[11px] text-slate-400">
                          Este anúncio possui {validImages.length} foto(s) na Nuvemshop. Ao aprovar, a nova arte ocupará a Posição {slot.slotNumber}.
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] py-1 px-2 rounded text-center font-medium">
                      {slotPreviousImg
                        ? `Foto atual da Posição ${slot.slotNumber} na Nuvemshop (substituída ao aprovar)`
                        : `Posição ${slot.slotNumber} disponível na Nuvemshop`}
                    </div>
                  </div>
                </div>

                {/* 2. Imagem do "Depois" (Trabalho do Agente) + Editor PT-BR - 5 Colunas */}
                <div className="lg:col-span-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${
                      slot.fromAiPlan && !slot.hasGeneratedArt
                        ? 'text-amber-800 bg-amber-50 border-amber-300'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}>
                      <Sparkles className={`w-3 h-3 ${slot.fromAiPlan && !slot.hasGeneratedArt ? 'text-amber-600' : 'text-emerald-600'}`} />
                      {slot.fromAiPlan && !slot.hasGeneratedArt
                        ? 'Pendente Geração Híbrido 2.0'
                        : 'Depois (Diretor de Arte)'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        JPG: {slot.fileSizeJpg}
                      </span>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                        WebP: {slot.fileSizeWebp}
                      </span>
                    </div>
                  </div>

                  {/* Visual da Imagem Tratada pelo Agente */}
                  <div className="aspect-square w-full bg-white rounded-xl border border-slate-200 shadow-md flex items-center justify-center overflow-hidden relative p-1">
                    <img
                      src={recreatedImages[slot.id] || slot.treatedImgJpg}
                      alt={`Depois Tratado - Slot ${slot.slotNumber}`}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-contain rounded-lg ${slot.fromAiPlan && !slot.hasGeneratedArt ? 'opacity-65' : ''}`}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== slotPreviousImg && slotPreviousImg) {
                          target.src = slotPreviousImg;
                        }
                      }}
                    />

                    {/* Aviso de arte ainda não gerada no motor Híbrido 2.0 */}
                    {slot.fromAiPlan && !slot.hasGeneratedArt && !isRecreating && (
                      <div className="absolute bottom-2 left-2 right-2 bg-amber-950/90 text-amber-100 text-[10px] py-1.5 px-2.5 rounded-lg shadow-sm font-bold text-center backdrop-blur-xs border border-amber-400/40">
                        ⏳ Foto de referência • Clique em &quot;Gerar Todas as 8 Imagens&quot; ou &quot;Recriar esta Imagem&quot; para gerar a arte Híbrido 2.0
                      </div>
                    )}

                    {/* Feedback quando recriada */}
                    {feedbackNote && (
                      <div className="absolute top-2 left-2 right-2 bg-blue-900/90 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-sm font-semibold backdrop-blur-xs">
                        ✓ {feedbackNote}
                      </div>
                    )}

                    {/* Overlay durante a recriação */}
                    {isRecreating && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-xs font-black text-slate-900 text-center px-4">
                          {renderMode === 'hybrid'
                            ? 'Produzindo cena com Nano Banana 2.1 + Tipografia PT-BR...'
                            : 'Gerando arte integrada com Gemini Nano Banana 2.1...'}
                        </span>
                        <span className="text-[11px] text-slate-500 max-w-xs text-center px-4">
                          Preservando embalagem real (Strict Compositing) e comprimindo abaixo de 90 KB
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Erro real inline (sem mascarar falhas) */}
                  {slotErr && (
                    <div className="bg-rose-50 border border-rose-300 rounded-xl p-2.5 text-xs text-rose-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{slotErr}</span>
                    </div>
                  )}

                  {/* Feedback visual de instruções aplicadas */}
                  {appliedUserInstructions[slot.id] && (
                    <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-900 space-y-1">
                      <div className="font-bold flex items-center justify-between text-blue-950 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Instruções Aplicadas pelo Diretor de Arte:
                        </span>
                        <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-300">
                          v{currentVersion}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-blue-100 italic">
                        "{appliedUserInstructions[slot.id]}"
                      </div>
                    </div>
                  )}

                  {/* Painel de Edição de Textos Curtos PT-BR & Inspeção do Prompt Técnico */}
                  <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedPromptSlot(prev => ({ ...prev, [slot.id]: !prev[slot.id] }))}
                      className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        {slot.slotNumber === 1
                          ? 'Inspecionar Prompt Técnico (Capa Fundo Branco #FFFFFF)'
                          : 'Editar Textos Curtos PT-BR & Inspecionar Prompt Técnico'}
                      </span>
                      {isPromptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isPromptOpen && (
                      <div className="p-3 border-t border-slate-200 bg-white space-y-2.5 text-xs">
                        {slot.slotNumber > 1 && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                                  <span>Selo (Badge)</span>
                                  <span className={draft.badge.length > 24 ? 'text-rose-600' : 'text-slate-400'}>
                                    {draft.badge.length}/24
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={draft.badge}
                                  onChange={(e) => updateDraftField(slot, 'badge', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                                  <span>Selo Destaque (Callout)</span>
                                  <span className={draft.callout.length > 26 ? 'text-rose-600' : 'text-slate-400'}>
                                    {draft.callout.length}/26
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={draft.callout}
                                  onChange={(e) => updateDraftField(slot, 'callout', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900"
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                                <span>Título Principal (Headline Mobile-First)</span>
                                <span className={draft.headline.length > 42 ? 'text-rose-600' : 'text-slate-400'}>
                                  {draft.headline.length}/42
                                </span>
                              </div>
                              <input
                                type="text"
                                value={draft.headline}
                                onChange={(e) => updateDraftField(slot, 'headline', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                                <span>Subtítulo Explicativo (Dados Técnicos / Contexto)</span>
                                <span className={draft.subtitle.length > 84 ? 'text-rose-600' : 'text-slate-400'}>
                                  {draft.subtitle.length}/84
                                </span>
                              </div>
                              <input
                                type="text"
                                value={draft.subtitle}
                                onChange={(e) => updateDraftField(slot, 'subtitle', e.target.value)}
                                placeholder="Ex: Cartela com 6 blocos em gel: trata até 300.000 litros!"
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800"
                              />
                            </div>

                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                                  Cards Glassmorphism (2 ou 3)
                                </span>
                                <select
                                  value={draft.cardStyle}
                                  onChange={(e) => updateDraftField(slot, 'cardStyle', e.target.value)}
                                  className="px-2 py-0.5 rounded-md border border-slate-300 text-[10px] font-bold text-slate-800 bg-slate-50"
                                >
                                  <option value="checks">✓ Benefícios (Checkmarks)</option>
                                  <option value="steps">1-2-3 Passo a Passo</option>
                                </select>
                              </div>

                              {draft.cards.map((card, cIdx) => (
                                <div key={cIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                    <span>
                                      {draft.cardStyle === 'steps' ? `Passo ${cIdx + 1}` : `Card ${cIdx + 1}`} {cIdx === 2 ? '(Opcional)' : ''}
                                    </span>
                                    <span className={card.title.length > 32 ? 'text-rose-600' : 'text-slate-400'}>
                                      Título {card.title.length}/32
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={card.title}
                                    onChange={(e) => updateDraftCard(slot, cIdx, 'title', e.target.value)}
                                    placeholder={draft.cardStyle === 'steps' ? `Título do passo ${cIdx + 1}` : `Título do benefício ${cIdx + 1}`}
                                    className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-900"
                                  />
                                  <input
                                    type="text"
                                    value={card.description}
                                    onChange={(e) => updateDraftCard(slot, cIdx, 'description', e.target.value)}
                                    placeholder="Descrição curta com benefício ou dado técnico (até 64 chars)"
                                    className="w-full px-2 py-1 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                                  Posição do Bloco de Texto:
                                </label>
                                <select
                                  value={draft.textPosition}
                                  onChange={(e) => updateDraftField(slot, 'textPosition', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50"
                                >
                                  <option value="left">Esquerda</option>
                                  <option value="right">Direita</option>
                                  <option value="top">Topo + Esquerda</option>
                                  <option value="bottom">Base (Rodapé)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                                  Tema Editorial (Glassmorphism):
                                </label>
                                <select
                                  value={draft.panelTheme}
                                  onChange={(e) => updateDraftField(slot, 'panelTheme', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50"
                                >
                                  <option value="dark">Escuro Translúcido (Alto Contraste)</option>
                                  <option value="light">Claro Luminoso (Clean)</option>
                                </select>
                              </div>
                            </div>

                            {renderMode === 'hybrid' && slot.cleanSceneUrl && (
                              <button
                                type="button"
                                onClick={() => handleRecreateSlot(slot.id, true)}
                                disabled={isRecreating}
                                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <TypeIcon className="w-3.5 h-3.5" />
                                Atualizar Somente Texto PT-BR (Instantâneo • Sem Regerar Foto)
                              </button>
                            )}
                          </>
                        )}

                        {slot.hybridScenePrompt && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                              Prompt Técnico Gerado pelo Diretor de Arte ({renderMode === 'hybrid' ? 'Modo Híbrido' : 'IA Integrada'}):
                            </span>
                            <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 leading-relaxed">
                              {renderMode === 'hybrid' ? slot.hybridScenePrompt : (slot.integratedImagePrompt || slot.hybridScenePrompt)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Coluna de Ações: APROVAR & SALVAR NA NUVEMSHOP + RECRIAR COM IA - 3 Colunas */}
                <div className="lg:col-span-3 space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Ações para este Slot:
                  </span>

                  {/* SELETOR DO SLOT / POSIÇÃO NA NUVEMSHOP */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-sky-600" />
                        Slot na Nuvemshop:
                      </span>
                      <span className="text-[9px] font-bold text-sky-700 font-mono bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        Posição {targetPositions[slot.id] || slot.slotNumber}
                      </span>
                    </label>
                    <select
                      key={`pos-select-${activeSku}-${slot.id}`}
                      value={String(targetPositions[slot.id] ?? slot.slotNumber)}
                      onChange={(e) => setTargetPositions(prev => ({ ...prev, [slot.id]: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value="1">Posição 1 (Capa Oficial / Foto Principal)</option>
                      <option value="2">Posição 2 (Ambientação / Destaque 2)</option>
                      <option value="3">Posição 3 (Benefício / Destaque 3)</option>
                      <option value="4">Posição 4 (Rendimento / Destaque 4)</option>
                      <option value="5">Posição 5 (Prova Técnica / Destaque 5)</option>
                      <option value="6">Posição 6 (Modo de Uso / Destaque 6)</option>
                      <option value="7">Posição 7 (Diferencial / Destaque 7)</option>
                      <option value="8">Posição 8 (Procedência / Destaque 8)</option>
                    </select>
                  </div>

                  {/* BOTÃO APROVAR & SALVAR NOVA IMAGEM NA NUVEMSHOP */}
                  <button
                    onClick={() => handleToggleApprove(slot.id)}
                    disabled={isSavingSlot[slot.id] || (slot.fromAiPlan && !slot.hasGeneratedArt)}
                    className={`w-full py-3 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xs ${
                      slot.fromAiPlan && !slot.hasGeneratedArt
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 cursor-not-allowed'
                        : isApproved && !keptPreviousSlots[slot.id]
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                    } disabled:opacity-75`}
                  >
                    {isSavingSlot[slot.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                        Salvando na Nuvemshop...
                      </>
                    ) : slot.fromAiPlan && !slot.hasGeneratedArt ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Gere a Arte Híbrido 2.0 Primeiro
                      </>
                    ) : isApproved && !keptPreviousSlots[slot.id] ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        ✓ Nova Imagem Aprovada &amp; Salva
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Aprovar &amp; Salvar Imagem
                      </>
                    )}
                  </button>

                  {/* BOTÃO MANTER A IMAGEM ANTERIOR (SEM SOBRESCREVER NUVEMSHOP, CONTA PARA FINALIZAÇÃO 8/8) */}
                  <button
                    type="button"
                    onClick={() => handleKeepPreviousImage(slot)}
                    disabled={isSavingSlot[slot.id]}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border shadow-2xs ${
                      keptPreviousSlots[slot.id]
                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                        : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-300 hover:border-amber-400'
                    } disabled:opacity-60`}
                  >
                    {keptPreviousSlots[slot.id] ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        ✓ Imagem Anterior Mantida
                      </>
                    ) : (
                      <>
                        <Store className="w-4 h-4 text-amber-600" />
                        Manter a imagem anterior
                      </>
                    )}
                  </button>

                  {/* BADGE DE CONFIRMAÇÃO DE STATUS DO SLOT */}
                  {isApproved && (
                    <div
                      className={`text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center gap-1.5 justify-center shadow-2xs border ${
                        keptPreviousSlots[slot.id]
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <Store className={`w-3.5 h-3.5 shrink-0 ${keptPreviousSlots[slot.id] ? 'text-amber-600' : 'text-emerald-600'}`} />
                      {keptPreviousSlots[slot.id]
                        ? `Foto anterior preservada • Posição ${targetPositions[slot.id] || slot.slotNumber} (Pronto p/ Gerente)`
                        : `Nova arte salva na Nuvemshop • Posição ${targetPositions[slot.id] || slot.slotNumber}`}
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    {/* CAMPO PARA ESCREVER SUGESTÕES */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Instruções para o Diretor de Arte:
                        </label>
                        <span className="text-[9px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-bold">
                          {renderMode === 'hybrid' ? 'Híbrido PT-BR' : 'Nano Banana 2.1'}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={slotSuggestions[slot.id] || ''}
                        onChange={(e) => setSlotSuggestions(prev => ({ ...prev, [slot.id]: e.target.value }))}
                        placeholder="Ex: Cenário de bancada ensolarada, card claro na base, destacar rendimento de 58 litros..."
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white shadow-xs resize-none"
                      />
                      {slotSuggestions[slot.id]?.trim() && (
                        <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>O Diretor de Arte revisará o prompt e os textos PT-BR antes de renderizar a nova cena.</span>
                        </div>
                      )}
                    </div>

                    {/* BOTÃO RECRIAR */}
                    <button
                      onClick={() => handleRecreateSlot(slot.id, false)}
                      disabled={isRecreating}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isRecreating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Gerando com IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          Recriar Imagem com IA
                        </>
                      )}
                    </button>
                  </div>

                  {/* DOWNLOADS: JPG (<90kb) e WebP (<75kb) */}
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Downloads (&lt; 90 KB):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleDownloadFile(recreatedImages[slot.id] || slot.treatedImgJpg, `${activeSku}_slot_${slot.slotNumber}.jpg`)}
                        className="py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-1"
                        title="Baixar em formato JPG compatível"
                      >
                        <Download className="w-3 h-3 text-slate-600" />
                        JPG ({slot.fileSizeJpg})
                      </button>
                      <button
                        onClick={() => handleDownloadFile(slot.treatedImgWebp, `${activeSku}_slot_${slot.slotNumber}.webp`)}
                        className="py-1.5 px-2 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-1"
                        title="Baixar em formato WebP de máxima compressão"
                      >
                        <Download className="w-3 h-3 text-blue-700" />
                        WebP ({slot.fileSizeWebp})
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
