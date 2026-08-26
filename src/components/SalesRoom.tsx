import React, { useState } from 'react';
import { 
  Search, Filter, MoreVertical, Phone, Video, 
  Smile, Paperclip, Mic, Send, Bot, User, 
  Sparkles, ShieldAlert, Zap, BrainCircuit, Check, CheckCheck,
  ChevronLeft, TrendingUp, Clock, Target, DollarSign, Shield,
  UserMinus, UserPlus, Eye, PieChart, Network, BarChart3, Users, Activity
} from 'lucide-react';

// --- TYPES ---
type ProfileType = 'pragmatico' | 'analitico' | 'amigavel' | 'expressivo' | 'analisando';

interface SellerStats {
  volume: number;
  charisma: number;
  nlpSpeed: number; // Substituiu a Aceleração. Medido em qtd de mensagens para detectar o perfil.
  effectiveness: number;
  shield: number;
  revenue: number;
}

interface Seller {
  id: string;
  name: string;
  role: string;
  avatar: string;
  stats: SellerStats;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
  unread: number;
  profile: ProfileType;
  status: 'novo' | 'em_atendimento' | 'frio' | 'blacklist';
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'client';
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

// --- MOCK DATA ---
const INITIAL_SELLERS: Seller[] = [
  {
    id: 's1',
    name: 'Ana Silva',
    role: 'Consultora de Vendas (IA)',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg', // Foto apenas para o painel interno
    stats: {
      volume: 1450,
      charisma: 42,
      nlpSpeed: 2.1,
      effectiveness: 12.5,
      shield: 1.2,
      revenue: 45800
    }
  },
  {
    id: 's2',
    name: 'Marcos Paulo',
    role: 'Consultor de Vendas (IA)',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg', // Foto apenas para o painel interno
    stats: {
      volume: 1200,
      charisma: 18,
      nlpSpeed: 4.5,
      effectiveness: 4.2,
      shield: 8.5,
      revenue: 12400
    }
  },
  {
    id: 's3',
    name: 'Carla Dias',
    role: 'Consultora de Vendas (IA)',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg', // Foto apenas para o painel interno
    stats: {
      volume: 1320,
      charisma: 35,
      nlpSpeed: 2.8,
      effectiveness: 9.8,
      shield: 3.1,
      revenue: 31200
    }
  }
];

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Carlos Eduardo', phone: '+55 11 99999-1111', lastMessage: 'Qual o valor do plano anual?', time: '10:42', unread: 1, profile: 'pragmatico', status: 'novo' },
  { id: '2', name: 'Mariana Costa', phone: '+55 11 98888-2222', lastMessage: 'Bom dia! Tudo bem? Eu vi o anúncio e achei super legal, queria saber se serve pra mim 😊', time: '10:15', unread: 2, profile: 'amigavel', status: 'em_atendimento' },
  { id: '3', name: 'Roberto Almeida', phone: '+55 11 97777-3333', lastMessage: 'Pode me enviar o PDF com as especificações técnicas e a SLA de garantia?', time: 'Ontem', unread: 0, profile: 'analitico', status: 'em_atendimento' },
  { id: '4', name: 'Juliana Paes', phone: '+55 11 96666-4444', lastMessage: 'Nossa, incrível!! Quero pra ontem, como faz pra assinar VIP?', time: 'Ontem', unread: 0, profile: 'expressivo', status: 'frio' },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', text: 'Olá Carlos, bom dia!', sender: 'me', time: '09:00', status: 'read' },
    { id: 'm2', text: 'Bom dia. Qual o valor do plano anual?', sender: 'client', time: '10:42' },
  ],
  '2': [
    { id: 'm1', text: 'Oi Mariana, vi que você se cadastrou na nossa página. Como posso te ajudar?', sender: 'me', time: '09:30', status: 'read' },
    { id: 'm2', text: 'Bom dia! Tudo bem? Eu vi o anúncio e achei super legal, queria saber se serve pra mim 😊', sender: 'client', time: '10:15' },
  ]
};

