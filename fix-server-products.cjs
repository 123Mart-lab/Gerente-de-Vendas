const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// For /api/marketing/products
const searchProducts = `
    let creds = null;
    try {
      creds = await firebaseService.getNuvemshopCredentials();
    } catch (err) {}
    
    if (!creds) {
`;

const replaceProducts = `
    let creds = null;
    try {
      creds = await firebaseService.getNuvemshopCredentials();
    } catch (err) {}
    
    // FALLBACK IF FIREBASE FAILS BUT ENV VARS EXIST
    if (!creds && process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
      creds = { 
        accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN, 
        storeId: process.env.NUVEMSHOP_STORE_ID 
      };
    }
    
    if (!creds) {
`;

if (code.includes(searchProducts)) {
  code = code.replace(searchProducts, replaceProducts);
  fs.writeFileSync('server.ts', code);
  console.log('Fixed /products fallback');
} else {
  console.log('Could not find /products to replace');
}
