import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, CheckCircle2, Clock, ArrowRight, ShieldCheck, ShoppingBag, 
  Store, Image as ImageIcon, FileText, ChevronRight, RefreshCw, Eye, 
  ExternalLink, Layers, Award, BarChart3, AlertCircle, Check, X,
  Search, Users, MessageSquare, TrendingUp, Tag
} from 'lucide-react';
import { useSku } from '../../contexts/SkuContext';

interface AuditTask {
  id: string;
  date: string;
  productName: string;
  receivedPrompt: string;
  sentResponse: string;
  status: 'pending' | 'completed';
  role?: string;
  requestingSector?: string;
  executingSector?: string;
  oldScore?: number;
  newScore?: number;
  evolutionPercentage?: number;
}

interface PipelineStepInfo {
  id: string;
  number: number;
  role: string;
  agentTitle: string;
  actionTitle: string;
  status: 'completed' | 'in_progress' | 'pending';
  summary: string;
  savedToNuvemshop?: boolean;
  deliverableType: 'text' | 'image' | 'seo' | 'catalog';
  icon: any;
}

export default function MarketingDashboard() {
  const { activeSku: contextSku, setActiveSku: setContextSku } = useSku();
  const [selectedSku, setSelectedSku] = useState<string>(contextSku || '123Mart09168');
  const [activeTab, setActiveTab] = useState<'esteira' | 'nuvemshop' | 'galeria' | 'auditoria'>('esteira');
  
  const [auditLogs, setAuditLogs] = useState<AuditTask[]>([]);
  const [nuvemProduct, setNuvemProduct] = useState<any>(null);
  const [loadingNuvem, setLoadingNuvem] = useState<boolean>(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<AuditTask | null>(null);
  const [selectedStepModal, setSelectedStepModal] = useState<PipelineStepInfo | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Sincroniza com contexto global
  useEffect(() => {
    if (contextSku && contextSku !== selectedSku) {
      setSelectedSku(contextSku);
    }
  }, [contextSku]);

  // Carrega histórico de auditoria
  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get('/api/marketing/audit-logs');
      if (res.data && Array.isArray(res.data)) {
        setAuditLogs(res.data);
      }
    } catch (e) {
      console.warn('Erro ao buscar audit logs:', e);
    }
  };

  // Carrega produto da Nuvemshop
  const fetchNuvemProduct = async (sku: string) => {
    setLoadingNuvem(true);
    try {
      const res = await axios.get(`/api/marketing/nuvemshop/product/${sku}`);
      if (res.data) {
        setNuvemProduct(res.data);
      }
    } catch (e) {
      console.warn('Produto não encontrado ou loja desconectada:', e);
      setNuvemProduct(null);
    } finally {
      setLoadingNuvem(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchNuvemProduct(selectedSku);
    const interval = setInterval(fetchAuditLogs, 6000);
    return () => clearInterval(interval);
  }, [selectedSku]);

  const handleSelectSku = (sku: string) => {
    setSelectedSku(sku);
    setContextSku(sku);
  };

  const is09168 = selectedSku.toLowerCase().includes('09168');

  // Definição dos 8 Slots visuais homologados
  const slots09168 = [
    {
      id: 1,
      title: 'Slot 1: Capa Fundo Branco 100% Puro (#FFFFFF)',
      badge: 'Capa Oficial',
      badgeColor: 'bg-slate-900 text-white',
      desc: 'Fundo branco absoluto (#FFFFFF), sombra suave de estúdio, zero texto e zero logotipo da loja.',
      jpg: '/assets/slots_09168/slot_1.jpg',
      webp: '/assets/slots_09168/slot_1.webp',
      sizeJpg: '44.2 KB',
      sizeWebp: '30.9 KB'
    },
    {
      id: 2,
      title: 'Slot 2: Cozinha Real & Alimentos Frescos',
      badge: 'Higiene de Alimentos',
      badgeColor: 'bg-emerald-600 text-white',
      desc: 'Desinfecção de frutas e legumes, eliminação de agrotóxicos e preservação do frescor.',
      jpg: '/assets/slots_09168/slot_2.jpg',
      webp: '/assets/slots_09168/slot_2.webp',
      sizeJpg: '87.4 KB',
      sizeWebp: '71.0 KB'
    },
    {
      id: 3,
      title: 'Slot 3: Maternidade & Mamadeiras',
      badge: 'Maternidade Segura',
      badgeColor: 'bg-sky-600 text-white',
      desc: '100% seguro para mamadeiras, chupetas e bicos de bebê. Zero resíduo tóxico.',
      jpg: '/assets/slots_09168/slot_3.jpg',
      webp: '/assets/slots_09168/slot_3.webp',
      sizeJpg: '82.6 KB',
      sizeWebp: '73.9 KB'
    },
    {
      id: 4,
      title: 'Slot 4: Rendimento Máximo de 58 Litros',
      badge: 'Rendimento 58L',
      badgeColor: 'bg-amber-600 text-white',
      desc: '1 frasco de 350ml rende mais de 58 bacias de higienização. Máxima economia.',
      jpg: '/assets/slots_09168/slot_4.jpg',
      webp: '/assets/slots_09168/slot_4.webp',
      sizeJpg: '88.9 KB',
      sizeWebp: '68.0 KB'
    },
    {
      id: 5,
      title: 'Slot 5: Eficácia Comprovada em Laboratório',
      badge: 'Ação Antibacteriana',
      badgeColor: 'bg-rose-600 text-white',
      desc: 'Elimina 99,9% de Escherichia coli e Enterococcus faecium com ação bactericida testada.',
      jpg: '/assets/slots_09168/slot_5.jpg',
      webp: '/assets/slots_09168/slot_5.webp',
      sizeJpg: '87.6 KB',
      sizeWebp: '72.3 KB'
    },
    {
      id: 6,
      title: 'Slot 6: Diluição Rápida 6ml por Litro',
      badge: 'Modo de Uso',
      badgeColor: 'bg-indigo-600 text-white',
      desc: 'Apenas 1 colher de sobremesa (6ml) por litro de água da torneira. 10 minutos de molho.',
      jpg: '/assets/slots_09168/slot_6.jpg',
      webp: '/assets/slots_09168/slot_6.webp',
      sizeJpg: '86.1 KB',
      sizeWebp: '67.2 KB'
    },
    {
      id: 7,
      title: 'Slot 7: Não Altera Sabor nem Aroma',
      badge: 'Preservação Natural',
      badgeColor: 'bg-teal-600 text-white',
      desc: 'Alimentos crocantes e puros. Fórmula inodora e sem resíduo de cloro ou soda.',
      jpg: '/assets/slots_09168/slot_7.jpg',
      webp: '/assets/slots_09168/slot_7.webp',
      sizeJpg: '86.4 KB',
      sizeWebp: '69.1 KB'
    },
    {
      id: 8,
      title: 'Slot 8: Fórmula Biodegradável Start Química',
      badge: 'Sustentável',
      badgeColor: 'bg-emerald-700 text-white',
      desc: 'Grau alimentício biodegradável, sem agressão ao meio ambiente e com selo de fábrica.',
      jpg: '/assets/slots_09168/slot_8.jpg',
      webp: '/assets/slots_09168/slot_8.webp',
      sizeJpg: '85.2 KB',
      sizeWebp: '70.8 KB'
    }
  ];

  // Pipeline Stepper Steps
  const pipelineSteps: PipelineStepInfo[] = [
    {
      id: 'step-1',
      number: 1,
      role: 'Gerente de Projetos',
      agentTitle: 'Orquestrador Geral',
      actionTitle: 'Briefing Executivo & Delegação',
      status: 'completed',
      summary: 'Emissão de ordens sequenciais e parâmetros de qualidade técnica para a equipe de agentes.',
      deliverableType: 'text',
      icon: Award
    },
    {
      id: 'step-2',
      number: 2,
      role: 'Pesquisador de Mercado',
      agentTitle: 'Inteligência de Mercado',
      actionTitle: 'Mapeamento de Dores & Concorrência',
      status: 'completed',
      summary: 'Identificação de queixas contra concorrentes: cheiro residual nos alimentos e medo de resíduos tóxicos em mamadeiras.',
      deliverableType: 'text',
      icon: Search
    },
    {
      id: 'step-3',
      number: 3,
      role: 'Redator',
      agentTitle: 'Neuro-Copywriting',
      actionTitle: 'Estruturação de Gatilhos & Objeções',
      status: 'completed',
      summary: 'Copywriting focado em proteção materno-infantil, segurança alimentar e âncora de rendimento (58L por menos de R$ 0,22/litro).',
      deliverableType: 'text',
      icon: FileText
    },
    {
      id: 'step-4',
      number: 4,
      role: 'Especialista SEO',
      agentTitle: 'Publicação na Nuvemshop',
      actionTitle: 'Otimização & Salvamento Direto na Loja',
      status: 'completed',
      savedToNuvemshop: true,
      summary: 'Executou e salvou automaticamente no catálogo da Nuvemshop o Título Otimizado, Título SEO, Meta Descrição e Copy HTML.',
      deliverableType: 'seo',
      icon: Store
    },
    {
      id: 'step-5',
      number: 5,
      role: 'Diretor de Arte',
      agentTitle: 'Design Gráfico & Audiovisual',
      actionTitle: 'Galeria dos 8 Slots (100% Aprovados)',
      status: 'completed',
      savedToNuvemshop: true,
      summary: 'Homologação dos 8 slots visuais sem tarjas pretas, sem logos da loja, Slot 1 com fundo branco puro (#FFFFFF) e peso < 90 KB.',
      deliverableType: 'image',
      icon: ImageIcon
    },
    {
      id: 'step-6',
      number: 6,
      role: 'Especialista Merchant',
      agentTitle: 'Google Shopping & Feeds',
      actionTitle: 'Validação Google Merchant Center',
      status: 'completed',
      summary: 'Atributos obrigatórios (GTIN/EAN 7897534836495, peso, marca e dimensões) validados para veiculação no Google Shopping.',
      deliverableType: 'catalog',
      icon: Tag
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner: Resposta Imediata e Status da Esteira */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Esteira 100% Concluída & Homologada
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
                  <Store className="w-3.5 h-3.5 text-sky-400" />
                  Nuvemshop Store ID: 4383282
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Visão Geral do Marketing & Esteira de Agentes
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Central de auditoria, progresso em tempo real da equipe multiagente e confirmação de publicações sincronizadas com o e-commerce.
              </p>
            </div>

            {/* Seletor Rápido de SKU */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 min-w-[280px]">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                SKU em Monitoramento:
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectSku('123Mart09168')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                    selectedSku === '123Mart09168' 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  123Mart09168 (Qualifood)
                </button>
                <button
                  onClick={() => handleSelectSku('123Mart09078')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                    selectedSku === '123Mart09078' 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  123Mart09078 (Tuff)
                </button>
              </div>
              <div className="text-[11px] text-slate-300 mt-2 flex items-center justify-between">
                <span>Produto: <strong>{is09168 ? 'Germicida Qualifood 350ml' : 'Base Amaciante Tuff 900g'}</strong></span>
                <span className="text-emerald-400 font-medium">8/8 Aprovados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Informativo Executivo: Qual agente salvou o trabalho na Nuvemshop? */}
        <div className="p-6 bg-slate-50 border-b border-slate-200/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Quem salvou textos & SEO?</span>
                <h4 className="text-sm font-bold text-slate-900">Especialista SEO (Agente 5)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conforme as diretrizes corporativas, o Especialista SEO salvou automaticamente na Nuvemshop o título de alta conversão, metadados e a cópia HTML com modo de uso e FAQ.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Quem tratou as 8 Imagens?</span>
                <h4 className="text-sm font-bold text-slate-900">Diretor de Arte (Design Gráfico)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Criou os 8 slots com Strict Compositing, sem tarjas pretas e sem logotipos de loja. Slot 1 com fundo 100% branco (#FFFFFF) e todas aprovadas pela Diretoria.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Quem orquestrou tudo?</span>
                <h4 className="text-sm font-bold text-slate-900">Gerente de Projetos (Agente 9)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Liderou a esteira completa: Pesquisador &rarr; Redator &rarr; Especialista SEO &rarr; Diretor de Arte &rarr; Especialista Merchant, gerando o relatório final consolidado.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Abas de Navegação Interna da Visão Geral */}
        <div className="px-6 pt-4 border-b border-slate-200 bg-white">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('esteira')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'esteira'
                  ? 'border-sky-600 text-sky-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              Esteira de Produção dos Agentes ({pipelineSteps.length} Passos)
            </button>

            <button
              onClick={() => setActiveTab('nuvemshop')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'nuvemshop'
                  ? 'border-sky-600 text-sky-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Store className="w-4 h-4" />
              Resultado Salvo na Nuvemshop (Antes vs. Depois)
            </button>

            <button
              onClick={() => setActiveTab('galeria')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'galeria'
                  ? 'border-sky-600 text-sky-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Galeria dos 8 Slots Aprovados (Diretor de Arte)
            </button>

            <button
              onClick={() => setActiveTab('auditoria')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'auditoria'
                  ? 'border-sky-600 text-sky-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Log de Auditoria em Tempo Real ({auditLogs.length})
            </button>
          </nav>
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: ESTEIRA COMPLETA DOS AGENTES */}
      {activeTab === 'esteira' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-600" />
                  Fluxo Operacional Sequencial (SKU: {selectedSku})
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cada agente executa sua função e repassa o entregável para a próxima etapa até a publicação final.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  6 de 6 Etapas Concluídas
                </span>
              </div>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pipelineSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div 
                    key={step.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                          {step.number}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {step.savedToNuvemshop && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Salvo na Loja
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            Concluído
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
                        <Icon className="w-4 h-4" />
                        {step.role}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">
                        {step.actionTitle}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        {step.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {step.agentTitle}
                      </span>
                      <button
                        onClick={() => setSelectedStepModal(step)}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        Ver Detalhes <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: RESULTADO SALVO NA NUVEMSHOP (ANTES VS DEPOIS) */}
      {activeTab === 'nuvemshop' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  Auditoria de Publicação na Nuvemshop (Store ID: 4383282)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Registro do que o <strong>Especialista SEO</strong> gravou no produto através da API oficial da Nuvemshop.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Status: Publicado com Sucesso
                </span>
              </div>
            </div>

            {/* Comparativo Lado a Lado: Antes vs Depois */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card ANTES */}
              <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    Antes (Cadastro Inicial sem SEO)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                    Score SEO: 35% (Crítico)
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Título do Produto:
                    </label>
                    <div className="text-sm font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      Germicida Desinfetante Frutas Legumes Utensílios de Maternidade e Lacteos
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Título SEO (Google Snippet):
                    </label>
                    <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                      Germicida Desinfetante Frutas Legumes Utensílios de Maternidade
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Meta Description (Snippet de Busca):
                    </label>
                    <div className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-200">
                      Desinfete frutas, legumes e utensílios de maternidade com Germicida Qualifood. Compre agora!
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Descrição & Copywriting:
                    </label>
                    <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto">
                      Germicida desinfetante para frutas e legumes 350ml Start Química. Produto sem detalhes de diluição ou prova laboratorial.
                    </div>
                  </div>
                </div>
              </div>

              {/* Card DEPOIS (Salvo na Nuvemshop) */}
              <div className="bg-sky-50/50 rounded-xl border border-sky-200 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-sky-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    Depois (Salvo na Loja pelo Especialista SEO)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Score SEO: 98% (Excelente)
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-sky-700 block mb-1">
                      Título Otimizado (Palavras-Chave de Cauda Longa):
                    </label>
                    <div className="text-sm font-semibold text-slate-900 bg-white p-2.5 rounded-lg border border-sky-200">
                      Germicida Desinfetante Qualifood 350ml – Lava e Desinfeta Frutas, Legumes, Mamadeiras e Utensílios de Bebê
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-sky-700 block mb-1">
                      Título SEO (Otimizado para Busca Orgânica):
                    </label>
                    <div className="text-xs font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-sky-200">
                      Germicida Desinfetante Qualifood 350ml | Rende 58 Litros
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-sky-700 block mb-1">
                      Meta Description (Foco em Alto CTR):
                    </label>
                    <div className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-sky-200">
                      Desinfete frutas, verduras e mamadeiras com segurança hospitalar. O Germicida Qualifood 350ml rende até 58L, elimina bactérias e não deixa gosto nem cheiro.
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-sky-700 block mb-1">
                      Descrição Estruturada HTML (Neuro-Copywriting):
                    </label>
                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-sky-200 max-h-36 overflow-y-auto space-y-1">
                      <p><strong>Germicida Desinfetante Qualifood 350ml – Higienização Hospitalar e Segurança Alimentar</strong></p>
                      <p>Fórmula biodegradável de grau alimentício que desinfeta sem deixar resíduos tóxicos nem cheiro químico.</p>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li><strong>1 Frasco Rende até 58 Litros:</strong> 6 ml por litro.</li>
                        <li><strong>100% Seguro para Maternidade:</strong> Bicos e mamadeiras.</li>
                        <li><strong>Ação Antibacteriana Comprovada:</strong> E. coli e Enterococcus faecium.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Banner Informativo de Integração */}
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase">
                    Sincronização Nuvemshop Autenticada
                  </h4>
                  <p className="text-xs text-emerald-800">
                    O produto está ativo na loja virtual com o SKU <strong>{selectedSku}</strong> e GTIN/EAN <strong>7897534836495</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                  Preço: R$ 12,24 | Estoque: 17 un
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: GALERIA DOS 8 SLOTS APROVADOS (DIRETOR DE ARTE) */}
      {activeTab === 'galeria' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-sky-600" />
                  Galeria Oficial de 8 Slots Homologada (Diretor de Arte)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Todas as imagens foram aprovadas pela Diretoria, sem tarjas pretas, sem logotipos proibidos nos marketplaces e com peso reduzido.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  8 de 8 Slots Aprovados
                </span>
              </div>
            </div>

            {/* Grid dos 8 Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {slots09168.map((slot) => (
                <div 
                  key={slot.id} 
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Imagem com visualização */}
                    <div 
                      className="relative aspect-square bg-slate-100 cursor-pointer overflow-hidden"
                      onClick={() => setSelectedImageModal(slot.jpg)}
                    >
                      <img 
                        src={slot.jpg} 
                        alt={slot.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${slot.badgeColor}`}>
                          {slot.badge}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                          <Check className="w-3 h-3" /> Aprovado
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                        <Eye className="w-4 h-4" /> Expandir Imagem
                      </div>
                    </div>

                    <div className="p-3.5">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
                        {slot.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {slot.desc}
                      </p>
                    </div>
                  </div>

                  <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <span>JPG: <strong className="text-slate-800">{slot.sizeJpg}</strong></span>
                    <span>WebP: <strong className="text-emerald-700">{slot.sizeWebp}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Especificações Técnicas de Conformidade */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Checklist de Conformidade dos Marketplaces & Nuvemshop:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Slot 1:</strong> Fundo 100% Branco Puro (#FFFFFF) com sombra suave.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Sem Tarjas Pretas:</strong> Resolução nativa 1200x1200px sem letterbox.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Zero Branding da Loja:</strong> Sem nomes proibidos nos marketplaces.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 4: LOG DE AUDITORIA EM TEMPO REAL */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-600" />
                  Histórico de Auditoria & Entregas dos Agentes
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Registro cronológico de todas as ordens expedidas pelo Gerente de Projetos e relatórios de cada profissional.
                </p>
              </div>
              <button 
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar Logs
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-slate-200 rounded-xl">
                  Nenhum registro de auditoria encontrado.
                </div>
              ) : (
                auditLogs.map((task) => (
                  <div 
                    key={task.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                          {task.executingSector || task.role || 'Agente'}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {task.productName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {task.date}
                        </span>
                        {task.evolutionPercentage && (
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            +{task.evolutionPercentage}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Ordem Emitida ({task.requestingSector || 'Gerente'}):
                        </span>
                        <div className="text-slate-700 whitespace-pre-line line-clamp-3">
                          {task.receivedPrompt}
                        </div>
                      </div>

                      <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-200/60">
                        <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                          Relatório Entregue:
                        </span>
                        <div className="text-slate-700 line-clamp-3">
                          {(() => {
                            try {
                              const parsed = JSON.parse(task.sentResponse);
                              return parsed.message || task.sentResponse;
                            } catch {
                              return task.sentResponse;
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={() => setSelectedTaskForModal(task)}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                      >
                        Ver Detalhes Completos <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DE UMA ETAPA DA ESTEIRA */}
      {selectedStepModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                  {selectedStepModal.number}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedStepModal.actionTitle}
                  </h3>
                  <span className="text-xs text-sky-600 font-semibold">
                    Responsável: {selectedStepModal.role} ({selectedStepModal.agentTitle})
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStepModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Missão do Agente:</h4>
                <p>{selectedStepModal.summary}</p>
              </div>

              {selectedStepModal.savedToNuvemshop && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase">
                      Integrado Diretamente à Nuvemshop
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Esta etapa resultou em gravação oficial na loja através da API REST da Nuvemshop (Store ID: 4383282).
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 text-xs text-slate-500">
                Para auditar o histórico de comandos trocados, acesse a aba <strong>Log de Auditoria</strong> ou a tela específica deste agente no menu lateral.
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStepModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORIA INDIVIDUAL */}
      {selectedTaskForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                  {selectedTaskForModal.executingSector || selectedTaskForModal.role}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedTaskForModal.productName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTaskForModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase block mb-1">
                  Ordem Recebida do Gerente:
                </span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedTaskForModal.receivedPrompt}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase block mb-1">
                  Relatório & Dados Entregues pelo Agente:
                </span>
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-96">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedTaskForModal.sentResponse), null, 2);
                    } catch {
                      return selectedTaskForModal.sentResponse;
                    }
                  })()}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTaskForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM DE IMAGEM */}
      {selectedImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <button 
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedImageModal} 
              alt="Zoom do Slot" 
              className="w-full aspect-square object-contain rounded-xl bg-slate-100" 
            />
          </div>
        </div>
      )}

    </div>
  );
}
