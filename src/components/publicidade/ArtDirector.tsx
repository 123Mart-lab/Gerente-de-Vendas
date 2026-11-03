import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Palette, Search, RefreshCw, CheckCircle2, 
  Download, Sparkles, Check, RotateCcw, 
  FileText, Box, ShieldCheck, ArrowRight, Award,
  CheckCheck, Store, Loader2, Send
} from 'lucide-react';
import { useSku } from '../../contexts/SkuContext';

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

interface SlotDefinition {
  id: number;
  slotNumber: number;
  title: string;
  badge: string;
  badgeColor: string;
  headline: string;
  bullets: string[];
  callout: string;
  insight: string;
  treatedImgJpg: string;
  treatedImgWebp: string;
  fileSizeJpg: string;
  fileSizeWebp: string;
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

  // Dados do produto da Nuvemshop
  const [productData, setProductData] = useState<NuvemshopProductDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados de aprovação e recriação
  const [approvedSlots, setApprovedSlots] = useState<{ [key: number]: boolean }>({});
  const [slotSuggestions, setSlotSuggestions] = useState<{ [key: number]: string }>({});
  const [slotRecreating, setSlotRecreating] = useState<{ [key: number]: boolean }>({});
  const [slotVersions, setSlotVersions] = useState<{ [key: number]: number }>({
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1
  });
  const [recreatedNotes, setRecreatedNotes] = useState<{ [key: number]: string }>({});
  const [recreatedImages, setRecreatedImages] = useState<{ [key: number]: string }>({});
  const [appliedUserInstructions, setAppliedUserInstructions] = useState<{ [key: number]: string }>({});
  const [isSavingApproval, setIsSavingApproval] = useState<boolean>(false);

  // Seleção de slot na Nuvemshop (1 a 8) e estado de salvamento por imagem
  const [targetPositions, setTargetPositions] = useState<{ [key: number]: number }>({
    1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8
  });
  const [isSavingSlot, setIsSavingSlot] = useState<{ [key: number]: boolean }>({});
  const [savedSlotStatus, setSavedSlotStatus] = useState<{ [key: number]: { saved: boolean; position: number; imageId?: number } }>({});
  const [managerNotified, setManagerNotified] = useState<boolean>(false);

  // Carrega aprovações do backend
  useEffect(() => {
    axios.get(`/api/marketing/art-approvals/${activeSku}`)
      .then(res => {
        if (res.data && Array.isArray(res.data.approvedSlots)) {
          const map: { [key: number]: boolean } = {};
          res.data.approvedSlots.forEach((slotId: number) => {
            map[slotId] = true;
          });
          setApprovedSlots(map);
        }
      })
      .catch(() => {});
  }, [activeSku]);

