const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'CEOBriefing.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Adicionar o auto-save no useEffect
const autoSaveLogic = `
  useEffect(() => {
    if (selectedPdf && !isSavingToDrive && !driveSuccess) {
      saveToDrive();
    }
  }, [selectedPdf]);
`;

code = code.replace("  useEffect(() => {\n    const fetchData = () => {", autoSaveLogic + "\n  useEffect(() => {\n    const fetchData = () => {");


// 2. Substituir o Modal Antigo
const oldModal = /{selectedPdf && \([\s\S]*?      \)}/;
const newModal = `{selectedPdf && (
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
               <iframe src={selectedPdf.url} className="w-full h-full border-none" title="PDF Viewer" />
            </div>
          </div>
        </div>
      )}`;

// We need to carefully replace just the selectedPdf modal, not the selectedPrompt modal.
// Let's use a split to target the exact block.
const parts = code.split('{selectedPdf && (');
if (parts.length > 1) {
    const afterSelectedPdf = parts[1];
    const endOfModal = afterSelectedPdf.indexOf('      )}');
    if (endOfModal !== -1) {
        // the remaining content after the first `      )}`
        const restOfCode = afterSelectedPdf.substring(endOfModal + 8);
        code = parts[0] + newModal + restOfCode;
    }
}

fs.writeFileSync(filePath, code);
