import fs from 'fs';

let content = fs.readFileSync('src/components/publicidade/TaskAuditPanel.tsx', 'utf8');

// Update Interface
const newInterface = `export interface AuditTask {
  id: string;
  date: string;
  productName: string;
  receivedPrompt: string;
  sentResponse: string;
  status: 'pending' | 'completed';
  role?: string;
  requestingSector?: string;
  executingSector?: string;
  oldScore?: number;
  newScore?: number;
  evolutionPercentage?: number;
}`;

content = content.replace(/export interface AuditTask \{[\s\S]*?\}/, newInterface);

// Import Lucide icons we might need
if (!content.includes('TrendingUp')) {
  content = content.replace(
    "import { Clock, MessageSquare, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';",
    "import { Clock, MessageSquare, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Building2, Target } from 'lucide-react';"
  );
}

// Add the metadata section inside expanded view
const metadataUI = `
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1"><Building2 className="w-3 h-3"/> Solicitante</span>
              <span className="text-sm font-medium text-slate-700">{task.requestingSector || 'Gerente de Projetos'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1"><Target className="w-3 h-3"/> Executante</span>
              <span className="text-sm font-medium text-slate-700">{task.executingSector || roleLabels[task.role || ''] || 'Profissional'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Score Evolutivo</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500 line-through">{task.oldScore || 0}</span>
                <span className="text-sm font-bold text-sky-600">{task.newScore || 0}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500"/> Evolução</span>
              <span className="text-sm font-bold text-emerald-600">+{task.evolutionPercentage || 0}%</span>
            </div>
          </div>
        </div>
`;

content = content.replace(
  '{isExpanded && (\n        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 animate-in fade-in duration-200">',
  '{isExpanded && (\n        <div className="animate-in fade-in duration-200 flex flex-col">\n' + metadataUI + '\n          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">'
);

content = content.replace(
  '</div>\n        </div>\n      )}',
  '</div>\n          </div>\n        </div>\n      )}'
);

// We need to update the Ordem Recebida text to use requestingSector instead of (Gerente) statically
content = content.replace(
  "Ordem Recebida (Gerente)",
  "Ordem Recebida ({task.requestingSector || 'Gerente'})"
);

fs.writeFileSync('src/components/publicidade/TaskAuditPanel.tsx', content, 'utf8');
console.log('patched TaskAuditPanel with metadata');
