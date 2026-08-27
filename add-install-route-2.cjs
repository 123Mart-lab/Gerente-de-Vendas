const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = "app.get('/api/auth/callback', async (req, res) => {";
const replacement = `app.get('/api/auth/install', (req, res) => {
  const clientId = process.env.NUVEMSHOP_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('Erro: NUVEMSHOP_CLIENT_ID não configurado no .env');
  }
  res.redirect(\`https://www.nuvemshop.com.br/apps/\${clientId}/authorize\`);
});

app.get('/api/auth/callback', async (req, res) => {`;

if (code.includes(target) && !code.includes('/api/auth/install')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log('Install route added 2');
} else {
  console.log('Target not found 2');
}
