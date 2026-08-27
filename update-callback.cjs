const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    // Salvar no Firebase em segurança
    await firebaseService.saveNuvemshopCredentials(storeId, access_token);`;

const replacement = `    // EXIBIR TOKEN NO TERMINAL PARA O USUÁRIO COPIAR
    console.log('\\n\\n======================================================');
    console.log('✅ SUCESSO! NUVEMSHOP AUTENTICADA!');
    console.log('Copie os valores abaixo e cole no seu arquivo .env:');
    console.log('NUVEMSHOP_ACCESS_TOKEN="' + access_token + '"');
    console.log('NUVEMSHOP_STORE_ID="' + storeId + '"');
    console.log('======================================================\\n\\n');

    // Tentar Salvar no Firebase em segurança (pode falhar se Firebase estiver mal configurado)
    try {
      await firebaseService.saveNuvemshopCredentials(storeId, access_token);
    } catch (firebaseErr) {
      console.error('Aviso: Não foi possível salvar no Firebase, mas o token foi gerado no terminal!', firebaseErr.message);
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log('Callback updated');
} else {
  console.log('Target not found');
}