const PROFILE_CONFIGS = {
  pragmatico: {
    title: 'Pragmático (Direto)',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    traits: ['Foco em resultados', 'Sem enrolação', 'Valoriza tempo'],
    tips: ['Seja direto e objetivo', 'Foque no preço e ROI', 'Evite áudios longos e emojis em excesso']
  },
  analitico: {
    title: 'Analítico (Lógico)',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    traits: ['Foco em dados', 'Cauteloso', 'Faz muitas perguntas'],
    tips: ['Envie dados e garantias', 'Use listas (bullet points)', 'Passe segurança, não apresse a venda']
  },
  amigavel: {
    title: 'Amigável (Emocional)',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    traits: ['Foco em pessoas', 'Empático', 'Valoriza atenção'],
    tips: ['Use um tom caloroso', 'Chame pelo nome', 'Pode usar emojis e áudios simpáticos']
  },
  expressivo: {
    title: 'Expressivo (Comunicativo)',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    traits: ['Entusiasmado', 'Inovador', 'Foco em status'],
    tips: ['Seja animado', 'Foque em exclusividade e novidade', 'Mostre como ele vai se destacar']
  },
  analisando: {
    title: 'Analisando Perfil...',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    traits: ['Aguardando mais interações'],
    tips: ['Continue a conversa normalmente']
  }
};

const getScaledStats = (stats: SellerStats, days: number): SellerStats => {
  const multiplier = days / 7;
  return {
    ...stats,
    volume: Math.round(stats.volume * multiplier),
    revenue: stats.revenue * multiplier,
  };
};

