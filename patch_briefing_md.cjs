const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'CEOBriefing.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add import for React Markdown
code = "import Markdown from 'react-markdown';\n" + code;

// 2. Add state for Markdown content
code = code.replace(
  "const [selectedPdf, setSelectedPdf] = useState<{url: string, role: string, sku: string} | null>(null);",
  "const [selectedPdf, setSelectedPdf] = useState<{url: string, role: string, sku: string, markdown?: string} | null>(null);"
);

// 3. We need to fetch the JSON when selectedPdf is set but doesn't have markdown yet.
const markdownEffect = `
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
`;
code = code.replace("  useEffect(() => {\n    const fetchData", markdownEffect + "\n  useEffect(() => {\n    const fetchData");

// 4. Update UI to render Markdown instead of iframe
const iframeHtml = `<iframe src={selectedPdf.url} className="w-full h-full border-none" title="PDF Viewer" />`;
const markdownHtml = `
              <div className="p-8 prose prose-slate max-w-none">
                 {selectedPdf.markdown ? (
                   <div className="markdown-body">
                     <Markdown>{selectedPdf.markdown}</Markdown>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Carregando relatório...</div>
                 )}
              </div>`;
code = code.replace(iframeHtml, markdownHtml);

// 5. Update saveToDrive logic to upload as Google Doc instead of PDF
const oldFetchPdf = `      // Fetch the PDF from our backend
      const pdfRes = await fetch(selectedPdf.url);
      const pdfBlob = await pdfRes.blob();`;
const newFetchMarkdown = `      if (!selectedPdf.markdown) throw new Error("Aguarde o carregamento do texto.");
      const pdfBlob = new Blob([selectedPdf.markdown], { type: 'text/plain' });`;
code = code.replace(oldFetchPdf, newFetchMarkdown);

// Change file name and mimeTypes
code = code.replace(/const fileName = `\$\{selectedPdf\.role\}_\$\{selectedPdf\.sku\}\.pdf`;/g, "const fileName = `${selectedPdf.role}_${selectedPdf.sku}`;"); // Google Docs don't need extension
code = code.replace(/mimeType='application\/pdf'/g, "mimeType='application/vnd.google-apps.document'");
code = code.replace(/mimeType: 'application\/pdf'/g, "mimeType: 'application/vnd.google-apps.document'");

fs.writeFileSync(filePath, code);
