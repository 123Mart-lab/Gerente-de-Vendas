import React, { useState } from 'react';
import { Clock, MessageSquare, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Building2, Target } from 'lucide-react';

export interface AuditTask {
  id: string;
  date: string;
  productName: string;
  receivedPrompt: string;
  sentResponse: string;
  status: 'pending' | 'completed';
  role?: string;
  requestingSector?: string;
  executingSector?: string;
  oldScore?: number;
  newScore?: number;
  evolutionPercentage?: number;
}

const roleLabels: Record<string, string> = {
  planner: 'Pesquisador',
  monitor: 'Monitor',
  seo: 'Especialista SEO',
  art: 'Diretor de Arte',
  finance: 'Analista Financeiro'
};

const AuditTaskItem: React.FC<{ task: AuditTask }> = ({ task }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
      <div 
        className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
          {task.role && <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-xs">{roleLabels[task.role] || task.role}</span>} 
          Alvo: {task.productName}
        </span>
        <span className="text-xs font-medium text-slate-500 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
            {task.date}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </span>
      </div>
      
      {isExpanded && (
        <div className="animate-in fade-in duration-200 flex flex-col">

        <div className="bg-white border-b border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1"><Building2 className="w-3 h-3"/> Solicitante</span>
              <span className="text-sm font-medium text-slate-700">{task.requestingSector || 'Gerente de Projetos'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1"><Target className="w-3 h-3"/> Executante</span>
              <span className="text-sm font-medium text-slate-700">{task.executingSector || roleLabels[task.role || ''] || 'Profissional'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Score Evolutivo</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500 line-through">{task.oldScore || 0}</span>
                <span className="text-sm font-bold text-sky-600">{task.newScore || 0}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500"/> Evolução</span>
              <span className="text-sm font-bold text-emerald-600">+{task.evolutionPercentage || 0}%</span>
            </div>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Prompt Recebido */}
          <div className="p-5 bg-sky-50/20">
            <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              Ordem Recebida ({task.requestingSector || 'Gerente'})
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
      )}
    </div>
  );
}

export default function TaskAuditPanel({ mockTasks = [] }: { mockTasks?: AuditTask[] }) {
  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-sky-600" />
        Auditoria de Trabalhos (Histórico)
      </h3>
      <div className="space-y-4">
        {mockTasks.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 text-sm">
            Nenhuma tarefa recebida do Gerente de Projetos ainda.
          </div>
        ) : (
          mockTasks.map(task => (
            <AuditTaskItem key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
}
