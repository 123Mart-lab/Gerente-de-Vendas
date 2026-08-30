import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, Search, Sparkles, Plus, ArrowRight, CheckCircle2, Upload, File, X, Image as ImageIcon, DollarSign, Play, StopCircle, RefreshCw } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';

export default function ProjectManager() {
  const [activeTab, setActiveTab] = useState<'otimizacao' | 'pesquisa'>('otimizacao');

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-sky-600" />
          Gerente de Projetos
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Chefe do Setor de Publicidade</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Orquestra os fluxos de trabalho e dispara prompts em fila para os profissionais abaixo dele.</li>
            <li>Somente avança para o próximo profissional após receber o resultado do anterior.</li>
            <li>Recebe a ordem final (Otimização ou Pesquisa) e devolve um relatório completo consolidado.</li>
          </ul>
        </div>
      </div>

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
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'otimizacao' ? <OtimizacaoAnuncios /> : <PesquisaMercado />}
      </div>
    </div>
  );
}

function OtimizacaoAnuncios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const autoPilotRef = useRef(false);

  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);
  
  const [seoFiltersEnabled, setSeoFiltersEnabled] = useState(false);
  const [seoScoreMin, setSeoScoreMin] = useState<number>(0);
  const [seoScoreMax, setSeoScoreMax] = useState<number>(100);
  const [ignoreKits, setIgnoreKits] = useState(false);
  const [ignoreAlteredCondition, setIgnoreAlteredCondition] = useState<'less' | 'more'>('less');
  const [ignoreAlteredDays, setIgnoreAlteredDays] = useState<number>(7);
  const isInitialMount = useRef(true);

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

  const startAutoPilot = async () => {
    const newState = !isAutoPilotRunning;
    setIsAutoPilotRunning(newState);
    autoPilotRef.current = newState;
    
    if (newState) {
      try {
        const response = await axios.get('/api/marketing/products?limit=50&page=1');
        const catalog = response.data || [];
        
        for (const p of catalog) {
          if (!autoPilotRef.current) break;
          
          if (seoFiltersEnabled) {
            const isKit = (p.name?.pt || p.name || '').toLowerCase().includes('kit');
            if (ignoreKits && isKit) continue;
          }
          
          setSelectedProductId(p.id);
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
              productId: p.id,
              query: p.name?.pt || p.name
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
    if (!selectedProductId) return;
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
        productId: selectedProductId,
        query: searchTerm
      });
      setProgress(4);
    } catch (err) {
      console.error('Erro na orquestração:', err);
    } finally {
      clearInterval(progressInterval);
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Orquestração: Otimização de Anúncio Existente</h3>
        <p className="text-sm text-slate-600 mb-6">Selecione um produto da base para enviar para a esteira de otimização completa (Pesquisador &rarr; Monitor &rarr; Especialista SEO &rarr; Diretor de Arte).</p>
        
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
        
        <div className="flex gap-4 items-start">
          <div className="relative flex-1 w-full" ref={dropdownRef}>
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
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
                          setSelectedProductId(p.id);
                          setSearchTerm(p.name);
                          setShowDropdown(false);
                        }}
                      >
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500 mt-1">ID: {p.id}</div>
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
            disabled={!selectedProductId || isRunning || isAutoPilotRunning}
            className="px-6 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            {isRunning && !isAutoPilotRunning ? 'Orquestrando...' : 'Melhorar Anúncio'}
          </button>
          
          <button 
            onClick={startAutoPilot}
            disabled={isRunning && !isAutoPilotRunning}
            className={`px-6 py-2.5 ${isAutoPilotRunning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap`}
          >
            {isAutoPilotRunning ? (
              <><StopCircle className="w-4 h-4 animate-pulse" /> Interromper Orquestração</>
            ) : (
              <><Play className="w-4 h-4" /> Orquestrar Todos os Anúncios</>
            )}
          </button>
        </div>

        {/* Workflow Visualization */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h4 className="font-semibold text-slate-700 mb-4">Status da Fila de Trabalho</h4>
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            
            <WorkflowStep 
              title="Pesquisador de Mercado" 
              status={progress > 0 ? 'done' : (isRunning && progress === 0 ? 'active' : 'idle')} 
            />
            <ArrowRight className={`w-5 h-5 ${progress >= 1 ? 'text-sky-500' : 'text-slate-300'}`} />
            
            <WorkflowStep 
              title="Monitor de Concorrência" 
              status={progress > 1 ? 'done' : (isRunning && progress === 1 ? 'active' : 'idle')} 
            />
            <ArrowRight className={`w-5 h-5 ${progress >= 2 ? 'text-sky-500' : 'text-slate-300'}`} />
            
            <WorkflowStep 
              title="Especialista SEO" 
              status={progress > 2 ? 'done' : (isRunning && progress === 2 ? 'active' : 'idle')} 
            />
            <ArrowRight className={`w-5 h-5 ${progress >= 3 ? 'text-sky-500' : 'text-slate-300'}`} />
            
            <WorkflowStep 
              title="Diretor de Arte" 
              status={progress >= 4 ? 'done' : (isRunning && progress === 3 ? 'active' : 'idle')} 
            />

          </div>
        </div>

        {/* Audit Panel (Global for Orchestration) */}
        <TaskAuditPanel mockTasks={mockHistory} />
      </div>
    </div>
  );
}

