const fs = require('fs');
let code = fs.readFileSync('src/services/firebase.ts', 'utf8');

const target = "dbInstance = getFirestore('ai-studio-123martbot-19f3e99a-8216-4025-87f9-5c4fa761b2df');";
const replacement = "dbInstance = getFirestore(); // Removido o ID fixo para funcionar com o seu Firebase";

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/services/firebase.ts', code);
  console.log('Firebase DB ID fixed');
} else {
  console.log('Target not found in firebase.ts');
}
