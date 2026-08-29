import React from 'react';
import { Briefcase } from 'lucide-react';

export default function ProjectManager() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-sky-600" />
          Gerente de Projetos
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Chefe do setor de Publicidade</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Faz a ponte entre os objetivos comerciais globais e a equipe de IA. Define prazos, prioridades, orquestra os prompts e garante que o fluxo de trabalho não tenha gargalos.</li>
            <li>Solicita informações de todos os profissionais do setor de Publicidade para apresentar relatórios ao CMO da empresa.</li>
            <li>Faz pesquisa de mercado para mensurar se é viável comercialmente adicionar um novo produto em nosso catálogo. Analisa e mensura a aceitação ou rejeição do produto. Viabilidade financeira (lucro) e velocidade de venda. Entrega um resultado profissional digno do Notebook LLM para análise.</li>
          </ul>
          
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Persona e Configuração da IA</h3>
            <p className="text-sm text-slate-500 italic mb-4">Insira aqui a descrição detalhada da persona e instruções de sistema para este agente...</p>
            <textarea 
              className="w-full h-32 p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              placeholder="Ex: Você é um Gerente de Projetos Sênior focado em e-commerce..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
