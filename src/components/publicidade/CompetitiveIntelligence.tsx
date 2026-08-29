import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { Radar } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';

export default function CompetitiveIntelligence() {
  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.role === 'monitor'));
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
          
          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>
    </div>
  );
}
