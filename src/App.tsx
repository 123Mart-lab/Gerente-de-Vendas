import React, { useState } from 'react';
import { LayoutDashboard, Users, Zap, Settings, Play, Smartphone, ListFilter, Sparkles, Tags, Megaphone, Store } from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import SalesRoom from './components/SalesRoom';
import CampaignManager from './components/CampaignManager';
import SettingsPanel from './components/SettingsPanel';
import DeviceManager from './components/DeviceManager';
import ListManager from './components/ListManager';
import MarketingDashboard from './components/marketing/MarketingDashboard';
import ProductOptimizer from './components/marketing/ProductOptimizer';
import CategorySEO from './components/marketing/CategorySEO';
import { SettingsProvider } from './contexts/SettingsContext';

type SectorType = 'comercial' | 'marketing';
type ComercialTabType = 'dashboard' | 'sales' | 'campaigns' | 'devices' | 'lists' | 'settings';
type MarketingTabType = 'mkt-dashboard' | 'products' | 'categories';

export default function App() {
  const [activeSector, setActiveSector] = useState<SectorType>('comercial');
  const [activeComercialTab, setActiveComercialTab] = useState<ComercialTabType>('dashboard');
  const [activeMarketingTab, setActiveMarketingTab] = useState<MarketingTabType>('mkt-dashboard');

  const renderContent = () => {
    if (activeSector === 'comercial') {
      switch (activeComercialTab) {
        case 'dashboard': return <DashboardOverview />;
        case 'sales': return <SalesRoom />;
        case 'campaigns': return <CampaignManager />;
        case 'devices': return <DeviceManager />;
        case 'lists': return <ListManager />;
        case 'settings': return <SettingsPanel />;
      }
    } else {
      switch (activeMarketingTab) {
        case 'mkt-dashboard': return <MarketingDashboard />;
        case 'products': return <ProductOptimizer />;
        case 'categories': return <CategorySEO />;
      }
    }
  };

  const renderHeaderTitle = () => {
    if (activeSector === 'comercial') {
      switch (activeComercialTab) {
        case 'dashboard': return 'Visão Geral do Sistema';
        case 'sales': return 'Sala de Operações: Vendedores';
        case 'campaigns': return 'Regras e Cadência de Disparo';
        case 'devices': return 'Aparelhos Conectados';
        case 'lists': return 'Extrator de Contatos e Listas';
        case 'settings': return 'Segurança e Cadência de Envio';
      }
    } else {
      switch (activeMarketingTab) {
        case 'mkt-dashboard': return 'Visão Geral do Marketing';
        case 'products': return 'Otimizador de Produtos com IA';
        case 'categories': return 'SEO de Categorias';
      }
    }
  };

  return (
    <SettingsProvider>
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
        
        {/* Top Navbar / Sector Selector */}
        <header className="h-14 bg-slate-900 text-white flex items-center px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 mr-10">
            <Zap className="w-6 h-6 text-sky-400 fill-sky-400" />
            <h1 className="text-lg font-bold tracking-tight">123Mart Brain</h1>
          </div>
          
          <nav className="flex space-x-1">
            <SectorTab 
              active={activeSector === 'comercial'} 
              onClick={() => setActiveSector('comercial')}
              icon={<Store className="w-4 h-4" />}
              label="Setor Comercial"
            />
            <SectorTab 
              active={activeSector === 'marketing'} 
              onClick={() => setActiveSector('marketing')}
              icon={<Megaphone className="w-4 h-4" />}
              label="Catálogo & Marketing"
            />
          </nav>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <nav className="flex-1 py-4 px-3 space-y-1">
              
              {activeSector === 'comercial' && (
                <>
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Atendimento & Vendas</div>
                  <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Visão Geral" active={activeComercialTab === 'dashboard'} onClick={() => setActiveComercialTab('dashboard')} />
                  <NavItem icon={<Users className="w-5 h-5" />} label="Sala de Vendas" active={activeComercialTab === 'sales'} onClick={() => setActiveComercialTab('sales')} />
                  <NavItem icon={<Play className="w-5 h-5" />} label="Regras de Disparo" active={activeComercialTab === 'campaigns'} onClick={() => setActiveComercialTab('campaigns')} />
                  <NavItem icon={<Smartphone className="w-5 h-5" />} label="Aparelhos" active={activeComercialTab === 'devices'} onClick={() => setActiveComercialTab('devices')} />
                  <NavItem icon={<ListFilter className="w-5 h-5" />} label="Listas" active={activeComercialTab === 'lists'} onClick={() => setActiveComercialTab('lists')} />
                  <NavItem icon={<Settings className="w-5 h-5" />} label="Configurações" active={activeComercialTab === 'settings'} onClick={() => setActiveComercialTab('settings')} />
                </>
              )}

              {activeSector === 'marketing' && (
                <>
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Otimização & IA</div>
                  <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Visão Geral" active={activeMarketingTab === 'mkt-dashboard'} onClick={() => setActiveMarketingTab('mkt-dashboard')} />
                  <NavItem icon={<Sparkles className="w-5 h-5" />} label="Otimizar Produtos" active={activeMarketingTab === 'products'} onClick={() => setActiveMarketingTab('products')} />
                  <NavItem icon={<Tags className="w-5 h-5" />} label="SEO de Categorias" active={activeMarketingTab === 'categories'} onClick={() => setActiveMarketingTab('categories')} />
                </>
              )}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
              <h2 className="text-xl font-medium tracking-tight text-slate-800">
                {renderHeaderTitle()}
              </h2>
            </header>
            
            <div className="flex-1 overflow-auto p-8">
              <div className="max-w-7xl mx-auto">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SettingsProvider>
  );
}

function SectorTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
        active 
          ? 'bg-slate-800 text-white border-sky-400' 
          : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-sky-50 text-sky-700' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`mr-3 ${active ? 'text-sky-600' : 'text-slate-400'}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}
