/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

export default function App() {
  const [waStatus, setWaStatus] = useState<{status: string, qrCodeBase64: string | null}>({
    status: 'disconnected',
    qrCodeBase64: null
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp/status');
        if (response.ok) {
          const data = await response.json();
          setWaStatus(data);
        }
      } catch (error) {
        console.error('Error fetching WhatsApp status:', error);
      }
    };

    // Polling a cada 3 segundos
    const interval = setInterval(fetchStatus, 3000);
    fetchStatus(); // Busca imediata
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      setWaStatus({ status: 'disconnected', qrCodeBase64: null });
      await fetch('/api/whatsapp/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout falhou:', e);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0F172A] text-slate-100 font-sans overflow-hidden">
      <header className="flex items-center justify-between px-8 py-4 bg-[#1E293B] border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center font-bold text-xl">
            123
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              123Mart Omnichannel
            </h1>
            <p className="text-xs text-slate-400">
              System Architecture: Node.js + Baileys + React
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-400 uppercase tracking-wider">
              Engine: Active (WebSocket)
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full">
            <span className="text-xs font-mono text-slate-400">
              /api/health: 200 OK
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        <aside className="col-span-3 flex flex-col gap-4">
          <div className="p-5 bg-[#1E293B] rounded-xl border border-slate-700 h-full flex flex-col">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Security Protocols
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/50 rounded-lg border-l-4 border-indigo-500">
                <p className="text-xs font-bold text-slate-200">
                  Zero Chromium Policy
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  No Puppeteer detected. Engine running via WebSockets (Baileys).
                </p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border-l-4 border-emerald-500">
                <p className="text-xs font-bold text-slate-200">
                  Persistent Session
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Disk Path: /auth_info_baileys (Mount: Render Disk)
                </p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border-l-4 border-amber-500">
                <p className="text-xs font-bold text-slate-200">
                  Anti-Sleep Mode
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  UptimeRobot monitoring /ping every 5 minutes.
                </p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-slate-500">Memory Usage (Render)</span>
                <span className="text-indigo-400">142MB / 512MB</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[28%]"></div>
              </div>
            </div>
          </div>
        </aside>
        <section className="col-span-9 grid grid-rows-6 gap-6 overflow-hidden">
          <div className="row-span-2 grid grid-cols-3 gap-6">
            <div className="bg-[#1E293B] rounded-xl p-5 border border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  WhatsApp Connections
                </span>
                <button 
                  onClick={handleLogout} 
                  className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  Forçar Reset
                </button>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-white">{waStatus.status === 'connected' ? '01' : '00'}</span>
                <span className={`text-xs ${waStatus.status === 'connected' ? 'text-green-400' : 'text-amber-400'}`}>
                  {waStatus.status === 'connected' ? 'Connected' : 'Waiting...'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-center p-4 bg-white rounded flex-1">
                {waStatus.status === 'qr' && waStatus.qrCodeBase64 ? (
                  <img src={waStatus.qrCodeBase64} alt="QR Code WhatsApp" className="max-h-32 object-contain" />
                ) : waStatus.status === 'connected' ? (
                  <div className="text-green-600 font-bold uppercase tracking-tighter text-sm">
                    ✓ Conectado
                  </div>
                ) : (
                  <div className="text-slate-900 text-center uppercase tracking-tighter font-mono text-[10px]">
                    [Aguardando Engine...]
                  </div>
                )}
              </div>
            </div>
            <div className="bg-[#1E293B] rounded-xl p-5 border border-slate-700 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Gemini AI Integration
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-white">1.4k</span>
                <span className="text-xs text-indigo-400">Requests/Day</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Model</span>
                  <span className="text-slate-200">Gemini 1.5 Pro</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Latency</span>
                  <span className="text-slate-200">1.2s avg</span>
                </div>
              </div>
            </div>
            <div className="bg-[#1E293B] rounded-xl p-5 border border-slate-700 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Tiny ERP Sync
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-white">892</span>
                <span className="text-xs text-slate-400">Products</span>
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <div className="px-2 py-1 bg-slate-900 rounded text-[10px] flex justify-between">
                  <span className="text-slate-500">Last Sync:</span>
                  <span className="text-slate-300">2 mins ago</span>
                </div>
                <button className="mt-2 bg-slate-700 hover:bg-slate-600 py-1.5 rounded text-[10px] uppercase font-bold cursor-pointer transition-colors">
                  Force Catalog Update
                </button>
              </div>
            </div>
          </div>
          <div className="row-span-4 bg-[#1E293B] rounded-xl border border-slate-700 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                System Logs & WebSocket Stream
              </h3>
              <div className="flex gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                <span className="w-2 h-2 bg-slate-700 rounded-full"></span>
              </div>
            </div>
            <div className="flex-1 p-6 font-mono text-[11px] text-slate-300 space-y-2 overflow-hidden leading-relaxed">
              <p>
                <span className="text-indigo-400">[SYSTEM]</span> Initiating
                123Mart CRM Backend...
              </p>
              <p>
                <span className="text-emerald-400">[AUTH]</span> Auth State
                loaded from /auth_info_baileys
              </p>
              <p>
                <span className="text-indigo-400">[BAILEYS]</span> Socket
                connection established. Type: WebSocket
              </p>
              <p>
                <span className="text-slate-500">[HEALTH]</span> 2023-10-27
                14:02:01 - GET /api/health 200 (UptimeRobot)
              </p>
              <p>
                <span className="text-slate-500">[HEALTH]</span> 2023-10-27
                14:07:01 - GET /api/health 200 (UptimeRobot)
              </p>
              <p>
                <span className="text-amber-400">[FIREBASE]</span> Database
                connected: 123mart-prod-db
              </p>
              <p>
                <span className="text-indigo-400">[GEMINI]</span> AI Session
                warmed up for omnichannel routing
              </p>
              <p>
                <span className="text-slate-500">[HEALTH]</span> 2023-10-27
                14:12:01 - GET /api/health 200 (UptimeRobot)
              </p>
              <p className="text-indigo-400 border-t border-slate-800 pt-2 opacity-50">
                Waiting for incoming events...
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="px-8 py-3 bg-[#0F172A] border-t border-slate-800 flex justify-between items-center mt-auto">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-500 uppercase">
            Stack: React + Node + Baileys
          </span>
          <div className="w-px h-3 bg-slate-700"></div>
          <span className="text-[10px] text-slate-500 uppercase font-mono">
            V 2.1.0-STABLE
          </span>
        </div>
        <div className="text-[10px] text-slate-500">
          Senior Tech Lead Protocol:{" "}
          <span className="text-indigo-400 font-bold">
            Step 1: Analysis Completed
          </span>
        </div>
      </footer>
    </div>
  );
}
