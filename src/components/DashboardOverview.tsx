import React, { useEffect, useState } from 'react';
import { Activity, MessageSquare, Clock, AlertTriangle, ShieldCheck, MessageCircle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import AgentWhatsApp from './chat/AgentWhatsApp';

export default function DashboardOverview() {
  const { rules } = useSettings();
  const [stats, setStats] = useState({
    activeWorkers: 0,
    messagesQueued: 0,
    messagesProcessed: 0,
    salesConversations: 0,
    supportConversations: 0
  });

  useEffect(() => {
    // Busca dados reais da nossa API
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Workers Ativos" 
          value={stats.activeWorkers.toString()} 
          icon={<Activity className="w-5 h-5" />} 
          trend="Estável"
        />
        <MetricCard 
          title="Mensagens na Fila" 
          value={stats.messagesQueued.toString()} 
          icon={<Clock className="w-5 h-5" />} 
          trend="Aguardando Triagem"
        />
        <MetricCard 
          title="Leads em Vendas" 
          value={stats.salesConversations.toString()} 
          icon={<MessageSquare className="w-5 h-5 text-sky-500" />} 
          trend="Funil ativo"
        />
        <MetricCard 
          title="Tickets de Suporte" 
          value={stats.supportConversations.toString()} 
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} 
          trend="Em atendimento"
        />
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Status dos Serviços Core</h3>
        <div className="space-y-4">
          <StatusRow name="Gerente de Triagem (BullMQ)" status="online" />
          <StatusRow name="Vendedor AI Closer (Gemini 3.6)" status="online" />
          <StatusRow name="Conector WhatsApp (OpenWA)" status="offline" note="Aguardando conexão com dispositivo" />
          <StatusRow name="Memória de Contexto (Firestore)" status="online" />
        </div>
      </div>

      {/* Rules Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-medium text-slate-800">Diretrizes Operacionais Ativas</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">A equipe de vendas está operando atualmente sob as seguintes regras globais:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-center">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prospecção</span>
            <span className="font-medium text-slate-800">{rules.prospectStartTime} às {rules.prospectEndTime}</span>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-center">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Delay de Envio</span>
            <span className="font-medium text-slate-800">
              {rules.useDelay ? `${rules.delayMin}s a ${rules.delayMax}s` : 'Sem atraso (Perigoso)'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-center">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Limite Diário/Vendedor</span>
            <span className="font-medium text-slate-800">
              {rules.limitSends ? `${rules.limitAmount} envios` : 'Ilimitado (Perigoso)'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-center">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Limpeza e Opt-Out</span>
            <span className="font-medium text-slate-800">
              {rules.optOut ? 'Opt-Out Automático' : 'Manual'} {rules.clearChats ? `| Limpa chats > ${rules.clearChatsDays}d` : ''}
            </span>
          </div>
        </div>
      </div>
      
      {/* Communication Hub */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-medium text-slate-800">Comunicação Direta com Equipe</h3>
        </div>
        <AgentWhatsApp currentAgentId="diretoria" currentAgentName="Marcus / CEO" />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-semibold text-slate-900 mb-1">{value}</div>
      <div className="text-xs font-medium text-slate-500">{trend}</div>
    </div>
  );
}

function StatusRow({ name, status, note }: { name: string, status: 'online' | 'offline', note?: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
      <div className="flex items-center">
        <div className={`w-2.5 h-2.5 rounded-full mr-3 ${status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <span className="font-medium text-sm text-slate-700">{name}</span>
      </div>
      <div className="flex items-center space-x-3 text-sm">
        {note && <span className="text-slate-400">{note}</span>}
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
