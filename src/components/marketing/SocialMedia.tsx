import React from 'react';
import { Share2, Sparkles, Camera } from 'lucide-react';

export default function SocialMedia() {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Redes Sociais</h2>
          <p className="text-sm text-slate-500">Criação de posts, cronogramas e copies magnéticas.</p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Módulo em Desenvolvimento</h3>
        <p className="text-slate-500 text-sm mb-6">
          O Agente de Social Media está sendo integrado para agendar posts automaticamente e interagir com comentários.
        </p>
        <button className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-100 transition-colors">
          <Camera className="w-4 h-4" />
          Avisar quando lançar
        </button>
      </div>
    </div>
  );
}
