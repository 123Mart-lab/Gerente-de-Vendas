import React, { useState } from 'react';
import { 
  Settings2, Filter, Clock, ShieldAlert, 
  RotateCw, Save, CalendarClock, MessageSquareReply
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

type Tab = 'options' | 'filters';

export default function CampaignManager() {
  const [activeTab, setActiveTab] = useState<Tab>('options');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { rules, updateRule, saveRules } = useSettings();

  const handleSave = () => {
    saveRules();
    setShowSaveModal(true);
    setTimeout(() => setShowSaveModal(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {showSaveModal && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
          <Save className="w-5 h-5" />
          <span className="font-medium">Regras de disparo e cadência salvas com sucesso!</span>
        </div>
      )}
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Regras de Disparo (Anti-Ban)</h2>
          <p className="text-gray-500 mt-1">Configure as travas de segurança e a cadência para os disparos realizados pelos vendedores.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" /> 
            Salvar Configurações
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Tabs Header */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('options')} 
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'options' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Cadência & Anti-Ban
          </button>
          <button 
            onClick={() => setActiveTab('filters')} 
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'filters' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtros Globais
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 flex-1 bg-gray-50/30">
          
          {/* TAB 1: OPÇÕES (ANTI-BAN) */}
          {activeTab === 'options' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Configurações de Tempo */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" /> 
                  Cadência de Envio (Por Vendedor)
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={rules.useDelay} onChange={(e) => updateRule('useDelay', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Aguardar entre</span>
                    <input type="number" value={rules.delayMin} onChange={(e) => updateRule('delayMin', Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm" />
                    <span className="text-sm text-gray-700">e</span>
                    <input type="number" value={rules.delayMax} onChange={(e) => updateRule('delayMax', Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm" />
                    <span className="text-sm text-gray-700">segundos a cada disparo</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={rules.useRest} onChange={(e) => updateRule('useRest', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Pausar envios por</span>
                    <input type="number" value={rules.restMinutes} onChange={(e) => updateRule('restMinutes', Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm" />
                    <span className="text-sm text-gray-700">minuto(s) após</span>
                    <input type="number" value={rules.restEvery} onChange={(e) => updateRule('restEvery', Number(e.target.value))} className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm" />
                    <span className="text-sm text-gray-700">disparos contínuos</span>
                  </label>
                </div>
              </div>

              {/* Rotação e Limites */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <RotateCw className="w-4 h-4 text-purple-600" /> 
                  Rotação de Chips e Limites
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={rules.rotatePhones} onChange={(e) => updateRule('rotatePhones', e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                    <span className="text-sm text-gray-700">Trocar de chip quando houver mais números disponíveis após</span>
                    <input type="number" value={rules.rotateEvery} onChange={(e) => updateRule('rotateEvery', Number(e.target.value))} className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm" />
                    <span className="text-sm text-gray-700">envios</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={rules.limitSends} onChange={(e) => updateRule('limitSends', e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                    <span className="text-sm text-gray-700">Travar disparos do vendedor após</span>
                    <input type="number" value={rules.limitAmount} onChange={(e) => updateRule('limitAmount', Number(e.target.value))} className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm" />
                    <span className="text-sm text-gray-700">envios (limite diário)</span>
                  </label>
                </div>
              </div>

              {/* Horários e Janelas de Atuação */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5 md:col-span-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <CalendarClock className="w-4 h-4 text-orange-600" /> 
                  Horários de Operação e Respostas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Prospecção */}
                  <div className="space-y-4 p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      Primeiro Contato (Prospecção)
                    </h4>
                    <label className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">Permitir novos envios entre</span>
                      <input type="time" value={rules.prospectStartTime} onChange={(e) => updateRule('prospectStartTime', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm bg-white" />
                      <span className="text-sm text-gray-700">e</span>
                      <input type="time" value={rules.prospectEndTime} onChange={(e) => updateRule('prospectEndTime', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm bg-white" />
                    </label>
                    <p className="text-xs text-gray-500">Fora deste horário, o sistema bloqueará envios de novos contatos pelos vendedores.</p>
                  </div>

                  {/* Respostas */}
                  <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <MessageSquareReply className="w-4 h-4 text-blue-600" />
                      Respostas aos Clientes
                    </h4>
                    
                    <label className="flex items-center gap-3">
                      <input type="checkbox" checked={rules.reply24h} onChange={(e) => updateRule('reply24h', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700 font-medium">Permitir respostas 24 horas por dia</span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input type="checkbox" checked={rules.useReplyDelay} onChange={(e) => updateRule('useReplyDelay', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">Atraso na resposta (entre</span>
                      <input type="number" value={rules.replyDelayMin} onChange={(e) => updateRule('replyDelayMin', Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm bg-white" />
                      <span className="text-sm text-gray-700">e</span>
                      <input type="number" value={rules.replyDelayMax} onChange={(e) => updateRule('replyDelayMax', Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm bg-white" />
                      <span className="text-sm text-gray-700">segundos)</span>
                    </label>
                    <p className="text-xs text-gray-500">Adiciona um pequeno atraso antes do envio da resposta do vendedor para simular digitação humana e evitar banimentos.</p>
                  </div>
                </div>
              </div>

              {/* Comportamento */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 md:col-span-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Settings2 className="w-4 h-4 text-emerald-600" /> 
                  Comportamento Global e Opt-Out
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={rules.skipDuplicates} onChange={(e) => updateRule('skipDuplicates', e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                    <span className="text-sm text-gray-700">Bloquear envio para contatos já acionados na semana</span>
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={rules.clearChats} onChange={(e) => updateRule('clearChats', e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                    <span className="text-sm text-gray-700">Limpar histórico de conversas antigas após</span>
                    <input type="number" value={rules.clearChatsDays} onChange={(e) => updateRule('clearChatsDays', Number(e.target.value))} disabled={!rules.clearChats} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm disabled:bg-gray-50" />
                    <span className="text-sm text-gray-700">dias</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <label className="flex items-start gap-3 mb-3">
                    <input type="checkbox" checked={rules.optOut} onChange={(e) => updateRule('optOut', e.target.checked)} className="w-4 h-4 text-emerald-600 rounded mt-1" />
                    <span className="text-sm font-medium text-gray-900">Forçar inclusão de mensagem de OPT-OUT no final do primeiro contato</span>
                  </label>
                  {rules.optOut && (
                    <textarea 
                      value={rules.optOutText}
                      onChange={(e) => updateRule('optOutText', e.target.value)}
                      className="w-full ml-7 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      rows={2}
                      placeholder="Digite a frase de Opt-Out..."
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FILTROS AVANÇADOS */}
          {activeTab === 'filters' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={rules.filterDDD} onChange={(e) => updateRule('filterDDD', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Permitir envios somente para DDDs de</span>
                    <input type="number" value={rules.dddMin} onChange={(e) => updateRule('dddMin', Number(e.target.value))} disabled={!rules.filterDDD} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm disabled:bg-gray-50" />
                    <span className="text-sm text-gray-700">até</span>
                    <input type="number" value={rules.dddMax} onChange={(e) => updateRule('dddMax', Number(e.target.value))} disabled={!rules.filterDDD} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm disabled:bg-gray-50" />
                  </label>

                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={rules.ignoreUnread} onChange={(e) => updateRule('ignoreUnread', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Bloquear envio quando houver mensagens não lidas</span>
                  </label>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <input type="checkbox" className="w-4 h-4 text-rose-600 rounded" defaultChecked />
                      Blacklist Global (Opt-outs e Não Interessantes)
                    </label>
                    <span className="text-xs font-semibold px-2 py-1 bg-rose-100 text-rose-700 rounded-full">
                      Sincronizado com a Sala de Vendas
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    Estes contatos nunca receberão mensagens. Esta lista é alimentada <strong>automaticamente</strong> 
                    quando os clientes pedem para sair (Opt-out) ou quando os vendedores marcam um lead como "Não Interessante" 
                    na Sala de Vendas. Você também pode inserir números manualmente abaixo.
                  </p>
                  <textarea 
                    value={rules.ignoreList}
                    onChange={(e) => updateRule('ignoreList', e.target.value)}
                    placeholder="Digite um número por linha (Ex: 5511999999999)"
                    className="w-full h-48 p-4 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
