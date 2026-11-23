import React, { useState, useEffect } from 'react';
import {
  FileJson, Store, CheckCircle2, Image as ImageIcon,
  Tag, ShieldCheck, X, Check, Loader2, Send, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

interface SeoWebhookModalProps {
  sku: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PhotoPreview {
  slot: number;
  title: string;
  size?: string;
  url: string;
}

function stripHtmlPreview(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 260);
}

export default function SeoWebhookModal({ sku, onClose, onSuccess }: SeoWebhookModalProps) {
  const [loadingData, setLoadingData] = useState(true);
  const [briefing, setBriefing] = useState<any>(null);
  const [nuvemProduct, setNuvemProduct] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [commercialOverrideConfirmed, setCommercialOverrideConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingData(true);
    setErrorMsg(null);

    Promise.all([
      axios.get(`/api/marketing/sku-briefings/${encodeURIComponent(sku)}`).catch(() => ({ data: null })),
      axios.get(`/api/marketing/nuvemshop/product/${encodeURIComponent(sku)}`).catch(() => ({ data: null })),
    ])
      .then(([briefRes, prodRes]) => {
        if (!active) return;
        setBriefing(briefRes.data?.briefing || null);
        setNuvemProduct(prodRes.data || null);
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [sku]);

  const seoData = briefing?.seoData || null;
  const commercialAlert = briefing?.commercialAlert || null;
  const needsOverride = Boolean(commercialAlert?.blockedAutoSave);

  // Monta galeria real a partir dos generatedSlots do Diretor de Arte (fallback: imagens da Nuvemshop)
  const photos: PhotoPreview[] = [];
  const generatedSlots = briefing?.generatedSlots || {};
  const planSlots: any[] = Array.isArray(briefing?.artPlan?.slots) ? briefing.artPlan.slots : [];

  for (let slot = 1; slot <= 8; slot++) {
    const gen = generatedSlots[String(slot)] || generatedSlots[slot];
    const planSlot = planSlots.find((s: any) => Number(s.slotNumber) === slot);
    const nuvemImg = Array.isArray(nuvemProduct?.images) ? nuvemProduct.images[slot - 1] : null;
    const url = gen?.imageUrl || gen?.jpgUrl || gen?.webpUrl || nuvemImg?.src || '';
    if (url) {
      photos.push({
        slot,
        title: planSlot?.title || (slot === 1 ? 'Capa Oficial Fundo Branco (#FFFFFF)' : `Slot ${slot}`),
        size: gen?.fileSizeKb ? `${gen.fileSizeKb} KB` : gen?.jpgSizeKb || undefined,
        url,
      });
    }
  }

  const tituloSeo = seoData?.novoTitulo || nuvemProduct?.name || `Título SEO pendente para ${sku}`;
  const descricaoSeo = seoData?.metaDescription || nuvemProduct?.seo_description || 'Meta description ainda não gerada pela esteira.';
  const descricaoProdutoPreview =
    stripHtmlPreview(seoData?.novaDescricaoHtml) ||
    stripHtmlPreview(nuvemProduct?.description) ||
    'Descrição HTML completa será preenchida pelo Especialista em SEO.';

  const resolvedProductId = nuvemProduct?.id ? String(nuvemProduct.id) : 'Não localizado';
  const resolvedPrice = typeof nuvemProduct?.price === 'number' ? `R$ ${nuvemProduct.price.toFixed(2).replace('.', ',')}` : 'N/A';
  const resolvedStock = nuvemProduct?.stock !== undefined ? `${nuvemProduct.stock} un` : 'N/A';
  const resolvedBarcode = nuvemProduct?.barcode || 'Sem GTIN/EAN';
  const resolvedBrand = seoData?.marca || briefing?.officialBrand || nuvemProduct?.brand || 'Não informada';
  const dims = nuvemProduct?.dimensions;
  const resolvedDimensions = dims ? `${dims.height}×${dims.width}×${dims.depth} cm` : 'Padrão';

  const handleTriggerWebhook = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/marketing/webhook-seo-publish', {
        sku,
        productId: nuvemProduct?.id ? String(nuvemProduct.id) : undefined,
      });
      setExecutionResult(res.data);
      setExecuted(true);
      if (onSuccess) onSuccess();
    } catch (e: any) {
      console.error('Erro ao disparar webhook:', e);
      setErrorMsg(e?.response?.data?.error || 'Falha ao processar webhook para o Especialista em SEO.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Etapa 9: Webhook Final do Gerente
                </span>
                <span className="text-xs text-slate-300 font-mono">SKU: {sku}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Publicação & Sincronização Real na Nuvemshop
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loadingData ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-500 text-sm">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
              Carregando dados reais do SKU {sku}...
            </div>
          ) : (
            <>
              {/* Alerta Comercial (Trava de Segurança) se ativo */}
              {needsOverride && (
                <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold uppercase tracking-wider text-amber-900">
                        Trava Comercial Ativada — Publicação Automática Pausada
                      </p>
                      <p className="text-amber-900 leading-relaxed">{commercialAlert.reason}</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-amber-200 cursor-pointer font-semibold text-amber-950">
                    <input
                      type="checkbox"
                      checked={commercialOverrideConfirmed}
                      onChange={(e) => setCommercialOverrideConfirmed(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    Confirmo que revisei o preço e a quantidade do kit na Nuvemshop e autorizo publicar este SEO agora.
                  </label>
                </div>
              )}

              {/* Caixa Explicativa */}
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    Diretriz Corporativa — Publicação do Especialista em SEO ({sku}):
                  </p>
                  <p className="text-sky-800 leading-relaxed">
                    Ao disparar este webhook, os campos otimizados (<strong>#título-de-seo</strong>, <strong>#descrição-de-seo</strong>, <strong>#descrição-do-produto</strong>) são enviados diretamente para a API da <strong>Nuvemshop</strong> e sincronizados com o <strong>MeliAgent</strong>.
                  </p>
                </div>
              </div>

              {/* Hashtags Obrigatórias (Dados Reais do SKU) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-sky-600" />
                  Campos Reais Gerados pelo Especialista em SEO:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1.5">
                    <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-[11px] inline-block">
                      #título-de-seo
                    </span>
                    <p className="text-slate-800 font-medium leading-snug">{tituloSeo}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1.5">
                    <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-[11px] inline-block">
                      #descrição-de-seo
                    </span>
                    <p className="text-slate-700 italic leading-snug text-[11px]">{descricaoSeo}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1.5">
                    <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-[11px] inline-block">
                      #descrição-do-produto
                    </span>
                    <p className="text-slate-700 leading-snug text-[11px]">
                      {descricaoProdutoPreview}{descricaoProdutoPreview.length >= 260 ? '...' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Galeria Real do SKU */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Galeria do SKU ({photos.length} foto{photos.length === 1 ? '' : 's'} mapeada{photos.length === 1 ? '' : 's'}):
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {Object.keys(generatedSlots).length}/8 Geradas no Diretor de Arte
                  </span>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                    {photos.map((p) => (
                      <div key={p.slot} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-center text-[10px]">
                        <img src={p.url} alt={p.title} className="w-full aspect-square object-cover" />
                        <div className="p-1 font-bold text-slate-700">Slot {p.slot}</div>
                        {p.size && <div className="text-[9px] text-slate-400 font-mono pb-1">{p.size}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    Nenhuma foto gerada ou cadastrada encontrada ainda para este SKU.
                  </div>
                )}
              </div>

              {/* Campos Reais na Nuvemshop */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-sky-600" />
                  Dados Atuais do Produto na Nuvemshop:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">PRODUTO ID</span>
                    <span className="font-semibold text-slate-800">{resolvedProductId}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">PREÇO &amp; ESTOQUE</span>
                    <span className="font-semibold text-slate-800">{resolvedPrice} | {resolvedStock}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">GTIN / EAN</span>
                    <span className="font-semibold text-slate-800">{resolvedBarcode}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">MARCA &amp; DIMENSÕES</span>
                    <span className="font-semibold text-slate-800">{resolvedBrand} | {resolvedDimensions}</span>
                  </div>
                </div>
              </div>

              {/* Erro inline */}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Feedback de Execução */}
              {executed && executionResult && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Webhook Concluído! (SKU {executionResult.sku} • Produto ID {executionResult.productId})
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {executionResult.message}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Destinatário: <strong>Especialista em SEO (Nuvemshop + MeliAgent)</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              Fechar
            </button>

            <button
              onClick={handleTriggerWebhook}
              disabled={isExecuting || loadingData || (needsOverride && !commercialOverrideConfirmed)}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                executed
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-sky-600 hover:bg-sky-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando na Nuvemshop...
                </>
              ) : executed ? (
                <>
                  <Check className="w-4 h-4" />
                  Publicado com Sucesso
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publicar SEO na Nuvemshop &amp; Disparar Webhook
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