function PesquisaMercado() {
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

    const steps = [
      { role: 'planner', req: 'Gerente de Projetos', exe: 'Pesquisador de Mercado', oldS: 0, newS: 40, ev: 40, prompt: 'Analise os links fornecidos e encontre o padrão de preços.', resp: 'Encontrei um padrão onde o preço médio é R$ 120, com ofertas de R$ 99.' },
      { role: 'monitor', req: 'Pesquisador de Mercado', exe: 'Monitor de Concorrência', oldS: 40, newS: 70, ev: 30, prompt: 'Faça um benchmark detalhado com base na pesquisa.', resp: 'Nossos concorrentes diretos estão focados em frete grátis. Sugiro destacarmos nosso envio expresso.' },
      { role: 'finance', req: 'Monitor de Concorrência', exe: 'Analista Financeiro', oldS: 70, newS: 90, ev: 20, prompt: 'Avalie a viabilidade financeira desta estratégia de preço.', resp: 'A viabilidade é positiva. Temos margem para absorver o custo de envio expresso mantendo 35% de ROI.' }
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      if (currentProgress < steps.length) {
        const step = steps[currentProgress];
        const newTask = {
          id: `task-${step.role}-${Date.now()}`,
          date: new Date().toLocaleString('pt-BR'),
          productName: 'Pesquisa de Viabilidade (Múltiplos Links)',
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

        {/* Workflow Visualization */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h4 className="font-semibold text-slate-700 mb-4">Status da Fila de Trabalho</h4>
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            
            <WorkflowStep 
              title="Pesquisador de Mercado" 
              status={progress > 0 ? 'done' : (isRunning && progress === 0 ? 'active' : 'idle')} 
            />
            <ArrowRight className={`w-5 h-5 ${progress >= 1 ? 'text-sky-500' : 'text-slate-300'}`} />
            
            <WorkflowStep 
              title="Monitor de Concorrência" 
              status={progress > 1 ? 'done' : (isRunning && progress === 1 ? 'active' : 'idle')} 
            />
            <ArrowRight className={`w-5 h-5 ${progress >= 2 ? 'text-sky-500' : 'text-slate-300'}`} />
            
            <WorkflowStep 
              title="Analista Financeiro" 
              status={progress >= 3 ? 'done' : (isRunning && progress === 2 ? 'active' : 'idle')} 
            />

          </div>
        </div>

        {/* Audit Panel (Pesquisa) */}
        <TaskAuditPanel mockTasks={pesquisaHistory} />
      </div>
    </div>
  );
}

function WorkflowStep({ title, status }: { title: string, status: 'idle' | 'active' | 'done' }) {
  return (
    <div className="flex flex-col items-center text-center max-w-[120px]">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
        status === 'done' ? 'bg-emerald-100 text-emerald-600' :
        status === 'active' ? 'bg-sky-100 text-sky-600 ring-4 ring-sky-50 animate-pulse' :
        'bg-slate-100 text-slate-400'
      }`}>
        {status === 'done' ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-3 h-3 rounded-full bg-current" />}
      </div>
      <span className={`text-xs font-medium ${
        status === 'active' ? 'text-sky-700' : 
        status === 'done' ? 'text-emerald-700' : 
        'text-slate-500'
      }`}>
        {title}
      </span>
    </div>
  );
}
