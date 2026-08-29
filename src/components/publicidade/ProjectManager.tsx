import React, { useState } from 'react';
import { Briefcase, Search, Sparkles, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';

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
          
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Persona e Configuração da IA</h3>
            <p className="text-sm text-slate-500 italic mb-4">Insira aqui a descrição detalhada da persona e instruções de sistema para este agente...</p>
            <textarea 
              className="w-full h-48 p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              defaultValue="Você é um Gerente de Projetos Sênior atuando como Chefe do Setor de Publicidade. Você coordena uma equipe de IA (Pesquisador, Monitor, Especialista SEO, Diretor de Arte, Analista Financeiro). Você delega tarefas sequencialmente (esperando o retorno de um para enviar ao outro) e consolida todas as informações em relatórios para o CMO. Suas principais vertentes são: 1) Otimização de anúncios existentes, 2) Pesquisa de mercado para viabilidade de novos produtos."
            />
          </div>
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
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const startOptimization = () => {
    if (!selectedProduct) return;
    setIsRunning(true);
    setProgress(0);

    // Mock progress for the UI orchestration visualization
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);
      if (currentProgress >= 4) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Orquestração: Otimização de Anúncio Existente</h3>
        <p className="text-sm text-slate-600 mb-6">Selecione um produto da base para enviar para a esteira de otimização completa (Pesquisador &rarr; Monitor &rarr; Especialista SEO &rarr; Diretor de Arte).</p>
        
        <div className="flex gap-4">
          <select 
            className="flex-1 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Selecione um produto do catálogo...</option>
            <option value="1">FACA DE AÇO INOXIDÁVEL C/ CABO PLÁSTICO 12"</option>
            <option value="2">CONJUNTO DE PANELAS ANTIADERENTE 5 PEÇAS</option>
            <option value="3">CHURRASQUEIRA ELÉTRICA PORTÁTIL 220V</option>
          </select>
          <button 
            onClick={startOptimization}
            disabled={!selectedProduct || isRunning}
            className="px-6 py-2 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {isRunning ? 'Orquestrando...' : 'Melhorar Anúncio'}
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
      </div>
    </div>
  );
}

function PesquisaMercado() {
  const [links, setLinks] = useState(['', '', '']);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const addLink = () => {
    if (links.length < 5) setLinks([...links, '']);
  };

  const startResearch = () => {
    const validLinks = links.filter(l => l.trim() !== '');
    if (validLinks.length === 0) return;
    
    setIsRunning(true);
    setProgress(0);

    // Mock progress
    let currentProgress = 0;
    const interval = setInterval(() => {
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
        <p className="text-sm text-slate-600 mb-6">Insira de 3 a 5 links de concorrentes. O Gerente enviará a solicitação aos especialistas (Pesquisador &rarr; Monitor &rarr; Analista Financeiro) para criar o relatório de viabilidade.</p>
        
        <div className="space-y-3 max-w-2xl">
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

        <div className="mt-6">
          <button 
            onClick={startResearch}
            disabled={links.filter(l => l.trim() !== '').length === 0 || isRunning}
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
