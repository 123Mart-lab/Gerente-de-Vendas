import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Share2, Sparkles, Video, MessageCircle, Send, FileText, ChevronDown, Activity, CheckCircle2, Search, Image as ImageIcon, Download, RefreshCw, Wand2, Smartphone, LayoutGrid, Check } from 'lucide-react';
import AgentWhatsApp from '../chat/AgentWhatsApp';

export default function SocialMedia() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [viralContent, setViralContent] = useState<any>(null);

  // Estados do Criador & Editor de Imagens (Gemini Nano Banana 2.1)
  const [customImagePrompt, setCustomImagePrompt] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '9:16'>('1:1');
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState('Instagram Feed');
  const [isGeneratingSocialImage, setIsGeneratingSocialImage] = useState(false);
  const [generatedSocialImage, setGeneratedSocialImage] = useState<string | null>(null);
  const [generatedPromptUsed, setGeneratedPromptUsed] = useState<string | null>(null);

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
        const res = await axios.get(`/api/marketing/products?q=${encodeURIComponent(searchTerm)}&limit=10`);
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

  const handleGenerateSocialImage = async () => {
    const prodName = selectedProduct?.name || searchTerm;
    if (!prodName) {
      alert('Por favor, selecione ou digite o nome de um produto.');
      return;
    }

    setIsGeneratingSocialImage(true);
    try {
      const res = await axios.post('/api/marketing/ai/generate-social-image', {
        productName: prodName,
        platform: selectedSocialPlatform,
        aspectRatio: selectedAspectRatio,
        userPrompt: customImagePrompt,
        hook: viralContent?.hook || '',
        cta: viralContent?.cta || ''
      });

      if (res.data && res.data.success) {
        setGeneratedSocialImage(res.data.imageUrl);
        setGeneratedPromptUsed(res.data.promptUsed);
      }
    } catch (err: any) {
      console.error('Erro ao gerar imagem social:', err);
      alert('Não foi possível gerar a imagem no momento.');
    } finally {
      setIsGeneratingSocialImage(false);
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

        {/* ESTÚDIO CRIATIVO DE IMAGENS & BANNERS (GEMINI NANO BANANA 2.1) */}
        <div className="mt-8 bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center border border-purple-500/40">
                <ImageIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Estúdio Criativo de Imagens & Banners
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700">
                    Gemini Nano Banana 2.1
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Crie e edite criativos visuais para campanhas de Instagram, TikTok, Reels e WhatsApp com prompts em linguagem natural.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedAspectRatio('1:1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedAspectRatio === '1:1'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Feed 1:1 (Quadrado)
              </button>
              <button
                type="button"
                onClick={() => setSelectedAspectRatio('9:16')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedAspectRatio === '9:16'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Stories / Reels 9:16
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Controles de Geração */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Instruções Visuais / Sugestões para o Criativo:</span>
                  <span className="text-[10px] text-purple-400 font-normal">Canal: {selectedSocialPlatform}</span>
                </label>
                <textarea
                  rows={3}
                  value={customImagePrompt}
                  onChange={(e) => setCustomImagePrompt(e.target.value)}
                  placeholder="Ex: Criativo com alto contraste, fundo gradiente roxo e neon suave, produto em destaque central, sem tarjas e iluminação moderna..."
                  className="w-full p-3 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500 resize-none font-medium shadow-inner"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {['Instagram Feed', 'Stories / TikTok', 'WhatsApp Promo', 'Banner de Remarketing'].map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => {
                      setSelectedSocialPlatform(plat);
                      if (plat.includes('Stories') || plat.includes('TikTok')) {
                        setSelectedAspectRatio('9:16');
                      } else {
                        setSelectedAspectRatio('1:1');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border ${
                      selectedSocialPlatform === plat
                        ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateSocialImage}
                disabled={isGeneratingSocialImage || (!selectedProduct && !searchTerm)}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingSocialImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Renderizando Criativo com Gemini Nano Banana 2.1...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Gerar Criativo Visual com IA
                  </>
                )}
              </button>
            </div>

            {/* Preview do Criativo Gerado */}
            <div className="lg:col-span-5 bg-slate-800/70 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
              {generatedSocialImage ? (
                <div className="space-y-3 w-full flex flex-col items-center">
                  <div className={`relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-lg ${
                    selectedAspectRatio === '9:16' ? 'w-48 aspect-9/16' : 'w-56 aspect-square'
                  }`}>
                    <img 
                      src={generatedSocialImage} 
                      alt="Criativo Gerado Social Media" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-purple-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-purple-800">
                      {selectedAspectRatio} • Nano Banana 2.1
                    </div>
                  </div>

                  <a
                    href={generatedSocialImage}
                    download="criativo_123mart.png"
                    className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Criativo em Alta Resolução
                  </a>
                </div>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Wand2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">
                    Nenhum criativo visual gerado ainda
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Selecione o produto acima, defina o formato e clique em "Gerar Criativo Visual com IA" para sintetizar sua arte.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Comunicação da Equipe</h3>
          <AgentWhatsApp currentAgentId="social" currentAgentName="Gestor de Social Media" />
        </div>
      </div>
    </div>
  );
}
