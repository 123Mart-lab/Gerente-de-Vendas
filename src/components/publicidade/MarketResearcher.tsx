import React from 'react';
import { Search } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';

export default function MarketResearcher() {
  const mockHistory: AuditTask[] = [
    {
      id: 'task-001',
      date: 'Hoje, 10:42',
      productName: 'Faca de Aço Inoxidável 12" Top Chef',
      receivedPrompt: 'Analise o mercado para o produto "Faca de Aço Inox 12 polegadas".\n\nPreciso que você levante:\n1. Principais argumentos de venda usados pela concorrência.\n2. Principais dores dos clientes (o que reclamam nas avaliações).\n3. Aceitação geral do mercado.',
      sentResponse: 'Análise Concluída.\n\nArgumentos de Venda (Concorrência):\n- Durabilidade extrema do fio.\n- Cabo ergonômico que não escorrega.\n\nDores dos Clientes (Reclamações em outros anúncios):\n- Muitas facas enferrujam rápido se não secar bem.\n- A lâmina vem cega de fábrica.\n\nAceitação: Alta. Produto com saída rápida em churrascarias e uso doméstico premium.',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Search className="w-6 h-6 text-sky-600" />
          Pesquisador de Mercado (Planner)
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Planejamento e Inteligência</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Busca especificações técnicas, preços, perfil do consumidor, aceitação do produto e avaliações reais.</li>
            <li>Define a estratégia central de comunicação.</li>
            <li><strong>Fluxo de Operação:</strong> Recebe o prompt de comando do Gestor de Projetos. Busca informações sobre o produto em toda a internet e nos marketplaces.</li>
            <li><strong>Relatórios Entregues:</strong> Análise geral sobre: informações de uso, informações técnicas, informações comerciais/publicitárias (argumentos de venda), quantidade de anunciantes, aceitações e reprovações do anúncio (pesquisa de satisfação).</li>
          </ul>
          
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Persona e Configuração da IA</h3>
            <p className="text-sm text-slate-500 italic mb-4">Insira aqui a descrição detalhada da persona e instruções de sistema para este agente...</p>
            <textarea 
              className="w-full h-48 p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              defaultValue="Você é um Planner e Pesquisador de Mercado focado em análise de tendências de e-commerce. Você recebe ordens do Gerente de Projetos. Sua função é buscar informações sobre o produto em toda a internet e nos marketplaces. Traga uma análise geral sobre: - As informações de uso - As informações técnicas - As informações comerciais (argumentos de venda) - Quantidade de anunciantes - As aceitações e reprovações do anúncio (pesquisa de satisfação). Após a análise, crie relatórios detalhados e envie de volta ao Gestor de Projetos."
            />
          </div>
          
          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>
    </div>
  );
}
