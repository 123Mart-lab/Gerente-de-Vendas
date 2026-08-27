import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Sparkles, RefreshCw, LayoutTemplate, Save, CheckCircle2, ToggleLeft, ToggleRight, CheckSquare2, Square } from 'lucide-react';

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
  const [selectedFields, setSelectedFields] = useState({
    title: true,
    metaDescription: true,
    brand: true,
    tags: true,
    url: false,
    seoTitle: false,
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
      setOriginalProduct(response.data.original);
      setSeoResult(response.data.otimizado);
      setOptimized(true);
      
      // Reset toggles to all true when new optimization comes
      setSelectedFields({
        title: true,
        metaDescription: true,
        brand: true,
        tags: true,
        url: true,
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

  const renderHTML = (html: string) => {
    return { __html: html || '' };
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-700">Selecione o que deseja salvar:</span>
                    <span className="bg-emerald-200 text-emerald-800 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md">SEO Excelente</span>
                  </div>
                </h3>
              </div>
            </div>

            {/* Linha: Título e Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-white">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">Título Original</label>
                <p className="text-sm text-slate-800 mb-2">
                  {typeof originalProduct?.name === 'string' ? originalProduct?.name : (originalProduct?.name?.pt || <span className="text-slate-400 italic">Vazio</span>)}
                </p>
                {seoResult?.scoreTituloOriginal !== undefined && (
                  <div className="inline-flex items-center mt-2 px-2 py-1 rounded bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Nota de SEO: {seoResult.scoreTituloOriginal}%
                  </div>
                )}
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col gap-4">
                {/* Checkbox Titulo */}
                <div className={`p-3 rounded-lg border ${selectedFields.title ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('title')}>
                      {selectedFields.title ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Novo Título Otimizado
                    </label>
                    {seoResult?.scoreTituloNovo !== undefined && (
                      <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Nota de SEO: {seoResult.scoreTituloNovo}%
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={!selectedFields.title}
                    value={seoResult?.novoTitulo || ''}
                    onChange={(e) => setSeoResult({...seoResult, novoTitulo: e.target.value})}
                    className="w-full text-sm text-slate-900 font-medium p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                
                {/* Checkbox Meta Description */}
                <div className={`p-3 rounded-lg border ${selectedFields.metaDescription ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('metaDescription')}>
                      {selectedFields.metaDescription ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Meta Description (SEO)
                    </label>
                  </div>
                  <textarea
                    disabled={!selectedFields.metaDescription}
                    value={seoResult?.metaDescription || ''}
                    onChange={(e) => setSeoResult({...seoResult, metaDescription: e.target.value})}
                    className="w-full text-sm text-slate-900 p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors resize-y h-16 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            
            {/* Linha: SEO Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-white">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">Título SEO Original</label>
                <p className="text-sm text-slate-800">
                  {typeof originalProduct?.seo_title === 'string' ? originalProduct?.seo_title : (originalProduct?.seo_title?.pt || <span className="text-slate-400 italic">Vazio (Usa o Título Padrão)</span>)}
                </p>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col gap-4">
                <div className={`p-3 rounded-lg border ${selectedFields.seoTitle ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('seoTitle')}>
                      {selectedFields.seoTitle ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Título SEO (Otimizado)
                    </label>
                  </div>
                  <div className="text-sm text-slate-500 italic mb-1">
                    Ao marcar esta opção, o novo título otimizado gerado pela IA (visto acima) também será aplicado como o Título SEO do produto na Nuvemshop.
                  </div>
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
                {/* Checkbox Marca */}
                <div className={`p-3 rounded-lg border ${selectedFields.brand ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('brand')}>
                      {selectedFields.brand ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Marca Sugerida (IA)
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!selectedFields.brand}
                    value={seoResult?.marca || ''}
                    onChange={(e) => setSeoResult({...seoResult, marca: e.target.value})}
                    className="w-full text-sm text-slate-900 font-medium p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                
                {/* Checkbox Tags */}
                <div className={`p-3 rounded-lg border ${selectedFields.tags ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('tags')}>
                      {selectedFields.tags ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Novas Tags SEO (IA)
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!selectedFields.tags}
                    value={seoResult?.tags || ''}
                    onChange={(e) => setSeoResult({...seoResult, tags: e.target.value})}
                    className="w-full text-sm text-slate-900 font-medium p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Linha: URL Amigável */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200 bg-white">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">URL Original</label>
                <p className="text-sm text-slate-800 font-mono break-all">
                  .../produtos/{typeof originalProduct?.handle === 'string' ? originalProduct?.handle : (originalProduct?.handle?.pt || 'vazio')}
                </p>
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col gap-4">
                <div className={`p-3 rounded-lg border ${selectedFields.url ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('url')}>
                      {selectedFields.url ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Nova URL Amigável
                    </label>
                  </div>
                  <div className="flex items-center opacity-100">
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
              <div className="p-5 border-r border-slate-200 bg-white">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-2 tracking-wider">Descrição Atual (Visualização HTML)</label>
                <div 
                  className="prose prose-sm text-slate-600 break-words max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1"
                  dangerouslySetInnerHTML={renderHTML(
                    typeof originalProduct?.description === 'string' ? originalProduct?.description : originalProduct?.description?.pt
                  )} 
                />
                {seoResult?.scoreDescricaoOriginal !== undefined && (
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <div className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Nota de SEO (Qualidade Técnica): {seoResult.scoreDescricaoOriginal}%
                    </div>
                    {seoResult.dicasMelhoria && seoResult.dicasMelhoria.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                        <p className="font-semibold mb-1">⚠️ Faltam dados técnicos no ERP:</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-90">
                          {seoResult.dicasMelhoria.map((dica: string, i: number) => <li key={i}>{dica}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-5 bg-emerald-50/30 flex flex-col">
                <div className={`p-3 rounded-lg border flex-1 flex flex-col ${selectedFields.description ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider cursor-pointer flex items-center gap-2" onClick={() => toggleField('description')}>
                      {selectedFields.description ? <CheckSquare2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      Nova Descrição de Vendas (Copywriting)
                    </label>
                    {seoResult?.scoreDescricaoNova !== undefined && (
                      <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Nota de SEO: {seoResult.scoreDescricaoNova}%
                      </div>
                    )}
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
    </div>
  );
}
