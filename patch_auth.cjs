const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'services', 'auth.ts');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "provider.addScope('https://www.googleapis.com/auth/drive.file');",
  "provider.addScope('https://www.googleapis.com/auth/drive'); // Updated scope to read existing folders"
);

// We should also add customParameters to force a consent prompt so the user grants the new scope
code = code.replace(
  "const provider = new GoogleAuthProvider();",
  "const provider = new GoogleAuthProvider();\nprovider.setCustomParameters({ prompt: 'consent' });"
);

fs.writeFileSync(filePath, code);
