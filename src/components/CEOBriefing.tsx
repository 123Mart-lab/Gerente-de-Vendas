import React, { useState } from 'react';
import { FileText, FileDown, CheckCircle2, Circle, X, Download, FileJson } from 'lucide-react';

interface PipelineStep {
  id: string;
  role: string;
  actionTitle: string;
  type: 'prompt' | 'pdf' | 'webhook';
  isCompleted: boolean;
  content?: string; // For prompts
  pdfUrl?: string; // For PDFs
}

interface SkuPipeline {
  sku: string;
  startedAt: string;
  finishedAt?: string;
  steps: PipelineStep[];
}

// Mock Data based on the user's diagram
const mockPipelines: SkuPipeline[] = [
  {
    sku: '123Mart09015',
    startedAt: '31/08/2026 18:32',
    finishedAt: '31/08/2026 18:32',
    steps: [
      { id: '1', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, content: 'Prompt enviado ao Planner solicitando análise profunda de mercado e persona para o SKU 123Mart09015.' },
      { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, pdfUrl: '/api/marketing/pdf/planner/123Mart09015' },
      { id: '3', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, content: 'Prompt enviado ao Monitor para levantar preços e ofertas dos 5 principais concorrentes do SKU 123Mart09015.' },
      { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, pdfUrl: '/api/marketing/pdf/monitor/123Mart09015' },
      { id: '5', role: 'Gerente', actionTitle: 'Briefing PDF', type: 'pdf', isCompleted: true, pdfUrl: '/api/marketing/pdf/briefing/123Mart09015' },
      { id: '6', role: 'Gerente', actionTitle: 'Ver prompt Arte', type: 'prompt', isCompleted: true, content: 'Prompt enviado ao Diretor de Arte solicitando pacote de criativos com base no Briefing.' },
      { id: '7', role: 'Diret. Arte', actionTitle: 'Criativos PDF', type: 'pdf', isCompleted: true, pdfUrl: '/api/marketing/pdf/arte/123Mart09015' },
      { id: '8', role: 'Esp. SEO', actionTitle: 'Copy/SEO PDF', type: 'pdf', isCompleted: true, pdfUrl: '/api/marketing/pdf/seo/123Mart09015' },
      { id: '9', role: 'Gerente', actionTitle: 'Notificações', type: 'webhook', isCompleted: true, content: 'Webhooks enviados para: Redator, Especialista Ads, Especialista Merchant e Analista de Métricas informando disponibilidade do material.' },
    ]
  },
  {
    sku: '123Mart09016',
    startedAt: '31/08/2026 19:00',
    steps: [
      { id: '1', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, content: 'Prompt enviado ao Planner...' },
      { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, pdfUrl: '/api/marketing/pdf/planner/123Mart09016' },
      { id: '3', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, content: 'Prompt para monitor...' },
      { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
      { id: '5', role: 'Gerente', actionTitle: 'Briefing PDF', type: 'pdf', isCompleted: false },
      { id: '6', role: 'Gerente', actionTitle: 'Ver prompt Arte', type: 'prompt', isCompleted: false },
      { id: '7', role: 'Diret. Arte', actionTitle: 'Criativos PDF', type: 'pdf', isCompleted: false },
      { id: '8', role: 'Esp. SEO', actionTitle: 'Copy/SEO PDF', type: 'pdf', isCompleted: false },
      { id: '9', role: 'Gerente', actionTitle: 'Notificações', type: 'webhook', isCompleted: false },
    ]
  }
];

export default function CEOBriefing() {
  const [selectedPrompt, setSelectedPrompt] = useState<{role: string, content: string} | null>(null);

  const handleActionClick = (step: PipelineStep, sku: string) => {
    if (!step.isCompleted) return;
    
    if (step.type === 'prompt' || step.type === 'webhook') {
      setSelectedPrompt({ role: step.role, content: step.content || 'Conteúdo não disponível' });
    } else if (step.type === 'pdf') {
      if (step.pdfUrl) {
        // Trigger download/view of PDF
        window.open(step.pdfUrl, '_blank');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-medium text-slate-800">Briefings de Execução (SKUs)</h3>
        </div>
        <p className="text-slate-500 text-sm">
          Acompanhamento da esteira de produção. Todos os processos são referenciados pelo SKU do produto (CPF).
        </p>
      </div>

      {/* Pipelines */}
      <div className="space-y-4">
        {mockPipelines.map((pipeline) => (
          <div key={pipeline.sku} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Pipeline Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-4 border-b border-slate-200">
              <div className="flex items-center">
                <div className="bg-sky-500 text-white font-semibold px-3 py-1 text-sm rounded-md shadow-sm">
                  Pasta (SKU): {pipeline.sku}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 sm:mt-0 text-sm font-medium text-slate-600">
                <span>Iniciado em {pipeline.startedAt}</span>
                {pipeline.finishedAt && (
                  <span>Finalizado em {pipeline.finishedAt}</span>
                )}
              </div>
            </div>

            {/* Pipeline Steps (Horizontal Scroll) */}
            <div className="p-6 overflow-x-auto">
              <div className="flex items-center gap-8 min-w-max pb-4">
                {pipeline.steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center relative group">
                    
                    {/* Connection Line */}
                    {index < pipeline.steps.length - 1 && (
                      <div className={`absolute top-6 left-1/2 w-full h-[2px] ${step.isCompleted && pipeline.steps[index + 1].isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} style={{ width: 'calc(100% + 2rem)' }} />
                    )}

                    {/* Icon Box */}
                    <button 
                      onClick={() => handleActionClick(step, pipeline.sku)}
                      disabled={!step.isCompleted}
                      className={`relative z-10 w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all bg-white
                        ${step.isCompleted 
                          ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:shadow-md cursor-pointer' 
                          : 'border-slate-200 text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed'
                        }
                      `}
                      title={step.actionTitle}
                    >
                      {step.type === 'pdf' ? <FileDown className="w-6 h-6" /> : 
                       step.type === 'webhook' ? <FileJson className="w-6 h-6" /> : 
                       <FileText className="w-6 h-6" />}
                      
                      {/* Status Dot */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white
                        ${step.isCompleted ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      </div>
                    </button>
                    
                    {/* Labels */}
                    <div className="mt-3 text-center">
                      <p className="text-sm font-bold text-slate-800">{step.role}</p>
                      <p className={`text-xs mt-0.5 ${step.isCompleted ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        {step.type === 'prompt' ? 'Ver prompt' : step.type === 'webhook' ? 'Webhooks' : 'Entregue'}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Prompt Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                Auditoria de Prompt ({selectedPrompt.role})
              </h3>
              <button 
                onClick={() => setSelectedPrompt(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap">
                {selectedPrompt.content}
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setSelectedPrompt(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Fechar Auditoria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
