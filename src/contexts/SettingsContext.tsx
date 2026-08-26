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
  ignoreUnread: false, ignoreList: ''
};

interface SettingsContextType {
  rules: RulesSettings;
  updateRule: <K extends keyof RulesSettings>(key: K, value: RulesSettings[K]) => void;
  saveRules: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<RulesSettings>(() => {
    const saved = localStorage.getItem('applet_campaign_rules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const updateRule = <K extends keyof RulesSettings>(key: K, value: RulesSettings[K]) => {
    setRules(prev => ({ ...prev, [key]: value }));
  };

  const saveRules = () => {
    localStorage.setItem('applet_campaign_rules', JSON.stringify(rules));
  };

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
