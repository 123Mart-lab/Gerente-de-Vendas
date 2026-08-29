import fs from 'fs';
let content = `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, TrendingUp, ShoppingCart, Info, Activity } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';

export default function MarketResearcher() {
  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.role === 'planner'));
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

  const handleSearchTrends = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setTrends([]);
    
    try {
      const res = await axios.post('/api/marketing/marketplace-trends', { query });
      if (res.data && res.data.trends) {
        setTrends(res.data.trends);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao buscar tendências.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Search className="w-6 h-6 text-sky-600" />
          Pesquisador de Mercado (Inteligência Rally)
        </h2>
        <div className="text-sm text-slate-600 mt-2 mb-6">
          <p>Motor inspirado no <strong>Rally MCP</strong>. Busque nichos e descubra tendências de produtos no Mercado Livre e Shopee para validar novos produtos ou ofertas de afiliação antes de orquestrar anúncios.</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Pesquisa de Tendências de Marketplaces</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Ex: Fones Bluetooth, Utensílios de Cozinha, Moda Fitness..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchTrends()}
              />
            </div>
            <button 
              onClick={handleSearchTrends}
              disabled={isSearching}
              className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSearching ? <Activity className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              {isSearching ? 'Analisando...' : 'Buscar Tendências'}
            </button>
          </div>

          {trends.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Top Tendências Identificadas (Benchmark)</h3>
              <div className="grid grid-cols-1 gap-4">
                {trends.map((trend, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 flex gap-4 items-start shadow-sm hover:shadow transition-shadow">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-800">{trend.productName}</h4>
                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{trend.marketplace}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-3 text-sm">
                        <div>
                          <span className="block text-slate-400 text-xs font-medium uppercase">Preço</span>
                          <span className="font-semibold text-slate-700">{trend.priceRange}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-xs font-medium uppercase">Competitividade</span>
                          <span className="font-semibold text-slate-700">{trend.competitiveness}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-xs font-medium uppercase">Nota de Qualidade</span>
                          <span className="font-semibold text-emerald-600">{trend.qualityScore}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm text-slate-600 flex gap-2">
                        <Info className="w-4 h-4 shrink-0 text-sky-500 mt-0.5" />
                        <span><strong>Por que está viralizando?</strong> {trend.whyIsTrending}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Auditoria do Pesquisador</h3>
          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/publicidade/MarketResearcher.tsx', content, 'utf8');
