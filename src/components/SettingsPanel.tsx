import React, { useState } from 'react';
import { Shield, Clock, Zap } from 'lucide-react';

export default function SettingsPanel() {
  const [delay, setDelay] = useState(3);
  const [rateLimit, setRateLimit] = useState(15);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delay, rateLimit })
    }).then(() => {
      setTimeout(() => setSaving(false), 800);
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center">
          <Shield className="w-5 h-5 text-indigo-500 mr-3" />
          <h3 className="text-lg font-medium text-slate-800">Proteção Anti-Ban (WhatsApp)</h3>
        </div>
        
        <div className="p-6 space-y-8">
          
          {/* Delay Configuration */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <label className="block text-sm font-semibold text-slate-900">Atraso Simulado de Digitação (Delay)</label>
                <p className="text-sm text-slate-500 mt-1">Tempo que o bot aguarda antes de enviar a resposta, simulando um humano digitando.</p>
              </div>
              <div className="p-2 bg-slate-100 rounded text-slate-500">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-4">
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={delay} 
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-lg font-medium text-slate-700 w-16 text-right">{delay} seg</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Rate Limit Configuration */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <label className="block text-sm font-semibold text-slate-900">Limitação de Disparos em Lote (Rate Limit)</label>
                <p className="text-sm text-slate-500 mt-1">Máximo de mensagens disparadas por minuto para evitar banimento do número.</p>
              </div>
              <div className="p-2 bg-slate-100 rounded text-slate-500">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-4">
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={rateLimit} 
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
              />
              <span className="text-sm font-medium text-slate-600">mensagens por minuto</span>
            </div>
          </div>
          
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações de Segurança'}
          </button>
        </div>
      </div>
    </div>
  );
}
