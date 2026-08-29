import React, { useState } from 'react';
import { LayoutDashboard, Users, Zap, Settings, Play, Smartphone, ListFilter, Sparkles, Tags, Megaphone, Store, Mail, Share2, Target, Image as ImageIcon, Video, Menu, X } from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import SalesRoom from './components/SalesRoom';
import CampaignManager from './components/CampaignManager';
import SettingsPanel from './components/SettingsPanel';
import DeviceManager from './components/DeviceManager';
import ListManager from './components/ListManager';
import MarketingDashboard from './components/marketing/MarketingDashboard';
import ProductOptimizer from './components/marketing/ProductOptimizer';
import CategorySEO from './components/marketing/CategorySEO';
import EmailMarketing from './components/marketing/EmailMarketing';
import SocialMedia from './components/marketing/SocialMedia';
import AdsManager from './components/marketing/AdsManager';
import PhotoProduction from './components/marketing/PhotoProduction';
import VideoProduction from './components/marketing/VideoProduction';
import { SettingsProvider } from './contexts/SettingsContext';

type SectorType = 'comercial' | 'marketing';
type ComercialTabType = 'dashboard' | 'sales' | 'campaigns' | 'devices' | 'lists' | 'settings';
type MarketingTabType = 'mkt-dashboard' | 'products' | 'categories' | 'email-marketing' | 'social-media' | 'facebook-ads' | 'photos' | 'videos';

export default function App() {
  const [activeSector, setActiveSector] = useState<SectorType>('comercial');
  const [activeComercialTab, setActiveComercialTab] = useState<ComercialTabType>('dashboard');
  const [activeMarketingTab, setActiveMarketingTab] = useState<MarketingTabType>('mkt-dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (type: 'comercial' | 'marketing', tab: any) => {
    if (type === 'comercial') setActiveComercialTab(tab);
    else setActiveMarketingTab(tab);
    setIsMobileMenuOpen(false);
  };

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
        case 'email-marketing': return <EmailMarketing />;
        case 'social-media': return <SocialMedia />;
        case 'facebook-ads': return <AdsManager />;
        case 'photos': return <PhotoProduction />;
        case 'videos': return <VideoProduction />;
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
        case 'products': return 'SEO de Produtos';
        case 'categories': return 'SEO de Categorias';
        case 'email-marketing': return 'Email Marketing & CRM';
        case 'social-media': return 'Gestão de Redes Sociais';
        case 'facebook-ads': return 'Tráfego Pago e Ads';
        case 'photos': return 'Produção de Fotos (IA)';
        case 'videos': return 'Produção de Vídeos (IA)';
      }
    }
  };

  return (
    <SettingsProvider>
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
        
        {/* Top Navbar / Sector Selector */}
        <header className="h-14 bg-slate-900 text-white flex items-center px-4 md:px-6 shrink-0 z-50 shadow-sm relative">
          <button 
            className="md:hidden mr-4 text-slate-300 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-2 mr-4 md:mr-10">
            <Zap className="w-6 h-6 text-sky-400 fill-sky-400 shrink-0" />
            <h1 className="text-lg font-bold tracking-tight hidden sm:block whitespace-nowrap">123Mart Brain</h1>
          </div>
          
          <nav className="flex space-x-1 overflow-x-auto overflow-y-hidden no-scrollbar h-full pt-1">
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

        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile Sidebar Overlay */}
          <div 
            className={`fixed inset-0 bg-slate-900/50 z-30 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <aside 
            className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:pt-0 ${
              isMobileMenuOpen ? 'translate-x-0 pt-14' : '-translate-x-full'
            }`}
          >
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              
              {activeSector === 'comercial' && (
                <>
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2 md:mt-0">Atendimento & Vendas</div>
                  <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Visão Geral" active={activeComercialTab === 'dashboard'} onClick={() => handleTabChange('comercial', 'dashboard')} />
                  <NavItem icon={<Users className="w-5 h-5" />} label="Sala de Vendas" active={activeComercialTab === 'sales'} onClick={() => handleTabChange('comercial', 'sales')} />
                  <NavItem icon={<Play className="w-5 h-5" />} label="Regras de Disparo" active={activeComercialTab === 'campaigns'} onClick={() => handleTabChange('comercial', 'campaigns')} />
                  <NavItem icon={<Smartphone className="w-5 h-5" />} label="Aparelhos" active={activeComercialTab === 'devices'} onClick={() => handleTabChange('comercial', 'devices')} />
                  <NavItem icon={<ListFilter className="w-5 h-5" />} label="Listas" active={activeComercialTab === 'lists'} onClick={() => handleTabChange('comercial', 'lists')} />
                  <NavItem icon={<Settings className="w-5 h-5" />} label="Configurações" active={activeComercialTab === 'settings'} onClick={() => handleTabChange('comercial', 'settings')} />
                </>
              )}

              {activeSector === 'marketing' && (
                <>
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2 md:mt-0">Otimização & IA</div>
                  <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Visão Geral" active={activeMarketingTab === 'mkt-dashboard'} onClick={() => handleTabChange('marketing', 'mkt-dashboard')} />
                  <NavItem icon={<Sparkles className="w-5 h-5" />} label="SEO de Produtos" active={activeMarketingTab === 'products'} onClick={() => handleTabChange('marketing', 'products')} />
                  <NavItem icon={<Tags className="w-5 h-5" />} label="SEO de Categorias" active={activeMarketingTab === 'categories'} onClick={() => handleTabChange('marketing', 'categories')} />
                  
                  <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estúdio Criativo</div>
                  <NavItem icon={<ImageIcon className="w-5 h-5" />} label="Produção de Fotos" active={activeMarketingTab === 'photos'} onClick={() => handleTabChange('marketing', 'photos')} />
                  <NavItem icon={<Video className="w-5 h-5" />} label="Produção de Vídeos" active={activeMarketingTab === 'videos'} onClick={() => handleTabChange('marketing', 'videos')} />
                  
                  <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Automação 360º</div>
                  <NavItem icon={<Mail className="w-5 h-5" />} label="Email Marketing" active={activeMarketingTab === 'email-marketing'} onClick={() => handleTabChange('marketing', 'email-marketing')} />
                  <NavItem icon={<Share2 className="w-5 h-5" />} label="Redes Sociais" active={activeMarketingTab === 'social-media'} onClick={() => handleTabChange('marketing', 'social-media')} />
                  <NavItem icon={<Target className="w-5 h-5" />} label="Tráfego Pago (Ads)" active={activeMarketingTab === 'facebook-ads'} onClick={() => handleTabChange('marketing', 'facebook-ads')} />
                </>
              )}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden w-full">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 shrink-0">
              <h2 className="text-lg md:text-xl font-medium tracking-tight text-slate-800 line-clamp-1">
                {renderHeaderTitle()}
              </h2>
            </header>
            
            <div className="flex-1 overflow-auto p-4 md:p-8">
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
      className={`flex items-center px-3 md:px-4 py-2.5 rounded-t-lg text-xs md:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
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
