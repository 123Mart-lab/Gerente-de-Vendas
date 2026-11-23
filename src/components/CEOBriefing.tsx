import Markdown from 'react-markdown';
import React, { useState, useEffect } from 'react';
import { initAuth, googleSignIn, getAccessToken } from '../services/auth';
import {
  Cloud, Check, FileText, FileDown, CheckCircle2, Circle, X, Download,
  FileJson, Loader2, Edit2, Save, Trash2, Layers, ShieldCheck, Plus,
  Send, Sparkles, Store, ExternalLink, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import WorkflowManager, { WorkflowStep } from './ceo/WorkflowManager';
import SeoWebhookModal from './ceo/SeoWebhookModal';

export interface PipelineStep {
  id: string;
  role: string;
  actionTitle: string;
  type: 'prompt' | 'pdf' | 'webhook';
  isCompleted: boolean;
  phase?: 'Pesquisa' | 'Criação' | 'Revisão' | 'Aprovação' | 'Salvamento';
  content?: string; // For prompts
  pdfUrl?: string; // For PDFs
  artObligatory?: boolean;
}

export interface SkuPipeline {
  sku: string;
  startedAt: string;
  finishedAt?: string;
  steps: PipelineStep[];
  errorWaitingForSku?: boolean;
  workflowSourceOfTruth?: boolean;
  commercialAlert?: {
    blockedAutoSave?: boolean;
    reason?: string;
    manualOverrideApproved?: boolean;
  } | null;
  generatedSlotsCount?: number;
  approvedSlotsCount?: number;
}

const defaultStepsTemplate: PipelineStep[] = [
  { id: '1', role: 'Gerente', actionTitle: 'Prompt Planner', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
  { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Pesquisa' },
  { id: '3', role: 'Gerente', actionTitle: 'Prompt Monitor', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
  { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Revisão' },
  { id: '5', role: 'Gerente', actionTitle: 'Briefing Mestre PDF', type: 'pdf', isCompleted: true, phase: 'Revisão' },
  { id: '6', role: 'Diret. Arte', actionTitle: 'Plano Visual 8 Slots', type: 'prompt', isCompleted: true, phase: 'Criação', artObligatory: true },
  { id: '7', role: 'Diret. Arte', actionTitle: 'Criativos PDF', type: 'pdf', isCompleted: true, phase: 'Criação', artObligatory: true },
  { id: '8', role: 'Esp. SEO', actionTitle: 'Copy/SEO PDF', type: 'pdf', isCompleted: true, phase: 'Aprovação' },
  { id: '9', role: 'Gerente', actionTitle: 'Notificações', type: 'webhook', isCompleted: true, phase: 'Salvamento' },
];

export default function CEOBriefing() {
  const [selectedPrompt, setSelectedPrompt] = useState<{role: string, content: string} | null>(null);
  const [pipelines, setPipelines] = useState<SkuPipeline[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<{url: string, role: string, sku: string, markdown?: string} | null>(null);
  const [selectedWebhookSku, setSelectedWebhookSku] = useState<string | null>(null);
  const [managingWorkflowSku, setManagingWorkflowSku] = useState<string | null>(null);

  const [needsAuth, setNeedsAuth] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState(false);
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [editSkuValue, setEditSkuValue] = useState<string>('');
  
  const [skuToDelete, setSkuToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal para criar nova pasta de SKU
  const [isAddingNewSku, setIsAddingNewSku] = useState(false);
  const [newSkuInput, setNewSkuInput] = useState('');
  const [newSkuError, setNewSkuError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setActionFeedback({ type, text });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const confirmDelete = async (sku: string) => {
    try {
      await axios.delete(`/api/marketing/sku-briefings/${sku}`);
      setPipelines(prev => prev.filter(p => p.sku !== sku));
      setSkuToDelete(null);
      showFeedback('success', `Pasta do SKU ${sku} removida com sucesso.`);
    } catch (e) {
      console.error(e);
      showFeedback('error', `Erro ao deletar SKU ${sku}.`);
    }
  };

  const handleDeleteSku = (sku: string) => {
    setSkuToDelete(sku);
  };

  const handleSaveSku = async (oldSku: string) => {
    if (!editSkuValue.trim().toLowerCase().startsWith('123mart')) {
      setEditSkuValue('123Mart...');
      return;
    }
    try {
      await axios.post('/api/marketing/rename-sku', { oldSku, newSku: editSkuValue });
      setEditingSkuId(null);
      showFeedback('success', `SKU renomeado para ${editSkuValue} e esteira reiniciada.`);
      fetchData();
    } catch (e) {
      console.error(e);
      showFeedback('error', 'Erro ao renomear SKU.');
    }
  };

  const handleCreateNewSku = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewSkuError(null);
    const clean = newSkuInput.trim();
    if (!clean.toLowerCase().startsWith('123mart')) {
      setNewSkuError('O SKU deve iniciar obrigatoriamente com "123Mart" (ex: 123Mart09168).');
      return;
    }

    try {
      await axios.post('/api/marketing/sku-briefings', {
        sku: clean,
        data: {
          sku: clean,
          startedAt: Date.now(),
          steps: defaultStepsTemplate,
          workflowSourceOfTruth: true
        }
      });
      setIsAddingNewSku(false);
      setNewSkuInput('');
      fetchData();
    } catch (e) {
      console.error('Erro ao criar SKU:', e);
      setNewSkuError('Erro ao registrar novo SKU.');
    }
  };

  const fetchData = () => {
    fetch('/api/marketing/sku-briefings')
      .then(res => res.json())
      .then((data: any) => {
        if (data && data.length > 0) {
          const formattedData = data.map((b: any) => {
            const generatedCount = b.generatedSlots ? Object.keys(b.generatedSlots).length : 0;
            const approvedCount = Array.isArray(b.artApprovals?.approvedSlots)
              ? b.artApprovals.approvedSlots.length
              : 0;
            return {
              sku: b.sku,
              startedAt: new Date(b.startedAt || b.updatedAt || Date.now()).toLocaleString('pt-BR'),
              finishedAt: b.finishedAt ? new Date(b.finishedAt).toLocaleString('pt-BR') : undefined,
              steps: b.steps || defaultStepsTemplate.map(s => ({ ...s, isCompleted: false })),
              workflowSourceOfTruth: b.workflowSourceOfTruth ?? true,
              commercialAlert: b.commercialAlert || null,
              generatedSlotsCount: generatedCount,
              approvedSlotsCount: approvedCount,
            };
          });

          setPipelines(formattedData);
        } else {
          setPipelines([]);
        }
      })
      .catch(err => console.error('Erro ao buscar briefings de SKUs', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    initAuth(
      () => setNeedsAuth(false),
      () => setNeedsAuth(true)
    );
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const getFolderStrict = async (folderName: string, parentId: string | null, token: string): Promise<string> => {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`;
    const searchRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!searchRes.ok) {
       throw new Error(`Erro na API do Google Drive ao buscar a pasta '${folderName}'.`);
    }
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    throw new Error(`A pasta '${folderName}' não foi encontrada no seu Google Drive.`);
  };

  const getOrCreateFolder = async (folderName: string, parentId: string | null, token: string): Promise<string> => {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`;
    const searchRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : [] })
    });
    if (!createRes.ok) {
       throw new Error(`Erro ao criar a pasta '${folderName}'`);
    }
    const createData = await createRes.json();
    return createData.id;
  };

  const saveToDrive = async () => {
    if (!selectedPdf) return;
    setIsSavingToDrive(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        if (result) token = result.accessToken;
        else throw new Error('Auth failed');
      }
      
      if (!selectedPdf.markdown) throw new Error("Aguarde o carregamento do texto.");
      const pdfBlob = new Blob([selectedPdf.markdown], { type: 'text/plain' });

      const f1 = await getFolderStrict('123MART.COM.BR', null, token);
      const f2 = await getFolderStrict('Publicidade', f1, token);
      const f3 = await getFolderStrict('Arquivos Gerente 123Mart', f2, token);
      const f4 = await getOrCreateFolder(selectedPdf.sku, f3, token);

      const fileName = `${selectedPdf.role}_${selectedPdf.sku}`;
      const fileQuery = `mimeType='application/vnd.google-apps.document' and name='${fileName}' and '${f4}' in parents and trashed=false`;
      const fileUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fileQuery)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`;
      
      const fileRes = await fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` } });
      const fileData = await fileRes.json();
      
      const metadata = { name: fileName, mimeType: 'application/vnd.google-apps.document', parents: [f4] };
      const form = new FormData();
      
      let uploadRes;
      if (fileData.files && fileData.files.length > 0) {
        const existingFileId = fileData.files[0].id;
        const updateMetadata = { mimeType: 'application/vnd.google-apps.document' };
        form.append('metadata', new Blob([JSON.stringify(updateMetadata)], { type: 'application/json' }));
        form.append('file', pdfBlob);
        
        uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&supportsAllDrives=true`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
      } else {
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', pdfBlob);
        
        uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
      }

      if (uploadRes.ok) {
        setDriveSuccess(true);
        showFeedback('success', `Relatório salvo no Google Drive (${fileName}).`);
        setTimeout(() => setDriveSuccess(false), 3000);
      } else {
        showFeedback('error', 'Erro ao salvar relatório no Google Drive.');
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', err instanceof Error ? err.message : 'Erro de autenticação ou upload no Drive.');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleDownloadReport = () => {
    if (!selectedPdf?.markdown) return;
    const blob = new Blob([selectedPdf.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedPdf.role}_${selectedPdf.sku}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (selectedPdf && !selectedPdf.markdown) {
      fetch(selectedPdf.url)
        .then(res => res.json())
        .then(data => {
          setSelectedPdf(prev => prev ? { ...prev, markdown: data.markdown } : null);
        })
        .catch(console.error);
    }
  }, [selectedPdf]);

  const handleActionClick = (step: PipelineStep, sku: string) => {
    // Webhook Especialista SEO (Nuvemshop) sempre acessível para revisão / liberação de trava comercial
    if (step.type === 'webhook') {
      setSelectedWebhookSku(sku);
      return;
    }

    if (!step.isCompleted) return;
    
    if (step.type === 'prompt') {
      setSelectedPrompt({ role: step.role, content: step.content || 'Conteúdo não disponível' });
    } else if (step.type === 'pdf') {
      let safeRole = step.role;
      if (safeRole.toLowerCase().includes('planner')) safeRole = 'planner';
      else if (safeRole.toLowerCase().includes('monitor')) safeRole = 'monitor';
      else if (safeRole.toLowerCase().includes('arte')) safeRole = 'arte';
      else if (safeRole.toLowerCase().includes('seo')) safeRole = 'seo';
      else safeRole = 'briefing';

      setSelectedPdf({ url: `/api/marketing/pdf/${safeRole}/${sku}`, role: step.role, sku });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header com Ações Executivas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-900">Briefings de Execução (SKUs)</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Fonte da Verdade Homologada
            </span>
          </div>
          <p className="text-slate-500 text-sm max-w-3xl leading-relaxed">
            Acompanhamento da esteira de produção. Todos os processos são referenciados pelo SKU do produto (CPF). Use o <strong>Gerenciador de Fluxo</strong> para definir a fonte da verdade mandatória para o Diretor de Arte e o Especialista em SEO.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAddingNewSku(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            + Nova Pasta de SKU
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{actionFeedback.text}</span>
          <button onClick={() => setActionFeedback(null)} className="ml-3 font-bold opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Pipelines (SKUs) */}
      <div className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          </div>
        ) : pipelines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <h4 className="text-slate-700 font-bold text-base">Nenhum briefing criado ainda</h4>
            <p className="text-slate-400 text-xs mt-1 text-center max-w-md">
              Clique em "+ Nova Pasta de SKU" para registrar o SKU 123Mart09168 e iniciar a esteira.
            </p>
          </div>
        ) : pipelines.map((pipeline) => {
          const isManagingThisSku = managingWorkflowSku === pipeline.sku;

          return (
            <div 
              key={pipeline.sku} 
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col transition-all"
            >
              
              {/* Pipeline Header */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-slate-50/90 p-4 sm:p-5 border-b border-slate-200 gap-4">
                
                <div className="flex items-center gap-3 flex-wrap">
                  {editingSkuId === pipeline.sku ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={editSkuValue}
                        onChange={(e) => setEditSkuValue(e.target.value)}
                        className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                        placeholder="Ex: 123Mart09168"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveSku(pipeline.sku)}
                        className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingSkuId(null)}
                        className="bg-slate-300 text-slate-700 p-1.5 rounded-lg hover:bg-slate-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-sky-600 text-white font-semibold px-3 py-1.5 text-xs rounded-xl shadow-xs flex items-center gap-2">
                      <span className="font-mono font-bold tracking-wide">
                        Pasta (SKU): {pipeline.sku}
                      </span>
                      <button 
                        onClick={() => { setEditSkuValue(pipeline.sku); setEditingSkuId(pipeline.sku); }}
                        className="hover:text-sky-200 transition-colors ml-1"
                        title="Editar SKU"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSku(pipeline.sku)}
                        className="hover:text-red-300 transition-colors ml-1"
                        title="Deletar Pasta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Botão Gerenciador de Fluxo (Fonte da Verdade) */}
                  <button
                    onClick={() => setManagingWorkflowSku(isManagingThisSku ? null : pipeline.sku)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
                      isManagingThisSku 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                        : 'bg-white hover:bg-slate-100 text-sky-700 border-sky-300'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-500" />
                    {isManagingThisSku ? 'Ocultar Gerenciador' : 'Gerenciador de Fluxo (Fonte da Verdade)'}
                  </button>

                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Fonte da Verdade Ativa
                  </span>

                  {pipeline.commercialAlert?.blockedAutoSave && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Trava Comercial (Revisar Preço/Kit)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <span>Iniciado em {pipeline.startedAt}</span>
                  {pipeline.finishedAt && (
                    <span className="text-emerald-700 font-semibold">• Finalizado em {pipeline.finishedAt}</span>
                  )}
                </div>

              </div>

              {pipeline.commercialAlert?.blockedAutoSave && (
                <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{pipeline.commercialAlert.reason}</span>
                  </div>
                  <button
                    onClick={() => setSelectedWebhookSku(pipeline.sku)}
                    className="shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px]"
                  >
                    Revisar &amp; Publicar Manualmente
                  </button>
                </div>
              )}

              {/* Componente Integrado de Gerenciador de Fluxo (Drag & Drop) */}
              {isManagingThisSku && (
                <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                  <WorkflowManager
                    sku={pipeline.sku}
                    steps={pipeline.steps}
                    onSave={(updatedSteps) => {
                      setPipelines(prev => prev.map(p => p.sku === pipeline.sku ? { ...p, steps: updatedSteps } : p));
                    }}
                    onClose={() => setManagingWorkflowSku(null)}
                  />
                </div>
              )}

              {/* Pipeline Steps (Horizontal Node Stepper - Idêntico ao Print) */}
              <div className="p-6 overflow-x-auto bg-white">
                <div className="flex items-center gap-8 min-w-max pb-3 pt-1">
                  {pipeline.steps.map((step, index) => {
                    const isLast = index === pipeline.steps.length - 1;
                    const isWebhookStep = step.type === 'webhook';

                    return (
                      <div key={step.id + '-' + index} className="flex flex-col items-center relative group">
                        
                        {/* Connection Line */}
                        {!isLast && (
                          <div 
                            className={`absolute top-6 left-1/2 w-full h-[2px] transition-colors ${
                              step.isCompleted && pipeline.steps[index + 1]?.isCompleted 
                                ? 'bg-emerald-500' 
                                : 'bg-slate-200'
                            }`} 
                            style={{ width: 'calc(100% + 2rem)' }} 
                          />
                        )}

                        {/* Icon Box */}
                        <button
                          onClick={() => handleActionClick(step, pipeline.sku)}
                          disabled={!step.isCompleted && !isWebhookStep}
                          className={`relative z-10 w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all bg-white shadow-2xs
                            ${step.isCompleted
                              ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:shadow-md cursor-pointer'
                              : isWebhookStep
                                ? 'border-amber-400 text-amber-600 hover:bg-amber-50 hover:shadow-md cursor-pointer'
                                : 'border-slate-200 text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed'
                            }
                          `}
                          title={`${step.role}: ${step.actionTitle} (Clique para auditar)`}
                        >
                          {step.type === 'pdf' ? <FileDown className="w-6 h-6" /> :
                           step.type === 'webhook' ? <FileJson className="w-6 h-6" /> :
                           <FileText className="w-6 h-6" />}

                          {/* Status Dot */}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white
                            ${step.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                          </div>
                        </button>

                        {/* Labels */}
                        <div className="mt-3 text-center">
                          <p className="text-sm font-bold text-slate-800 tracking-tight">
                            {step.role}
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            step.isCompleted
                              ? 'text-emerald-600 font-medium'
                              : isWebhookStep
                                ? 'text-amber-600 font-semibold'
                                : 'text-slate-400 font-medium'
                          }`}>
                            {step.type === 'prompt'
                              ? 'Ver prompt'
                              : step.type === 'webhook'
                              ? (step.isCompleted ? 'Webhooks' : 'Pendente revisão')
                              : 'Entregue'}
                          </p>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Barra Inferior de Ação Rápida: Webhook do Especialista em SEO */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Diretor de Arte:{' '}
                  <strong>
                    {pipeline.generatedSlotsCount ?? 0}/8 slots gerados • {pipeline.approvedSlotsCount ?? 0}/8 aprovados
                  </strong>
                </span>

                <button
                  onClick={() => setSelectedWebhookSku(pipeline.sku)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 bg-white border border-sky-200 hover:border-sky-300 px-3 py-1 rounded-lg shadow-2xs transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  Abrir Webhook Especialista SEO (Nuvemshop) &rarr;
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL 1: ESPECIALISTA EM SEO WEBHOOK & NUVEMSHOP SALVAMENTO */}
      {selectedWebhookSku && (
        <SeoWebhookModal
          sku={selectedWebhookSku}
          onClose={() => setSelectedWebhookSku(null)}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}

      {/* MODAL 2: PDF Actions Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileDown className="w-5 h-5 text-sky-600" />
                Visualizador de Relatório — {selectedPdf.role}_{selectedPdf.sku}.pdf
              </h3>
              <div className="flex items-center gap-2">
                {driveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mr-1">
                    <Check className="w-3.5 h-3.5" /> Salvo no Drive
                  </span>
                )}
                <button
                  onClick={saveToDrive}
                  disabled={!selectedPdf.markdown || isSavingToDrive}
                  className="text-sky-700 hover:text-sky-900 disabled:opacity-40 transition-colors flex items-center gap-1 text-xs font-bold bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg shadow-2xs"
                  title="Salvar este relatório na pasta do SKU no Google Drive"
                >
                  {isSavingToDrive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  {isSavingToDrive ? 'Salvando...' : 'Salvar no Drive'}
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={!selectedPdf.markdown}
                  className="text-slate-600 hover:text-sky-600 disabled:opacity-40 transition-colors flex items-center gap-1 text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs"
                  title="Baixar Relatório (.md)"
                >
                  <Download className="w-4 h-4" /> Baixar Relatório
                </button>
                <button
                  onClick={() => { setSelectedPdf(null); setDriveSuccess(false); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-50/50 overflow-y-auto p-6 md:p-8">
              {selectedPdf.markdown ? (
                <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed">
                  <Markdown>{selectedPdf.markdown}</Markdown>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                  Carregando relatório do agente...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Prompt Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
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
            <div className="p-6 overflow-y-auto">
              <div 
                className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-800 leading-relaxed space-y-3 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-slate-900 [&>ul]:list-disc [&>ul]:ml-5 [&>ol]:list-decimal [&>ol]:ml-5"
                dangerouslySetInnerHTML={{ __html: selectedPrompt.content }}
              />
              <div className="mt-6 flex justify-end shrink-0">
                <button 
                  onClick={() => setSelectedPrompt(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Fechar Auditoria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Adicionar Novo SKU Modal */}
      {isAddingNewSku && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-600" />
                Criar Nova Pasta de SKU (CEO)
              </h3>
              <button onClick={() => setIsAddingNewSku(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSku} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Código do SKU (Mandatório iniciar com 123Mart):
                </label>
                <input
                  type="text"
                  value={newSkuInput}
                  onChange={(e) => setNewSkuInput(e.target.value)}
                  placeholder="Ex: 123Mart09168"
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
                {newSkuError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{newSkuError}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                A nova pasta será configurada com a Fonte da Verdade de 9 passos padrão da 123Mart.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNewSku(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Confirmation Modal */}
      {skuToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confirmar Exclusão</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Tem certeza que deseja deletar permanentemente a pasta e todos os briefings do SKU <strong>{skuToDelete}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setSkuToDelete(null)}
                className="px-4 py-2 text-slate-600 text-xs font-semibold hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button 
                onClick={() => confirmDelete(skuToDelete)}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Deletar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
