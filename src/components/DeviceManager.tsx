import React, { useState } from 'react';
import { Smartphone, Plus, QrCode, Wifi, Trash2, CheckCircle2, XCircle, RefreshCw, Shield } from 'lucide-react';

type DeviceStatus = 'connected' | 'disconnected' | 'authenticating' | 'warming_up';

interface Device {
  id: string;
  phone: string;
  status: DeviceStatus;
  proxy?: string;
}

export default function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', phone: '5511999999991', status: 'connected', proxy: '192.168.1.10:8080' },
    { id: '2', phone: '5511999999992', status: 'disconnected' }
  ]);

  const [showQrModal, setShowQrModal] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'connected': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'disconnected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'authenticating': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'warming_up': return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusText = (status: DeviceStatus) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'authenticating': return 'Aguardando QR...';
      case 'warming_up': return 'Aquecendo Chip';
    }
  };

  const handleAddDevice = () => {
    setShowQrModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciador de Aparelhos</h2>
          <p className="text-gray-500 mt-1">Conecte e gerencie múltiplos números de WhatsApp simultaneamente.</p>
        </div>
        <button 
          onClick={handleAddDevice}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Conectar Novo Número</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {devices.map((device) => (
          <div key={device.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                  <Smartphone className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">+{device.phone}</h3>
                  <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                    {device.status === 'connected' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {device.status === 'disconnected' && <XCircle className="w-3 h-3 mr-1" />}
                    {device.status === 'authenticating' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                    {getStatusText(device.status)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedDevice(device); setShowProxyModal(true); }}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Configurar Proxy"
                >
                  <Shield className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Remover Aparelho">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Endereço de Proxy</span>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  {device.proxy ? (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-500" />
                      {device.proxy}
                    </>
                  ) : (
                    <span className="text-gray-400 font-normal">Sem proxy configurado</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Última Sincronização</span>
                <span className="text-sm font-medium text-gray-900">Agora mesmo</span>
              </div>
            </div>

            {device.status === 'disconnected' && (
              <button 
                onClick={() => setShowQrModal(true)}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition-colors font-medium text-sm"
              >
                <QrCode className="w-4 h-4" />
                Gerar Novo QR Code
              </button>
            )}
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Escaneie para entrar</h3>
              <p className="text-gray-500 mt-2 text-sm">Abra o WhatsApp no seu celular, toque em Aparelhos Conectados e aponte a câmera para esta tela.</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 flex items-center justify-center mb-6">
              <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3">
                <QrCode className="w-12 h-12 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Aguardando código...</span>
              </div>
            </div>

            <button 
              onClick={() => setShowQrModal(false)}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Proxy Modal */}
      {showProxyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Configurar Proxy Isolado</h3>
              <button onClick={() => setShowProxyModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-500">Configure um proxy dedicado para este número. Isso previne banimentos por cruzamento de IP.</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servidor (Host)</label>
                <input type="text" placeholder="ex: 192.168.1.100" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Porta</label>
                <input type="text" placeholder="ex: 8080" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowProxyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setShowProxyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Salvar Proxy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
