import React from 'react';
import { Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

export interface AuditTask {
  id: string;
  date: string;
  productName: string;
  receivedPrompt: string;
  sentResponse: string;
  status: 'pending' | 'completed';
}

export default function TaskAuditPanel({ mockTasks = [] }: { mockTasks?: AuditTask[] }) {
  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-sky-600" />
        Auditoria de Trabalhos (Histórico)
      </h3>
      <div className="space-y-6">
        {mockTasks.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 text-sm">
            Nenhuma tarefa recebida do Gerente de Projetos ainda.
          </div>
        ) : (
          mockTasks.map(task => (
            <div key={task.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700 text-sm">Alvo: {task.productName}</span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                  {task.date}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                {/* Prompt Recebido */}
                <div className="p-5 bg-sky-50/20">
                  <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                    Ordem Recebida (Gerente)
                  </h4>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {task.receivedPrompt}
                  </div>
                </div>
                {/* Resposta Enviada */}
                <div className="p-5 bg-emerald-50/10">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Relatório Entregue
                  </h4>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {task.sentResponse || <span className="text-slate-400 italic">Trabalhando na solicitação...</span>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
