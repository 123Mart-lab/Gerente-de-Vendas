import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Briefcase, Search, Sparkles, Plus, ArrowRight, CheckCircle2, Upload, File, 
  X, Image as ImageIcon, DollarSign, Play, StopCircle, RefreshCw, MessageSquare, 
  Send, Bot, User, Tag, AlertTriangle, ShieldCheck, Check, Edit3
} from 'lucide-react';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';
import AgentWhatsApp from '../chat/AgentWhatsApp';
import { useSku, extractSkuFromText, validateSkuFormat } from '../../contexts/SkuContext';

export default function ProjectManager() {
  const [activeTab, setActiveTab] = useState<'otimizacao' | 'pesquisa' | 'chat'>('otimizacao');
  const { activeSku, activeProductName, setActiveSku, clearActiveSku, validateSku } = useSku();
  const [manualSkuInput, setManualSkuInput] = useState('');
  const [manualSkuError, setManualSkuError] = useState<string | null>(null);
  const [isEditingSku, setIsEditingSku] = useState(false);
  
  // Persist chat state across tab switches and component unmounts
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'agent', text: string, timestamp: string }[]>(() => {
    const saved = localStorage.getItem('123mart_gerente_chat');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        role: 'agent',
        text: 'Olá. Sou o Gerente de Projetos. Como posso orquestrar as demandas da equipe hoje? Qual produto ou pesquisa precisamos iniciar?',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('123mart_gerente_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const handleSetManualSku = (e: React.FormEvent) => {
    e.preventDefault();
    setManualSkuError(null);
    const validation = validateSku(manualSkuInput);
    if (!validation.isValid) {
      setManualSkuError(validation.message);
      return;
    }
    setActiveSku(validation.formattedSku, activeProductName || `Produto ${validation.formattedSku}`);
    setManualSkuInput('');
    setIsEditingSku(false);
  };

  const validationResult = validateSku(activeSku);

  return (
    <div className="space-y-6">
      
      {/* Header do Gerente de Projetos */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-sky-600" />
          Gerente de Projetos
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-2">
          <p className="font-medium text-slate-700">Chefe do Setor de Publicidade & Orquestrador da Esteira</p>
          <ul className="space-y-1 mt-2 list-disc pl-5 text-sm">
            <li>Orquestra os fluxos de trabalho e dispara prompts em fila (Pesquisador &rarr; Monitor &rarr; Arte &rarr; SEO).</li>
            <li><strong>Controle de SKU Mandatório:</strong> Nenhum comando ou esteira é disparado sem um SKU válido ativo (padrão 123Mart...).</li>
          </ul>
        </div>
      </div>

      {/* Card de Controle Global e Validação do SKU Ativo */}
      <div className={`p-4 rounded-xl border shadow-xs transition-all ${
        validationResult.isValid 
          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
          : 'bg-amber-50/90 border-amber-300 text-amber-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              validationResult.isValid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {validationResult.isValid ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold">
                  {validationResult.isValid ? 'SKU Ativo Validado' : 'Atenção: Nenhum SKU Ativo Vinculado'}
                </span>
                {validationResult.isValid && (
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                    {activeSku}
                  </span>
                )}
                {validationResult.isValid && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    ✓ Injetado em todos os prompts
                  </span>
                )}
              </div>

              <p className="text-sm mt-0.5 font-medium">
                {validationResult.isValid 
                  ? (activeProductName ? `${activeProductName}` : 'Pronto para orquestração e interações de equipe.')
                  : 'Selecione um produto na lista ou digite o SKU abaixo. É proibido enviar comandos aos agentes sem SKU.'
                }
              </p>
            </div>
          </div>

          {/* Ações do SKU */}
          <div className="flex items-center gap-2 shrink-0">
            {validationResult.isValid ? (
              <button
                onClick={() => setIsEditingSku(!isEditingSku)}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditingSku ? 'Cancelar' : 'Alterar SKU'}
              </button>
            ) : (
              <button
                onClick={() => setIsEditingSku(true)}
                className="px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Tag className="w-3.5 h-3.5" />
                Vincular SKU
              </button>
            )}

            {activeSku && (
              <button
                onClick={() => {
                  clearActiveSku();
                  setIsEditingSku(false);
                }}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Desvincular SKU atual"
              >
                Desvincular
              </button>
            )}
          </div>
        </div>

        {/* Formulário de Vinculação Manual de SKU */}
        {(!validationResult.isValid || isEditingSku) && (
          <form onSubmit={handleSetManualSku} className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Tag className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={manualSkuInput}
                onChange={(e) => {
                  setManualSkuInput(e.target.value);
                  if (manualSkuError) setManualSkuError(null);
                }}
                placeholder="Digite o SKU (ex: 123Mart09015)..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Salvar SKU Ativo
            </button>
            {manualSkuError && (
              <div className="w-full text-xs text-rose-600 font-medium mt-1">
                ⚠️ {manualSkuError}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('otimizacao')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'otimizacao'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Otimização de Anúncios
          </button>
          <button
            onClick={() => setActiveTab('pesquisa')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'pesquisa'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Search className="w-4 h-4" />
            Pesquisa de Mercado
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Comunicação Direta
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'otimizacao' && <OtimizacaoAnuncios />}
        {activeTab === 'pesquisa' && <PesquisaMercado />}
        {activeTab === 'chat' && <ChatDireto messages={chatMessages} setMessages={setChatMessages} />}
      </div>
    </div>
  );
}

function OtimizacaoAnuncios() {
  const { activeSku, activeProductName, setActiveSku, validateSku } = useSku();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const autoPilotRef = useRef(false);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);
  
  const [seoFiltersEnabled, setSeoFiltersEnabled] = useState(false);
  const [seoScoreMin, setSeoScoreMin] = useState<number>(0);
  const [seoScoreMax, setSeoScoreMax] = useState<number>(100);
  const [ignoreKits, setIgnoreKits] = useState(false);
  const [ignoreAlteredCondition, setIgnoreAlteredCondition] = useState<'less' | 'more'>('less');
  const [ignoreAlteredDays, setIgnoreAlteredDays] = useState<number>(7);
  const isInitialMount = useRef(true);

  // Inicializa searchTerm com o produto ativo se já existir
  useEffect(() => {
    if (activeProductName && !searchTerm) {
      setSearchTerm(activeProductName);
    }
  }, [activeProductName]);

  // Load history from backend
  useEffect(() => {
    axios.get('/api/marketing/seo-filters').then(res => {
      if (res.data) {
        setSeoFiltersEnabled(res.data.enabled);
        setSeoScoreMin(res.data.min);
        setSeoScoreMax(res.data.max);
        setIgnoreKits(res.data.ignoreKits);
        setIgnoreAlteredCondition(res.data.alteredCondition);
        setIgnoreAlteredDays(res.data.alteredDays);
      }
    }).catch(console.error);
  }, []);

  // Persist filters to API so the server knows about them
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    axios.post('/api/marketing/seo-filters', {
      enabled: seoFiltersEnabled,
      min: seoScoreMin,
      max: seoScoreMax,
      ignoreKits: ignoreKits,
      alteredCondition: ignoreAlteredCondition,
      alteredDays: ignoreAlteredDays
    }).catch(console.error);
  }, [seoFiltersEnabled, seoScoreMin, seoScoreMax, ignoreKits, ignoreAlteredCondition, ignoreAlteredDays]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.productName !== 'Pesquisa de Viabilidade (Múltiplos Links)'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs', err);
      }
    };
    fetchLogs();
    
    // Auto refresh
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch products on mount and when typing
  useEffect(() => {
    const fetchProducts = async () => {
      setIsSearchingProducts(true);
      try {
        const response = await axios.get('/api/marketing/products', {
          params: { q: searchTerm }
        });
        setProducts(response.data);
      } catch (err) {
        console.error("Erro ao buscar produtos", err);
      } finally {
        setIsSearchingProducts(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 400); // Debounce
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelectProduct = (p: any) => {
    const validation = validateSku(p.id);
    if (!validation.isValid) {
      setValidationAlert(`Atenção: O produto "${p.name}" possui o código "${p.id}", que não segue o padrão "123Mart...". Ajuste o SKU no topo para continuar.`);
    } else {
      setValidationAlert(null);
    }

    setActiveSku(p.id, p.name, p);
    setSearchTerm(p.name);
    setShowDropdown(false);
  };

  const startAutoPilot = async () => {
    const newState = !isAutoPilotRunning;
    setIsAutoPilotRunning(newState);
    autoPilotRef.current = newState;
    setValidationAlert(null);
    
    if (newState) {
      try {
        const response = await axios.get('/api/marketing/products?limit=50&page=1');
        const catalog = response.data || [];
        
        for (const p of catalog) {
          if (!autoPilotRef.current) break;
          
          const rawSku = p.id || p.sku;
          const validation = validateSku(rawSku);

          // Validação rigorosa: ignora produtos com SKU inválido
          if (!validation.isValid) {
            console.warn(`[Piloto Automático] Produto ignorado por SKU inválido: ${p.name} (SKU: ${rawSku})`);
            continue;
          }

          if (seoFiltersEnabled) {
            const isKit = (p.name?.pt || p.name || '').toLowerCase().includes('kit');
            if (ignoreKits && isKit) continue;
          }
          
          setActiveSku(validation.formattedSku, p.name?.pt || p.name, p);
          setSearchTerm(p.name?.pt || p.name);
          setIsRunning(true);
          setProgress(0);
          
          let pVal = 0;
          const interval = setInterval(() => {
            pVal++;
            if(pVal < 4) setProgress(pVal);
          }, 2000);
          
          try {
            await axios.post('/api/marketing/orchestrate-optimization', { 
              productId: validation.formattedSku,
              sku: validation.formattedSku,
              query: p.name?.pt || p.name,
              name: p.name?.pt || p.name
            });
            setProgress(4);
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (err) {
            console.error(err);
          } finally {
            clearInterval(interval);
            setIsRunning(false);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAutoPilotRunning(false);
        autoPilotRef.current = false;
      }
    }
  };

  const startOptimization = async () => {
    setValidationAlert(null);
    const validation = validateSku(activeSku);

    // Validação estrita antes de permitir envio
    if (!validation.isValid) {
      setValidationAlert(`Bloqueio de Execução: ${validation.message} Defina um SKU válido iniciado em '123Mart' no topo da tela antes de iniciar a esteira.`);
      return;
    }

    setIsRunning(true);
    setProgress(0);

    // Mock progress visualizer that moves along while waiting
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p < 3) return p + 1;
        return p;
      });
    }, 4000);

    try {
      await axios.post('/api/marketing/orchestrate-optimization', { 
        productId: validation.formattedSku,
        sku: validation.formattedSku,
        query: activeProductName || searchTerm,
        name: activeProductName || searchTerm
      });
      setProgress(4);
    } catch (err) {
      console.error('Erro na orquestração:', err);
    } finally {
      clearInterval(progressInterval);
      setIsRunning(false);
    }
  };

  const isSkuReady = validateSku(activeSku).isValid;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Orquestração: Otimização de Anúncio Existente</h3>
        <p className="text-sm text-slate-600 mb-6">Selecione um produto da base para enviar para a esteira de otimização completa (Pesquisador &rarr; Monitor &rarr; Especialista SEO &rarr; Diretor de Arte).</p>
        
        {validationAlert && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationAlert}</span>
            </div>
            <button onClick={() => setValidationAlert(null)} className="font-bold text-rose-600 hover:text-rose-900">
              ✕
            </button>
          </div>
        )}

        {/* Toggle Filtros de SEO */}
        <div className="flex flex-col gap-2 mb-6 bg-white border border-slate-200 rounded-lg p-3 w-full shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className={`text-sm font-semibold ${seoFiltersEnabled ? 'text-indigo-700' : 'text-slate-700'}`}>Filtros de SEO</span>
              <span className={`text-[10px] font-medium ${seoFiltersEnabled ? 'text-indigo-500' : 'text-slate-400'}`}>
                Restringe o Piloto Automático e as orquestrações do Gerente
              </span>
            </div>
            <button 
              onClick={() => setSeoFiltersEnabled(!seoFiltersEnabled)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${seoFiltersEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </button>
          </div>
          
          <div className={`flex flex-col gap-2 mt-2 transition-all ${seoFiltersEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-medium whitespace-nowrap">Ignorar SEO entre</span>
              <input 
                type="number" min="0" max="100" 
                value={seoScoreMin} 
                onChange={e => setSeoScoreMin(Number(e.target.value))}
                className="w-14 p-1 border border-slate-200 rounded text-center focus:border-indigo-400 focus:outline-none" 
              />
              <span className="font-medium">% e</span>
              <input 
                type="number" min="0" max="100" 
                value={seoScoreMax} 
                onChange={e => setSeoScoreMax(Number(e.target.value))}
                className="w-14 p-1 border border-slate-200 rounded text-center focus:border-indigo-400 focus:outline-none" 
              />
              <span className="font-medium">%</span>
            </div>
            
            <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
              <input 
                type="checkbox" 
                checked={ignoreKits}
                onChange={e => setIgnoreKits(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer" 
              />
              Ignorar variações de kits
            </label>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-medium whitespace-nowrap">Ignorar alterados a</span>
              <select 
                value={ignoreAlteredCondition}
                onChange={e => setIgnoreAlteredCondition(e.target.value as 'less'|'more')}
                className="p-1 border border-slate-200 rounded focus:border-indigo-400 focus:outline-none bg-white"
              >
                <option value="less">menos de</option>
                <option value="more">mais de</option>
              </select>
              <input 
                type="number" min="1" 
                value={ignoreAlteredDays}
                onChange={e => setIgnoreAlteredDays(Number(e.target.value))}
                className="w-14 p-1 border border-slate-200 rounded text-center focus:border-indigo-400 focus:outline-none" 
              />
              <span className="font-medium">dias</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="relative flex-1 w-full" ref={dropdownRef}>
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Selecione ou busque um produto na Nuvemshop..." 
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white shadow-sm cursor-text"
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isSearchingProducts ? (
                  <div className="p-3 text-sm text-slate-500 text-center">Buscando produtos...</div>
                ) : products.length > 0 ? (
                  <ul className="py-1">
                    {products.map(p => (
                      <li 
                        key={p.id}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                        onClick={() => handleSelectProduct(p)}
                      >
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">SKU: {p.id}</span>
                          {p.id && p.id.toLowerCase().startsWith('123mart') ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">✓ SKU Válido</span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-semibold">⚠️ Requer Ajuste</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-sm text-slate-500 text-center">Nenhum produto encontrado.</div>
                )}
              </div>
            )}
          </div>
          
          <button 
            onClick={startOptimization}
            disabled={!isSkuReady || isRunning || isAutoPilotRunning}
            className="px-6 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs"
            title={!isSkuReady ? "Defina um SKU válido para habilitar a orquestração." : "Iniciar otimização estrutural com SKU validado"}
          >
            <Sparkles className="w-4 h-4" />
            {isRunning && !isAutoPilotRunning ? 'Orquestrando...' : 'Melhorar Anúncio'}
          </button>
          
          <button 
            onClick={startAutoPilot}
            disabled={isRunning && !isAutoPilotRunning}
            className={`px-6 py-2.5 ${isAutoPilotRunning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs`}
          >
            {isAutoPilotRunning ? (
              <><StopCircle className="w-4 h-4 animate-pulse" /> Interromper Orquestração</>
            ) : (
              <><Play className="w-4 h-4" /> Orquestrar Todos os Anúncios</>
            )}
          </button>
        </div>

        {/* Communication and Workflow WhatsApp UI */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <AgentWhatsApp 
            currentAgentId="gerente" 
            currentAgentName="Gerente de Projetos" 
            activeSku={activeSku}
            activeProductName={activeProductName}
          />
        </div>

        {/* Audit Panel (Global for Orchestration) */}
        <TaskAuditPanel mockTasks={mockHistory} />
      </div>
    </div>
  );
}

function PesquisaMercado() {
  const { activeSku, activeProductName } = useSku();
  const [pesquisaHistory, setPesquisaHistory] = useState<AuditTask[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setPesquisaHistory(res.data.filter((task: any) => task.productName === 'Pesquisa de Viabilidade (Múltiplos Links)'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs de pesquisa', err);
      }
    };
    fetchLogs();
    
    // Auto-refresh for demo
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const [links, setLinks] = useState(['', '', '']);
  const [files, setFiles] = useState<File[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [kbPlatformFee, setKbPlatformFee] = useState('');
  const [kbIcms, setKbIcms] = useState('');
  const [kbTaxes, setKbTaxes] = useState('');
  const [kbLogistics, setKbLogistics] = useState('');
  const [kbMargin, setKbMargin] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const addLink = () => {
    if (links.length < 5) setLinks([...links, '']);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const startResearch = () => {
    const validLinks = links.filter(l => l.trim() !== '');
    if (validLinks.length === 0 && files.length === 0) return;
    
    setIsRunning(true);
    setProgress(0);
    setPesquisaHistory([]);

    const skuHeader = activeSku ? `[SKU: ${activeSku}] ` : '';

    const steps = [
      { role: 'planner', req: 'Gerente de Projetos', exe: 'Pesquisador de Mercado', oldS: 0, newS: 40, ev: 40, prompt: `${skuHeader}Analise os links fornecidos e encontre o padrão de preços.`, resp: 'Encontrei um padrão onde o preço médio é R$ 120, com ofertas de R$ 99.' },
      { role: 'monitor', req: 'Pesquisador de Mercado', exe: 'Monitor de Concorrência', oldS: 40, newS: 70, ev: 30, prompt: `${skuHeader}Faça um benchmark detalhado com base na pesquisa.`, resp: 'Nossos concorrentes diretos estão focados em frete grátis. Sugiro destacarmos nosso envio expresso.' },
      { role: 'finance', req: 'Monitor de Concorrência', exe: 'Analista Financeiro', oldS: 70, newS: 90, ev: 20, prompt: `${skuHeader}Avalie a viabilidade financeira desta estratégia de preço.`, resp: 'A viabilidade é positiva. Temos margem para absorver o custo de envio expresso mantendo 35% de ROI.' }
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      if (currentProgress < steps.length) {
        const step = steps[currentProgress];
        const newTask = {
          id: `task-${step.role}-${Date.now()}`,
          date: new Date().toLocaleString('pt-BR'),
          productName: activeProductName ? `Pesquisa: ${activeProductName}` : 'Pesquisa de Viabilidade (Múltiplos Links)',
          receivedPrompt: step.prompt,
          sentResponse: step.resp,
          status: 'completed',
          role: step.role,
          requestingSector: step.req,
          executingSector: step.exe,
          oldScore: step.oldS,
          newScore: step.newS,
          evolutionPercentage: step.ev
        } as AuditTask;
        
        setPesquisaHistory(prev => [...prev, newTask]);
        axios.post('/api/marketing/audit-logs', { task: newTask }).catch(console.error);
      }

      currentProgress += 1;
      setProgress(currentProgress);
      if (currentProgress >= 3) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Orquestração: Pesquisa de Viabilidade de Produto</h3>
        <p className="text-sm text-slate-600 mb-6">Insira de 3 a 5 links de concorrentes e/ou anexe documentos (PDF, Imagens) do produto. O Gerente enviará a solicitação aos especialistas (Pesquisador &rarr; Monitor &rarr; Analista Financeiro) para criar o relatório de viabilidade.</p>
        
        <div className="space-y-3 max-w-2xl mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">Links da Concorrência</label>
          {links.map((link, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-slate-400 font-medium w-6">{index + 1}.</span>
              <input
                type="url"
                value={link}
                onChange={(e) => updateLink(index, e.target.value)}
                placeholder="https://produto.concorrente.com/..."
                className="flex-1 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 p-2.5"
              />
            </div>
          ))}
          {links.length < 5 && (
            <button 
              onClick={addLink}
              className="mt-2 text-sm text-sky-600 font-medium flex items-center gap-1 hover:text-sky-700 ml-9"
            >
              <Plus className="w-4 h-4" /> Adicionar outro link
            </button>
          )}
        </div>

        <div className="max-w-2xl mb-8 bg-slate-50 p-4 border border-slate-200 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Knowledge Base do Analista Financeiro
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Taxa da Plataforma (%)</label>
              <input type="text" value={kbPlatformFee} onChange={e => setKbPlatformFee(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: 10% ou 12.5%" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Alíquota ICMS (%)</label>
              <input type="text" value={kbIcms} onChange={e => setKbIcms(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: 18%" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Impostos / Simples (%)</label>
              <input type="text" value={kbTaxes} onChange={e => setKbTaxes(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: 6%" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Logística Fixa (R$)</label>
              <input type="text" value={kbLogistics} onChange={e => setKbLogistics(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: R$ 5,00" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 font-medium mb-1">Margem de Lucro Líquida Desejada (%)</label>
              <input type="text" value={kbMargin} onChange={e => setKbMargin(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" placeholder="Ex: 20%" />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">Materiais de Apoio (Opcional)</label>
          
          <div 
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:bg-slate-50 transition-colors text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">Clique para selecionar arquivos</p>
            <p className="text-xs text-slate-500 mt-1">PDFs de fornecedor, planilhas ou imagens de referência</p>
            <input 
              type="file" 
              multiple 
              accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {file.type.includes('image') ? (
                      <ImageIcon className="w-5 h-5 text-sky-500 shrink-0" />
                    ) : (
                      <File className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <span className="text-sm text-slate-700 font-medium truncate">{file.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button 
                    onClick={() => removeFile(index)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <button 
            onClick={startResearch}
            disabled={(links.filter(l => l.trim() !== '').length === 0 && files.length === 0) || isRunning}
            className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            {isRunning ? 'Gerando Relatório de Viabilidade...' : 'Iniciar Pesquisa de Mercado'}
          </button>
        </div>

        {/* Communication and Workflow WhatsApp UI */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <AgentWhatsApp 
            currentAgentId="gerente" 
            currentAgentName="Gerente de Projetos" 
            activeSku={activeSku}
            activeProductName={activeProductName}
          />
        </div>

        {/* Audit Panel (Pesquisa) */}
        <TaskAuditPanel mockTasks={pesquisaHistory} />
      </div>
    </div>
  );
}

function ChatDireto({ messages, setMessages }: { 
  messages: { role: 'user' | 'agent', text: string, timestamp: string }[], 
  setMessages: React.Dispatch<React.SetStateAction<{ role: 'user' | 'agent', text: string, timestamp: string }[]>> 
}) {
  const { activeSku, activeProductName, setActiveSku, validateSku } = useSku();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<AuditTask[]>([]);
  const [chatValidationError, setChatValidationError] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          // Show all tasks in the manager's view, since the manager orchestrates everything
          setChatHistory(res.data);
        }
      } catch (err) {
        console.error('Erro ao buscar logs', err);
      }
    };
    fetchLogs();
    
    // Auto refresh
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setChatValidationError(null);

    // Tenta detectar SKU no texto da mensagem
    const detectedSku = extractSkuFromText(userMessage);
    let effectiveSku = activeSku;

    if (detectedSku) {
      const val = validateSku(detectedSku);
      if (val.isValid) {
        effectiveSku = val.formattedSku;
        setActiveSku(val.formattedSku);
      }
    }

    // Validação estrita: exige SKU para comandos operacionais do gerente
    const isTaskInstruction = /briefing|otimiza|planner|pesquis|concorr|anuncio|melhor|esteira|art|seo|produto/i.test(userMessage);
    const skuValidation = validateSku(effectiveSku);

    if (isTaskInstruction && !skuValidation.isValid) {
      setChatValidationError(`Bloqueio de Segurança: ${skuValidation.message} Por favor, defina o SKU ativo no topo da tela ou inclua o SKU no seu texto (ex: 123Mart09015).`);
      return;
    }

    setInputMessage('');
    
    const newMessages = [
      ...messages,
      { role: 'user' as const, text: userMessage, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await axios.post('/api/marketing/chat-gerente', {
        message: userMessage,
        history: messages,
        activeSku: effectiveSku,
        activeProductName: activeProductName
      });
      
      setMessages([
        ...newMessages,
        {
          role: 'agent',
          text: res.data.response || 'Erro ao processar resposta.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: 'agent',
          text: 'Ocorreu um erro ao me comunicar com o servidor. Verifique os logs.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0 flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Gerente de Projetos</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Online e aguardando ordens
              </p>
            </div>
          </div>
          {activeSku && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-mono font-bold shadow-2xs">
              <Tag className="w-3.5 h-3.5" />
              SKU: {activeSku}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-sky-100 text-sky-600'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
                <div className={`p-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-tr-sm' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-sky-100 text-sky-600">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {chatValidationError && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{chatValidationError}</span>
            </div>
            <button onClick={() => setChatValidationError(null)} className="font-bold text-rose-600 hover:text-rose-900 ml-2">
              ✕
            </button>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                if (chatValidationError) setChatValidationError(null);
              }}
              placeholder={activeSku ? `Digite uma ordem para o Gerente (SKU ativo: ${activeSku})...` : "Digite uma ordem para o Gerente (especifique o SKU 123Mart...)"}
              className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 p-3"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-5 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-4 text-lg">Últimas Atividades Orquestradas</h3>
        <TaskAuditPanel mockTasks={chatHistory} />
      </div>
    </div>
  );
}
