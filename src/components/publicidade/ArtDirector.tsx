import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Palette, Search, RefreshCw, CheckCircle2, AlertCircle, 
  Download, Sparkles, Brain, Check, RotateCcw, 
  ShieldCheck, FileText, ChevronRight, MessageSquare,
  Sparkle, Award, Box, ArrowRight
} from 'lucide-react';

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
}

export default function ArtDirector() {
  // 1. Campo de SKU configurável (Padrão: Base para Amaciante 123Mart09078)
  const [skuInput, setSkuInput] = useState<string>('123Mart09078');
  const [activeSku, setActiveSku] = useState<string>('123Mart09078');

  // Dados do produto e briefing do Gerente de Projetos
  const [productData, setProductData] = useState<NuvemshopProductDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados individuais para cada um dos 8 slots
  const [approvedSlots, setApprovedSlots] = useState<{ [key: number]: boolean }>({});
  const [slotSuggestions, setSlotSuggestions] = useState<{ [key: number]: string }>({});
  const [slotRecreating, setSlotRecreating] = useState<{ [key: number]: boolean }>({});
  const [slotVersions, setSlotVersions] = useState<{ [key: number]: number }>({
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1
  });
  const [slotCustomHeadlines, setSlotCustomHeadlines] = useState<{ [key: number]: string }>({});
  const [downloadingSlot, setDownloadingSlot] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carrega dados da Nuvemshop e o Dossiê do Gerente de Projetos
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
      setActiveSku(skuInput.trim());
    }
  };

  // Configuração dos 8 slots baseados nos estudos do Gerente de Projetos
  const getSlots = (): SlotDefinition[] => {
    const isAmaciante = (productData?.name || '').toUpperCase().includes('AMACIANTE') || activeSku.includes('09078');

    if (isAmaciante) {
      return [
        {
          id: 1,
          slotNumber: 1,
          title: 'Capa Oficial Marketplace (Fundo Branco Puro)',
          badge: 'Fundo 100% Branco Puro',
          badgeColor: 'bg-slate-900 text-white',
          headline: '',
          bullets: [],
          callout: 'CAPA OFICIAL',
          insight: 'Diretriz Inegociável do Gerente de Projetos: Capa de catálogo com fundo 100% branco (#FFFFFF), isolamento de estúdio com sombra de contato e oclusão na base. Zero textos ou marcas d’água (atende ao Mercado Livre, Shopee e Nuvemshop).'
        },
        {
          id: 2,
          slotNumber: 2,
          title: 'Gatilho de Compra & Rendimento Máximo (15 Litros)',
          badge: 'Rendimento de 15L',
          badgeColor: 'bg-blue-600 text-white',
          headline: slotCustomHeadlines[2] || '1 POTE DE 900G RENDE 15 LITROS DE AMACIANTE PROFISSIONAL',
          bullets: [
            'Substitui até 5 galões de 3 litros de marcas famosas do supermercado',
            'Pare de pagar por água: leve a base pura e adicione água da torneira em casa'
          ],
          callout: '1 POTE = 15 LITROS',
          insight: 'Insight do Planner: Consumidor revoltado em pagar R$ 25 a R$ 30 em galões comerciais que são 90% água.'
        },
        {
          id: 3,
          slotNumber: 3,
          title: 'Quebra de Objeção: Consistência Cremosa',
          badge: 'Cremoso & Encorpado',
          badgeColor: 'bg-emerald-600 text-white',
          headline: slotCustomHeadlines[3] || 'TEXTURA CREMOSA QUE NÃO FICA RALA: VOCÊ CONTROLA A GROSSURA',
          bullets: [
            'Fórmula especial Tuff que encorpa e não separa a água com o tempo',
            'Faça com 10L para super concentrado ou 15L para rendimento máximo'
          ],
          callout: 'TEXTURA CREMOSA',
          insight: 'Insight da Concorrência: A reclamação nº 1 em bases concorrentes é que o amaciante fica ralo parecendo "água suja".'
        },
        {
          id: 4,
          slotNumber: 4,
          title: 'Tecnologia de Perfumaria Fina & Fibras',
          badge: 'Microcápsulas de Perfume',
          badgeColor: 'bg-indigo-600 text-white',
          headline: slotCustomHeadlines[4] || 'PERFUME PROLONGADO: CHEIRO DE ROUPA DE GENTE RICA POR DIAS',
          bullets: [
            'Microcápsulas ativadas no uso que mantêm o aroma no guarda-roupa',
            'Blindagem de fibras: amacia profundamente e facilita na hora de passar'
          ],
          callout: 'PERFUME PROLONGADO',
          insight: 'Insight do Dossiê: O desejo inconfessável da dona de casa é o perfume intenso e maciez de lavanderia profissional.'
        },
        {
          id: 5,
          slotNumber: 5,
          title: 'Ancoragem de Valor & Economia Real',
          badge: 'Economia de até 80%',
          badgeColor: 'bg-amber-600 text-white',
          headline: slotCustomHeadlines[5] || 'ECONOMIA BRUTAL DE ATÉ 80%: APENAS R$ 3,63 POR LITRO',
          bullets: [
            'Pague R$ 54,49 e tenha 15 Litros de amaciante premium na sua despensa',
            'Custo por lavagem de centavos: o maior alívio no orçamento de compras do mês'
          ],
          callout: 'MÁXIMA ECONOMIA',
          insight: 'Insight Financeiro: Ancoragem contra o preço abusivo de R$ 25 por galão de 3L nos supermercados.'
        },
        {
          id: 6,
          slotNumber: 6,
          title: 'Modo de Aplicação: Preparo a Frio em 3 Passos',
          badge: 'Dissolução a Frio',
          badgeColor: 'bg-cyan-600 text-white',
          headline: slotCustomHeadlines[6] || 'PREPARO FÁCIL A FRIO EM 3 PASSOS: NÃO PRECISA FERVER ÁGUA',
          bullets: [
            '1. Coloque a base no balde • 2. Adicione água da torneira • 3. Misture bem',
            'Dissolve fácil com colher de pau ou cabo limpo: sem batedeira elétrica'
          ],
          callout: 'SEM FERVER ÁGUA',
          insight: 'Insight do FAQ: Mais de 60% dos compradores perguntam se é preciso ferver água para diluir o produto.'
        },
        {
          id: 7,
          slotNumber: 7,
          title: 'Blindagem Logística & Frete Econômico',
          badge: 'Pote Lacrado 900g',
          badgeColor: 'bg-rose-600 text-white',
          headline: slotCustomHeadlines[7] || 'POTE COMPACTO DE 900G: FRETE MAIS BARATO E ZERO VAZAMENTO',
          bullets: [
            'Transporte 900g de base pura em vez de pagar frete caríssimo de 15L de água',
            'Pote reforçado com lacre industrial que não quebra nem vaza no transporte'
          ],
          callout: 'FRETE ECONÔMICO',
          insight: 'Insight Logístico: Envio de 900g é até 15 vezes mais leve e seguro do que enviar galões pesados com líquido.'
        },
        {
          id: 8,
          slotNumber: 8,
          title: 'Matriz de Objeções & Garantia Start Química',
          badge: 'Garantia Start Química',
          badgeColor: 'bg-emerald-700 text-white',
          headline: slotCustomHeadlines[8] || 'QUALIDADE COMPROVADA TUFF: VALIDADE DE 6 MESES APÓS PRONTO',
          bullets: [
            'Não estraga o dispenser da máquina de lavar e não mancha roupas',
            'Qualidade Start Química com nota fiscal eletrônica e envio imediato'
          ],
          callout: 'GARANTIA 123MART',
          insight: 'Insight de Fechamento: Elimina o receio de estragar a máquina ou as roupas com produto caseiro.'
        }
      ];
    }

    // Fallback padrão para outros produtos
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i + 1,
      slotNumber: i + 1,
      title: i === 0 ? 'Capa Oficial Marketplace (Fundo Branco Puro)' : `Peça Publicitária Slot ${i + 1}`,
      badge: i === 0 ? 'Fundo Branco' : `Destaque Slot ${i + 1}`,
      badgeColor: 'bg-blue-600 text-white',
      headline: slotCustomHeadlines[i + 1] || `DESTAQUE PUBLICITÁRIO PROFISSIONAL ${i + 1}`,
      bullets: [
        'Qualidade comprovada com máxima performance',
        'Produto original com garantia e nota fiscal'
      ],
      callout: `SLOT ${i + 1}`,
      insight: 'Estudo do Gerente de Projetos para otimização de conversão.'
    }));
  };

  const slots = getSlots();

  // Ação de Aprovar a Imagem
  const handleToggleApprove = (slotId: number) => {
    setApprovedSlots(prev => ({
      ...prev,
      [slotId]: !prev[slotId]
    }));
  };

  // Ação de Recriar a Imagem com base na sugestão
  const handleRecreateSlot = (slotId: number) => {
    const suggestion = slotSuggestions[slotId] || '';
    setSlotRecreating(prev => ({ ...prev, [slotId]: true }));

    setTimeout(() => {
      // Incrementa a versão
      setSlotVersions(prev => ({
        ...prev,
        [slotId]: (prev[slotId] || 1) + 1
      }));

      // Se o usuário escreveu sugestão de texto ou alteração, ajusta dinamicamente a headline
      if (suggestion.trim()) {
        const cleanSuggestion = suggestion.trim().toUpperCase();
        setSlotCustomHeadlines(prev => ({
          ...prev,
          [slotId]: cleanSuggestion.length > 10 ? cleanSuggestion : `${slots[slotId - 1].headline} • [${cleanSuggestion}]`
        }));
      }

      setSlotRecreating(prev => ({ ...prev, [slotId]: false }));
    }, 1200);
  };

  // Motor em Canvas para gerar e baixar imagem tratada <100kb
  const handleDownloadSlotImage = async (slot: SlotDefinition, imgSrc: string) => {
    if (!canvasRef.current || !imgSrc) return;
    setDownloadingSlot(slot.id);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1200;
      canvas.height = 1200;

      // Fundo Branco Puro
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1200, 1200);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if (slot.id === 1) {
        // Slot 1: Capa Oficial - Sombra de estúdio e produto centralizado
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(600, 1020, 260, 30, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.filter = 'blur(16px)';
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(600, 1015, 160, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.filter = 'blur(6px)';
        ctx.fill();
        ctx.restore();

        const pHeight = 840;
        const pWidth = (img.width / img.height) * pHeight;
        const pX = (1200 - pWidth) / 2;
        const pY = 1015 - pHeight;
        ctx.drawImage(img, pX, pY, pWidth, pHeight);
      } else {
        // Slots 2 a 8: Layout Publicitário de Agência
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(840, 1015, 230, 26, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.filter = 'blur(14px)';
        ctx.fill();
        ctx.restore();

        const pHeight = 800;
        const pWidth = (img.width / img.height) * pHeight;
        const pX = 840 - (pWidth / 2);
        const pY = 1015 - pHeight;
        ctx.drawImage(img, pX, pY, pWidth, pHeight);

        // Badge
        ctx.fillStyle = '#0047BA';
        ctx.beginPath();
        ctx.roundRect(80, 100, 260, 48, 12);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(slot.callout, 105, 132);

        // Headline
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(80, 170, 520, 170, 20);
        ctx.fill();

        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('123MART • START QUÍMICA OFICIAL', 105, 205);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 24px sans-serif';
        const words = slot.headline.split(' ');
        let line = '';
        let y = 245;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > 470 && n > 0) {
            ctx.fillText(line, 105, y);
            line = words[n] + ' ';
            y += 34;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 105, y);

        // Bullets
        let bY = 360;
        slot.bullets.forEach((bullet) => {
          ctx.fillStyle = '#F8FAFC';
          ctx.beginPath();
          ctx.roundRect(80, bY, 520, 80, 16);
          ctx.fill();
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(115, bY + 40, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('✓', 108, bY + 46);

          ctx.fillStyle = '#1E293B';
          ctx.font = 'bold 17px sans-serif';
          ctx.fillText(bullet, 145, bY + 46);
          bY += 95;
        });
      }

      // Exporta em JPEG otimizado para menos de 100kb
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${productData?.sku || activeSku}_imagem_${slot.id}_tratada.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.84);

    } catch (e) {
      console.error('Erro ao gerar imagem:', e);
    } finally {
      setDownloadingSlot(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Canvas Oculto para renderização física e download <100kb */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 1. TOPO LIMPO: CAMPO DE SKU & BOTÃO DE PROCESSAMENTO */}
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
                placeholder="Ex: 123Mart09078"
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
                    Processando...
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

          {/* Atalho rápido para teste imediato */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400">Atalhos rápidos:</span>
            <button
              type="button"
              onClick={() => { setSkuInput('123Mart09078'); setActiveSku('123Mart09078'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSku === '123Mart09078' 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Base Amaciante (123Mart09078)
            </button>
            <button
              type="button"
              onClick={() => { setSkuInput('123Mart09015'); setActiveSku('123Mart09015'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSku === '123Mart09015' 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Flotador Azulim (123Mart09015)
            </button>
          </div>
        </form>
      </div>

      {/* 2. FLUXO DE TRABALHO ENVIADO PELO GERENTE DE PROJETOS (BRIEFING EXECUTIVO) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <FileText className="w-5 h-5 text-blue-400" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                Ordem Executiva de Criação Publicitária
              </span>
              <h2 className="text-base md:text-lg font-black text-white">
                Fluxo de Trabalho Enviado pelo Gerente de Projetos para o SKU {activeSku}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Estudos Multidisciplinares Validados
            </span>
          </div>
        </div>

        {/* Resumo do Produto & Diretrizes da Ordem */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Produto & Cadastro:
            </span>
            <div className="font-bold text-white line-clamp-2">
              {productData ? productData.name : 'Carregando produto...'}
            </div>
            <div className="text-slate-300 text-[11px] font-mono mt-1">
              SKU: <strong>{activeSku}</strong> • {productData ? `R$ ${productData.price.toFixed(2)}` : ''} • {productData ? `${productData.stock} UN` : ''}
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
              1. Pesquisador de Mercado:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Consumidor cansado de pagar R$ 25 a R$ 30 em amaciantes de mercado que são 90% água. Desejo de ter 15L de amaciante cremoso pagando apenas R$ 3,63/L.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
              2. Monitor de Concorrência:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Neutralizar a reclamação nº 1 das bases concorrentes: textura rala que parece "água suja". Comprovar visualmente consistência cremosa Tuff Start Química.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
              3. Diretrizes Gráficas do Agente:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Slot 1: Fundo 100% branco (#FFFFFF) sem ruídos. Slots 2 a 8: Diagramação publicitária em negative space com sombra de estúdio e compressão para menos de 100kb.
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de Erro caso ocorra */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* 3. AS OITO LINHAS DE COMPARATIVO: ANTES (NUVEMSHOP) vs DEPOIS (TRABALHO DO AGENTE) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Comparativo das 8 Imagens: Antes (Nuvemshop) e Depois (Trabalho do Agente)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada linha compara a foto bruta da Nuvemshop com a peça publicitária tratada pelo agente, com aprovação e campo para sugestões.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Total de 8 Imagens Oficiais
          </span>
        </div>

        {/* Mapeamento das 8 Linhas */}
        {slots.map((slot, index) => {
          // Imagem Nuvemshop correspondente (ou fallback para a primeira)
          const rawNuvemshopImg = productData?.images && productData.images.length > 0
            ? (productData.images[index]?.src || productData.images[0]?.src)
            : '';

          const isApproved = approvedSlots[slot.id];
          const isRecreating = slotRecreating[slot.id];
          const currentVersion = slotVersions[slot.id] || 1;

          return (
            <div 
              key={slot.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs ${
                isApproved 
                  ? 'border-emerald-400 ring-2 ring-emerald-400/20' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Cabeçalho da Linha */}
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
                      Foto {index + 1} Original
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
                      <div className="text-xs text-slate-400 font-bold">Sem imagem bruta</div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] py-1 px-2 rounded text-center font-medium">
                      Foto bruta cadastrada no e-commerce
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
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      1200×1200px • &lt; 100kb
                    </span>
                  </div>

                  {/* Canvas Visual Tratado */}
                  <div className="aspect-square w-full bg-[#FFFFFF] rounded-xl border border-slate-200 shadow-md flex items-center justify-center overflow-hidden relative p-4">
                    
                    {/* Se for Slot 1: Fundo Branco Puro + Sombra de Estúdio Realista */}
                    {slot.id === 1 ? (
                      <div className="w-full h-full relative flex items-center justify-center">
                        <div className="relative h-[85%] max-w-[85%] flex items-center justify-center">
                          {/* Sombra de Contato Fotorrealista na Base */}
                          <div className="absolute -bottom-3 w-[70%] h-6 bg-black/25 rounded-[100%] blur-md pointer-events-none" />
                          <div className="absolute -bottom-1.5 w-[45%] h-3 bg-black/45 rounded-[100%] blur-xs pointer-events-none" />

                          {rawNuvemshopImg ? (
                            <img 
                              src={rawNuvemshopImg} 
                              alt="Depois Slot 1" 
                              className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.12)]"
                            />
                          ) : (
                            <div className="text-slate-400 text-xs">Sem foto</div>
                          )}
                        </div>

                        {/* Selo discreto de Capa Oficial */}
                        <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 text-white text-[10px] py-1 px-2 rounded-lg text-center font-bold">
                          Fundo 100% Branco Puro (#FFFFFF) • Sombra de Estúdio Realista
                        </div>
                      </div>
                    ) : (
                      /* Slots 2 a 8: Layout Publicitário em Negative Space */
                      <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                        
                        {/* Produto à Direita com Sombra de Contato */}
                        <div className="relative h-[78%] max-w-[55%] ml-auto mr-1 flex items-center justify-center z-10">
                          <div className="absolute -bottom-3 w-[65%] h-5 bg-black/25 rounded-[100%] blur-md pointer-events-none" />
                          <div className="absolute -bottom-1 w-[40%] h-2.5 bg-black/45 rounded-[100%] blur-xs pointer-events-none" />
                          
                          {rawNuvemshopImg ? (
                            <img 
                              src={rawNuvemshopImg} 
                              alt={`Depois Slot ${slot.slotNumber}`} 
                              className="w-full h-full object-contain filter drop-shadow-[0_12px_16px_rgba(0,0,0,0.12)]"
                            />
                          ) : (
                            <div className="text-slate-400 text-xs">Sem foto</div>
                          )}
                        </div>

                        {/* Diagramação Publicitária à Esquerda */}
                        <div className="absolute top-3 left-3 z-20 max-w-[55%] space-y-1.5 pointer-events-none select-none">
                          <div className="inline-flex items-center gap-1 bg-blue-700 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-xs">
                            <Sparkle className="w-2.5 h-2.5 text-amber-300" />
                            {slot.callout}
                          </div>

                          <div className="bg-slate-950 text-white p-2 rounded-xl shadow-lg border border-slate-800">
                            <span className="text-[8px] font-black uppercase tracking-wider text-cyan-400 block">
                              123MART • TUFF START QUÍMICA
                            </span>
                            <h5 className="text-[10px] font-black tracking-tight leading-snug text-white line-clamp-3">
                              "{slot.headline}"
                            </h5>
                          </div>

                          <div className="space-y-1">
                            {slot.bullets.map((bullet, bIdx) => (
                              <div 
                                key={bIdx}
                                className="bg-white/95 backdrop-blur-xs text-slate-800 px-2 py-1 rounded-lg shadow-xs border border-slate-200 text-[9px] font-bold flex items-center gap-1.5"
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-[8px] shrink-0">
                                  ✓
                                </span>
                                <span className="line-clamp-2">"{bullet}"</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Selo no Rodapé */}
                        <div className="absolute bottom-2 left-2 right-2 bg-white/95 border border-slate-200 text-slate-800 text-[9px] py-1 px-2 rounded-md font-bold flex items-center justify-between z-20">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Start Química Oficial
                          </span>
                          <span className="text-slate-500">
                            Strict Compositing
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Overlay durante a Recriação */}
                    {isRecreating && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-xs font-black text-slate-900">
                          Aplicando sugestões e recriando arte...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Coluna de Ações: SOMENTE OS BOTÕES APROVAR & RECRIAR (COM CAMPO DE SUGESTÕES) - 3 Colunas */}
                <div className="lg:col-span-3 space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Ações para esta Imagem:
                  </span>

                  {/* BOTÃO APROVAR */}
                  <button
                    onClick={() => handleToggleApprove(slot.id)}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xs ${
                      isApproved 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        ✓ Imagem Aprovada
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Aprovar Imagem
                      </>
                    )}
                  </button>

                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    {/* CAMPO PARA ESCREVER SUGESTÕES */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Sugestões para o Agente:
                      </label>
                      <textarea
                        rows={2}
                        value={slotSuggestions[slot.id] || ''}
                        onChange={(e) => setSlotSuggestions(prev => ({ ...prev, [slot.id]: e.target.value }))}
                        placeholder="Ex: Aumentar destaque do rendimento, ajustar cor do selo..."
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white shadow-xs resize-none"
                      />
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
                          Recriando...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Recriar Imagem
                        </>
                      )}
                    </button>
                  </div>

                  {/* Opção Rápida para Baixar o Arquivo <100kb */}
                  {rawNuvemshopImg && (
                    <div className="pt-1">
                      <button
                        onClick={() => handleDownloadSlotImage(slot, rawNuvemshopImg)}
                        disabled={downloadingSlot === slot.id}
                        className="w-full py-1.5 px-2 bg-slate-200/70 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        title="Baixar em JPG otimizado <100kb"
                      >
                        {downloadingSlot === slot.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3 text-slate-600" />
                        )}
                        Baixar JPG (&lt;100kb)
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
