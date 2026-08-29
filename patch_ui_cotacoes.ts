import fs from 'fs';
let content = fs.readFileSync('src/components/publicidade/CompetitiveIntelligence.tsx', 'utf8');

const cotacoesUI = `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radar, Search, ExternalLink, Activity, Target } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';

export default function CompetitiveIntelligence() {
  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [quotesData, setQuotesData] = useState<any>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.role === 'monitor'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs', err);
      }
    };
    fetchLogs();
    
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchQuotes = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setQuotesData(null);
    
    try {
      const res = await axios.post('/api/marketing/product-quotes', { productName: query });
      if (res.data) {
        setQuotesData(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao buscar cotações na internet.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Radar className="w-6 h-6 text-sky-600" />
          Monitor de Inteligência Competitiva (Cotações Google & Buscapé)
        </h2>
        
        <div className="text-sm text-slate-600 mt-2 mb-6">
          <p>Motor inspirado no repositório <strong>cotacoes_google_buscape</strong>. Este scraper realiza uma varredura nas plataformas (Google Shopping e Buscapé) para extrair os preços dos concorrentes.</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Pesquisar Produto (Web Scraper)</label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Ex: iPhone 13 128GB, Airfryer Mondial..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchQuotes()}
              />
            </div>
            <button 
              onClick={handleSearchQuotes}
              disabled={isSearching || !query}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
            >
              {isSearching ? <Activity className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {isSearching ? 'Buscando Cotações...' : 'Raspar Cotações (Scrape)'}
            </button>
          </div>

          {quotesData && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4">Métricas Consolidadas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
                  <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Menor Preço Encontrado</span>
                  <span className="text-2xl font-bold text-emerald-600">R$ {quotesData.minPrice.toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
                  <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço Médio de Mercado</span>
                  <span className="text-2xl font-bold text-sky-600">R$ {quotesData.averagePrice.toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
                  <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Maior Preço Encontrado</span>
                  <span className="text-2xl font-bold text-red-600">R$ {quotesData.maxPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Google Shopping
                  </h4>
                  <ul className="space-y-2">
                    {quotesData.googleShopping.map((item: any, i: number) => (
                      <li key={i} className="bg-white border border-slate-200 rounded p-3 flex justify-between items-center text-sm shadow-sm hover:border-sky-300 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-800">{item.store}</p>
                          <p className="text-emerald-600 font-medium">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-sky-500 hover:text-sky-700 bg-sky-50 p-2 rounded-lg">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Buscapé
                  </h4>
                  <ul className="space-y-2">
                    {quotesData.buscape.map((item: any, i: number) => (
                      <li key={i} className="bg-white border border-slate-200 rounded p-3 flex justify-between items-center text-sm shadow-sm hover:border-amber-300 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-800">{item.store}</p>
                          <p className="text-emerald-600 font-medium">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-amber-600 hover:text-amber-800 bg-amber-50 p-2 rounded-lg">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Auditoria do Monitor</h3>
          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/components/publicidade/CompetitiveIntelligence.tsx', cotacoesUI, 'utf8');
