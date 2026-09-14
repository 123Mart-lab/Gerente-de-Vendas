const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'CEOBriefing.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const debugLogic = `
  const getFolderStrict = async (folderName: string, parentId: string | null, token: string): Promise<string> => {
    let query = \`mimeType='application/vnd.google-apps.folder' and name='\${folderName}' and trashed=false\`;
    if (parentId) {
      query += \` and '\${parentId}' in parents\`;
    }
    // Removemos a restrição rigorosa 'root in parents' para a pasta principal
    // pois '123MART.COM.BR' pode estar em um drive compartilhado ou não estar exatamente na raiz ('root') estrita
    
    const searchRes = await fetch(\`https://www.googleapis.com/drive/v3/files?q=\${encodeURIComponent(query)}&fields=files(id)\`, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    const searchData = await searchRes.json();
    console.log(\`[Drive Search] Folder: \${folderName}, Parent: \${parentId} -> Result:\`, searchData);
    
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    throw new Error(\`A pasta '\${folderName}' não foi encontrada no seu Google Drive.\`);
  };`;

code = code.replace(/  const getFolderStrict = async [\s\S]*?    throw new Error\(`A pasta '\$\{folderName\}' não foi encontrada no seu Google Drive\.`\);\n  };/g, debugLogic);

fs.writeFileSync(filePath, code);
