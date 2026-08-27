const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = "// ROTA OAUTH NUVEMSHOP (INSTALAÇÃO)";
const replacement = `// ROTA OAUTH NUVEMSHOP (INSTALAÇÃO)
// ==========================================
app.get('/api/auth/install', (req, res) => {
  const clientId = process.env.NUVEMSHOP_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('Erro: NUVEMSHOP_CLIENT_ID não configurado no .env');
  }
  // Redireciona para a tela de permissão da Nuvemshop
  res.redirect(\`https://www.nuvemshop.com.br/apps/\${clientId}/authorize\`);
});
`;

if (code.includes(target) && !code.includes('/api/auth/install')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log('Install route added');
} else {
  console.log('Target not found or route already exists');
}
