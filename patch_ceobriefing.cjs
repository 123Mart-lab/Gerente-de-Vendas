const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'CEOBriefing.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Add imports
if (!code.includes('import { initAuth, googleSignIn, getAccessToken }')) {
  code = code.replace("import React, { useState, useEffect } from 'react';", 
    "import React, { useState, useEffect } from 'react';\nimport { initAuth, googleSignIn, getAccessToken } from '../services/auth';\nimport { Cloud, Download, Loader2, Check } from 'lucide-react';");
}

// Add state for PDF modal
if (!code.includes('selectedPdf')) {
  code = code.replace("const [pipelines, setPipelines] = useState<SkuPipeline[]>([]);",
    "const [pipelines, setPipelines] = useState<SkuPipeline[]>([]);\n  const [selectedPdf, setSelectedPdf] = useState<{url: string, role: string, sku: string} | null>(null);\n  const [needsAuth, setNeedsAuth] = useState(false);\n  const [isSavingToDrive, setIsSavingToDrive] = useState(false);\n  const [driveSuccess, setDriveSuccess] = useState(false);\n\n  useEffect(() => {\n    initAuth(\n      () => setNeedsAuth(false),\n      () => setNeedsAuth(true)\n    );\n  }, []);\n\n  const saveToDrive = async () => {\n    if (!selectedPdf) return;\n    setIsSavingToDrive(true);\n    try {\n      let token = await getAccessToken();\n      if (!token) {\n        const result = await googleSignIn();\n        if (result) token = result.accessToken;\n        else throw new Error('Auth failed');\n      }\n      \n      // Fetch the PDF from our backend\n      const pdfRes = await fetch(selectedPdf.url);\n      const pdfBlob = await pdfRes.blob();\n\n      // Upload to Drive\n      const metadata = {\n        name: `${selectedPdf.role}_${selectedPdf.sku}.pdf`,\n        mimeType: 'application/pdf'\n      };\n\n      const form = new FormData();\n      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));\n      form.append('file', pdfBlob);\n\n      const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {\n        method: 'POST',\n        headers: {\n          Authorization: `Bearer ${token}`\n        },\n        body: form\n      });\n\n      if (uploadRes.ok) {\n        setDriveSuccess(true);\n        setTimeout(() => setDriveSuccess(false), 3000);\n      } else {\n        console.error('Drive upload failed', await uploadRes.text());\n        alert('Erro ao salvar no Drive.');\n      }\n    } catch (err) {\n      console.error(err);\n      alert('Erro de autenticação ou upload.');\n    } finally {\n      setIsSavingToDrive(false);\n    }\n  };");
}

// Replace step.type === 'pdf' handler
code = code.replace(/} else if \(step\.type === 'pdf'\) \{\n\s*if \(step\.pdfUrl\) \{\n\s*\/\/ Trigger download\/view of PDF\n\s*window\.open\(step\.pdfUrl, '_blank'\);\n\s*\}\n\s*\}/g,
  `} else if (step.type === 'pdf') {
      if (step.pdfUrl) {
        setSelectedPdf({ url: step.pdfUrl, role: step.role, sku });
      }
    }`);

// Add PDF Modal JSX
const pdfModalJSX = `
      {/* PDF Actions Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileDown className="w-5 h-5 text-sky-600" />
                Opções de Arquivo
              </h3>
              <button 
                onClick={() => { setSelectedPdf(null); setDriveSuccess(false); }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <button 
                onClick={() => window.open(selectedPdf.url, '_blank')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-sm"
              >
                <Download className="w-4 h-4" /> Baixar PDF
              </button>
              
              <button 
                onClick={saveToDrive}
                disabled={isSavingToDrive || driveSuccess}
                className={\`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium border shadow-sm \${
                  driveSuccess 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }\`}
              >
                {isSavingToDrive ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Salvando no Drive...</>
                ) : driveSuccess ? (
                  <><Check className="w-4 h-4" /> Salvo com sucesso!</>
                ) : (
                  <><Cloud className="w-4 h-4 text-sky-500" /> Salvar no Google Drive</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/\{\/\* Prompt Modal \*\/\}/, `${pdfModalJSX}\n\n      {/* Prompt Modal */}`);

fs.writeFileSync(filePath, code);
