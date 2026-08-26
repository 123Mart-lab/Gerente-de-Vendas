import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { 
  Users, 
  MessageSquare, 
  CheckSquare, 
  Download, 
  Play, 
  Settings2, 
  Clock, 
  ShieldAlert,
  Search,
  FolderOpen,
  Filter,
  X,
  ArrowRight,
  Upload,
  Database,
  Send,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

type ExtractionSource = 'all_groups' | 'history';

interface SavedList {
  id: string;
  name: string;
  date: string;
  count: number;
}

interface TreatmentList {
  id: string;
  name: string;
  count: number;
  status: 'pending' | 'verified' | 'treated' | 'sent';
}

export default function ListManager() {
  const [source, setSource] = useState<ExtractionSource>('all_groups');
  const [delay, setDelay] = useState(10);
  const [useDelay, setUseDelay] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [onlyGroups, setOnlyGroups] = useState(false);
  
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [searchGroup, setSearchGroup] = useState('');

  const [savedLists] = useState<SavedList[]>([
    { id: '1', name: 'Conversas Individuais', date: '25/08/2026', count: 1245 },
    { id: '2', name: 'Membros de Grupo', date: '24/08/2026', count: 8390 }
  ]);

  const [treatmentLists, setTreatmentLists] = useState<TreatmentList[]>([]);
  const [showVerifyModal, setShowVerifyModal] = useState<{isOpen: boolean, removedCount: number}>({isOpen: false, removedCount: 0});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [isTreating, setIsTreating] = useState(false);
  const [contactsCount, setContactsCount] = useState<number | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [isFetchingCount, setIsFetchingCount] = useState(false);

  const checkContactsCount = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/userinfo.email',
    prompt: 'select_account',
    onSuccess: async (tokenResponse) => {
      setIsFetchingCount(true);
      try {
        const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names&pageSize=1', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const data = await response.json();
        setContactsCount(data.totalItems || data.totalPeople || 0);

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userData = await userResponse.json();
        setConnectedEmail(userData.email);
      } catch (error) {
        console.error("Erro ao buscar total de contatos", error);
      } finally {
        setIsFetchingCount(false);
      }
    },
    onError: () => setIsFetchingCount(false)
  });

  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/contacts',
    prompt: 'select_account',
    onSuccess: async (tokenResponse) => {
      setIsTreating(true);
      try {
        // Obter o token de acesso
        const accessToken = tokenResponse.access_token;
        
        // Simular a criação de contatos em lote na agenda do Google
        // Em um cenário real, você iteraria sobre a lista real de números e enviaria para
        // https://people.googleapis.com/v1/people:batchCreateContacts
        
        const response = await fetch('https://people.googleapis.com/v1/people:createContact', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            names: [{ givenName: 'Contato', familyName: '123Mart Teste' }],
            phoneNumbers: [{ value: '+5511999999999' }],
          })
        });

        if (!response.ok) {
          throw new Error('Falha ao salvar no Google Contacts');
        }

        // Marcar a lista como tratada e mostrar modal de sucesso
        setShowSaveModal(true);
        setTimeout(() => setShowSaveModal(false), 3000);
        
        setTreatmentLists(prev => prev.map(l => 
          l.id === currentTreatingListId ? { ...l, status: 'treated' as const } : l
        ));
      } catch (error) {
        console.error("Erro ao salvar contatos:", error);
        alert('Erro ao salvar os contatos na agenda.');
      } finally {
        setIsTreating(false);
        setCurrentTreatingListId(null);
      }
    },
    onError: (errorResponse) => {
      console.error("Google Login falhou", errorResponse);
      setIsTreating(false);
      setCurrentTreatingListId(null);
    }
  });

  const [currentTreatingListId, setCurrentTreatingListId] = useState<string | null>(null);

  const handleSendToTreatment = (list: SavedList) => {
    setTreatmentLists(prev => [
      ...prev,
      { id: list.id + '-' + Date.now(), name: list.name, count: list.count, status: 'pending' }
    ]);
  };

  const handleVerifyList = (id: string) => {
    // Simulate removing numbers without WhatsApp (approx 5-15% of the list)
    setTreatmentLists(prev => prev.map(list => {
      if (list.id === id) {
        const removedPercent = Math.random() * 0.1 + 0.05;
        const removedCount = Math.floor(list.count * removedPercent);
        setShowVerifyModal({isOpen: true, removedCount});
        setTimeout(() => setShowVerifyModal({isOpen: false, removedCount: 0}), 4000);
        return { ...list, count: list.count - removedCount, status: 'verified' };
      }
      return list;
    }));
  };

  const handleTreatList = (list: TreatmentList) => {
    if (list.status === 'pending') {
      setVerifyError(true);
      setTimeout(() => setVerifyError(false), 3000);
      return;
    }

    setCurrentTreatingListId(list.id);
    googleLogin();
  };

  const handleSendToManager = (list: TreatmentList) => {
    if (list.status !== 'treated') {
      setSendError(true);
      setTimeout(() => setSendError(false), 3000);
      return;
    }
    
    // Simulate sending to manager
    setShowSendModal(true);
    setTimeout(() => setShowSendModal(false), 3000);
    setTreatmentLists(prev => prev.map(l => 
      l.id === list.id ? { ...l, status: 'sent' } : l
    ));
  };

  // Mock de grupos para o modal
  const mockGroups = [
    { id: 'g1', name: 'Oficina Sergio Fidelis', phone: '+55 11 97331-5186' },
    { id: 'g2', name: 'Múltipla Cimentos', phone: '+55 11 99277-4576' },
    { id: 'g3', name: 'Vendas Região Sul', phone: '+55 11 99350-0075' },
    { id: 'g4', name: 'Fornecedores Auto', phone: '+55 11 99934-9728' },
    { id: 'g5', name: 'Grupo VIP Clientes', phone: '+55 12 99138-1438' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Criador de Listas (Extrator)</h2>
          <p className="text-gray-500 mt-1">Extraia contatos do seu WhatsApp de forma segura e automatizada.</p>
        </div>
        <div className="flex items-center gap-3">
          {contactsCount !== null ? (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 font-medium flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-bold">{contactsCount}</span> contatos salvos
              </div>
              {connectedEmail && (
                <span className="text-xs sm:ml-2 sm:pl-2 sm:border-l border-blue-200 text-blue-600/80">
                  em {connectedEmail}
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={() => checkContactsCount()}
              disabled={isFetchingCount}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isFetchingCount ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Consultando...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-blue-600" />
                  Ver Contatos Salvos
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da Esquerda: Configurações de Extração */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card: Origem dos Dados (Pesquisa) */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                Critério de Pesquisa
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-5">
                  <input 
                    type="radio" 
                    name="source" 
                    checked={source === 'all_groups'}
                    onChange={() => {
                      setSource('all_groups');
                      setShowGroupModal(true);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                  />
                </div>
                <div className="flex flex-col w-full">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Membros de grupos que participo</span>
                    {source === 'all_groups' && (
                      <button onClick={() => setShowGroupModal(true)} className="text-xs text-blue-600 hover:underline">
                        Selecionar Grupos
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">Varre seus grupos selecionados extraindo os participantes.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-5">
                  <input 
                    type="radio" 
                    name="source" 
                    checked={source === 'history'}
                    onChange={() => setSource('history')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Contatos no histórico de conversas</span>
                  <span className="text-xs text-gray-500">Extrai contatos individuais (que não estão em grupos) do seu histórico.</span>
                </div>
              </label>


            </div>
          </div>

          {/* Card: Opções (Anti-Ban) */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-purple-600" />
                Opções de Segurança
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="useDelay"
                  checked={useDelay}
                  onChange={(e) => setUseDelay(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" 
                />
                <label htmlFor="useDelay" className="text-sm text-gray-700 flex items-center gap-2">
                  Aguardar 
                  <input 
                    type="number" 
                    value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                    disabled={!useDelay}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  segundos a cada pesquisa
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="skipDuplicates"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5" 
                />
                <label htmlFor="skipDuplicates" className="text-sm text-gray-700 leading-tight">
                  Não pesquisar itens que já tenham sido pesquisados antes (Evitar duplicidade na base)
                </label>
              </div>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-semibold text-sm">
            <Play className="w-5 h-5 fill-current" />
            Iniciar Extração de Contatos
          </button>
        </div>

        {/* Coluna da Direita: Listas Salvas e Resultados */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Suas Listas</h3>
                <p className="text-sm text-gray-500">Bases extraídas prontas para envio em campanhas.</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Filtrar">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-0 flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    <th className="px-6 py-4 border-b border-gray-200">Nome da Lista</th>
                    <th className="px-6 py-4 border-b border-gray-200">Volume</th>
                    <th className="px-6 py-4 border-b border-gray-200 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {savedLists.map((list) => (
                    <tr key={list.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{list.name}</p>
                            <p className="text-xs text-gray-500">{list.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{list.count.toLocaleString('pt-BR')}</span>
                        <span className="text-xs text-gray-500 ml-1">itens</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleSendToTreatment(list)}
                            className="px-3 py-1.5 text-sm bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-1.5"
                            title="Enviar para Tratamento"
                          >
                            <ArrowRight className="w-4 h-4" /> Tratamento
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Exportar CSV">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
              <span>Mostrando {savedLists.length} listas salvas</span>
              <span className="flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Backup automático ativado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Tratamento de Listas */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Tratamento de Listas
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Trate suas listas e salve os contatos na agenda do Google antes de distribuí-los para evitar banimentos.
            </p>
          </div>
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 shadow-sm text-sm">
            <FileSpreadsheet className="w-4 h-4" /> Importar Excel (.csv, .xlsx)
          </button>
        </div>
        
        <div className="p-0 overflow-auto">
          {treatmentLists.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900 mb-1">Nenhuma lista em tratamento</p>
              <p className="text-sm">Envie uma lista da aba acima ou importe um arquivo Excel.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-medium border-b border-gray-100">
                  <th className="px-6 py-4">Nome da Lista</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Volume</th>
                  <th className="px-6 py-4 text-right">Ações de Tratamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {treatmentLists.map((list) => (
                  <tr key={list.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {list.name}
                    </td>
                    <td className="px-6 py-4">
                      {list.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5" /> Pendente de Verificação
                        </span>
                      )}
                      {list.status === 'verified' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> WhatsApp Verificado
                        </span>
                      )}
                      {list.status === 'treated' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Salvo no Google
                        </span>
                      )}
                      {list.status === 'sent' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Send className="w-3.5 h-3.5" /> Enviado ao Gerente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-semibold text-gray-900">{list.count.toLocaleString('pt-BR')}</span>
                      <span className="text-xs text-gray-500 ml-1">contatos</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {list.status === 'pending' && (
                          <button 
                            onClick={() => handleVerifyList(list.id)}
                            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm"
                          >
                            <ShieldCheck className="w-4 h-4" /> Verificar WhatsApp
                          </button>
                        )}
                        {(list.status === 'pending' || list.status === 'verified') && (
                          <button 
                            onClick={() => handleTreatList(list)}
                            disabled={isTreating && currentTreatingListId === list.id}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm ${
                              list.status === 'verified'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            } ${(isTreating && currentTreatingListId === list.id) ? 'opacity-75 cursor-not-allowed' : ''}`}
                          >
                            {(isTreating && currentTreatingListId === list.id) ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Salvando...
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" /> Tratar (Salvar Agenda)
                              </>
                            )}
                          </button>
                        )}
                        {(list.status === 'treated' || list.status === 'sent' || list.status === 'verified' || list.status === 'pending') && (
                          <button 
                            onClick={() => handleSendToManager(list)}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm ${
                              list.status === 'treated' 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : list.status === 'sent'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            <Send className="w-4 h-4" /> Enviar p/ Gerente
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Selecionar Contatos / Grupos */}
      {showVerifyModal.isOpen && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-medium">Verificação concluída: {showVerifyModal.removedCount} números sem WhatsApp removidos!</span>
        </div>
      )}

      {verifyError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Atenção: A lista precisa ser verificada no WhatsApp antes de ser salva na agenda!</span>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Contatos salvos na Agenda do Google com sucesso!</span>
        </div>
      )}

      {showSendModal && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
          <Send className="w-5 h-5" />
          <span className="font-medium">Lista enviada ao Gerente de Vendas para distribuição!</span>
        </div>
      )}

      {sendError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Atenção: A lista precisa ser tratada (Salva no Google) antes de enviar!</span>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                Selecionar Grupos para Extração
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Termo de Pesquisa</label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Digite o nome do grupo..." 
                    value={searchGroup}
                    onChange={(e) => setSearchGroup(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-900">{mockGroups.length} grupos encontrados</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Atualizar novos grupos
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Selecionar todos
                  </label>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50/50">
                <div className="space-y-1">
                  {mockGroups.filter(g => g.name.toLowerCase().includes(searchGroup.toLowerCase())).map((group) => (
                    <label key={group.id} className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all shadow-sm">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{group.name}</span>
                        <span className="text-xs text-gray-500">{group.phone}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <button 
                onClick={() => setShowGroupModal(false)}
                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm">
                  <FolderOpen className="w-4 h-4" />
                  Abrir Seleção
                </button>
                <button 
                  onClick={() => setShowGroupModal(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <CheckSquare className="w-4 h-4" />
                  Confirmar Seleção
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
