import Markdown from 'react-markdown';
import React, { useState, useEffect } from 'react';
import { initAuth, googleSignIn, getAccessToken } from '../services/auth';
import { Cloud, Check, FileText, FileDown, CheckCircle2, Circle, X, Download, FileJson, Loader2, Edit2, Save, Trash2 } from 'lucide-react';
import axios from 'axios';

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
  errorWaitingForSku?: boolean;
}

const defaultStepsTemplate: PipelineStep[] = [
  { id: '1', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: false },
  { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
  { id: '3', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: false },
  { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: false },
  { id: '5', role: 'Gerente', actionTitle: 'Briefing PDF', type: 'pdf', isCompleted: false },
  { id: '6', role: 'Gerente', actionTitle: 'Ver prompt Arte', type: 'prompt', isCompleted: false },
  { id: '7', role: 'Diret. Arte', actionTitle: 'Criativos PDF', type: 'pdf', isCompleted: false },
  { id: '8', role: 'Esp. SEO', actionTitle: 'Copy/SEO PDF', type: 'pdf', isCompleted: false },
  { id: '9', role: 'Gerente', actionTitle: 'Notificações', type: 'webhook', isCompleted: false },
];

export default function CEOBriefing() {
  const [selectedPrompt, setSelectedPrompt] = useState<{role: string, content: string} | null>(null);
  const [pipelines, setPipelines] = useState<SkuPipeline[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<{url: string, role: string, sku: string, markdown?: string} | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState(false);
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [editSkuValue, setEditSkuValue] = useState<string>('');
  
  
  const [skuToDelete, setSkuToDelete] = useState<string | null>(null);

  const confirmDelete = async (sku: string) => {
    try {
      await axios.delete(`/api/marketing/sku-briefings/${sku}`);
      setPipelines(prev => prev.filter(p => p.sku !== sku));
      setSkuToDelete(null);
    } catch (e) {
      console.error(e);
      // fallback visual alert
      alert('Erro ao deletar SKU'); 
    }
  };

  const handleDeleteSku = (sku: string) => {
    setSkuToDelete(sku);
  };

  const handleSaveSku = async (oldSku: string) => {
    if (!editSkuValue.trim().toLowerCase().startsWith('123mart')) {
      // In iframe, alert might not block but it's bad UX, we'll just ignore or could use a toast. 
      // For now, let's just reset
      setEditSkuValue('123Mart...');
      return;
    }
    try {
      await axios.post('/api/marketing/rename-sku', { oldSku, newSku: editSkuValue });
      setEditingSkuId(null);
      
      // A UI atualiza automaticamente pelo polling (ou recarregue a página se preferir)
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Erro ao renomear SKU');
    }
  };

  useEffect(() => {
    initAuth(
      () => setNeedsAuth(false),
      () => setNeedsAuth(true)
    );
  }, []);





  const getFolderStrict = async (folderName: string, parentId: string | null, token: string): Promise<string> => {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }
    
    // Para garantir que ele encontre pastas em qualquer lugar (Meu Drive, Compartilhados, etc)
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`;
    
    const searchRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!searchRes.ok) {
       console.error("Drive API Search Error:", await searchRes.text());
       throw new Error(`Erro na API do Google Drive ao buscar a pasta '${folderName}'. Você aceitou as permissões?`);
    }
    
    const searchData = await searchRes.json();
    console.log(`[Drive Search] Folder: ${folderName} -> Result:`, searchData);
    
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id; // Retorna o primeiro match
    }
    
    // Se não encontrou, vamos listar as primeiras 10 pastas para debugar no console
    try {
        const debugRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false")}&fields=files(name)&pageSize=10&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`, { headers: { Authorization: `Bearer ${token}` } });
        const debugData = await debugRes.json();
        console.log(" Pastas visíveis no seu Drive para o Agente:", debugData.files);
    } catch(e){}

    throw new Error(`A pasta '${folderName}' não foi encontrada no seu Google Drive. (Verifique maiúsculas/minúsculas e espaços)`);
  };

  const getOrCreateFolder = async (folderName: string, parentId: string | null, token: string): Promise<string> => {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }
    
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`;
    const searchRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : []
      })
    });
    
    if (!createRes.ok) {
       console.error("Drive API Create Error:", await createRes.text());
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

      // Localiza a hierarquia de pastas existente rigorosamente
      const f1 = await getFolderStrict('123MART.COM.BR', null, token);
      const f2 = await getFolderStrict('Publicidade', f1, token);
      const f3 = await getFolderStrict('Arquivos Gerente 123Mart', f2, token);
      
      // Cria APENAS a pasta do SKU se ela não existir
      const f4 = await getOrCreateFolder(selectedPdf.sku, f3, token);

// Verifica se o arquivo já existe na pasta
      const fileName = `${selectedPdf.role}_${selectedPdf.sku}`;
      const fileQuery = `mimeType='application/vnd.google-apps.document' and name='${fileName}' and '${f4}' in parents and trashed=false`;
      const fileUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fileQuery)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`;
      
      const fileRes = await fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` } });
      const fileData = await fileRes.json();
      
      const metadata = {
        name: fileName,
        mimeType: 'application/vnd.google-apps.document',
        parents: [f4]
      };
      
      const form = new FormData();
      
      let uploadRes;
      
      if (fileData.files && fileData.files.length > 0) {
        // Arquivo já existe, vamos ATUALIZAR (PATCH) o arquivo existente
        const existingFileId = fileData.files[0].id;
        console.log("Arquivo já existe no Drive, atualizando...", existingFileId);
        
        // Para atualizar o arquivo existente, não passamos parents, apenas enviamos a media
        const updateMetadata = { mimeType: 'application/vnd.google-apps.document' };
        form.append('metadata', new Blob([JSON.stringify(updateMetadata)], { type: 'application/json' }));
        form.append('file', pdfBlob);
        
        uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&supportsAllDrives=true`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
      } else {
        // Arquivo não existe, vamos CRIAR (POST)
        console.log("Arquivo não existe no Drive, criando...");
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
        setTimeout(() => setDriveSuccess(false), 3000);
      } else {
        console.error('Drive upload failed', await uploadRes.text());
        alert('Erro ao salvar no Drive.');
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro de autenticação ou upload.');
    } finally {
      setIsSavingToDrive(false);
    }
  };
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (selectedPdf && !isSavingToDrive && !driveSuccess) {
      saveToDrive();
    }
  }, [selectedPdf]);


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

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/marketing/sku-briefings')
        .then(res => res.json())
        .then((data: any) => {
          if (data && data.length > 0) {
            const formattedData = data.map((b: any) => ({
              sku: b.sku,
              startedAt: new Date(b.startedAt || b.updatedAt || Date.now()).toLocaleString('pt-BR'),
              finishedAt: b.finishedAt ? new Date(b.finishedAt).toLocaleString('pt-BR') : undefined,
              steps: b.steps || defaultStepsTemplate.map(s => ({...s, isCompleted: false}))
            }));
            
            setPipelines(formattedData);
          } else {
            setPipelines([]);
          }
        })
        .catch(err => console.error('Erro ao buscar briefings de SKUs', err))
        .finally(() => setLoading(false));
    };

    fetchData(); // Fetch initial data
    const intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const handleActionClick = (step: PipelineStep, sku: string) => {
    if (!step.isCompleted) return;
    
    if (step.type === 'prompt' || step.type === 'webhook') {
      setSelectedPrompt({ role: step.role, content: step.content || 'Conteúdo não disponível' });
    } else if (step.type === 'pdf') {
      // Dynamically construct URL to ignore corrupted 'undefined' strings in older DB records
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          </div>
        ) : pipelines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <h4 className="text-slate-600 font-medium">Nenhum briefing criado ainda</h4>
            <p className="text-slate-400 text-sm mt-1 text-center max-w-md">Solicite ao Gerente de Projetos a orquestração e otimização de um produto para iniciar a esteira de SKUs.</p>
          </div>
        ) : pipelines.map((pipeline) => (
          <div key={pipeline.sku} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Pipeline Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-4 border-b border-slate-200">
              <div className="flex items-center">
                {editingSkuId === pipeline.sku ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={editSkuValue}
                      onChange={(e) => setEditSkuValue(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                      placeholder="Ex: 123Mart001"
                      autoFocus
                    />
                    <button 
                      onClick={() => handleSaveSku(pipeline.sku)}
                      className="bg-emerald-500 text-white p-1.5 rounded hover:bg-emerald-600"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingSkuId(null)}
                      className="bg-slate-300 text-slate-700 p-1.5 rounded hover:bg-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-sky-500 text-white font-semibold px-3 py-1 text-sm rounded-md shadow-sm flex items-center gap-2">
                    Pasta (SKU): {pipeline.sku}
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

      
      {/* PDF Actions Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileDown className="w-5 h-5 text-sky-600" />
                Visualizador de PDF - {selectedPdf.role}_{selectedPdf.sku}.pdf
              </h3>
              <div className="flex items-center gap-4">
                {isSavingToDrive && (
                  <span className="text-sm font-medium text-sky-600 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin"/> Salvando no Drive...</span>
                )}
                {driveSuccess && (
                  <span className="text-sm font-medium text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4"/> Salvo no Drive</span>
                )}
                <button 
                  onClick={() => window.open(selectedPdf.url, '_blank')}
                  className="text-slate-500 hover:text-sky-600 transition-colors flex items-center gap-1 text-sm font-medium bg-white border px-3 py-1.5 rounded-md shadow-sm"
                  title="Baixar Arquivo"
                >
                  <Download className="w-4 h-4" /> Baixar
                </button>
                <button 
                  onClick={() => { setSelectedPdf(null); setDriveSuccess(false); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-100/50">
               
              <div className="p-8 prose prose-slate max-w-none">
                 {selectedPdf.markdown ? (
                   <div className="markdown-body">
                     <Markdown>{selectedPdf.markdown}</Markdown>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Carregando relatório...</div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Prompt Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
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
            <div className="p-6 overflow-y-auto">
              <div 
                className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-sm text-slate-800 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-3 [&>h3:first-child]:mt-0 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>p]:mb-4 [&>strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: selectedPrompt.content }}
              />
              <div className="mt-6 flex justify-end shrink-0">
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


      {/* Delete Confirmation Modal */}
      {skuToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-600 mb-6">Tem certeza que deseja deletar permanentemente a pasta e todos os briefings do SKU <strong>{skuToDelete}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSkuToDelete(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => confirmDelete(skuToDelete)}
                className="px-4 py-2 bg-red-500 text-white font-medium hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
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
