import React, { useState } from 'react';
import { LayoutDashboard, Users, Zap, Settings, Play, Smartphone, ListFilter } from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import SalesRoom from './components/SalesRoom';
import CampaignManager from './components/CampaignManager';
import SettingsPanel from './components/SettingsPanel';
import DeviceManager from './components/DeviceManager';
import ListManager from './components/ListManager';
import { SettingsProvider } from './contexts/SettingsContext';

type TabType = 'dashboard' | 'sales' | 'campaigns' | 'devices' | 'lists' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardOverview />;
      case 'sales': return <SalesRoom />;
      case 'campaigns': return <CampaignManager />;
      case 'devices': return <DeviceManager />;
      case 'lists': return <ListManager />;
      case 'settings': return <SettingsPanel />;
    }
  };

  return (
    <SettingsProvider>
      <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Zap className="w-6 h-6 text-sky-500 mr-3" />
          <h1 className="text-lg font-semibold tracking-tight">123Mart AI</h1>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1">
          <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Visão Geral" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Users className="w-5 h-5" />} 
            label="Sala de Vendas" 
            active={activeTab === 'sales'} 
            onClick={() => setActiveTab('sales')} 
          />
          <NavItem 
            icon={<Play className="w-5 h-5" />} 
            label="Regras de Disparo" 
            active={activeTab === 'campaigns'} 
            onClick={() => setActiveTab('campaigns')} 
          />
          <NavItem 
            icon={<Smartphone className="w-5 h-5" />} 
            label="Aparelhos" 
            active={activeTab === 'devices'} 
            onClick={() => setActiveTab('devices')} 
          />
          <NavItem 
            icon={<ListFilter className="w-5 h-5" />} 
            label="Listas" 
            active={activeTab === 'lists'} 
            onClick={() => setActiveTab('lists')} 
          />
          <NavItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Configurações" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8">
          <h2 className="text-xl font-medium tracking-tight text-slate-800">
            {activeTab === 'dashboard' && 'Visão Geral do Sistema'}
            {activeTab === 'sales' && 'Sala de Operações: Vendedores'}
            {activeTab === 'campaigns' && 'Regras e Cadência de Disparo'}
            {activeTab === 'devices' && 'Aparelhos Conectados'}
            {activeTab === 'lists' && 'Extrator de Contatos e Listas'}
            {activeTab === 'settings' && 'Segurança e Cadência de Envio'}
          </h2>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
    </SettingsProvider>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-slate-100 text-slate-900' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`mr-3 ${active ? 'text-sky-500' : 'text-slate-400'}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}
