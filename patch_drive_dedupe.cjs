const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'CEOBriefing.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const newSaveToDrive = `
      // Verifica se o arquivo já existe na pasta
      const fileName = \`\${selectedPdf.role}_\${selectedPdf.sku}.pdf\`;
      const fileQuery = \`mimeType='application/pdf' and name='\${fileName}' and '\${f4}' in parents and trashed=false\`;
      const fileUrl = \`https://www.googleapis.com/drive/v3/files?q=\${encodeURIComponent(fileQuery)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives\`;
      
      const fileRes = await fetch(fileUrl, { headers: { Authorization: \`Bearer \${token}\` } });
      const fileData = await fileRes.json();
      
      const metadata = {
        name: fileName,
        mimeType: 'application/pdf',
        parents: [f4]
      };
      
      const form = new FormData();
      
      let uploadRes;
      
      if (fileData.files && fileData.files.length > 0) {
        // Arquivo já existe, vamos ATUALIZAR (PATCH) o arquivo existente
        const existingFileId = fileData.files[0].id;
        console.log("Arquivo já existe no Drive, atualizando...", existingFileId);
        
        // Para atualizar o arquivo existente, não passamos parents, apenas enviamos a media
        const updateMetadata = { mimeType: 'application/pdf' };
        form.append('metadata', new Blob([JSON.stringify(updateMetadata)], { type: 'application/json' }));
        form.append('file', pdfBlob);
        
        uploadRes = await fetch(\`https://www.googleapis.com/upload/drive/v3/files/\${existingFileId}?uploadType=multipart&supportsAllDrives=true\`, {
          method: 'PATCH',
          headers: { Authorization: \`Bearer \${token}\` },
          body: form
        });
      } else {
        // Arquivo não existe, vamos CRIAR (POST)
        console.log("Arquivo não existe no Drive, criando...");
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', pdfBlob);
        
        uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
          method: 'POST',
          headers: { Authorization: \`Bearer \${token}\` },
          body: form
        });
      }
`;

// Replace the old metadata and form logic
code = code.replace(/      \/\/ Upload to Drive[\s\S]*?      const uploadRes = await fetch\('https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?uploadType=multipart&supportsAllDrives=true', \{\n        method: 'POST',\n        headers: \{\n          Authorization: `Bearer \$\{token\}`\n        \},\n        body: form\n      \}\);/, newSaveToDrive.trim());

fs.writeFileSync(filePath, code);
