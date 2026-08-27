import React, { useState } from 'react';
import axios from 'axios';
import { Search, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Eye, RefreshCw, LayoutTemplate } from 'lucide-react';

export default function ProductOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);

  const [searchTerm, setSearchTerm] = useState('FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12');
  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [seoResult, setSeoResult] = useState<any>(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimized(false);
    try {
      const response = await axios.post('/api/marketing/optimize', { query: searchTerm });
      setOriginalProduct(response.data.original);
      setSeoResult(response.data.otimizado);
      setOptimized(true);
    } catch (error) {
      console.error('Erro na otimização:', error);
      alert('Erro ao otimizar produto. Verifique se a loja possui esse produto ou se as credenciais são válidas.');
    } finally {
      setIsOptimizing(false);
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
        
        {/* Toggle Piloto Automático (Visual do Futuro) */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1: Produto Atual */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Produto Atual</h3>
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-md">SEO: Ruim</span>
            </div>
            
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar ID ou Nome..." 
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Título Original</label>
                <p className="text-sm text-slate-800 mt-1 p-2 bg-slate-50 rounded border border-slate-100">
                  {originalProduct?.name || "..."}
                </p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Descrição Atual</label>
                <p className="text-sm text-slate-800 mt-1 p-2 bg-slate-50 rounded border border-slate-100 italic text-slate-400">
                  {originalProduct?.description || "..."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase">Problemas Detectados</label>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center text-rose-600 gap-2"><AlertCircle className="w-4 h-4" /> Título em MAIÚSCULAS (Spam)</li>
                  <li className="flex items-center text-rose-600 gap-2"><AlertCircle className="w-4 h-4" /> Meta Description Ausente</li>
                  <li className="flex items-center text-rose-600 gap-2"><AlertCircle className="w-4 h-4" /> Sem gatilhos de conversão</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={handleOptimize}
              disabled={isOptimizing || optimized}
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isOptimizing ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando Copy...</>
              ) : optimized ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Otimização Concluída</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Gerar Otimização Profissional</>
              )}
            </button>
          </div>
        </div>

        {/* Coluna 2 e 3: Resultado da Otimização */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`bg-white p-5 rounded-xl border transition-all duration-500 ${optimized ? 'border-emerald-200 shadow-md' : 'border-slate-200 border-dashed opacity-50'} h-full flex flex-col`}>
            
            {!optimized ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
                <LayoutTemplate className="w-16 h-16 mb-4 text-slate-200" />
                <p className="text-center font-medium">Aguardando comando de otimização...</p>
                <p className="text-center text-sm mt-2 max-w-sm">A Inteligência Artificial analisará a categoria do produto para definir o público-alvo e criará copies focadas em vendas e SEO.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Resultado da Otimização
                  </h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">SEO: Excelente (98/100)</span>
                </div>

                {/* Google Search Preview */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4" /> Preview do Google Shopping
                  </label>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm max-w-xl">
                    <p className="text-[12px] text-slate-800 mb-1">https://www.123mart.com.br › produtos › faca-inox-12...</p>
                    <h4 className="text-[18px] text-[#1a0dab] cursor-pointer hover:underline truncate">
                      {seoResult?.novoTitulo || "Titulo Gerado..."}
                    </h4>
                    <p className="text-[13px] text-[#4d5156] mt-1 leading-snug">
                      {seoResult?.metaDescription || "..."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Novo Título da Loja</label>
                    <p className="text-sm text-slate-800 mt-1 p-2 bg-emerald-50 rounded border border-emerald-100 font-medium">
                      {seoResult?.novoTitulo || "..."}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Público-Alvo Detectado (IA)</label>
                    <p className="text-sm text-slate-800 mt-1 p-2 bg-slate-50 rounded border border-slate-200">
                      {seoResult?.publicoAlvo || "..."}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase">Nova Descrição (Copywriting)</label>
                  <div className="text-sm text-slate-700 mt-1 p-4 bg-slate-50 rounded border border-slate-200 h-48 overflow-y-auto prose prose-sm" dangerouslySetInnerHTML={{ __html: seoResult?.novaDescricaoHtml || '...' }}></div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setOptimized(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    Descartar
                  </button>
                  <button className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
                    Aprovar e Salvar na Nuvemshop <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
