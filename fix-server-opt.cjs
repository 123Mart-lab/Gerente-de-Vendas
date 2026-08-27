const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Optimize
const searchOpt = `
    let creds = null;
    try {
      creds = await firebaseService.getNuvemshopCredentials();
    } catch (err: any) {
      console.warn('⚠️ Erro ao acessar Firebase (Mock ativado):', err.message);
    }
    let produto;
    
    if (!creds) {
`;

const replaceOpt = `
    let creds = null;
    try {
      creds = await firebaseService.getNuvemshopCredentials();
    } catch (err: any) {
      console.warn('⚠️ Erro ao acessar Firebase (Mock ativado):', err.message);
    }
    
    // FALLBACK IF FIREBASE FAILS BUT ENV VARS EXIST
    if (!creds && process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
      creds = { 
        accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN, 
        storeId: process.env.NUVEMSHOP_STORE_ID 
      };
    }
    
    let produto;
    if (!creds) {
`;

if (code.includes(searchOpt)) {
  code = code.replace(searchOpt, replaceOpt);
} else {
  console.log('Optimize not found');
}

// Save
const searchSave = `
    if (productId && String(productId).indexOf('mock-') === -1) {
        let creds = null;
        try {
          creds = await firebaseService.getNuvemshopCredentials();
        } catch (err) {}
        
        if (creds) {
`;

const replaceSave = `
    if (productId && String(productId).indexOf('mock-') === -1) {
        let creds = null;
        try {
          creds = await firebaseService.getNuvemshopCredentials();
        } catch (err) {}
        
        if (!creds && process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
          creds = { accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN, storeId: process.env.NUVEMSHOP_STORE_ID };
        }
        
        if (creds) {
`;

if (code.includes(searchSave)) {
  code = code.replace(searchSave, replaceSave);
}

fs.writeFileSync('server.ts', code);
console.log('Done');
