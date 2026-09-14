const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'CEOBriefing.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const folderLogic = `
  const getOrCreateFolder = async (folderName: string, parentId: string | null, token: string): Promise<string> => {
    let query = \`mimeType='application/vnd.google-apps.folder' and name='\${folderName}' and trashed=false\`;
    if (parentId) {
      query += \` and '\${parentId}' in parents\`;
    } else {
      query += \` and 'root' in parents\`;
    }
    
    const searchRes = await fetch(\`https://www.googleapis.com/drive/v3/files?q=\${encodeURIComponent(query)}&fields=files(id)\`, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    const searchData = await searchRes.json();
    
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : []
      })
    });
    const createData = await createRes.json();
    return createData.id;
  };

  const saveToDrive = async () => {`;

code = code.replace("  const saveToDrive = async () => {", folderLogic);

const metadataLogic = `      // Get or create folders
      const f1 = await getOrCreateFolder('123MART.COM.BR', null, token);
      const f2 = await getOrCreateFolder('Publicidade', f1, token);
      const f3 = await getOrCreateFolder('Arquivos Gerente 123Mart', f2, token);
      const f4 = await getOrCreateFolder(selectedPdf.sku, f3, token);

      // Upload to Drive
      const metadata = {
        name: \`\${selectedPdf.role}_\${selectedPdf.sku}.pdf\`,
        mimeType: 'application/pdf',
        parents: [f4]
      };`;

code = code.replace(/      \/\/ Upload to Drive\n      const metadata = {\n        name: `\$\{selectedPdf.role\}_\$\{selectedPdf.sku\}.pdf`,\n        mimeType: 'application\/pdf'\n      };/, metadataLogic);

fs.writeFileSync(filePath, code);
