import React, { useState, useEffect } from 'react';
import { 
  Settings2, Filter, Clock, ShieldAlert, 
  RotateCw, Save, CalendarClock, MessageSquareReply,
  Flame, Info
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

type Tab = 'options' | 'warmup' | 'filters';

export default function CampaignManager() {
  const [activeTab, setActiveTab] = useState<Tab>('options');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { rules, updateRule, saveRules } = useSettings();

  const handleSave = () => {
    saveRules();
    setShowSaveModal(true);
    setTimeout(() => setShowSaveModal(false), 3000);
  };

  // Helper to adjust presets when phase changes
  const applyWarmupPreset = (phase: string) => {
    updateRule('warmupPhase', phase);
    if (phase === 'critical') {
      updateRule('warmupMessageCount', 15);
      updateRule('warmupIntervalMin', 30);
      updateRule('warmupIntervalMax', 60);
    } else if (phase === 'warm') {
      updateRule('warmupMessageCount', 40);
      updateRule('warmupIntervalMin', 15);
      updateRule('warmupIntervalMax', 30);
    } else if (phase === 'traction') {
      updateRule('warmupMessageCount', 100);
      updateRule('warmupIntervalMin', 5);
      updateRule('warmupIntervalMax', 15);
    }
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
          <p className="text-gray-500 mt-1">Configure as travas de segurança, cadência e aquecimento para os disparos.</p>
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
            onClick={() => setActiveTab('warmup')} 
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'warmup' ? 'border-orange-600 text-orange-600 bg-orange-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Flame className="w-4 h-4" /> Aquecimento de Chip (Warm-up)
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

          {/* TAB 2: AQUECIMENTO DE CHIP (WARM-UP) */}
          {activeTab === 'warmup' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                
                {/* Cabeçalho do Aquecimento */}
                <div className="flex items-start justify-between bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-1">
                      <Flame className="w-4 h-4 text-orange-600" /> 
                      Aquecimento Automático (Warm-up)
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      O aquecimento de chip instrui os vendedores (IA) a conversarem entre si para gerar histórico orgânico. 
                      Isso previne banimentos em números recém-ativados ou recém-saídos de bloqueios.
                    </p>
                  </div>
                  <div className="pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={rules.warmupEnabled} onChange={(e) => updateRule('warmupEnabled', e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      <span className="ml-3 text-sm font-bold text-gray-900">{rules.warmupEnabled ? 'ATIVADO' : 'DESATIVADO'}</span>
                    </label>
                  </div>
                </div>

                <div className={`space-y-6 transition-opacity ${!rules.warmupEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Fases do Aquecimento (Editáveis) */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Fases e Cadência</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Fase Crítica */}
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                        <div className="font-bold text-gray-900">Fase Crítica</div>
                        <label className="flex justify-between items-center text-xs text-gray-700">
                          Duração (dias):
                          <input type="number" value={rules.warmupP1Days} onChange={e => updateRule('warmupP1Days', Number(e.target.value))} className="w-16 p-1 border border-gray-300 rounded text-center" />
                        </label>
                        <label className="flex justify-between items-center text-xs text-gray-700">
                          Max Msgs/dia:
                          <input type="number" value={rules.warmupP1MsgCount} onChange={e => updateRule('warmupP1MsgCount', Number(e.target.value))} className="w-16 p-1 border border-gray-300 rounded text-center" />
                        </label>
                        <div className="flex justify-between items-center text-xs text-gray-700">
                          Intervalo (min):
                          <div className="flex items-center gap-1">
                            <input type="number" value={rules.warmupP1IntMin} onChange={e => updateRule('warmupP1IntMin', Number(e.target.value))} className="w-12 p-1 border border-gray-300 rounded text-center" />
                            <span>-</span>
                            <input type="number" value={rules.warmupP1IntMax} onChange={e => updateRule('warmupP1IntMax', Number(e.target.value))} className="w-12 p-1 border border-gray-300 rounded text-center" />
                          </div>
                        </div>
                      </div>

                      {/* Fase Morna */}
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                        <div className="font-bold text-gray-900">Fase Morna</div>
                        <label className="flex justify-between items-center text-xs text-gray-700">
                          Duração (dias):
                          <input type="number" value={rules.warmupP2Days} onChange={e => updateRule('warmupP2Days', Number(e.target.value))} className="w-16 p-1 border border-gray-300 rounded text-center" />
                        </label>
                        <label className="flex justify-between items-center text-xs text-gray-700">
                          Max Msgs/dia:
                          <input type="number" value={rules.warmupP2MsgCount} onChange={e => updateRule('warmupP2MsgCount', Number(e.target.value))} className="w-16 p-1 border border-gray-300 rounded text-center" />
                        </label>
                        <div className="flex justify-between items-center text-xs text-gray-700">
                          Intervalo (min):
                          <div className="flex items-center gap-1">
                            <input type="number" value={rules.warmupP2IntMin} onChange={e => updateRule('warmupP2IntMin', Number(e.target.value))} className="w-12 p-1 border border-gray-300 rounded text-center" />
                            <span>-</span>
                            <input type="number" value={rules.warmupP2IntMax} onChange={e => updateRule('warmupP2IntMax', Number(e.target.value))} className="w-12 p-1 border border-gray-300 rounded text-center" />
                          </div>
                        </div>
                      </div>

                      {/* Fase de Tração */}
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                        <div className="font-bold text-gray-900">Fase de Tração</div>
                        <label className="flex justify-between items-center text-xs text-gray-700">
                          Duração (dias):
                          <input type="number" value={rules.warmupP3Days} onChange={e => updateRule('warmupP3Days', Number(e.target.value))} className="w-16 p-1 border border-gray-300 rounded text-center" />
                        </label>
                        <label className="flex justify-between items-center text-xs text-gray-700">
                          Max Msgs/dia:
                          <input type="number" value={rules.warmupP3MsgCount} onChange={e => updateRule('warmupP3MsgCount', Number(e.target.value))} className="w-16 p-1 border border-gray-300 rounded text-center" />
                        </label>
                        <div className="flex justify-between items-center text-xs text-gray-700">
                          Intervalo (min):
                          <div className="flex items-center gap-1">
                            <input type="number" value={rules.warmupP3IntMin} onChange={e => updateRule('warmupP3IntMin', Number(e.target.value))} className="w-12 p-1 border border-gray-300 rounded text-center" />
                            <span>-</span>
                            <input type="number" value={rules.warmupP3IntMax} onChange={e => updateRule('warmupP3IntMax', Number(e.target.value))} className="w-12 p-1 border border-gray-300 rounded text-center" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Relacionamentos e Prompt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Matriz de Relacionamentos</h4>
                      <p className="text-xs text-gray-500 mb-4">Escolha com quantos vendedores este chip deve interagir e com qual persona.</p>
                      
                      <div className="space-y-3">
                        <label className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                          <span className="text-sm font-medium text-gray-700">Parentes (Primos/Irmãos)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Qtd:</span>
                            <input type="number" value={rules.warmupFamilyCount} onChange={e => updateRule('warmupFamilyCount', Number(e.target.value))} className="w-16 p-1.5 border border-gray-300 rounded-md text-center text-sm" />
                          </div>
                        </label>
                        <label className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                          <span className="text-sm font-medium text-gray-700">Amigos Próximos</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Qtd:</span>
                            <input type="number" value={rules.warmupFriendCount} onChange={e => updateRule('warmupFriendCount', Number(e.target.value))} className="w-16 p-1.5 border border-gray-300 rounded-md text-center text-sm" />
                          </div>
                        </label>
                        <label className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-white shadow-sm cursor-pointer">
                          <span className="text-sm font-medium text-gray-700">Casal (Parceiro/a)</span>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={rules.warmupCoupleEnabled} onChange={(e) => updateRule('warmupCoupleEnabled', e.target.checked)} className="w-4 h-4 text-orange-600 rounded" />
                            <span className="text-xs font-medium text-gray-600">1 Vendedor</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        Instrução da IA (Prompt)
                        <div className="group relative cursor-help">
                          <Info className="w-4 h-4 text-gray-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Esta instrução substitui o script de vendas durante o aquecimento para garantir conversas orgânicas.
                          </div>
                        </div>
                      </h4>
                      <textarea 
                        value={rules.warmupPrompt}
                        onChange={(e) => updateRule('warmupPrompt', e.target.value)}
                        className="w-full h-72 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-y"
                        placeholder="Instrução para a IA..."
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FILTROS AVANÇADOS */}
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
