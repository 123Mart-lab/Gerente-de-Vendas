import fs from 'fs';
let content = `import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Share2, Sparkles, Video, MessageCircle, Send, FileText, ChevronDown, Activity, CheckCircle2 } from 'lucide-react';

export default function SocialMedia() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [viralContent, setViralContent] = useState<any>(null);

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
    setViralContent(null);
    
    try {
      const payload = selectedProduct || { name: searchTerm, price: 'R$ ?', description: '' };
      const res = await axios.post('/api/marketing/viral-content', { productData: payload });
      if (res.data) {
        setViralContent(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar conteúdo viral.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Gestor de Social Media & Conteúdo Viral</h2>
            <p className="text-sm text-slate-500">Motor inspirado no <strong>Rally MCP</strong>. Gere scripts de vídeos, mensagens de WhatsApp e copys para viralizar vendas (Dropshipping & Afiliados).</p>
          </div>
        </div>

        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Selecione o Produto da Loja (ou digite o nome)</label>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="relative flex-1 w-full" ref={dropdownRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Ex: Ring Light 10 polegadas..." 
                className="w-full pl-9 pr-3 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white shadow-sm"
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
                    <div className="p-3 text-sm text-slate-500 text-center">Buscando produtos...</div>
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
                    <div className="p-3 text-sm text-slate-500 text-center">Nenhum produto da loja encontrado. Usará o termo digitado.</div>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !searchTerm}
              className="w-full md:w-auto bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              {isGenerating ? <Activity className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Criando Conteúdo...' : 'Gerar Pacote Viral'}
            </button>
          </div>
        </div>

        {viralContent && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Pacote de Conteúdo Viral Criado
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                  <Video className="w-4 h-4 text-pink-400" />
                  <h4 className="font-semibold text-white text-sm">Roteiro TikTok (Alta Retenção)</h4>
                </div>
                <div className="p-4 bg-slate-50">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{viralContent.tiktokScript}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 border-b border-pink-600 flex items-center gap-2">
                  <Video className="w-4 h-4 text-white" />
                  <h4 className="font-semibold text-white text-sm">Ideia Instagram Reels</h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{viralContent.reelsIdea}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-emerald-500 px-4 py-3 border-b border-emerald-600 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-white" />
                  <h4 className="font-semibold text-white text-sm">WhatsApp (Lista de Transmissão)</h4>
                </div>
                <div className="p-4 bg-emerald-50/30">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{viralContent.whatsappBroadcast}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-sky-500 px-4 py-3 border-b border-sky-600 flex items-center gap-2">
                  <Send className="w-4 h-4 text-white" />
                  <h4 className="font-semibold text-white text-sm">Canal Telegram</h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{viralContent.telegramMessage}</p>
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-orange-500 px-4 py-3 border-b border-orange-600 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  <h4 className="font-semibold text-white text-sm">Blog Post SEO (Artigo)</h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium">{viralContent.blogPost}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/marketing/SocialMedia.tsx', content, 'utf8');
