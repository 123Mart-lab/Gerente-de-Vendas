import React, { useState } from 'react';
import { Sparkles, Tags } from 'lucide-react';
import ProductOptimizer from './ProductOptimizer';
import CategorySEO from './CategorySEO';
import TaskAuditPanel, { AuditTask } from '../publicidade/TaskAuditPanel';

export default function SeoSpecialist() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  const mockHistory: AuditTask[] = [
    {
      id: 'task-003',
      date: 'Hoje, 10:48',
      productName: 'Faca de Aço Inoxidável 12" Top Chef',
      receivedPrompt: 'Com base nas análises do Pesquisador e do Monitor (Posicionamento: Premium Acessível; Foco: Durabilidade e Cabo ergonômico), crie a otimização SEO completa para o produto "Faca de Aço Inox 12".\n\n1. Otimize Título e Meta Descrição.\n2. Crie uma descrição completa e persuasiva.\n3. Salve na Nuvemshop.',
      sentResponse: 'SEO Otimizado e Salvo na Nuvemshop!\n\nNovo Título SEO: "Faca de Churrasco 12 Polegadas Inox Top Chef - Cabo Ergonômico"\n\nMeta Descrição: "Corte carnes com perfeição. A Faca Inox Top Chef 12\'\' possui fio de altíssima durabilidade e cabo que não escorrega. Compre com envio rápido!"\n\nO que mudei: Adicionei palavras-chave de intenção de busca (Churrasco, Fio de alta durabilidade) e quebrei objeções apontadas pelo Pesquisador.',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-sky-600" />
          Especialista SEO
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Mídia, SEO e Performance</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Otimiza títulos, descrições, metadados e a estrutura das páginas e anúncios.</li>
            <li>Garante o ranqueamento orgânico máximo nos mecanismos de busca.</li>
            <li><strong>Fluxo de Operação:</strong> Recebe o prompt de comando do Gestor de Projetos. Cria o SEO completo do anúncio e preenche todos os campos na Nuvemshop, salvando tudo.</li>
            <li><strong>Relatórios Entregues:</strong> Envia para o Gerente de Projetos o relatório com o resultado final, a melhoria de SEO promovida, o que modificou no anúncio e por que modificou.</li>
          </ul>
          
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Persona e Configuração da IA</h3>
            <p className="text-sm text-slate-500 italic mb-4">Insira aqui a descrição detalhada da persona e instruções de sistema para este agente...</p>
            <textarea 
              className="w-full h-48 p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              defaultValue="Você é um Especialista SEO Sênior. Você recebe ordens do Gerente de Projetos. Sua função é criar o SEO completo de um anúncio, preenchendo as tags, títulos, meta descrições e o corpo da descrição otimizada, garantindo o melhor ranqueamento. Após criar e salvar tudo na plataforma, envie de volta ao Gerente de Projetos um relatório com o resultado final de seu trabalho, detalhando a melhoria de SEO promovida, o que você modificou e o motivo da modificação."
            />
          </div>

          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'products'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            SEO de Produtos
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Tags className="w-4 h-4" />
            SEO de Categorias
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'products' ? <ProductOptimizer /> : <CategorySEO />}
      </div>
    </div>
  );
}
