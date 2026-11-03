import React, { useState } from 'react';
import { 
  GripVertical, Plus, Trash2, ArrowUp, ArrowDown, ShieldCheck, 
  Check, Save, Sparkles, Layers, RotateCcw, AlertTriangle, FileText, 
  FileDown, FileJson, Store, X, Info
} from 'lucide-react';
import axios from 'axios';

export type WorkflowPhase = 'Pesquisa' | 'Criação' | 'Revisão' | 'Aprovação' | 'Salvamento';

export interface WorkflowStep {
  id: string;
  role: string;
  actionTitle: string;
  type: 'prompt' | 'pdf' | 'webhook';
  isCompleted: boolean;
  phase?: WorkflowPhase;
  content?: string;
  pdfUrl?: string;
  artObligatory?: boolean;
}

interface WorkflowManagerProps {
  sku: string;
  steps: WorkflowStep[];
  onSave: (updatedSteps: WorkflowStep[]) => void;
  onClose?: () => void;
}

const AVAILABLE_ROLES = [
  'Gerente',
  'Planner',
  'Monitor',
  'Redator',
  'Diret. Arte',
  'Esp. SEO',
  'Especialista Merchant'
];

const PHASE_COLORS: Record<WorkflowPhase, { bg: string; text: string; border: string }> = {
  'Pesquisa': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Criação': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Revisão': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Aprovação': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Salvamento': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
};

