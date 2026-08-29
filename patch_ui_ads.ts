import fs from 'fs';
let content = `import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Target, Search, Activity, CheckCircle2, TrendingUp, Layers, MousePointerClick, DollarSign, Package } from 'lucide-react';

export default function AdsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [platform, setPlatform] = useState('Amazon Ads');
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);

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

  // Search Nuvemshop products
  useEffect(() => {
    if (!searchTerm || selectedProduct?.name === searchTerm) {
      setProducts([]);
      return;
    }
    
    const fetchProducts = async () => {
      setIsSearchingProducts(true);
      try {
        const res = await axios.get(\`/api/marketing/products?q=\${encodeURIComponent(searchTerm)}&limit=10\`);
        if (res.data) setProducts(res.data);
      } catch (err) {
        console.error("Erro ao buscar produtos", err);
      } finally {
        setIsSearchingProducts(false);
      }
    };
    
    const timeoutId = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedProduct]);

  const handleGenerate = async () => {
    if (!selectedProduct && !searchTerm) return;
    
    setIsGenerating(true);
    setCampaignData(null);
    
    try {
      const payload = selectedProduct || { name: searchTerm, price: 'R$ ?', description: '' };
      const res = await axios.post('/api/marketing/ads-campaign', { productData: payload, platform });
      if (res.data) {
        setCampaignData(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar a campanha.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Tráfego Pago (Ads & Marketplaces)</h2>
            <p className="text-sm text-slate-500">Motor inspirado no <strong>Titanos Agent Skills</strong>. Gere campanhas otimizadas de Ads, insights FBA (Logística) e palavras-chave de alta conversão.</p>
          </div>
        </div>

        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Orquestrador de Campanhas (Titanos Logic)</label>
          
          <div className="flex flex-col md:flex-row gap-4 items-start mb-4">
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Plataforma de Tráfego</label>
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Amazon Ads">Amazon Ads (Sponsored Products)</option>
                <option value="Mercado Ads">Mercado Ads (Product Ads)</option>
                <option value="Google Ads">Google Ads (Search / Shopping)</option>
                <option value="Meta Ads">Meta Ads (Facebook / Instagram)</option>
              </select>
            </div>
            
            <div className="relative flex-1 w-full" ref={dropdownRef}>
              <label className="block text-xs font-medium text-slate-500 mb-1">Produto da Loja ou Termo</label>
              <div className="absolute inset-y-0 left-0 pl-3 pt-6 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Busque o produto..." 
                className="w-full pl-9 pr-3 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                value={searchTerm} 
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedProduct(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && (searchTerm.length > 0) && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isSearchingProducts ? (
                    <div className="p-3 text-sm text-slate-500 text-center">Buscando...</div>
                  ) : products.length > 0 ? (
                    <ul className="py-1">
                      {products.map(p => (
                        <li 
                          key={p.id}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                          onClick={() => {
                            setSearchTerm(p.name);
                            setSelectedProduct(p);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="font-medium text-slate-800 line-clamp-1">{p.name}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-sm text-slate-500 text-center">Usará o termo digitado livremente.</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !searchTerm}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm whitespace-nowrap"
            >
              {isGenerating ? <Activity className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              {isGenerating ? 'Criando Setup da Campanha...' : 'Gerar Setup de Campanha'}
            </button>
          </div>
        </div>

        {campaignData && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Setup da Campanha Estruturado
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome da Campanha</span>
                <span className="text-sm font-bold text-slate-800">{campaignData.campaignName}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Público-Alvo</span>
                <span className="text-sm font-semibold text-sky-700">{campaignData.targetAudience}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Orçamento Recomendado
                </span>
                <span className="text-sm font-bold text-emerald-600">{campaignData.recommendedBudget}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-900 px-5 py-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-white">Grupos de Anúncio e Palavras-Chave</h4>
              </div>
              
              <div className="divide-y divide-slate-100">
                {campaignData.adGroups.map((ag: any, idx: number) => (
                  <div key={idx} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="font-bold text-slate-800">{ag.name}</h5>
                      <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                        {ag.biddingStrategy}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-2">Palavras-chave (Keywords)</span>
                      <div className="flex flex-wrap gap-2">
                        {ag.keywords.map((kw: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-white border border-slate-300 text-slate-700 text-xs rounded-md shadow-sm">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-2">Anúncios Sugeridos (Copies)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ag.adCopies.map((copy: any, i: number) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 relative">
                            <MousePointerClick className="w-4 h-4 text-blue-400 absolute top-3 right-3" />
                            <p className="font-bold text-blue-700 text-sm mb-1 pr-6">{copy.headline}</p>
                            <p className="text-xs text-slate-600 mb-3">{copy.description}</p>
                            <button className="w-full py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded transition-colors">
                              {copy.cta}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4 items-start shadow-sm">
              <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                <Package className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Insight de Logística (FBA/Fulfillment)</h4>
                <p className="text-sm text-blue-800 leading-relaxed">{campaignData.fbaOrLogisticsInsight}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/marketing/AdsManager.tsx', content, 'utf8');
