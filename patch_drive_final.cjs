const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'CEOBriefing.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const updatedDriveLogic = `
  const getFolderStrict = async (folderName: string, parentId: string | null, token: string): Promise<string> => {
    let query = \`mimeType='application/vnd.google-apps.folder' and name='\${folderName}' and trashed=false\`;
    if (parentId) {
      query += \` and '\${parentId}' in parents\`;
    }
    
    // Para garantir que ele encontre pastas em qualquer lugar (Meu Drive, Compartilhados, etc)
    const url = \`https://www.googleapis.com/drive/v3/files?q=\${encodeURIComponent(query)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives\`;
    
    const searchRes = await fetch(url, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    
    if (!searchRes.ok) {
       console.error("Drive API Search Error:", await searchRes.text());
       throw new Error(\`Erro na API do Google Drive ao buscar a pasta '\${folderName}'. Você aceitou as permissões?\`);
    }
    
    const searchData = await searchRes.json();
    console.log(\`[Drive Search] Folder: \${folderName} -> Result:\`, searchData);
    
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id; // Retorna o primeiro match
    }
    
    // Se não encontrou, vamos listar as primeiras 10 pastas para debugar no console
    try {
        const debugRes = await fetch(\`https://www.googleapis.com/drive/v3/files?q=\${encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false")}&fields=files(name)&pageSize=10&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives\`, { headers: { Authorization: \`Bearer \${token}\` } });
        const debugData = await debugRes.json();
        console.log(" Pastas visíveis no seu Drive para o Agente:", debugData.files);
    } catch(e){}

    throw new Error(\`A pasta '\${folderName}' não foi encontrada no seu Google Drive. (Verifique maiúsculas/minúsculas e espaços)\`);
  };

  const getOrCreateFolder = async (folderName: string, parentId: string | null, token: string): Promise<string> => {
    let query = \`mimeType='application/vnd.google-apps.folder' and name='\${folderName}' and trashed=false\`;
    if (parentId) {
      query += \` and '\${parentId}' in parents\`;
    }
    
    const url = \`https://www.googleapis.com/drive/v3/files?q=\${encodeURIComponent(query)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives\`;
    const searchRes = await fetch(url, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    const searchData = await searchRes.json();
    
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
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
    
    if (!createRes.ok) {
       console.error("Drive API Create Error:", await createRes.text());
       throw new Error(\`Erro ao criar a pasta '\${folderName}'\`);
    }
    
    const createData = await createRes.json();
    return createData.id;
  };
`;

code = code.replace(/  const getFolderStrict = async [\s\S]*?    throw new Error\(`A pasta '\$\{folderName\}' não foi encontrada no seu Google Drive\.\(Verifique maiúsculas\/minúsculas e espaços\)`\);\n  };\n\n  const getOrCreateFolder = async [\s\S]*?    return createData\.id;\n  };/g, ""); // Remove first if duplicate
code = code.replace(/  const getFolderStrict = async [\s\S]*?    return createData\.id;\n  };/g, updatedDriveLogic); // Standard replace
if (!code.includes("getFolderStrict = async")) {
  // It might have failed matching. Let's do a fallback replace.
  code = code.replace(/  const getFolderStrict = async [\s\S]*?    return createData\.id;\n  };/g, updatedDriveLogic);
}

// In saveToDrive, we must ensure supportsAllDrives when uploading file
code = code.replace(
  "const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {",
  "const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {"
);

fs.writeFileSync(filePath, code);
