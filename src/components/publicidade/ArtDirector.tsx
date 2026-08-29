import React, { useState } from 'react';
import { Palette, ImageIcon, Video } from 'lucide-react';
import PhotoProduction from '../marketing/PhotoProduction';
import VideoProduction from '../marketing/VideoProduction';

export default function ArtDirector() {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

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
          </ul>
          
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Persona e Configuração da IA</h3>
            <p className="text-sm text-slate-500 italic mb-4">Insira aqui a descrição detalhada da persona e instruções de sistema para este agente...</p>
            <textarea 
              className="w-full h-32 p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              placeholder="Ex: Você é um Diretor de Arte Sênior especializado em conversão visual..."
            />
          </div>
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
    </div>
  );
}
