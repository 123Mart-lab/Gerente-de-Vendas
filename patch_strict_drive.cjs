const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'CEOBriefing.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const updatedLogic = `
  const getFolderStrict = async (folderName: string, parentId: string | null, token: string): Promise<string> => {
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
    throw new Error(\`A pasta '\${folderName}' não foi encontrada no seu Google Drive.\`);
  };

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
`;

code = code.replace(/  const getOrCreateFolder = async [\s\S]*?  const saveToDrive = async \(\) => \{/, updatedLogic + "\n  const saveToDrive = async () => {");

const newMetadataLogic = `      // Localiza a hierarquia de pastas existente rigorosamente
      const f1 = await getFolderStrict('123MART.COM.BR', null, token);
      const f2 = await getFolderStrict('Publicidade', f1, token);
      const f3 = await getFolderStrict('Arquivos Gerente 123Mart', f2, token);
      
      // Cria APENAS a pasta do SKU se ela não existir
      const f4 = await getOrCreateFolder(selectedPdf.sku, f3, token);

      // Upload to Drive
      const metadata = {
        name: \`\${selectedPdf.role}_\${selectedPdf.sku}.pdf\`,
        mimeType: 'application/pdf',
        parents: [f4]
      };`;

code = code.replace(/      \/\/ Get or create folders\n      const f1 = await getOrCreateFolder\('123MART\.COM\.BR', null, token\);\n      const f2 = await getOrCreateFolder\('Publicidade', f1, token\);\n      const f3 = await getOrCreateFolder\('Arquivos Gerente 123Mart', f2, token\);\n      const f4 = await getOrCreateFolder\(selectedPdf\.sku, f3, token\);\n\n      \/\/ Upload to Drive\n      const metadata = \{\n        name: `\$\{selectedPdf\.role\}_\$\{selectedPdf\.sku\}\.pdf`,\n        mimeType: 'application\/pdf',\n        parents: \[f4\]\n      \};/g, newMetadataLogic);

code = code.replace(/      alert\('Erro de autenticação ou upload\.'\);/, "      alert(err instanceof Error ? err.message : 'Erro de autenticação ou upload.');");

fs.writeFileSync(filePath, code);
