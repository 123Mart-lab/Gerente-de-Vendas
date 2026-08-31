
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from '../publicidade/TaskAuditPanel';
import AgentWhatsApp from '../chat/AgentWhatsApp';

export default function FinancialAnalyst() {
  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.role === 'finance'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs', err);
      }
    };
    fetchLogs();
    
    // Auto-refresh for demo
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-sky-600" />
          Analista Financeiro
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Análise Financeira e Viabilidade</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Analisa a viabilidade financeira de comercializarmos um novo produto.</li>
            <li>Calcula os preços praticados pelo mercado e realiza o abatimento de custos com impostos, embalagem, compras, e taxas de comercialização.</li>
            <li><strong>Fluxo de Operação:</strong> Recebe o prompt de comando do Gestor de Projetos. Cria o preço mínimo de venda de acordo com as expectativas de lucro.</li>
            <li><strong>Relatórios Entregues:</strong> Cria relatórios completos de viabilidade financeira e envia ao Gestor de Projetos.</li>
          </ul>

          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
        
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Comunicação da Equipe</h3>
          <AgentWhatsApp currentAgentId="finance" currentAgentName="Analista Financeiro" />
        </div>
      </div>
    </div>
  );
}
