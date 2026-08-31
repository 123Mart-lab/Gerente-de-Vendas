import React, { useState } from 'react';
import { ShoppingBag, Search } from 'lucide-react';
import GoogleDataConnect from './GoogleDataConnect';
import AgentWhatsApp from '../chat/AgentWhatsApp';

export default function MerchantCenterSpecialist() {
  const [activeTab, setActiveTab] = useState<'info' | 'google'>('info');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-sky-600" />
          Especialista em Merchant Center & Search Console
        </h2>
        
        <div className="border-b border-slate-200 mt-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('google')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'google'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Integrações Google
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'info' && (
            <div className="prose prose-slate max-w-none text-slate-600">
              <p className="font-medium text-slate-700">Mídia, SEO e Performance</p>
              <ul className="space-y-2 mt-4 list-disc pl-5">
                <li>Garante a saúde técnica do catálogo no Google Merchant Center.</li>
                <li>Resolve erros de indexação e gerencia as tags.</li>
                <li>Cuida do feed de dados contínuo dos produtos, redirecionamentos 301, etc.</li>
              </ul>
              
              <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-2">Persona e Configuração da IA</h3>
                <p className="text-sm text-slate-500 italic mb-4">Insira aqui a descrição detalhada da persona e instruções de sistema para este agente...</p>
                <textarea 
                  className="w-full h-32 p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                  placeholder="Ex: Você é um Especialista Técnico focado em Google Merchant Center e infraestrutura de e-commerce..."
                />
              </div>
            </div>
          )}
          
          {activeTab === 'google' && (
            <GoogleDataConnect />
          )}

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Comunicação da Equipe</h3>
            <AgentWhatsApp currentAgentId="merchant" currentAgentName="Especialista Merchant Center" />
          </div>
        </div>
      </div>
    </div>
  );
}
