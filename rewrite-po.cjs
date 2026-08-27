const fs = require('fs');

const code = `import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Sparkles, RefreshCw, LayoutTemplate, Save } from 'lucide-react';

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
      setOriginalProduct(response.data.original);
      setSeoResult(response.data.otimizado);
      setOptimized(true);
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
      const response = await axios.post('/api/marketing/save', {
        productId: originalProduct?.id,
        data: seoResult
      });
      if (response.data.success) {
        alert(response.data.mock ? 'Produto salvo com sucesso! (Modo Simulação)' : 'Produto salvo e atualizado na Nuvemshop com sucesso!');
        setOptimized(false);
        setOriginalProduct(null);
        setSeoResult(null);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Falha ao salvar produto na Nuvemshop.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-500" />
            Otimizador de Produtos com IA
          </h2>
          <p className="text-slate-500 mt-1">Análise semântica, geração de copy e injeção de SEO para a Nuvemshop.</p>
        </div>
        
        {/* Toggle Piloto Automático */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-lg opacity-70">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-700">Piloto Automático</span>
            <span className="text-xs text-amber-500 font-medium">Em breve (Fase de Testes)</span>
          </div>
          <div className="w-10 h-6 bg-slate-200 rounded-full cursor-not-allowed">
            <div className="w-4 h-4 bg-white rounded-full mt-1 ml-1"></div>
          </div>
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
          <div className="flex flex-col items-center justify-center text-slate-400 p-16">
            <LayoutTemplate className="w-16 h-16 mb-4 text-slate-200" />
            <p className="text-center font-medium text-lg text-slate-500">Aguardando comando de otimização...</p>
            <p className="text-center text-sm mt-2 max-w-md">A Inteligência Artificial analisará a categoria do produto para definir o público-alvo e criará copies focadas em vendas e SEO.</p>
          </div>
        ) : (
          <div className="flex flex-col animate-in fade-in duration-500">
            {/* Header das Colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200 bg-slate-100">
              <div className="p-4 border-r border-slate-200">
                <h3 className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Produto Atual</span>
                  <span className="bg-rose-100 text-rose-700 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md">SEO Ruim</span>
                </h3>
              </div>
              <div className="p-4 bg-emerald-50">
                <h3 className="font-semibold text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Resultado da Otimização</span>
                  <span className="bg-emerald-200 text-emerald-800 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md">SEO Excelente</span>
                </h3>
              </div>
            </div>

            {/* Linha: Título */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-white">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">Título Original</label>
                <p className="text-sm text-slate-800">
                  {typeof originalProduct?.name === 'string' ? originalProduct?.name : (originalProduct?.name?.pt || <span className="text-slate-400 italic">Vazio</span>)}
                </p>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-emerald-600/70 uppercase block mb-2 tracking-wider">Novo Título Otimizado</label>
                  <input
                    type="text"
                    value={seoResult?.novoTitulo || ''}
                    onChange={(e) => setSeoResult({...seoResult, novoTitulo: e.target.value})}
                    className="w-full text-sm text-slate-900 font-medium p-2 bg-white border border-emerald-200/50 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600/70 uppercase block mb-2 tracking-wider">Meta Description (SEO)</label>
                  <textarea
                    value={seoResult?.metaDescription || ''}
                    onChange={(e) => setSeoResult({...seoResult, metaDescription: e.target.value})}
                    className="w-full text-sm text-slate-900 p-2 bg-white border border-emerald-200/50 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors resize-y h-16"
                  />
                </div>
              </div>
            </div>

            {/* Linha: Marca e Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-white flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">Marca Atual</label>
                  <p className="text-sm text-slate-800">
                    {originalProduct?.brand || <span className="text-slate-400 italic">Não cadastrada</span>}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">Tags Atuais</label>
                  <p className="text-sm text-slate-800">
                    {originalProduct?.tags || <span className="text-slate-400 italic">Sem tags</span>}
                  </p>
                </div>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-emerald-600/70 uppercase block mb-2 tracking-wider">Marca Sugerida (IA)</label>
                  <input
                    type="text"
                    value={seoResult?.marca || ''}
                    onChange={(e) => setSeoResult({...seoResult, marca: e.target.value})}
                    className="w-full text-sm text-slate-900 font-medium p-2 bg-white border border-emerald-200/50 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600/70 uppercase block mb-2 tracking-wider">Novas Tags SEO (IA)</label>
                  <input
                    type="text"
                    value={seoResult?.tags || ''}
                    onChange={(e) => setSeoResult({...seoResult, tags: e.target.value})}
                    className="w-full text-sm text-slate-900 font-medium p-2 bg-white border border-emerald-200/50 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Linha: URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-white">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">URL Original</label>
                <p className="text-sm text-slate-800 break-all">
                  {originalProduct?.handle ? \`.../produtos/\${originalProduct.handle}\` : <span className="text-slate-400 italic">Sem URL amigável</span>}
                </p>
              </div>
              <div className="p-5 bg-emerald-50/30">
                <label className="text-xs font-semibold text-emerald-600/70 uppercase block mb-2 tracking-wider">Nova URL Amigável</label>
                <div className="flex items-center">
                  <span className="text-sm text-slate-500 bg-slate-100 border border-emerald-200/50 border-r-0 rounded-l p-2">.../produtos/</span>
                  <input
                    type="text"
                    value={seoResult?.urlProduto || ''}
                    onChange={(e) => setSeoResult({...seoResult, urlProduto: e.target.value})}
                    className="w-full text-sm text-sky-700 font-mono p-2 bg-white border border-emerald-200/50 rounded-r focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Linha: Descrição */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-5 border-r border-slate-200 bg-white">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">Descrição Atual</label>
                <div className="text-sm text-slate-600 italic whitespace-pre-wrap">
                  {typeof originalProduct?.description === 'string' ? originalProduct?.description : (originalProduct?.description?.pt || <span className="text-slate-400">Vazio</span>)}
                </div>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col">
                <label className="text-xs font-semibold text-emerald-600/70 uppercase block mb-2 tracking-wider">Nova Descrição de Vendas (Copywriting) - HTML/Texto</label>
                <textarea
                  value={seoResult?.novaDescricaoHtml || ''}
                  onChange={(e) => setSeoResult({...seoResult, novaDescricaoHtml: e.target.value})}
                  className="w-full flex-1 min-h-[200px] text-sm text-slate-800 p-3 bg-white border border-emerald-200/50 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors font-mono resize-y"
                />
              </div>
            </div>

            {/* Rodapé: Ações */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
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
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando na Loja...</>
                ) : (
                  <><Save className="w-4 h-4" /> Aprovar e Salvar na Nuvemshop</>
                )}
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', code);
