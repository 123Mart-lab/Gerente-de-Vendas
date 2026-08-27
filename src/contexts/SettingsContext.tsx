import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface RulesSettings {
  useDelay: boolean;
  delayMin: number;
  delayMax: number;
  useRest: boolean;
  restMinutes: number;
  restEvery: number;
  rotatePhones: boolean;
  rotateEvery: number;
  limitSends: boolean;
  limitAmount: number;
  prospectStartTime: string;
  prospectEndTime: string;
  reply24h: boolean;
  useReplyDelay: boolean;
  replyDelayMin: number;
  replyDelayMax: number;
  skipDuplicates: boolean;
  clearChats: boolean;
  clearChatsDays: number;
  optOut: boolean;
  optOutText: string;
  filterDDD: boolean;
  dddMin: number;
  dddMax: number;
  ignoreUnread: boolean;
  ignoreList: string;
  // Warm-up configs
  warmupEnabled: boolean;
  warmupP1Days: number;
  warmupP1MsgCount: number;
  warmupP1IntMin: number;
  warmupP1IntMax: number;
  warmupP2Days: number;
  warmupP2MsgCount: number;
  warmupP2IntMin: number;
  warmupP2IntMax: number;
  warmupP3Days: number;
  warmupP3MsgCount: number;
  warmupP3IntMin: number;
  warmupP3IntMax: number;
  warmupFamilyCount: number;
  warmupFriendCount: number;
  warmupCoupleEnabled: boolean;
  warmupPrompt: string;
}

const defaultSettings: RulesSettings = {
  useDelay: true, delayMin: 30, delayMax: 180,
  useRest: true, restMinutes: 60, restEvery: 100,
  rotatePhones: true, rotateEvery: 50,
  limitSends: true, limitAmount: 50,
  prospectStartTime: '08:00', prospectEndTime: '18:00',
  reply24h: true, useReplyDelay: true, replyDelayMin: 5, replyDelayMax: 15,
  skipDuplicates: true, clearChats: false, clearChatsDays: 7,
  optOut: true, optOutText: 'Respeitamos sua privacidade: caso não queira mais receber nossas mensagens, responda *SAIR* por gentileza.',
  filterDDD: false, dddMin: 11, dddMax: 99,
  ignoreUnread: false, ignoreList: '',
  warmupEnabled: false, 
  warmupP1Days: 3, warmupP1MsgCount: 15, warmupP1IntMin: 30, warmupP1IntMax: 60,
  warmupP2Days: 4, warmupP2MsgCount: 40, warmupP2IntMin: 15, warmupP2IntMax: 30,
  warmupP3Days: 7, warmupP3MsgCount: 100, warmupP3IntMin: 5, warmupP3IntMax: 15,
  warmupFamilyCount: 2, warmupFriendCount: 3, warmupCoupleEnabled: true,
  warmupPrompt: 'Você é uma IA simulando um usuário humano do WhatsApp. Você conversará com outros números assumindo um papel específico. REGRAS GERAIS: Seja breve (1 a 3 linhas), use linguagem coloquial do dia a dia, e nunca envie links. Caso falte vendedores para algum papel, aguarde a entrada natural de novos números para assumi-los.\n\nDe acordo com seu papel na conversa, use estes temas:\n1. PARENTE (Irmão/Primo): Fale sobre família, saúde dos pais, como está o trabalho, organização de aniversários e festas/finais de semana em família.\n2. AMIGO(A) PRÓXIMO(A): Siga o gênero. Mulheres: falem sobre moda, beleza, relacionamentos, família e compras. Homens: falem sobre futebol, esportes, filmes e séries.\n3. CASAL: Fale sobre a rotina do dia, vitórias/dificuldades no trabalho, filhos, planejamento do final de semana em família e finanças/contas.\n\nAguarde sempre a resposta da outra pessoa para dar continuidade.'
};

interface SettingsContextType {
  rules: RulesSettings;
  updateRule: <K extends keyof RulesSettings>(key: K, value: RulesSettings[K]) => void;
  saveRules: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<RulesSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from backend on mount
  React.useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          setRules(prev => ({ ...prev, ...data }));
        } else {
          // Fallback to localStorage if backend is empty
          const saved = localStorage.getItem('applet_campaign_rules');
          if (saved) {
            try {
              setRules(JSON.parse(saved));
            } catch (e) {}
          }
        }
        setIsLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load settings from backend', err);
        setIsLoaded(true);
      });
  }, []);

  const updateRule = <K extends keyof RulesSettings>(key: K, value: RulesSettings[K]) => {
    setRules(prev => ({ ...prev, [key]: value }));
  };

  const saveRules = () => {
    localStorage.setItem('applet_campaign_rules', JSON.stringify(rules));
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules)
    }).catch(err => console.error('Failed to save settings to backend', err));
  };

  if (!isLoaded) {
    return <div>Carregando configurações...</div>; // Prevent hydration mismatch / early render with default settings
  }

  return (
    <SettingsContext.Provider value={{ rules, updateRule, saveRules }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
