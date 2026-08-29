import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Search, Sparkles, RefreshCw, LayoutTemplate, Save, CheckCircle2, ToggleLeft, ToggleRight, CheckSquare2, Square, Filter, ArrowUpDown } from 'lucide-react';

const getScoreColor = (score: number) => {
  if (score < 60) return 'bg-rose-100 text-rose-700 border-rose-200';
  if (score <= 80) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (score <= 90) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};

const getScoreLabel = (score: number) => {
  if (score < 60) return 'SEO Ruim';
  if (score <= 80) return 'SEO Médio';
  if (score <= 90) return 'SEO Bom';
  return 'SEO Excelente';
};

const ScoreBadge = ({ score, showLabel = false }: { score?: number, showLabel?: boolean }) => {
  if (score === undefined || score === null) return null;
  const colors = getScoreColor(score);
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colors}`}>
      {showLabel ? `${getScoreLabel(score)}: ${score}%` : `Nota de SEO: ${score}%`}
    </div>
  );
};

const calculateAverages = (seoResult: any) => {
  if (!seoResult) return { avgOriginal: 0, avgNovo: 0 };
  const origScores = [
    seoResult.scoreTituloOriginal,
    seoResult.scoreMetaOriginal,
    seoResult.scoreTagsOriginal,
    seoResult.scoreUrlOriginal,
    seoResult.scoreMarcaOriginal,
    seoResult.scoreDescricaoOriginal
  ].filter(s => s !== undefined && s !== null);
  
  const avgOriginal = origScores.length ? Math.round(origScores.reduce((a, b) => a + b, 0) / origScores.length) : 0;

  const newScores = [
    seoResult.scoreTituloNovo,
    seoResult.scoreMetaNova,
    seoResult.scoreTagsNova,
    seoResult.scoreUrlNova,
    seoResult.scoreMarcaNova,
    seoResult.scoreDescricaoNova
  ].filter(s => s !== undefined && s !== null);

  const avgNovo = newScores.length ? Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length) : 0;
  
  return { avgOriginal, avgNovo };
};

export default function ProductOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [optimized, setOptimized] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [seoResult, setSeoResult] = useState<any>(null);

  const [showHtmlPreview, setShowHtmlPreview] = useState(true);
  const [autoPilot, setAutoPilot] = useState(false);
  const [autoPilotLogs, setAutoPilotLogs] = useState<{id: number, text: string, type: 'info' | 'success' | 'warning'}[]>([]);
  const autoPilotActive = useRef(false);
  const processedProductIds = useRef<Set<string | number>>(new Set());
  
  const [autoPilotInterval, setAutoPilotInterval] = useState<number>(0.5);
  const autoPilotIntervalRef = useRef<number>(0.5);
  
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveEnabledRef = useRef(true);
  const manualResumeRef = useRef<(() => void) | null>(null);

  const [skipEnabled, setSkipEnabled] = useState(false);
  const skipEnabledRef = useRef(false);
  const [skipDays, setSkipDays] = useState<number>(7);
  const skipDaysRef = useRef<number>(7);
  
  interface AlteredProduct {
    id: string | number;
    name: string;
    alteredAt: string;
    timestamp: number;
    oldScore: number;
    newScore: number;
  }
  const [alteredProducts, setAlteredProducts] = useState<AlteredProduct[]>([]);
  
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState<'time_desc'|'time_asc'|'score_desc'|'score_asc'|'name_asc'|'name_desc'|'evo_desc'|'evo_asc'>('time_desc');

  const toggleAutoPilot = async () => {
    const newState = !autoPilot;
    setAutoPilot(newState);
    autoPilotActive.current = newState;
    
    if (newState) {
      alert('Piloto Automático Ativado! As regras de segurança (URL e Título SEO inalterados) serão rigorosamente aplicadas em otimizações em massa.');
      runAutoPilot();
    }
  };

  const addLog = (type: 'info' | 'success' | 'warning', text: string) => {
    setAutoPilotLogs(prev => [...prev.slice(-3), { id: Date.now() + Math.random(), type, text }]);
  };

  const runAutoPilot = async () => {
    addLog('info', 'Iniciando Piloto Automático... Buscando catálogo da Nuvemshop.');
    
    let catalog = [];
    try {
      const response = await axios.get('/api/marketing/products?q=');
      catalog = response.data || [];
    } catch (e) {
      addLog('warning', 'Erro ao buscar catálogo da Nuvemshop.');
      setAutoPilot(false);
      autoPilotActive.current = false;
      return;
    }

    if (catalog.length === 0) {
      addLog('warning', 'Nenhum produto retornado da loja.');
      setAutoPilot(false);
      autoPilotActive.current = false;
      return;
    }

    addLog('success', `${catalog.length} produtos encontrados na fila.`);

    for (const product of catalog) {
      if (!autoPilotActive.current) {
        addLog('info', 'Piloto automático interrompido pelo usuário.');
        break;
      }

      if (processedProductIds.current.has(product.id)) {
        continue;
      }
      
      if (skipEnabledRef.current && product.updated_at) {
        const skipDaysMs = skipDaysRef.current * 24 * 60 * 60 * 1000;
        const updatedAt = new Date(product.updated_at).getTime();
        const now = Date.now();
        if (now - updatedAt < skipDaysMs) {
          const skipProductName = product.name?.pt || product.name || 'Produto Desconhecido';
          addLog('info', `Pulando ${skipProductName} (alterado há menos de ${skipDaysRef.current} dias)`);
          continue;
        }
      }
      
      processedProductIds.current.add(product.id);

      const productName = product.name?.pt || product.name || 'Produto Desconhecido';
      setSelectedProductId(product.id);
      setSearchTerm(productName);
      setOriginalProduct(product);
      setSeoResult(null);
      setOptimized(false);
      
      addLog('warning', `[AGENTE 1] Analisando SEO do produto: ${productName}`);
      setIsOptimizing(true);
      
      try {
        const response = await axios.post('/api/marketing/optimize', { 
          productId: product.id,
          query: productName 
        });

        const finalData = response.data;
        if (!finalData || !finalData.otimizado) {
          throw new Error("A IA retornou um pacote vazio para este produto");
        }
        
        setOriginalProduct(finalData.original);
        setSeoResult(finalData.otimizado);
        setOptimized(true);
        setIsOptimizing(false);

        if (!autoPilotActive.current) {
          break;
        }

        setSelectedFields({
          title: true,
          metaDescription: true,
          brand: true,
          tags: true,
          url: false,
          seoTitle: true,
          description: true
        });

        if (autoSaveEnabledRef.current) {
          const currentInterval = autoPilotIntervalRef.current;
          addLog('success', `[AGENTES 2 e 3] Otimização gerada. Aguardando revisão visual por ${currentInterval} min...`);
          
          for (let i = 0; i < currentInterval * 60; i++) {
            if (!autoPilotActive.current || !autoSaveEnabledRef.current) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          if (!autoPilotActive.current) break;

          if (autoSaveEnabledRef.current) {
            addLog('warning', `[AGENTE 4] Salvando alterações na Nuvemshop...`);
            setIsSaving(true);
            
            const payloadToSave: any = {};
            if (finalData.otimizado?.novoTitulo) payloadToSave.novoTitulo = finalData.otimizado.novoTitulo;
            if (finalData.otimizado?.novoTitulo) payloadToSave.novoTituloSeo = finalData.otimizado.novoTitulo;
            if (finalData.otimizado?.metaDescription) payloadToSave.metaDescription = finalData.otimizado.metaDescription;
            if (finalData.otimizado?.marca) payloadToSave.marca = finalData.otimizado.marca;
            if (finalData.otimizado?.tags) payloadToSave.tags = finalData.otimizado.tags;
            
            if (finalData.otimizado?.novaDescricaoHtml) {
              payloadToSave.novaDescricaoHtml = finalData.otimizado.novaDescricaoHtml;
            }
            
            await axios.post('/api/marketing/save', {
              productId: product.id,
              data: payloadToSave
            });
            
            const avgs = calculateAverages(finalData.otimizado);
            setAlteredProducts(prev => [{
              id: product.id,
              name: product.name?.pt || product.name || 'Produto Desconhecido',
              alteredAt: new Date().toLocaleString(),
              timestamp: Date.now(),
              oldScore: avgs.avgOriginal,
              newScore: avgs.avgNovo
            }, ...prev]);
            
            setIsSaving(false);
            addLog('success', `Produto salvo com sucesso! Passando para o próximo...`);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        if (!autoSaveEnabledRef.current) {
          addLog('success', `[AGENTES 2 e 3] Otimização gerada. Aguardando você clicar em Salvar manual...`);
          await new Promise<void>(resolve => {
            manualResumeRef.current = resolve;
          });
          manualResumeRef.current = null;
          
          if (!autoPilotActive.current) break;
          
          addLog('info', `Passando para o próximo produto da fila...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        setIsOptimizing(false);
        setIsSaving(false);
        addLog('warning', `Erro ao processar o produto ${productName}. Pulando...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (autoPilotActive.current) {
      addLog('success', 'Varredura de todo o catálogo concluída!');
      setAutoPilot(false);
      autoPilotActive.current = false;
    }
  };
  const [selectedFields, setSelectedFields] = useState({
    title: true,
    metaDescription: true,
    brand: true,
    tags: true,
    url: false,
    seoTitle: true,
    description: true
  });

  const toggleField = (field: keyof typeof selectedFields) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Close dropdown when clicking outside
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

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimized(false);
    try {
      const response = await axios.post('/api/marketing/optimize', { 
        productId: selectedProductId,
        query: searchTerm 
      });
      
      if (!response.data || !response.data.otimizado) {
        throw new Error("A IA retornou um pacote vazio para este produto");
      }
      
      setOriginalProduct(response.data.original);
      setSeoResult(response.data.otimizado);
      setOptimized(true);
      
      // Reset toggles to correct defaults when new optimization comes
      setSelectedFields({
        title: true,
        metaDescription: true,
        brand: true,
        tags: true,
        url: false,
        seoTitle: true,
        description: true
      });
    } catch (error) {
      console.error('Erro na otimização:', error);
      alert('Erro na otimização. Verifique o console.');
      setOptimized(false);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Build the final payload depending on what is toggled ON
      const finalData: any = {};
      if (selectedFields.title) finalData.novoTitulo = seoResult?.novoTitulo;
      if (selectedFields.seoTitle) finalData.novoTituloSeo = seoResult?.novoTitulo;
      if (selectedFields.metaDescription) finalData.metaDescription = seoResult?.metaDescription;
      if (selectedFields.brand) finalData.marca = seoResult?.marca;
      if (selectedFields.tags) finalData.tags = seoResult?.tags;
      
      if (selectedFields.url) finalData.urlProduto = seoResult?.urlProduto;
      if (selectedFields.description) finalData.novaDescricaoHtml = seoResult?.novaDescricaoHtml;

      const response = await axios.post('/api/marketing/save', {
        productId: originalProduct?.id,
        data: finalData
      });
      if (response.data.success) {
        alert(response.data.mock ? 'Produto salvo com sucesso! (Modo Simulação)' : 'Produto salvo e atualizado na Nuvemshop com sucesso!');
        const avgs = calculateAverages(seoResult);
        setAlteredProducts(prev => [{
          id: originalProduct.id,
          name: originalProduct.name?.pt || originalProduct.name || 'Produto Desconhecido',
          alteredAt: new Date().toLocaleString(),
          timestamp: Date.now(),
          oldScore: avgs.avgOriginal,
          newScore: avgs.avgNovo
        }, ...prev]);
        setOptimized(false);
        setOriginalProduct(null);
        setSeoResult(null);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Falha ao salvar produto na Nuvemshop.');
    } finally {
      setIsSaving(false);
      if (manualResumeRef.current) {
        manualResumeRef.current();
      }
    }
  };

  const renderHTML = (html: string) => {
    return { __html: html || '' };
  };

  const { avgOriginal, avgNovo } = calculateAverages(seoResult);

  const filteredAndSortedHistory = useMemo(() => {
    let result = [...alteredProducts];
    
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    
    result.sort((a, b) => {
      switch (historySort) {
        case 'time_desc': return b.timestamp - a.timestamp;
        case 'time_asc': return a.timestamp - b.timestamp;
        case 'score_desc': return b.newScore - a.newScore;
        case 'score_asc': return a.newScore - b.newScore;
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'evo_desc': return (b.newScore - b.oldScore) - (a.newScore - a.oldScore);
        case 'evo_asc': return (a.newScore - a.oldScore) - (b.newScore - b.oldScore);
        default: return 0;
      }
    });
    
    return result;
  }, [alteredProducts, historySearch, historySort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-500" />
            SEO de Produtos
          </h2>
          <p className="text-slate-500 mt-1">Análise semântica, geração de copy e injeção de SEO para a Nuvemshop.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {/* Toggle Piloto Automático */}
          <div className={`flex items-center gap-3 border px-4 py-2 rounded-lg transition-colors ${autoPilot ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 opacity-80'}`}>
            <div className="flex flex-col text-right">
              <span className={`text-sm font-semibold ${autoPilot ? 'text-indigo-700' : 'text-slate-700'}`}>Piloto Automático</span>
              <span className={`text-xs font-medium ${autoPilot ? 'text-indigo-500' : 'text-slate-400'}`}>
                {autoPilot ? 'Ativado (Processamento em Lote)' : 'Desativado'}
              </span>
            </div>
            <button 
              onClick={toggleAutoPilot}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${autoPilot ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </button>
          </div>
          {autoPilot && (
            <>
              <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-md shadow-sm animate-in fade-in slide-in-from-top-2 transition-colors ${autoSaveEnabled ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={autoSaveEnabled}
                    onChange={(e) => {
                      setAutoSaveEnabled(e.target.checked);
                      autoSaveEnabledRef.current = e.target.checked;
                      if (e.target.checked && manualResumeRef.current) {
                        manualResumeRef.current();
                      }
                    }}
                  />
                  <span className={`text-xs font-medium ${autoSaveEnabled ? 'text-indigo-700' : 'text-slate-600'}`}>Gravar automático em</span>
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  disabled={!autoSaveEnabled}
                  className="w-16 text-center text-sm border border-slate-200 rounded focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none p-1 bg-white text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                  value={autoPilotInterval}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAutoPilotInterval(val);
                    autoPilotIntervalRef.current = isNaN(val) ? 0.5 : val;
                  }}
                />
                <span className={`text-xs font-medium ${autoSaveEnabled ? 'text-indigo-700' : 'text-slate-500'}`}>min</span>
              </div>
              
              <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-md shadow-sm animate-in fade-in slide-in-from-top-2 transition-colors ${skipEnabled ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={skipEnabled}
                    onChange={(e) => {
                      setSkipEnabled(e.target.checked);
                      skipEnabledRef.current = e.target.checked;
                    }}
                  />
                  <span className={`text-xs font-medium ${skipEnabled ? 'text-indigo-700' : 'text-slate-600'}`}>Pular alterados nos últimos</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  disabled={!skipEnabled}
                  className="w-16 text-center text-sm border border-slate-200 rounded focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none p-1 bg-white text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                  value={skipDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setSkipDays(val);
                    skipDaysRef.current = isNaN(val) ? 7 : val;
                  }}
                />
                <span className={`text-xs font-medium ${skipEnabled ? 'text-indigo-700' : 'text-slate-500'}`}>dias</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Barra de Busca e Ação Principal */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full" ref={dropdownRef}>
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Selecione ou busque um produto na Nuvemshop..." 
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white shadow-sm cursor-text"
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedProductId(null);
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
                        onClick={() => {
                          setSearchTerm(p.name);
                          setSelectedProductId(p.id);
                          setShowDropdown(false);
                        }}
                      >
                        <div className="font-medium text-slate-800 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-slate-400">ID: {p.id}</div>
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
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
          >
            {isOptimizing ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Analisando...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Gerar Otimização Profissional</>
            )}
          </button>
        </div>

        {!optimized && !originalProduct ? (
          autoPilot ? (
            <div className="flex flex-col h-96 bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700 font-mono text-sm">
              <div className="bg-slate-800 px-4 py-2 flex items-center border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <span className="ml-4 text-slate-400 text-xs">Terminal de Agentes (Piloto Automático)</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-2 flex flex-col justify-end">
                {autoPilotLogs.map(log => (
                  <div key={log.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <span className="text-slate-500 mr-2">[{new Date(log.id).toLocaleTimeString()}]</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-400 font-semibold' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.text.includes('[AGENTE') ? 'text-sky-300' : 'text-slate-300'
                    }>{log.text}</span>
                  </div>
                ))}
                <div className="flex items-center text-slate-500">
                  <span className="mr-2">[{new Date().toLocaleTimeString()}]</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-16">
              <LayoutTemplate className="w-16 h-16 mb-4 text-slate-200" />
              <p className="text-center font-medium text-lg text-slate-500">Aguardando comando de otimização...</p>
              <p className="text-center text-sm mt-2 max-w-md">A Inteligência Artificial analisará a categoria do produto para definir o público-alvo e criará copies focadas em vendas e SEO.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col animate-in fade-in duration-500">
            {/* Header das Colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200 bg-slate-100">
              <div className="p-4 border-r border-slate-200">
                <h3 className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Produto Atual</span>
                  <ScoreBadge score={avgOriginal} showLabel={true} />
                </h3>
              </div>
              <div className="p-4 bg-emerald-50">
                <h3 className="font-semibold text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Resultado da Otimização</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-700">Selecione o que deseja salvar:</span>
                    <ScoreBadge score={avgNovo} showLabel={true} />
                  </div>
                </h3>
              </div>
            </div>

            {/* Linha: Título */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              {/* Lado Esquerdo - Original */}
              <div className="p-5 border-r border-slate-200 bg-slate-50/50 flex flex-col">
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Título Original
                    </label>
                    <ScoreBadge score={seoResult?.scoreTituloOriginal} />
                  </div>
                  <p className="text-sm text-slate-800 font-medium">
                    {typeof originalProduct?.name === 'string' ? originalProduct?.name : (originalProduct?.name?.pt || <span className="text-slate-400 italic">Vazio</span>)}
                  </p>
                </div>
              </div>
              
              {/* Lado Direito - Otimizado */}
              <div className="p-5 bg-emerald-50/30 flex flex-col">
                {/* Checkbox Titulo */}
                <div className={`p-3 rounded-lg border shadow-sm flex-1 flex flex-col ${selectedFields.title ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('title')}>
                      {selectedFields.title ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Novo Título Otimizado
                    </label>
                    <ScoreBadge score={seoResult?.scoreTituloNovo} />
                  </div>
                  <input
                    type="text"
                    disabled={!selectedFields.title}
                    value={seoResult?.novoTitulo || ''}
                    onChange={(e) => setSeoResult({...seoResult, novoTitulo: e.target.value})}
                    className="w-full text-sm text-slate-900 font-medium p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors disabled:bg-slate-100 disabled:text-slate-500 mt-auto"
                  />
                </div>
              </div>
            </div>

            {/* Linha: Meta Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-slate-50/50 flex flex-col">
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Meta Description Original
                    </label>
                    <ScoreBadge score={seoResult?.scoreMetaOriginal} />
                  </div>
                  <p className="text-sm text-slate-800">
                    {typeof originalProduct?.seo_description === 'string' ? originalProduct?.seo_description : (originalProduct?.seo_description?.pt || <span className="text-slate-400 italic">Vazia (A Nuvemshop usará parte da descrição principal)</span>)}
                  </p>
                </div>
              </div>
              
              <div className="p-5 bg-emerald-50/30 flex flex-col">
                {/* Checkbox Meta Description */}
                <div className={`p-3 rounded-lg border shadow-sm flex-1 flex flex-col ${selectedFields.metaDescription ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('metaDescription')}>
                      {selectedFields.metaDescription ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Meta Description (SEO)
                    </label>
                    <ScoreBadge score={seoResult?.scoreMetaNova} />
                  </div>
                  <textarea
                    disabled={!selectedFields.metaDescription}
                    value={seoResult?.metaDescription || ''}
                    onChange={(e) => setSeoResult({...seoResult, metaDescription: e.target.value})}
                    className="w-full text-sm text-slate-900 p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors resize-y h-16 disabled:bg-slate-100 disabled:text-slate-500 mt-auto"
                  />
                </div>
              </div>
            </div>

            {/* Linha: SEO Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-slate-50/50 flex flex-col">
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Título SEO Original
                    </label>
                    <ScoreBadge score={seoResult?.scoreTituloOriginal} />
                  </div>
                  <p className="text-sm text-slate-800">
                    {typeof originalProduct?.seo_title === 'string' ? originalProduct?.seo_title : (originalProduct?.seo_title?.pt || <span className="text-slate-400 italic">Vazio (Usa o Título Padrão)</span>)}
                  </p>
                </div>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col">
                <div className={`p-3 rounded-lg border shadow-sm flex-1 flex flex-col ${selectedFields.seoTitle ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('seoTitle')}>
                      {selectedFields.seoTitle ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Título SEO (Otimizado)
                    </label>
                    <ScoreBadge score={seoResult?.scoreTituloNovo} />
                  </div>
                  <div className="text-sm text-slate-500 italic mb-1">
                    Ao marcar esta opção, o novo título otimizado gerado pela IA (visto acima) também será aplicado como o Título SEO do produto na Nuvemshop.
                  </div>
                </div>
              </div>
            </div>

            {/* Linha: Marca */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-slate-50/50 flex flex-col">
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Marca Atual
                    </label>
                    <ScoreBadge score={seoResult?.scoreMarcaOriginal} />
                  </div>
                  <p className="text-sm text-slate-800">
                    {originalProduct?.brand || <span className="text-slate-400 italic">Não cadastrada</span>}
                  </p>
                </div>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col">
                {/* Checkbox Marca */}
                <div className={`p-3 rounded-lg border shadow-sm flex-1 flex flex-col ${selectedFields.brand ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('brand')}>
                      {selectedFields.brand ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Marca Sugerida (IA)
                    </label>
                    <ScoreBadge score={seoResult?.scoreMarcaNova} />
                  </div>
                  <input
                    type="text"
                    disabled={!selectedFields.brand}
                    value={seoResult?.marca || ''}
                    onChange={(e) => setSeoResult({...seoResult, marca: e.target.value})}
                    className="w-full text-sm text-slate-900 font-medium p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors disabled:bg-slate-100 disabled:text-slate-500 mt-auto"
                  />
                </div>
              </div>
            </div>

            {/* Linha: Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-slate-50/50 flex flex-col">
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tags Atuais
                    </label>
                    <ScoreBadge score={seoResult?.scoreTagsOriginal} />
                  </div>
                  <p className="text-sm text-slate-800">
                    {originalProduct?.tags || <span className="text-slate-400 italic">Sem tags</span>}
                  </p>
                </div>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col">
                {/* Checkbox Tags */}
                <div className={`p-3 rounded-lg border shadow-sm flex-1 flex flex-col ${selectedFields.tags ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('tags')}>
                      {selectedFields.tags ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Novas Tags SEO (IA)
                    </label>
                    <ScoreBadge score={seoResult?.scoreTagsNova} />
                  </div>
                  <input
                    type="text"
                    disabled={!selectedFields.tags}
                    value={seoResult?.tags || ''}
                    onChange={(e) => setSeoResult({...seoResult, tags: e.target.value})}
                    className="w-full text-sm text-slate-900 font-medium p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors disabled:bg-slate-100 disabled:text-slate-500 mt-auto"
                  />
                </div>
              </div>
            </div>

            {/* Linha: URL Amigável */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-slate-50/50 flex flex-col">
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      URL Original
                    </label>
                    <ScoreBadge score={seoResult?.scoreUrlOriginal} />
                  </div>
                  <p className="text-sm text-slate-800 font-mono break-all">
                    .../produtos/{typeof originalProduct?.handle === 'string' ? originalProduct?.handle : (originalProduct?.handle?.pt || 'vazio')}
                  </p>
                </div>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col">
                <div className={`p-3 rounded-lg border shadow-sm flex-1 flex flex-col ${selectedFields.url ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('url')}>
                      {selectedFields.url ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Nova URL Amigável
                    </label>
                    <ScoreBadge score={seoResult?.scoreUrlNova} />
                  </div>
                  <div className="flex items-center opacity-100 mt-auto">
                    <span className="text-sm text-slate-500 bg-slate-100 border border-slate-200 border-r-0 rounded-l p-2">.../produtos/</span>
                    <input
                      type="text"
                      disabled={!selectedFields.url}
                      value={seoResult?.urlProduto || ''}
                      onChange={(e) => setSeoResult({...seoResult, urlProduto: e.target.value})}
                      className="w-full text-sm text-sky-700 font-mono p-2 bg-white border border-slate-200 rounded-r focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  {!selectedFields.url && (
                    <div className="mt-2 text-[10px] text-amber-600 font-medium">
                      ⚠️ Sugestão desativada por padrão. Lembre-se de criar um redirecionamento 301 se alterar a URL.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Linha: Descrição */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-5 border-r border-slate-200 bg-slate-50/50 flex flex-col gap-4">
                <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Descrição Atual (Visualização HTML)
                    </label>
                    <ScoreBadge score={seoResult?.scoreDescricaoOriginal} />
                  </div>
                  <div 
                    className="prose prose-sm text-slate-600 break-words max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1"
                    dangerouslySetInnerHTML={renderHTML(
                      typeof originalProduct?.description === 'string' ? originalProduct?.description : originalProduct?.description?.pt
                    )} 
                  />
                  {seoResult?.dicasMelhoria && seoResult.dicasMelhoria.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 mt-auto">
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                        <p className="font-semibold mb-1">⚠️ Auditoria Técnica (Por que o original perdeu pontos):</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-90">
                          {seoResult.dicasMelhoria.map((dica: string, i: number) => <li key={i}>{dica}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col">
                <div className={`p-3 rounded-lg border shadow-sm flex-1 flex flex-col ${selectedFields.description ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('description')}>
                      {selectedFields.description ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Nova Descrição de Vendas (Copywriting)
                    </label>
                    <ScoreBadge score={seoResult?.scoreDescricaoNova} />
                  </div>
                  
                  {/* Container duplo para visual e codigo */}
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      onClick={() => setShowHtmlPreview(true)}
                      className={`text-xs px-3 py-1 rounded ${showHtmlPreview ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-slate-100 text-slate-500'}`}
                    >
                      Modo Visual
                    </button>
                    <button 
                      onClick={() => setShowHtmlPreview(false)}
                      className={`text-xs px-3 py-1 rounded ${!showHtmlPreview ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-slate-100 text-slate-500'}`}
                    >
                      Código HTML
                    </button>
                  </div>

                  {showHtmlPreview ? (
                    <div 
                      className="w-full flex-1 min-h-[400px] text-sm text-slate-800 p-4 bg-white border border-slate-200 rounded prose prose-sm max-w-none overflow-y-auto whitespace-pre-wrap"
                      dangerouslySetInnerHTML={renderHTML(seoResult?.novaDescricaoHtml || '')} 
                    />
                  ) : (
                    <textarea
                      disabled={!selectedFields.description}
                      value={seoResult?.novaDescricaoHtml || ''}
                      onChange={(e) => setSeoResult({...seoResult, novaDescricaoHtml: e.target.value})}
                      className="w-full flex-1 min-h-[400px] text-sm text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 font-mono resize-y disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  )}
                  <div className="mt-2 text-xs text-slate-500">
                    (Alternar para Código HTML permite edição manual antes de salvar).
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé: Ações */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button 
                onClick={() => { setOptimized(false); setOriginalProduct(null); }} 
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Descartar Otimização
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando selecionados na Loja...</>
                ) : (
                  <><Save className="w-4 h-4" /> Aprovar e Salvar Alterações Selecionadas</>
                )}
              </button>
            </div>
            
          </div>
        )}
      </div>

      {/* SEÇÃO INDEPENDENTE: HISTÓRICO DE OTIMIZAÇÕES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Histórico de Otimizações
            </h3>
            <p className="text-sm text-slate-500 mt-1">Produtos otimizados e salvos durante esta sessão.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Filtrar produtos..."
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
              <select
                className="block w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors appearance-none cursor-pointer"
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value as any)}
              >
                <option value="time_desc">Mais recentes</option>
                <option value="time_asc">Mais antigos</option>
                <option value="score_desc">Maior Score Novo</option>
                <option value="score_asc">Menor Score Novo</option>
                <option value="evo_desc">Maior Evolução</option>
                <option value="evo_asc">Menor Evolução</option>
                <option value="name_asc">Nome (A-Z)</option>
                <option value="name_desc">Nome (Z-A)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <ArrowUpDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {alteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 p-12">
            <LayoutTemplate className="w-12 h-12 mb-3 text-slate-200" />
            <p className="text-center font-medium text-slate-500">Nenhum produto salvo ainda</p>
            <p className="text-center text-sm mt-1 max-w-sm">Quando você aprovar ou o piloto automático salvar as otimizações, elas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 font-semibold">Produto</th>
                  <th className="px-5 py-3 font-semibold">Data/Hora</th>
                  <th className="px-5 py-3 font-semibold">Score Antigo</th>
                  <th className="px-5 py-3 font-semibold">Score Novo</th>
                  <th className="px-5 py-3 font-semibold">Evolução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      Nenhum produto encontrado com este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedHistory.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-5 py-3 text-slate-500">{p.alteredAt}</td>
                      <td className="px-5 py-3"><ScoreBadge score={p.oldScore} /></td>
                      <td className="px-5 py-3"><ScoreBadge score={p.newScore} /></td>
                      <td className="px-5 py-3 font-bold text-emerald-600 flex items-center gap-1">
                        +{Math.max(0, p.newScore - p.oldScore)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