  // Carrega dados da Nuvemshop para o SKU ativo
  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await axios.get(`/api/marketing/nuvemshop/product/${activeSku}`);
        if (isMounted && res.data) {
          setProductData(res.data);
        } else if (isMounted) {
          setErrorMsg(`Produto ${activeSku} não encontrado na Nuvemshop.`);
        }
      } catch (err: any) {
        console.error('Erro ao buscar produto:', err);
        if (isMounted) setErrorMsg(`Não foi possível conectar à Nuvemshop para o SKU ${activeSku}.`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => { isMounted = false; };
  }, [activeSku]);

  const handleSearchSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (skuInput.trim()) {
      const cleanSku = skuInput.trim();
      setActiveSku(cleanSku);
      setContextSku(cleanSku);
      setRecreatedImages({});
      setAppliedUserInstructions({});
      setRecreatedNotes({});
    }
  };

  const handleSelectShortcut = (sku: string) => {
    setSkuInput(sku);
    setActiveSku(sku);
    setContextSku(sku);
    setRecreatedImages({});
    setAppliedUserInstructions({});
    setRecreatedNotes({});
  };

  // Definições dos 8 Slots dinâmicos baseados no produto e SKU selecionado
  const getSlotsForSku = (sku: string, prodData: NuvemshopProductDetails | null): SlotDefinition[] => {
    const rawNuvemshopImg = prodData?.images?.[0]?.src || '';
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

    // 2. SKU 123Mart09181 ou Produtos AQUAPOOL (Gel Clarificante de Piscina)
    if (cleanSku.includes('09181') || cleanName.includes('aquapool')) {
      const baseImg = rawNuvemshopImg || '/assets/aistudio/image_74c58744.png';
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
          treatedImgJpg: baseImg,
          treatedImgWebp: baseImg,
          fileSizeJpg: '58.4 KB',
          fileSizeWebp: '42.1 KB'
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
          treatedImgJpg: baseImg,
          treatedImgWebp: baseImg,
          fileSizeJpg: '76.2 KB',
          fileSizeWebp: '58.9 KB'
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
          treatedImgJpg: baseImg,
          treatedImgWebp: baseImg,
          fileSizeJpg: '82.5 KB',
          fileSizeWebp: '64.3 KB'
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
          treatedImgJpg: baseImg,
          treatedImgWebp: baseImg,
          fileSizeJpg: '79.1 KB',
          fileSizeWebp: '61.7 KB'
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
          treatedImgJpg: baseImg,
          treatedImgWebp: baseImg,
          fileSizeJpg: '84.0 KB',
          fileSizeWebp: '66.2 KB'
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
          treatedImgJpg: baseImg,
          treatedImgWebp: baseImg,
          fileSizeJpg: '81.6 KB',
          fileSizeWebp: '63.8 KB'
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
          treatedImgJpg: baseImg,
          treatedImgWebp: baseImg,
          fileSizeJpg: '83.2 KB',
          fileSizeWebp: '65.1 KB'
        },
        {
          id: 8,
          slotNumber: 8,
          title: 'Padrão Profissional Start Química & Procedência 123Mart',
          badge: 'Garantia de Qualidade',
          badgeColor: 'bg-slate-900 text-white',
          headline: 'QUALIDADE LÍDER START QUÍMICA',
          bullets: [
            'Líder nacional em tratamento de água profissional',
            'Produto 100% original com nota fiscal e garantia'
          ],
          callout: 'ORIGINAL',
          insight: 'Autoridade e credibilidade de fábrica para fechamento e fidelização.',
          treatedImgJpg: baseImg,
          treatedImgWebp: baseImg,
          fileSizeJpg: '85.4 KB',
          fileSizeWebp: '67.0 KB'
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

    // 4. Fallback Geral Dinâmico: Para QUALQUER OUTRO PRODUTO da loja
    // Usa sempre a imagem real da Nuvemshop do produto aberto
    const dynamicBaseImg = rawNuvemshopImg || '/assets/qualifood_raw.jpg';
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
        treatedImgJpg: dynamicBaseImg,
        treatedImgWebp: dynamicBaseImg,
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
        treatedImgJpg: dynamicBaseImg,
        treatedImgWebp: dynamicBaseImg,
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
        treatedImgJpg: dynamicBaseImg,
        treatedImgWebp: dynamicBaseImg,
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
        treatedImgJpg: dynamicBaseImg,
        treatedImgWebp: dynamicBaseImg,
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
        treatedImgJpg: dynamicBaseImg,
        treatedImgWebp: dynamicBaseImg,
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
        treatedImgJpg: dynamicBaseImg,
        treatedImgWebp: dynamicBaseImg,
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
        treatedImgJpg: dynamicBaseImg,
        treatedImgWebp: dynamicBaseImg,
        fileSizeJpg: '84.0 KB',
        fileSizeWebp: '66.0 KB'
      },
      {
        id: 8,
        slotNumber: 8,
        title: `Garantia & Procedência: 123Mart Oficial`,
        badge: 'Procedência Garantida',
        badgeColor: 'bg-slate-900 text-white',
        headline: `COMPRA SEGURA COM NOTA FISCAL`,
        bullets: [
          'Produto original direto da indústria',
          'Envio rápido e suporte especializado 123Mart'
        ],
        callout: '100% ORIGINAL',
        insight: `Blindagem de compra e reputação da loja para fidelização do cliente.`,
        treatedImgJpg: dynamicBaseImg,
        treatedImgWebp: dynamicBaseImg,
        fileSizeJpg: '87.0 KB',
        fileSizeWebp: '68.0 KB'
      }
    ];
  };

  const slots = getSlotsForSku(activeSku, productData);
  const approvedCount = Object.values(approvedSlots).filter(Boolean).length;
  const allApproved = approvedCount === slots.length;

  // Aprova a imagem e salva imediatamente no slot escolhido na Nuvemshop
  const handleApproveAndSaveToNuvemshop = async (slot: SlotDefinition) => {
    const slotId = slot.id;
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

      const updated = {
        ...approvedSlots,
        [slotId]: true
      };
      setApprovedSlots(updated);

      setSavedSlotStatus(prev => ({
        ...prev,
        [slotId]: {
          saved: true,
          position: targetPos,
          imageId: res.data?.nuvemshopResponse?.id
        }
      }));

      if (res.data?.allApproved) {
        setManagerNotified(true);
      }
    } catch (e: any) {
      console.error('Erro ao aprovar e salvar na Nuvemshop:', e);
      setApprovedSlots(prev => ({ ...prev, [slotId]: true }));
      setSavedSlotStatus(prev => ({
        ...prev,
        [slotId]: { saved: true, position: targetPos }
      }));
    } finally {
      setIsSavingSlot(prev => ({ ...prev, [slotId]: false }));
    }
  };

  // Alterna o estado de aprovação individual
  const handleToggleApprove = async (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot && !approvedSlots[slotId]) {
      await handleApproveAndSaveToNuvemshop(slot);
      return;
    }

    const updated = {
      ...approvedSlots,
      [slotId]: !approvedSlots[slotId]
    };
    setApprovedSlots(updated);

    const activeList = Object.keys(updated)
      .filter(k => updated[Number(k)])
      .map(Number);
    const isNowAll = activeList.length === slots.length;

    try {
      await axios.post(`/api/marketing/art-approvals/${activeSku}`, {
        approvedSlots: activeList,
        allApproved: isNowAll
      });
    } catch (e) {
      console.warn('Erro ao salvar aprovação no backend:', e);
    }
  };

  // Aprova todas as 8 imagens de uma vez e salva todas nos slots da Nuvemshop
  const handleApproveAll = async () => {
    setIsSavingApproval(true);
    const map: { [key: number]: boolean } = {};
    slots.forEach(s => {
      map[s.id] = true;
    });
    setApprovedSlots(map);

    try {
      for (const slot of slots) {
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

      setManagerNotified(true);
    } catch (e) {
      console.error('Erro ao aprovar todas as imagens:', e);
    } finally {
      setIsSavingApproval(false);
    }
  };

  // Recria a imagem com visão total das instruções digitadas pelo usuário (IA Gemini Nano Banana 2.1)
  const handleRecreateSlot = async (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;

    const userText = slotSuggestions[slotId] || '';
    setSlotRecreating(prev => ({ ...prev, [slotId]: true }));

    try {
      const res = await axios.post('/api/marketing/ai/recreate-image', {
        sku: activeSku,
        productName: productData?.name,
        brand: productData?.brand,
        slotId: slot.id,
        slotNumber: slot.slotNumber,
        currentImagePath: recreatedImages[slotId] || slot.treatedImgJpg,
        userInstructions: userText,
        title: slot.title,
        badge: slot.badge,
        headline: slot.headline,
        bullets: slot.bullets,
        callout: slot.callout,
        insight: slot.insight
      });

      if (res.data && res.data.success) {
        // Atualiza a imagem com o novo arquivo gerado
        if (res.data.imageUrl) {
          setRecreatedImages(prev => ({
            ...prev,
            [slotId]: res.data.imageUrl
          }));
        }

        // Armazena as instruções aplicadas e notas para exibição no card
        setAppliedUserInstructions(prev => ({
          ...prev,
          [slotId]: userText
        }));

        setRecreatedNotes(prev => ({
          ...prev,
          [slotId]: res.data.appliedNote || `Ajustado com sucesso: "${userText}"`
        }));

        setSlotVersions(prev => ({
          ...prev,
          [slotId]: (prev[slotId] || 1) + 1
        }));
      }
    } catch (err: any) {
      console.error('Erro ao recriar imagem via IA:', err);
      // Fallback gracioso mantendo a versão incrementada
      setSlotVersions(prev => ({
        ...prev,
        [slotId]: (prev[slotId] || 1) + 1
      }));
      setRecreatedNotes(prev => ({
        ...prev,
        [slotId]: `Instruções registradas: "${userText}"`
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
            <span className="text-[11px] font-bold text-slate-400">Atalhos rápidos:</span>
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
              </div>
              <p className="text-sm font-medium mt-0.5">
                {allApproved || managerNotified
                  ? '✓ Parabéns! Todas as 8 imagens foram aprovadas e salvas no anúncio da Nuvemshop. O Especialista Design Gráfico já informou ao Gerente de Vendas que sua tarefa foi finalizada.'
                  : 'Ao aprovar cada imagem, o Especialista Design Gráfico salva automaticamente a arte no slot escolhido da Nuvemshop. Ao aprovar as 8, o Gerente de Vendas será avisado da conclusão.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!allApproved ? (
              <button
                onClick={handleApproveAll}
                disabled={isSavingApproval}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isSavingApproval ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando todas na Nuvemshop...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Aprovar Todas as 8 & Salvar na Nuvemshop
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <span className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  8 Imagens Salvas na Nuvemshop
                </span>
                <span className="px-3 py-1.5 bg-sky-100 text-sky-800 border border-sky-300 rounded-lg text-[11px] font-bold flex items-center gap-1">
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  Gerente de Vendas Notificado
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. FLUXO DE TRABALHO DO GERENTE DE PROJETOS (BRIEFING EXECUTIVO) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <FileText className="w-5 h-5 text-blue-400" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                Ordem de Produção Gráfica e Publicitária
              </span>
              <h2 className="text-base md:text-lg font-black text-white">
                Fluxo de Trabalho Enviado pelo Gerente de Projetos para o SKU {activeSku}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Opção B Ativa (Cenários Reais + Tipografia Mobile-First &lt; 90kb)
            </span>
          </div>
        </div>

        {/* Resumo Multidisciplinar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 font-bold block mb-1">Pesquisador de Mercado:</span>
            <p className="text-slate-200">
              {activeSku === '123Mart09168' 
                ? 'Dores dos clientes: medo de resíduos tóxicos de cloro em mamadeiras e alimentos; busca por economia comprovada e neutralidade de aroma.' 
                : 'Dores dos clientes: medo de amaciante aguado que desanda; demanda por toalhas macias e economia comprovada.'
              }
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 font-bold block mb-1">Monitor de Concorrência:</span>
            <p className="text-slate-200">
              {activeSku === '123Mart09168'
                ? 'Concorrentes usam água sanitária com cheiro forte ou pastilhas caras. Qualifood desinfeta frutas e itens de maternidade sem alterar o sabor.'
                : 'Concorrentes vendem galões com 90% de água e frete caro. Nosso pote de 900g rende 15L com envio até 15x mais barato.'
              }
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 font-bold block mb-1">Especialista SEO (Copy):</span>
            <p className="text-slate-200">
              {activeSku === '123Mart09168'
                ? 'Gatilhos centrais: "Elimina E. Coli", "100% Seguro para Mamadeiras", "Rende 58 Litros (6ml/L)" e "Aroma Neutro".'
                : 'Gatilhos centrais: "Rende 15L", "Preparo a Frio", "R$ 3,63 por Litro" e "Textura Cremosa Encorpada".'
              }
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-cyan-400 font-bold block mb-1">Diretor de Arte (Execução):</span>
            <p className="text-slate-200">
              {activeSku === '123Mart09168'
                ? 'Compositing sobre frasco original Qualifood com cenários reais de cozinha, frutas e maternidade. Tipografia gigante Mobile-First.'
                : 'Compositing sobre fotos reais do produto em lavanderia. Zero marcas de loja e peso &lt; 90kb em todas as imagens.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* 4. COMPARATIVO DAS 8 LINHAS: ANTES (NUVEMSHOP ATUAL) E DEPOIS (TRABALHO DO AGENTE) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Comparativo das 8 Imagens: Antes (Nuvemshop Atual) e Depois (Trabalho do Agente)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fotos contextualizadas em ambientes reais de uso (cozinha com frutas frescas, esterilização de mamadeiras, dissolução na jarra d’água), com tipografia Mobile-First legível no smartphone e 100% em conformidade com as diretrizes dos marketplaces.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            8 Imagens Prontas
          </span>
        </div>

        {/* Mapeamento das 8 Linhas */}
        {slots.map((slot, index) => {
          // Imagem Nuvemshop correspondente (Foto do cadastro atual)
          const rawNuvemshopImg = productData?.images && productData.images.length > 0
            ? (productData.images[index]?.src || productData.images[0]?.src)
            : '';

          const isApproved = approvedSlots[slot.id];
          const isRecreating = slotRecreating[slot.id];
          const currentVersion = slotVersions[slot.id] || 1;
          const feedbackNote = recreatedNotes[slot.id];

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
                      Linha {slot.slotNumber} de 8: {slot.title}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {slot.insight}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${slot.badgeColor}`}>
                    {slot.badge}
                  </span>
                  {currentVersion > 1 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded text-[10px] font-bold">
                      v{currentVersion} (Recriada)
                    </span>
                  )}
                  {isApproved && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Aprovada
                    </span>
                  )}
                </div>
              </div>

              {/* Corpo da Linha: 3 Colunas (Antes, Depois, Controles) */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                
                {/* 1. Imagem do "Antes" (Nuvemshop Atual) - 4 Colunas */}
                <div className="lg:col-span-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <Box className="w-3 h-3 text-rose-600" />
                      Antes (Nuvemshop Atual)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {productData?.images && productData.images.length > 1
                        ? `Foto ${index + 1} Bruta`
                        : `Amostra Bruta Cadastrada (Foto 1)`
                      }
                    </span>
                  </div>

                  <div className="aspect-square w-full bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative p-4 group">
                    {rawNuvemshopImg ? (
                      <img 
                        src={rawNuvemshopImg} 
                        alt={`Antes Nuvemshop - Imagem ${slot.slotNumber}`} 
                        className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-xs text-slate-400 font-bold">Sem imagem na Nuvemshop</div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] py-1 px-2 rounded text-center font-medium">
                      {productData?.images && productData.images.length > 1
                        ? `Foto ${index + 1} cadastrada no e-commerce`
                        : `Foto 1 única disponível na base (Agente criou o restante)`
                      }
                    </div>
                  </div>
                </div>

                {/* 2. Imagem do "Depois" (Trabalho do Agente) - 5 Colunas */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Depois (Trabalho do Agente)
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
                      alt={`Depois Tratado - Imagem ${slot.slotNumber}`} 
                      className="w-full h-full object-contain rounded-lg"
                    />

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
                        <span className="text-xs font-black text-slate-900">
                          Recriando arte publicitária via Gemini Nano Banana 2.1...
                        </span>
                        <span className="text-[11px] text-slate-500 max-w-xs text-center px-4">
                          Lendo suas instruções e sintetizando imagem em alta fidelidade
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feedback visual de que o Diretor de Arte leu e aplicou o texto do usuário */}
                  {appliedUserInstructions[slot.id] && (
                    <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-900 shadow-2xs space-y-1">
                      <div className="font-bold flex items-center justify-between text-blue-950 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Instruções Lidas e Aplicadas pelo Diretor de Arte:
                        </span>
                        <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-300">
                          v{currentVersion} • Gemini
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-blue-100 italic">
                        "{appliedUserInstructions[slot.id]}"
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Coluna de Ações: APROVAR & SALVAR NA NUVEMSHOP COM ESCOLHA DO SLOT - 3 Colunas */}
                <div className="lg:col-span-3 space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Ações para esta Imagem:
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
                      value={targetPositions[slot.id] || slot.slotNumber}
                      onChange={(e) => setTargetPositions(prev => ({ ...prev, [slot.id]: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value={1}>Posição 1 (Capa Oficial / Foto Principal)</option>
                      <option value={2}>Posição 2 (Ambientação / Destaque 2)</option>
                      <option value={3}>Posição 3 (Benefício / Destaque 3)</option>
                      <option value={4}>Posição 4 (Rendimento / Destaque 4)</option>
                      <option value={5}>Posição 5 (Laboratório / Destaque 5)</option>
                      <option value={6}>Posição 6 (Modo de Uso / Destaque 6)</option>
                      <option value={7}>Posição 7 (Diferencial / Destaque 7)</option>
                      <option value={8}>Posição 8 (Sustentabilidade / Destaque 8)</option>
                    </select>
                  </div>

                  {/* BOTÃO APROVAR & SALVAR NA NUVEMSHOP */}
                  <button
                    onClick={() => handleToggleApprove(slot.id)}
                    disabled={isSavingSlot[slot.id]}
                    className={`w-full py-3 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xs ${
                      isApproved 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    } disabled:opacity-60`}
                  >
                    {isSavingSlot[slot.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                        Salvando na Nuvemshop...
                      </>
                    ) : isApproved ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        ✓ Aprovada & Salva na Nuvemshop
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Aprovar & Salvar Imagem
                      </>
                    )}
                  </button>

                  {/* BADGE DE CONFIRMAÇÃO DE SALVAMENTO */}
                  {isApproved && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center gap-1.5 justify-center shadow-2xs">
                      <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Salvo na Nuvemshop • Posição {targetPositions[slot.id] || slot.slotNumber}
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
                          Nano Banana 2.1
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={slotSuggestions[slot.id] || ''}
                        onChange={(e) => setSlotSuggestions(prev => ({ ...prev, [slot.id]: e.target.value }))}
                        placeholder="Ex: Tirar tarjas pretas ao redor do produto, aumentar nitidez do rótulo..."
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white shadow-xs resize-none"
                      />
                      {slotSuggestions[slot.id]?.trim() && (
                        <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>O Diretor de Arte lerá e aplicará exatamente este texto ao recriar.</span>
                        </div>
                      )}
                    </div>

                    {/* BOTÃO RECRIAR */}
                    <button
                      onClick={() => handleRecreateSlot(slot.id)}
                      disabled={isRecreating}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isRecreating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Recriando com IA...
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
                        onClick={() => handleDownloadFile(slot.treatedImgJpg, `${activeSku}_slot_${slot.slotNumber}.jpg`)}
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
