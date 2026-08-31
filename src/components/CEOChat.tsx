import React from 'react';
import { MessageCircle } from 'lucide-react';
import AgentWhatsApp from './chat/AgentWhatsApp';

export default function CEOChat() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-12rem)] min-h-[600px]">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <MessageCircle className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-medium text-slate-800">Comunicação Direta com a Equipe</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <AgentWhatsApp currentAgentId="diretoria" currentAgentName="Marcus / CEO" />
        </div>
      </div>
    </div>
  );
}
