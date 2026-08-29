import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { Search } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';

export default function MarketResearcher() {
  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.role === 'planner'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs', err);
      }
    };
    fetchLogs();
    
    // Auto refresh
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

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
          
          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>
    </div>
  );
}
