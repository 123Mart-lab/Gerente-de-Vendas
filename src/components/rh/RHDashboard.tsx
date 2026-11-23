import React, { useState, useEffect } from 'react';
import { Users, Shield, Wrench, Check, Search, Filter, Github, Save, AlertCircle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

type Department = 'comercial' | 'publicidade' | 'financeiro' | 'fiscal' | 'juridico';

interface Agent {
  id: string;
  name: string;
  department: Department;
}

type ToolCapabilityTier = 'real_integration' | 'prompt_directive' | 'planned';

interface APITool {
  id: string;
  name: string;
  description: string;
  status: ToolCapabilityTier;
}

const DEPARTMENTS: { id: Department; name: string; description: string }[] = [
  { id: 'comercial', name: 'Setor Comercial', description: 'Vendas, negociações e atendimento' },
  { id: 'publicidade', name: 'Setor de Publicidade', description: 'Marketing, tráfego, SEO e criação' },
  { id: 'financeiro', name: 'Setor Financeiro', description: 'Análise de viabilidade e controle de caixa' },
  { id: 'fiscal', name: 'Setor Fiscal (Em breve)', description: 'Tributação e conformidade' },
  { id: 'juridico', name: 'Setor Jurídico (Em breve)', description: 'Contratos e proteção legal' },
];

const AGENTS: Agent[] = [
  // Comercial
  { id: 'vendedor-1', name: 'Vendedor (Desempenho 1)', department: 'comercial' },
  { id: 'vendedor-2', name: 'Vendedor (Desempenho 2)', department: 'comercial' },
  { id: 'gerente-comercial', name: 'Gerente Comercial', department: 'comercial' },
  
  // Publicidade
  { id: 'gerente-projetos', name: 'Gerente de Projetos', department: 'publicidade' },
  { id: 'pesquisador-mercado', name: 'Pesquisador de Mercado', department: 'publicidade' },
  { id: 'monitor-concorrencia', name: 'Monitor de Inteligência Competitiva', department: 'publicidade' },
  { id: 'diretor-arte', name: 'Diretor de Arte e Áudio', department: 'publicidade' },
  { id: 'redator', name: 'Redator (Copywriter)', department: 'publicidade' },
  { id: 'social-media', name: 'Gestor de Social Media', department: 'publicidade' },
  { id: 'especialista-ads', name: 'Especialista em Ads', department: 'publicidade' },
  { id: 'especialista-seo', name: 'Especialista SEO', department: 'publicidade' },
  { id: 'especialista-merchant', name: 'Especialista Merchant Center', department: 'publicidade' },
  { id: 'analista-metricas', name: 'Analista de Métricas (BI)', department: 'publicidade' },
  
  // Financeiro
  { id: 'analista-financeiro', name: 'Analista Financeiro', department: 'financeiro' },
];

const API_TOOLS: APITool[] = [
  // Lojas Virtuais & E-commerce (Integração Real)
  { id: 'nuvemshop-api', name: 'API Nuvemshop', description: 'Acesso ao vivo ao catálogo de produtos, SEO, tags, imagens e dados reais dos anúncios da Nuvemshop.', status: 'real_integration' },

  // Repositórios de Terceiros & APIs com Bloqueio Técnico Real
  { id: 'search-console', name: 'Google Search Console / Grounding', description: 'Habilita busca real na web (Google Search) na geração de SEO e pesquisa orgânica.', status: 'real_integration' },
  { id: 'github-openwa', name: 'OpenWA / WaSender (WhatsApp API)', description: 'Controla disparo real de mensagens de WhatsApp nos workers de vendas e suporte.', status: 'real_integration' },
  { id: 'contacts-api', name: 'Google Contacts API', description: 'Controla salvamento de contatos de leads na agenda nos workers comerciais.', status: 'real_integration' },
  { id: 'people-api', name: 'Google People API', description: 'Controla sincronização de perfis de clientes nos workers comerciais.', status: 'real_integration' },

  // Conhecimentos e Frameworks (Diretrizes de Prompt IA)
  { id: 'github-rally-mcp', name: 'Rally MCP', description: 'Diretriz de inteligência viral e roteiros aplicada ao prompt de Pesquisa e Social Media.', status: 'prompt_directive' },
  { id: 'github-neuro-copywriting', name: 'NEURO-COPYWRITING', description: 'Framework de psicologia de conversão aplicado ao prompt de SEO e Copy.', status: 'prompt_directive' },
  { id: 'github-awesome-seo', name: 'AWESOME-SEO-TOOLS', description: 'Diretriz de estruturação semântica de HTML e escaneabilidade aplicada ao Especialista SEO.', status: 'prompt_directive' },
  { id: 'github-open-seo', name: 'OPEN-SEO', description: 'Diretriz de mineração de dores de concorrentes e cauda longa aplicada ao Especialista SEO.', status: 'prompt_directive' },

  // Diretrizes Comportamentais IA (Prompt)
  { id: 'nlp', name: 'Cloud Natural Language (Diretriz IA)', description: 'Ativa análise de sentimento e tom persuasivo no prompt de Vendas, Pesquisa, SEO e Social Media.', status: 'prompt_directive' },
  { id: 'vision-api', name: 'Cloud Vision (Alçada Visual)', description: 'Controla permissão de avaliação de imagem no chat e diretrizes de Alt-tags no SEO/Social.', status: 'prompt_directive' },
  { id: 'cloud-search', name: 'Cloud Search (Diretriz IA)', description: 'Ativa diretriz de enriquecimento técnico no prompt de Pesquisa e SEO.', status: 'prompt_directive' },
  { id: 'vertex-ai', name: 'AI Platform / Vertex AI (Diretriz IA)', description: 'Ativa diretriz de cross-sell preditivo e hooks de retenção no prompt de Vendas e Social.', status: 'prompt_directive' },
  { id: 'postmaster-tools', name: 'Gmail Postmaster (Diretriz IA)', description: 'Ativa diretriz anti-spam para copys de e-mail marketing no Social Media.', status: 'prompt_directive' },
  { id: 'speech-to-text', name: 'Cloud Speech-to-Text / TTS (Diretriz IA)', description: 'Ativa adaptação para scripts de áudio e voz no prompt de Vendedores.', status: 'prompt_directive' },
  { id: 'translation-api', name: 'Cloud Translation (Diretriz IA)', description: 'Ativa instrução de negociação multilíngue no prompt de Vendedores.', status: 'prompt_directive' },
  { id: 'calendar-api', name: 'Google Calendar (Diretriz IA)', description: 'Ativa proposta de agendamento de follow-ups no prompt de Vendedores.', status: 'prompt_directive' },
  { id: 'places-api', name: 'Places API (Diretriz IA)', description: 'Ativa gatilhos de proximidade/CEP no prompt de Vendedores.', status: 'prompt_directive' },

  // APIs Planejadas (Ainda sem conector ativo no backend)
  { id: 'merchant-center', name: 'Content API for Shopping', description: 'Gestão de produtos e anúncios no Google Merchant Center (conector ainda não integrado).', status: 'planned' },
  { id: 'ga-data', name: 'Google Analytics Data API', description: 'Extração de relatórios e eventos do GA4 (conector ainda não integrado).', status: 'planned' },
  { id: 'ga-admin', name: 'Google Analytics Admin API', description: 'Gestão de contas e propriedades do GA4 (conector ainda não integrado).', status: 'planned' },
  { id: 'tag-manager', name: 'Tag Manager API', description: 'Gestão de tags, acionadores e variáveis (conector ainda não integrado).', status: 'planned' },
  { id: 'gmp-admin', name: 'Google Marketing Platform Admin API', description: 'Integração do ecossistema corporativo Google (conector ainda não integrado).', status: 'planned' },
  { id: 'sheets-drive', name: 'Google Sheets & Drive', description: 'Exportação de relatórios e dados na nuvem (conector ainda não integrado).', status: 'planned' },
  { id: 'search-ads-360', name: 'Search Ads 360 Reporting API', description: 'Cruzamento de ROAS e performance de campanhas (conector ainda não integrado).', status: 'planned' },
];

const INITIAL_PERMISSIONS: Record<string, Record<string, boolean>> = {
  'especialista-seo': {
    'github-open-seo': true,
    'github-awesome-seo': true,
    'github-neuro-copywriting': true,
    'search-console': true,
    'nlp': true,
    'vision-api': true,
    'cloud-search': true,
  },
  'redator': {
    'github-neuro-copywriting': true,
    'nlp': true,
  },
  'pesquisador-mercado': {
    'github-rally-mcp': true,
    'cloud-search': true,
    'nlp': true,
  },
  'social-media': {
    'github-rally-mcp': true,
    'nlp': true,
    'vision-api': true,
    'vertex-ai': true,
    'postmaster-tools': true,
  },
  'vendedor-1': {
    'github-openwa': true,
    'contacts-api': true,
    'people-api': true,
    'speech-to-text': true,
    'calendar-api': true,
    'translation-api': true,
    'vertex-ai': true,
    'places-api': true,
    'nlp': true,
  },
  'vendedor-2': {
    'github-openwa': true,
    'contacts-api': true,
    'people-api': true,
    'speech-to-text': true,
    'calendar-api': true,
    'translation-api': true,
    'vertex-ai': true,
    'places-api': true,
    'nlp': true,
  },
  'gerente-comercial': {
    'github-openwa': true,
    'contacts-api': true,
    'people-api': true,
    'sheets-drive': true,
    'calendar-api': true,
    'search-ads-360': true,
    'nlp': true,
  },
  'especialista-merchant': {
    'merchant-center': true,
    'search-ads-360': true,
  },
  'analista-metricas': {
    'ga-data': true,
    'sheets-drive': true,
    'search-ads-360': true,
    'postmaster-tools': true,
  }
};

export default function RHDashboard() {
  const { rules, updateRule, saveRules } = useSettings();
  const [selectedDept, setSelectedDept] = useState<Department>('comercial');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(AGENTS.find(a => a.department === 'comercial')?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(rules.agentPermissions || INITIAL_PERMISSIONS);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync state if rules change
  useEffect(() => {
    if (rules.agentPermissions) {
      setPermissions(rules.agentPermissions);
    }
  }, [rules.agentPermissions]);

  // Handle department change
  const handleDeptChange = (dept: Department) => {
    setSelectedDept(dept);
    const firstAgentInDept = AGENTS.find(a => a.department === dept);
    setSelectedAgent(firstAgentInDept ? firstAgentInDept.id : null);
  };

  const persistPermissions = async (nextPerms: Record<string, Record<string, boolean>>) => {
    setSaveState('saving');
    const ok = await saveRules({ ...rules, agentPermissions: nextPerms });
    setSaveState(ok ? 'saved' : 'error');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const togglePermission = (agentId: string, toolId: string) => {
    const newPerms: Record<string, Record<string, boolean>> = {
      ...permissions,
      [agentId]: {
        ...(permissions[agentId] || {}),
        [toolId]: !(permissions[agentId]?.[toolId] || false)
      }
    };
    setPermissions(newPerms);
    updateRule('agentPermissions', newPerms);
    // Persiste imediatamente no servidor para ter efeito instantâneo no chat e na esteira
    void persistPermissions(newPerms);
  };

  const handleSave = async () => {
    await persistPermissions(permissions);
  };

  const activeAgentInfo = AGENTS.find(a => a.id === selectedAgent);

  const filteredTools = API_TOOLS.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Recursos Humanos (RH) - Gestão de Acessos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Controle as alçadas de cada agente. Alterações são salvas automaticamente no servidor com efeito imediato.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Integração Real (trava/libera execução)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Diretriz IA (ativa instrução no prompt)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Planejado (sem conector externo ainda)
            </span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shrink-0 ${
            saveState === 'saved'
              ? 'bg-emerald-100 text-emerald-700'
              : saveState === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'
          }`}
        >
          {saveState === 'saved' ? (
            <>
              <Check className="w-4 h-4" />
              Permissões Salvas!
            </>
          ) : saveState === 'error' ? (
            <>
              <AlertCircle className="w-4 h-4" />
              Erro ao Salvar
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saveState === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
            </>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Left Sidebar - Departments and Agents */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r border-slate-200 bg-slate-50/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Departamentos</h3>
            <div className="space-y-1">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => handleDeptChange(dept.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedDept === dept.id 
                      ? 'bg-indigo-100 text-indigo-800 font-medium' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Agentes do Setor
            </h3>
            <div className="space-y-1">
              {AGENTS.filter(a => a.department === selectedDept).length === 0 ? (
                <div className="text-sm text-slate-400 italic px-2 py-4 text-center border border-dashed border-slate-200 rounded-md">
                  Nenhum agente cadastrado neste setor ainda.
                </div>
              ) : (
                AGENTS.filter(a => a.department === selectedDept).map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                      selectedAgent === agent.id 
                        ? 'bg-white border border-indigo-200 shadow-sm text-indigo-700 font-medium' 
                        : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <span>{agent.name}</span>
                    {/* Badge to show active tools count */}
                    {Object.values(permissions[agent.id] || {}).filter(Boolean).length > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
                        {Object.values(permissions[agent.id] || {}).filter(Boolean).length}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Content - Permissions Matrix */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {!selectedAgent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Shield className="w-12 h-12 mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Selecione um Agente</h3>
              <p className="max-w-md">Escolha um agente no menu lateral para configurar suas permissões de acesso às ferramentas conectadas.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Permissões: {activeAgentInfo?.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Ative ou desative o acesso às integrações para este agente específico.
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar ferramenta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow w-64"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredTools.map(tool => {
                    const isEnabled = permissions[selectedAgent]?.[tool.id] || false;
                    
                    return (
                      <div 
                        key={tool.id}
                        className={`flex p-4 rounded-xl border transition-all duration-200 ${
                          isEnabled 
                            ? 'border-indigo-200 bg-indigo-50/30 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {tool.id.startsWith('github') ? (
                              <Github className={`w-4 h-4 ${isEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
                            ) : (
                              <Wrench className={`w-4 h-4 ${isEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
                            )}
                            <h4 className={`font-semibold ${isEnabled ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {tool.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mb-3 pr-4 leading-relaxed h-8">
                            {tool.description}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                              tool.status === 'real_integration'
                                ? 'bg-emerald-100 text-emerald-700'
                                : tool.status === 'prompt_directive'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {tool.status === 'real_integration'
                                ? 'Integração Real'
                                : tool.status === 'prompt_directive'
                                ? 'Diretriz IA (Prompt)'
                                : 'Planejado (Sem API)'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex items-center shrink-0">
                          <button
                            onClick={() => togglePermission(selectedAgent, tool.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                              isEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredTools.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                      <Filter className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                      <p>Nenhuma ferramenta encontrada com esse termo.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
