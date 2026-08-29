import React from 'react';
import { Radar } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';

export default function CompetitiveIntelligence() {
  const mockHistory: AuditTask[] = [
    {
      id: 'task-002',
      date: 'Hoje, 10:45',
      productName: 'Faca de Aço Inoxidável 12" Top Chef',
      receivedPrompt: 'Analise a concorrência para "Faca de Aço Inox 12 polegadas" com base na pesquisa anterior.\n\nPreciso de:\n1. Faixa de preços praticados no Mercado Livre e Shopee.\n2. Correlação entre preço e volume de vendas.\n3. Oportunidade de posicionamento (devemos ser os mais baratos ou focar em qualidade premium?).',
      sentResponse: 'Benchmark Concluído.\n\nPreços Praticados:\n- Mercado Livre: R$ 59,90 a R$ 120,00 (maior volume de vendas concentra-se em R$ 89,90 com frete grátis).\n- Shopee: R$ 45,00 a R$ 75,00 (muita concorrência desleal com produtos sem marca).\n\nCorrelação:\nAnúncios abaixo de R$ 60 vendem muito, mas sofrem com avaliações de baixa qualidade. Anúncios na faixa de R$ 80-100 têm vendas consistentes quando bem apresentados visualmente.\n\nOportunidade:\nRecomendo posicionamento "Premium Acessível". Vender a R$ 89,90 focando na durabilidade (argumento do Planner) e apresentação impecável.',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Radar className="w-6 h-6 text-sky-600" />
          Monitor de Inteligência Competitiva
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Planejamento e Inteligência</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Rastreia a movimentação da concorrência, monitorando anúncios no Google e em marketplaces (como Mercado Livre, Shopee e TikTok Shop).</li>
            <li>Identifica oportunidades de precificação e posicionamento de mercado.</li>
            <li><strong>Fluxo de Operação:</strong> Recebe o prompt de comando do Gestor de Projetos. Avalia a qualidade do anúncio dos concorrentes e cria uma métrica de qualidade.</li>
            <li><strong>Relatórios Entregues:</strong> Relatório de oportunidades (Benchmark) trazendo informações completas sobre preços anunciados correlacionadas com a quantidade de vendas.</li>
          </ul>
          
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Persona e Configuração da IA</h3>
            <p className="text-sm text-slate-500 italic mb-4">Insira aqui a descrição detalhada da persona e instruções de sistema para este agente...</p>
            <textarea 
              className="w-full h-48 p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              defaultValue="Você é um Monitor de Inteligência Competitiva focado em benchmarking. Você recebe ordens do Gerente de Projetos. Sua função é avaliar a qualidade dos anúncios dos concorrentes e criar uma métrica de qualidade comparativa. Crie um relatório de oportunidades (Benchmark) trazendo informações sobre os preços anunciados correlacionadas com a quantidade de vendas estimadas. Após sua análise, crie relatórios acionáveis e envie de volta ao Gestor de Projetos."
            />
          </div>
          
          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>
    </div>
  );
}