export default function SalesRoom() {
  const [sellers, setSellers] = useState<Seller[]>(INITIAL_SELLERS);
  const [activeSeller, setActiveSeller] = useState<Seller | null>(null);
  const [evaluationDays, setEvaluationDays] = useState<number>(7);
  const [auditModal, setAuditModal] = useState<{isOpen: boolean, sellerName: string}>({isOpen: false, sellerName: ''});
  const [selectionModal, setSelectionModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});

  // AÇÕES DO GERENTE IA
  const handleNaturalSelection = () => {
    if (sellers.length < 3) {
      setAlertModal({isOpen: true, message: 'Equipe muito pequena para realizar o ciclo de seleção natural. Mínimo de 3 vendedores necessários.'});
      return;
    }

    // Ordenar vendedores por Receita (Trunfo)
    const sellersWithScaledStats = sellers.map(s => ({
      ...s,
      currentStats: getScaledStats(s.stats, evaluationDays)
    }));

    const sorted = [...sellersWithScaledStats].sort((a, b) => b.currentStats.revenue - a.currentStats.revenue);
    const best1 = sorted[0];
    // Se tivermos apenas 2 vendedores, o top 2 seria o pior (que será demitido). 
    // Nesse caso, usamos o top 1 como base para ambos os clones para não herdar as táticas ruins.
    const best2 = sorted.length > 2 ? sorted[1] : sorted[0];
    const worst = sorted[sorted.length - 1];

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const confirmMessage = sorted.length > 2 
      ? `O Gerente IA analisou a performance dos últimos ${evaluationDays} dias e identificou:\n🏆 TOP 1: ${best1.name} (${formatCurrency(best1.currentStats.revenue)})\n🥈 TOP 2: ${best2.name} (${formatCurrency(best2.currentStats.revenue)})\n❌ ALVO DE DESLIGAMENTO: ${worst.name} (${formatCurrency(worst.currentStats.revenue)})\n\nDeseja autorizar o desligamento de ${worst.name} e permitir que o Gerente IA crie 2 novos perfis baseados nos dois melhores?`
      : `O Gerente IA analisou a performance dos últimos ${evaluationDays} dias e identificou:\n🏆 TOP 1: ${best1.name} (${formatCurrency(best1.currentStats.revenue)})\n❌ ALVO DE DESLIGAMENTO: ${worst.name} (${formatCurrency(worst.currentStats.revenue)})\n\nDeseja autorizar o desligamento de ${worst.name} e clonar 2 vezes os padrões de ${best1.name}?`;

    setSelectionModal({
      isOpen: true,
      message: confirmMessage,
      onConfirm: () => {
        // Remover o pior
      const survivors = sellers.filter(s => s.id !== worst.id);
      
      const femaleNames = ['Juliana', 'Camila', 'Beatriz', 'Fernanda', 'Amanda', 'Letícia', 'Bruna'];
      const maleNames = ['Rafael', 'Thiago', 'Bruno', 'Felipe', 'Lucas', 'Gabriel', 'Rodrigo'];

      // O Gerente IA inteligentemente decide fazer um Teste A/B de gênero e persona
      const name1 = femaleNames[Math.floor(Math.random() * femaleNames.length)];
      const name2 = maleNames[Math.floor(Math.random() * maleNames.length)];
      
      // Clone 1 baseado no TOP 1 (Feminino)
      const clone1: Seller = {
        id: Date.now().toString() + 'a',
        name: `${name1} (Genoma: ${best1.name.split(' ')[0]})`,
        role: 'Consultora Evoluída (IA)',
        avatar: `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 90)}.jpg`,
        stats: {
          volume: 0, 
          charisma: Math.min(100, best1.stats.charisma + 5), 
          nlpSpeed: Math.max(1, +(best1.stats.nlpSpeed - 0.3).toFixed(1)), 
          effectiveness: +(best1.stats.effectiveness + 2).toFixed(1), 
          shield: Math.max(0.1, +(best1.stats.shield - 0.5).toFixed(1)), 
          revenue: 0
        }
      };
      
      // Clone 2 baseado no TOP 2 (Masculino)
      const clone2: Seller = {
        id: Date.now().toString() + 'b',
        name: `${name2} (Genoma: ${best2.name.split(' ')[0]})`,
        role: 'Consultor Evoluído (IA)',
        avatar: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 90)}.jpg`,
        stats: {
          volume: 0, 
          charisma: Math.min(100, best2.stats.charisma + 4), 
          nlpSpeed: Math.max(1, +(best2.stats.nlpSpeed - 0.4).toFixed(1)), 
          effectiveness: +(best2.stats.effectiveness + 2.5).toFixed(1), 
          shield: Math.max(0.1, +(best2.stats.shield - 0.6).toFixed(1)), 
          revenue: 0
        }
      };

      setSellers([...survivors, clone1, clone2]);
      setSelectionModal({isOpen: false, message: '', onConfirm: () => {}});
      setAlertModal({isOpen: true, message: `Seleção Natural concluída com sucesso!\n\nO Gerente IA encerrou as operações de ${worst.name.split(' ')[0]}.\n\nOs novos operadores contratados foram:\n- ${name1} (Herdando táticas de ${best1.name.split(' ')[0]})\n- ${name2} (Herdando táticas de ${best2.name.split(' ')[0]})`});
    }
  });
  };

  if (!activeSeller) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] overflow-y-auto pb-8">
        
        {/* CABEÇALHO DO GERENTE DE VENDAS (IA) */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 rounded-2xl border border-indigo-500/30 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Network className="w-64 h-64 -mt-10 -mr-10 text-indigo-400" />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                <Bot className="w-8 h-8 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Gerente de Vendas <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/30">IA ACTIVA</span>
                </h2>
                <p className="text-indigo-200/80 text-sm mt-1">Orquestrador Neural: Distribuição de leads, Testes A/B e evolução da equipe.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => alert('Gerando relatórios consolidados de performance (Em breve na v2)')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-xl text-sm font-medium text-slate-200 transition-colors"
              >
                <PieChart className="w-4 h-4 text-sky-400" /> 
                Análise e Gráficos
              </button>
              
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300 font-medium whitespace-nowrap">Avaliar últimos:</span>
                <select 
                  value={evaluationDays}
                  onChange={(e) => setEvaluationDays(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                >
                  <option value={7} className="text-slate-900">7 dias</option>
                  <option value={15} className="text-slate-900">15 dias</option>
                  <option value={30} className="text-slate-900">30 dias</option>
                  <option value={90} className="text-slate-900">90 dias</option>
                </select>
              </div>

              <button 
                onClick={handleNaturalSelection}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] group"
              >
                <Network className="w-4 h-4 text-indigo-100 group-hover:rotate-12 transition-transform" /> 
                Executar Seleção Natural
              </button>
            </div>
          </div>
        </div>

        {/* GRID DE VENDEDORES (SUPER TRUNFO) */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            Equipe Operacional Ativa ({sellers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sellers.map(seller => {
              const displayStats = getScaledStats(seller.stats, evaluationDays);
              
              return (
              <div key={seller.id} className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col relative group hover:border-sky-500/50 transition-all hover:-translate-y-1">
                <div className="p-4 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-sky-400 p-0.5 shadow-[0_0_15px_rgba(56,189,248,0.4)] shrink-0 bg-slate-800">
                    <img src={seller.avatar} alt={seller.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-white tracking-tight truncate">{seller.name}</h3>
                    <p className="text-sky-400 text-xs font-medium uppercase tracking-wider truncate">{seller.role}</p>
                  </div>
                </div>
                
                <div className="p-4 space-y-1.5 flex-1">
                  <StatRow icon={<Zap />} label="Volume (Motor)" value={`${displayStats.volume} leads`} color="text-yellow-400" />
                  <StatRow icon={<Smile />} label="Carisma (Atração)" value={`${displayStats.charisma}%`} color="text-emerald-400" />
                  <StatRow icon={<BrainCircuit />} label="Percepção PNL" value={`${displayStats.nlpSpeed} msgs`} color="text-blue-400" />
                  <StatRow icon={<Target />} label="Efetividade" value={`${displayStats.effectiveness}%`} color="text-purple-400" />
                  
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50">
                    <div className="flex items-center gap-2 text-rose-400">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Blindagem (Opt-out)</span>
                    </div>
                    <span className="font-mono font-bold text-white text-sm">{displayStats.shield}%</span>
                  </div>

                  <div className="pt-1">
                    <div className="flex items-center justify-between bg-slate-800/80 rounded-lg px-3 py-2 border border-sky-500/30">
                      <div className="flex items-center gap-2 text-sky-400">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm font-black uppercase tracking-widest">Trunfo: Receita</span>
                      </div>
                      <span className="font-mono font-black text-emerald-400 text-lg">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.revenue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-700">
                  <button onClick={() => setActiveSeller(seller)} className="p-3 bg-slate-800 hover:bg-slate-700 transition-colors flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white">
                    <Eye className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Monitorar Tela</span>
                  </button>
                  <button onClick={() => setAuditModal({isOpen: true, sellerName: seller.name})} className="p-3 bg-slate-800 hover:bg-indigo-900/30 transition-colors flex flex-col items-center justify-center gap-1 text-indigo-400 hover:text-indigo-300">
                    <Activity className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Auditoria PNL</span>
                  </button>
                </div>
              </div>
            )})}
          </div>
        </div>
        {/* MODAL AUDITORIA PNL */}
        {auditModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-indigo-400 mb-4">
                <Activity className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Auditoria PNL</h3>
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Acessando log de decisões e DNA conversacional de <span className="font-bold text-white">{auditModal.sellerName}</span>...
                <br /><br />
                <span className="text-sm text-slate-400">(Módulo de auditoria visual estará disponível em breve)</span>
              </p>
              <button 
                onClick={() => setAuditModal({isOpen: false, sellerName: ''})}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
        {/* MODAL ALERTA */}
        {alertModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-amber-400 mb-4">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Atenção</h3>
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed">
                {alertModal.message}
              </p>
              <button 
                onClick={() => setAlertModal({isOpen: false, message: ''})}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMAÇÃO SELEÇÃO NATURAL */}
        {selectionModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-800 border border-sky-500/30 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(14,165,233,0.15)] animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-sky-400 mb-4">
                <BrainCircuit className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Resultado da Seleção Natural</h3>
              </div>
              <div className="text-slate-300 mb-6 whitespace-pre-line leading-relaxed text-sm bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                {selectionModal.message}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectionModal({isOpen: false, message: '', onConfirm: () => {}})}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={selectionModal.onConfirm}
                  className="flex-1 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)]"
                >
                  Autorizar Mutação
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return <Workspace seller={activeSeller} onBack={() => setActiveSeller(null)} />;
}

function StatRow({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50">
      <div className={`flex items-center gap-2 ${color}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-mono font-bold text-white text-sm">{value}</span>
    </div>
  );
}

function Workspace({ seller, onBack }: { seller: Seller, onBack: () => void }) {
  const [activeLeadId, setActiveLeadId] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeLead = MOCK_LEADS.find(l => l.id === activeLeadId);
  const activeMessages = MOCK_MESSAGES[activeLeadId] || [];
  const profileInfo = activeLead ? PROFILE_CONFIGS[activeLead.profile] : PROFILE_CONFIGS.analisando;

  const handleSuggestResponse = () => {
    setIsGenerating(true);
    setTimeout(() => {
      if (activeLead?.profile === 'pragmatico') {
        setMessageInput('O plano anual custa R$ 997 à vista ou 12x de R$ 99. Acesso imediato a todos os recursos. Posso enviar o link de pagamento?');
      } else {
        setMessageInput('Oi Carlos! Tudo ótimo por aqui 😊 O plano anual tá saindo por apenas R$ 997 à vista. Quer que eu te mande um PDF com tudo que inclui?');
      }
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <ChevronLeft className="w-5 h-5" />
          Voltar para Gestão (Super Trunfo)
        </button>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-sm font-semibold text-slate-700">Monitorando Tela: {seller.name}</span>
        </div>
      </div>

      <div className="flex flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Esquerda: Leads */}
        <div className="w-80 flex flex-col border-r border-slate-200 bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar conversas..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {MOCK_LEADS.map(lead => (
              <div 
                key={lead.id}
                onClick={() => setActiveLeadId(lead.id)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-slate-100 ${
                  activeLeadId === lead.id ? 'bg-sky-50' : 'hover:bg-slate-100/80 bg-white'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-medium text-slate-600">
                    {lead.name.charAt(0)}
                  </div>
                  {lead.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                      {lead.unread}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{lead.name}</h3>
                    <span className="text-xs text-slate-500">{lead.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{lead.lastMessage}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${PROFILE_CONFIGS[lead.profile].bg} ${PROFILE_CONFIGS[lead.profile].color} ${PROFILE_CONFIGS[lead.profile].border}`}>
                      {lead.profile.charAt(0).toUpperCase() + lead.profile.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Centro: Chat */}
        <div className="flex-1 flex flex-col bg-[#efeae2] relative">
          <div className="h-16 px-4 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                {activeLead?.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{activeLead?.name}</h2>
                <p className="text-xs text-slate-500">{activeLead?.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <button className="hover:text-slate-700"><Phone className="w-5 h-5" /></button>
              <button className="hover:text-slate-700"><Video className="w-5 h-5" /></button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button className="hover:text-slate-700"><MoreVertical className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex justify-center mb-6">
              <span className="px-3 py-1 bg-white/60 rounded-lg text-xs text-slate-500 font-medium shadow-sm">Hoje</span>
            </div>
            {activeMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${
                  msg.sender === 'me' ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-slate-500 leading-none">{msg.time}</span>
                    {msg.sender === 'me' && <CheckCheck className={`w-3 h-3 ${msg.status === 'read' ? 'text-blue-500' : 'text-slate-400'}`} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white border-t border-slate-200 flex items-end gap-2">
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
              <Smile className="w-6 h-6" />
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            
            <div className="flex-1 bg-slate-100 rounded-xl relative border border-transparent focus-within:border-sky-300 focus-within:bg-white transition-all">
              <textarea 
                rows={1}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Assistindo ${seller.name} digitar...`}
                className="w-full bg-transparent px-4 py-3 text-sm outline-none resize-none max-h-32 min-h-[44px]"
              />
            </div>
            {messageInput.trim() ? (
              <button className="p-3 bg-sky-500 text-white hover:bg-sky-600 rounded-full transition-colors shadow-sm">
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            ) : (
              <button className="p-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-full transition-colors shadow-sm">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Direita: PNL IA Copilot */}
        <div className="w-[340px] flex flex-col bg-slate-50 border-l border-slate-200 overflow-y-auto">
          <div className="p-5 bg-white border-b border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <User className="w-16 h-16" />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-sky-600 uppercase mb-2 block">
              Identidade do Operador
            </span>
            <div className="flex items-center gap-3">
              <img src={seller.avatar} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
              <div>
                <h3 className="text-base font-bold text-slate-900">{seller.name}</h3>
                <p className="text-xs text-slate-500">{seller.role}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Copiloto IA (PNL)</h3>
            </div>

            <div className={`p-4 rounded-xl border ${profileInfo.bg} ${profileInfo.border} shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perfil Detectado</span>
                <Sparkles className={`w-4 h-4 ${profileInfo.color}`} />
              </div>
              <h4 className={`text-lg font-bold mb-2 ${profileInfo.color}`}>{profileInfo.title}</h4>
              
              <div className="space-y-2 mt-4 pt-4 border-t border-white/40">
                <span className="text-xs font-semibold text-slate-700 mb-1 block">Diretrizes de Abordagem:</span>
                <ul className="space-y-1.5">
                  {profileInfo.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${profileInfo.color}`} />
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={handleSuggestResponse}
                disabled={isGenerating || activeLead?.profile === 'analisando'}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Gerando sugestão...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Sugerir Resposta Camaleão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