export default function WorkflowManager({ sku, steps: initialSteps, onSave, onClose }: WorkflowManagerProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(() => {
    return initialSteps.map((s, idx) => ({
      ...s,
      phase: s.phase || (
        idx <= 2 ? 'Pesquisa' :
        idx <= 4 ? 'Revisão' :
        idx <= 6 ? 'Criação' :
        idx === 7 ? 'Aprovação' : 'Salvamento'
      ),
      artObligatory: s.artObligatory ?? (s.role.toLowerCase().includes('arte') || s.actionTitle.toLowerCase().includes('arte'))
    }));
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updated = [...steps];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);
    
    setSteps(updated);
    setDraggedIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...steps];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSteps(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const updated = [...steps];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSteps(updated);
  };

  const handleUpdateStep = (index: number, field: keyof WorkflowStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleAddStep = () => {
    const newId = (steps.length + 1).toString();
    const newStep: WorkflowStep = {
      id: newId,
      role: 'Gerente',
      actionTitle: 'Novo Passo de Validação',
      type: 'prompt',
      isCompleted: false,
      phase: 'Revisão',
      artObligatory: false
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      alert('O fluxo deve conter pelo menos 1 passo.');
      return;
    }
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
  };

  const handleResetToStandard = () => {
    const standard: WorkflowStep[] = [
      { id: '1', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
      { id: '2', role: 'Planner', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Pesquisa' },
      { id: '3', role: 'Gerente', actionTitle: 'Ver prompt', type: 'prompt', isCompleted: true, phase: 'Pesquisa' },
      { id: '4', role: 'Monitor', actionTitle: 'Relatório PDF', type: 'pdf', isCompleted: true, phase: 'Revisão' },
      { id: '5', role: 'Gerente', actionTitle: 'Briefing PDF', type: 'pdf', isCompleted: true, phase: 'Revisão' },
      { id: '6', role: 'Gerente', actionTitle: 'Ver prompt Arte', type: 'prompt', isCompleted: true, phase: 'Criação', artObligatory: true },
      { id: '7', role: 'Diret. Arte', actionTitle: 'Criativos PDF', type: 'pdf', isCompleted: true, phase: 'Criação', artObligatory: true },
      { id: '8', role: 'Esp. SEO', actionTitle: 'Copy/SEO PDF', type: 'pdf', isCompleted: true, phase: 'Aprovação' },
      { id: '9', role: 'Gerente', actionTitle: 'Notificações', type: 'webhook', isCompleted: true, phase: 'Salvamento' },
    ];
    setSteps(standard);
  };

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/marketing/sku-briefings', {
        sku,
        data: {
          sku,
          steps,
          workflowSourceOfTruth: true,
          updatedAt: Date.now()
        }
      });
      setSaveSuccess(true);
      onSave(steps);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Erro ao salvar fluxo:', e);
      alert('Erro ao salvar o fluxo de trabalho.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/5 border-2 border-sky-500/40 rounded-2xl p-6 space-y-6 my-4 shadow-sm animate-in fade-in duration-200">
      
      {/* Top Banner: Fonte da Verdade */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 text-white p-5 rounded-xl border border-sky-400/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-sky-300">
              Gerenciador de Fluxo de Trabalho (CEO)
            </span>
          </div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Fonte da Verdade Mandatória: SKU {sku}
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Defina, ordene e configure a sequência oficial das etapas. O <strong>Diretor de Arte</strong> e os demais agentes devem seguir rigorosamente esta ordem antes da publicação final pelo <strong>Especialista em SEO</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetToStandard}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Restaurar passos padrão da 123Mart"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Template Padrão
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
              title="Fechar editor"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Legenda das Fases do Fluxo */}
      <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
        <span className="text-slate-500 mr-1 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" /> Fases Corporativas:
        </span>
        {(['Pesquisa', 'Criação', 'Revisão', 'Aprovação', 'Salvamento'] as WorkflowPhase[]).map(phase => {
          const colors = PHASE_COLORS[phase];
          return (
            <span 
              key={phase}
              className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {phase}
            </span>
          );
        })}
      </div>

      {/* Lista de Passos Reordenáveis (Drag & Drop) */}
      <div className="space-y-2.5">
        {steps.map((step, index) => {
          const phase = step.phase || 'Revisão';
          const colors = PHASE_COLORS[phase];
          const isDragging = draggedIndex === index;

          return (
            <div
              key={step.id + '-' + index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`p-3.5 rounded-xl border bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                isDragging 
                  ? 'opacity-40 border-dashed border-sky-500 bg-sky-50 scale-98' 
                  : 'border-slate-200 shadow-2xs hover:border-sky-300'
              }`}
            >
              {/* Handle e Ordem */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-1"
                  title="Arrastar e soltar para reordenar"
                >
                  <GripVertical className="w-4 h-4" />
                </button>

                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </div>

                {/* Seletor de Fase */}
                <select
                  value={phase}
                  onChange={(e) => handleUpdateStep(index, 'phase', e.target.value as WorkflowPhase)}
                  className={`text-[11px] font-bold px-2 py-1 rounded-md border ${colors.bg} ${colors.text} ${colors.border} focus:outline-none cursor-pointer`}
                >
                  <option value="Pesquisa">Pesquisa</option>
                  <option value="Criação">Criação</option>
                  <option value="Revisão">Revisão</option>
                  <option value="Aprovação">Aprovação</option>
                  <option value="Salvamento">Salvamento (Nuvemshop)</option>
                </select>

                {/* Seletor de Agente / Papel */}
                <select
                  value={step.role}
                  onChange={(e) => handleUpdateStep(index, 'role', e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 focus:ring-1 focus:ring-sky-500"
                >
                  {AVAILABLE_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                {/* Título da Ação */}
                <input
                  type="text"
                  value={step.actionTitle}
                  onChange={(e) => handleUpdateStep(index, 'actionTitle', e.target.value)}
                  placeholder="Nome da Ação"
                  className="text-xs font-medium text-slate-700 border border-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:border-sky-500 min-w-[160px]"
                />
              </div>

              {/* Controles de Tipo, Obrigatoriedade e Reordenação */}
              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                {/* Tipo de Entrega */}
                <select
                  value={step.type}
                  onChange={(e) => handleUpdateStep(index, 'type', e.target.value as 'prompt' | 'pdf' | 'webhook')}
                  className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1"
                >
                  <option value="prompt">Documento / Prompt</option>
                  <option value="pdf">Relatório PDF</option>
                  <option value="webhook">Webhook / Sincronização</option>
                </select>

                {/* Checkbox: Obrigatório para Diretor de Arte */}
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  <input
                    type="checkbox"
                    checked={!!step.artObligatory}
                    onChange={(e) => handleUpdateStep(index, 'artObligatory', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Fonte da Verdade (Mandatório)</span>
                </label>

                {/* Status: Concluído */}
                <button
                  type="button"
                  onClick={() => handleUpdateStep(index, 'isCompleted', !step.isCompleted)}
                  className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                    step.isCompleted 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title="Alternar estado de conclusão"
                >
                  <Check className="w-3 h-3" />
                  {step.isCompleted ? 'Entregue' : 'Pendente'}
                </button>

                {/* Botões Mover Cima/Baixo */}
                <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 hover:text-sky-600 disabled:opacity-30 disabled:hover:text-slate-400"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === steps.length - 1}
                    className="p-1 hover:text-sky-600 disabled:opacity-30 disabled:hover:text-slate-400 border-l border-slate-200"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Remover Passo */}
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remover passo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ações Inferiores: Adicionar Passo & Salvar Fonte da Verdade */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <button
          onClick={handleAddStep}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all"
        >
          <Plus className="w-4 h-4 text-sky-600" />
          Adicionar Novo Passo ao Fluxo
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              Fonte da Verdade salva com sucesso!
            </span>
          )}

          <button
            onClick={handleSaveWorkflow}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar & Aplicar Fonte da Verdade'}
          </button>
        </div>
      </div>

    </div>
  );
}
