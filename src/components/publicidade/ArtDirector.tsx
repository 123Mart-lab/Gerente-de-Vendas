import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AgentWhatsApp from '../chat/AgentWhatsApp';
//, { useState } from 'react';
import { Palette, ImageIcon, Video } from 'lucide-react';
import PhotoProduction from '../marketing/PhotoProduction';
import VideoProduction from '../marketing/VideoProduction';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';

export default function ArtDirector() {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.role === 'art'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs', err);
      }
    };
    fetchLogs();
    
    // Auto refresh
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Palette className="w-6 h-6 text-sky-600" />
          Diretor de Arte e Audiovisual
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Criação e Produção</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Responsável pela concepção visual das campanhas.</li>
            <li>Cria e edita fotos, vídeos e banners de alta conversão para os produtos do catálogo.</li>
            <li><strong>Fluxo de Operação:</strong> Recebe o prompt de comando do Gestor de Projetos. Cria as imagens e vídeos publicitários do anúncio, de acordo com o solicitado.</li>
            <li><strong>Relatórios Entregues:</strong> Salva tudo na Nuvemshop e envia para o Gerente de Projetos o relatório com o resultado final, a melhoria de conversão visual promovida, o que modificou no anúncio e o porquê.</li>
          </ul>

          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>
      
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('photos')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Produção de Fotos
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'videos'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Video className="w-4 h-4" />
            Produção de Vídeos
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'photos' ? <PhotoProduction /> : <VideoProduction />}
      </div>
      <div className="mt-8 border-t border-slate-100 pt-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Comunicação da Equipe</h3>
        <AgentWhatsApp currentAgentId="art" currentAgentName="Diretor de Arte e Áudio" />
      </div>
    </div>
  );
}
