import React, { useState } from 'react';
import { 
  FileJson, Store, CheckCircle2, ArrowRight, Sparkles, Image as ImageIcon, 
  Tag, ShieldCheck, X, Check, Loader2, Send, ExternalLink
} from 'lucide-react';
import axios from 'axios';

interface SeoWebhookModalProps {
  sku: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SeoWebhookModal({ sku, onClose, onSuccess }: SeoWebhookModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const is09168 = sku.toLowerCase().includes('09168');

  const photos = is09168 ? [
    { slot: 1, title: 'Slot 1: Capa Fundo Branco 100% Puro (#FFFFFF)', size: '44.2 KB', url: '/assets/slots_09168/slot_1.jpg' },
    { slot: 2, title: 'Slot 2: Cozinha & Desinfecção de Alimentos', size: '87.4 KB', url: '/assets/slots_09168/slot_2.jpg' },
    { slot: 3, title: 'Slot 3: Maternidade & Mamadeiras Seguras', size: '82.6 KB', url: '/assets/slots_09168/slot_3.jpg' },
    { slot: 4, title: 'Slot 4: Rendimento Máximo de 58 Litros', size: '88.9 KB', url: '/assets/slots_09168/slot_4.jpg' },
    { slot: 5, title: 'Slot 5: Eficácia Comprovada em Laboratório', size: '87.6 KB', url: '/assets/slots_09168/slot_5.jpg' },
    { slot: 6, title: 'Slot 6: Diluição 6ml por Litro de Água', size: '86.1 KB', url: '/assets/slots_09168/slot_6.jpg' },
    { slot: 7, title: 'Slot 7: Não Altera Sabor nem Aroma Natural', size: '86.4 KB', url: '/assets/slots_09168/slot_7.jpg' },
    { slot: 8, title: 'Slot 8: Grau Alimentício Biodegradável Start', size: '85.2 KB', url: '/assets/slots_09168/slot_8.jpg' },
  ] : [
    { slot: 1, title: 'Slot 1: Capa Fundo Branco #FFFFFF', size: '63.6 KB', url: '/assets/slots/slot_1.jpg' },
    { slot: 2, title: 'Slot 2: Rendimento de 15 Litros', size: '86.8 KB', url: '/assets/slots/slot_2.jpg' },
    { slot: 3, title: 'Slot 3: Textura Cremosa Encorpada', size: '86.9 KB', url: '/assets/slots/slot_3.jpg' },
    { slot: 4, title: 'Slot 4: Perfumaria Fina e Fixação', size: '73.6 KB', url: '/assets/slots/slot_4.jpg' },
    { slot: 5, title: 'Slot 5: Economia Real de até 80%', size: '88.2 KB', url: '/assets/slots/slot_5.jpg' },
    { slot: 6, title: 'Slot 6: Passo a Passo de Diluição', size: '87.1 KB', url: '/assets/slots/slot_6.jpg' },
    { slot: 7, title: 'Slot 7: Frete 15x Mais Leve', size: '84.3 KB', url: '/assets/slots/slot_7.jpg' },
    { slot: 8, title: 'Slot 8: Validade de 6 Meses e Qualidade', size: '89.5 KB', url: '/assets/slots/slot_8.jpg' },
  ];

  const handleTriggerWebhook = async () => {
    setIsExecuting(true);
    try {
      const res = await axios.post('/api/marketing/webhook-seo-publish', {
        sku,
        productId: is09168 ? '368839553' : '368839552'
      });
      setExecutionResult(res.data);
      setExecuted(true);
      if (onSuccess) onSuccess();
    } catch (e: any) {
      console.error('Erro ao disparar webhook:', e);
      alert('Falha ao processar webhook para o Especialista em SEO.');
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
                Webhook de Notificação & Salvamento Automático na Nuvemshop
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
          
          {/* Caixa Explicativa da Regra do CEO */}
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                Diretriz Corporativa do CEO — Papel do Especialista em SEO no Final do Fluxo:
              </p>
              <p className="text-sky-800 leading-relaxed">
                Ao receber este webhook do Gerente de Projetos informando que a pasta do SKU está pronta, o <strong>Especialista em SEO</strong> é o responsável por preencher e salvar todos os campos do anúncio na <strong>Nuvemshop</strong>, utilizando as hashtags obrigatórias (<strong>#título-de-seo</strong>, <strong>#descrição-de-seo</strong>, <strong>#descrição-do-produto</strong>) e salvando todas as fotos homologadas pelo <strong>Diretor de Arte</strong>.
              </p>
            </div>
          </div>

          {/* Hashtags Obrigatórias */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-sky-600" />
              Hashtags Oficiais Geradas pelo Especialista em SEO:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              
              {/* #título-de-seo */}
              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1.5">
                <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-[11px] inline-block">
                  #título-de-seo
                </span>
                <p className="text-slate-800 font-medium leading-snug">
                  {is09168 
                    ? 'Germicida Desinfetante Qualifood 350ml – Lava e Desinfeta Frutas, Legumes, Mamadeiras e Utensílios de Bebê'
                    : 'Base para Amaciante Concentrada Tuff 900g Start Química – Rende 15 Litros'}
                </p>
              </div>

              {/* #descrição-de-seo */}
              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1.5">
                <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-[11px] inline-block">
                  #descrição-de-seo
                </span>
                <p className="text-slate-700 italic leading-snug text-[11px]">
                  {is09168 
                    ? 'Desinfete frutas, legumes e mamadeiras com segurança hospitalar. O Germicida Qualifood 350ml rende até 58L, elimina bactérias e não deixa gosto nem cheiro.'
                    : 'Faça 15 litros de amaciante profissional em casa com a Base Tuff 900g Start Química. Perfumaria fina de alta fixação, maciez profunda e economia real de até 80%.'}
                </p>
              </div>

              {/* #descrição-do-produto */}
              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1.5">
                <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-[11px] inline-block">
                  #descrição-do-produto
                </span>
                <p className="text-slate-700 leading-snug text-[11px]">
                  {is09168
                    ? 'Estrutura HTML completa com diluição (6ml/L), ação contra E. coli e Enterococcus faecium, segurança para bebês e FAQ detalhado.'
                    : 'Estrutura HTML completa com instrução de preparo com água da torneira, densidade cremosa sem talhar e FAQ.'}
                </p>
              </div>

            </div>
          </div>

          {/* Galeria de Fotos do Diretor de Arte Sincronizadas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                8 Fotos Produzidas pelo Diretor de Arte (Salvas na Nuvemshop):
              </h4>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% Homologadas & Sem Logos
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {photos.map(p => (
                <div key={p.slot} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-center text-[10px]">
                  <img src={p.url} alt={p.title} className="w-full aspect-square object-cover" />
                  <div className="p-1 font-bold text-slate-700">Slot {p.slot}</div>
                  <div className="text-[9px] text-slate-400 font-mono pb-1">{p.size}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Campos Preenchidos na Nuvemshop */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-sky-600" />
              Campos Preenchidos Diretamente na Nuvemshop (Store ID: 4383282):
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">PRODUTO ID</span>
                <span className="font-semibold text-slate-800">{is09168 ? '368839553' : '368839552'}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">PREÇO & ESTOQUE</span>
                <span className="font-semibold text-slate-800">R$ 12,24 | 17 un</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">GTIN / EAN</span>
                <span className="font-semibold text-slate-800">7897534836495</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">MARCA & DIMENSÕES</span>
                <span className="font-semibold text-slate-800">Qualifood | 25×15×5 cm</span>
              </div>
            </div>
          </div>

          {/* Feedback de Execução */}
          {executed && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Webhook Concluído com Sucesso! (HTTP 200 OK)
                </h4>
                <p className="text-xs text-emerald-800">
                  O Especialista em SEO recebeu o webhook, aplicou as hashtags <strong>#título-de-seo</strong>, <strong>#descrição-de-seo</strong>, <strong>#descrição-do-produto</strong> e salvou todos os campos e as 8 fotos na loja virtual.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Destinatário do Webhook: <strong>Especialista em SEO (Nuvemshop)</strong>
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
              disabled={isExecuting}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                executed 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-sky-600 hover:bg-sky-700'
              } disabled:opacity-60`}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Disparando Webhook...
                </>
              ) : executed ? (
                <>
                  <Check className="w-4 h-4" />
                  Webhook Re-executado com Sucesso
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Disparar Webhook para Especialista SEO & Salvar na Nuvemshop
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
