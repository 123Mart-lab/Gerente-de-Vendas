const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCode = `    const { productId, query } = req.body;
    const creds = await firebaseService.getNuvemshopCredentials();
    let produto;`;

const newCode = `    const { productId, query } = req.body;
    let creds = null;
    try {
      creds = await firebaseService.getNuvemshopCredentials();
    } catch (err: any) {
      console.warn('⚠️ Erro ao acessar Firebase (Mock ativado):', err.message);
    }
    let produto;`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('server.ts', code);
