const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'firebase.ts');
let code = fs.readFileSync(filePath, 'utf8');

const importFsPath = `import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadLocalData(filename, defaultVal) {
  try {
    const file = path.join(DATA_DIR, filename);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch(e) {}
  return defaultVal;
}

function saveLocalData(filename, data) {
  try {
    const file = path.join(DATA_DIR, filename);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch(e) {}
}

let inMemoryChats = loadLocalData('chats.json', []);
let inMemoryBriefings = loadLocalData('briefings.json', {});
`;

code = code.replace(/const inMemoryChats: any\[\] = \[\];\nconst inMemoryBriefings: Record<string, any> = \{\};/g, importFsPath);

// Now patch the saving logic to also save to file
code = code.replace(/inMemoryBriefings\[sku\] = \{ \.\.\.briefingData, updatedAt: Date\.now\(\) \};/g, 
  `inMemoryBriefings[sku] = { ...briefingData, updatedAt: Date.now() };\n      saveLocalData('briefings.json', inMemoryBriefings);`);

code = code.replace(/inMemoryChats\.push\(savedMsg\);/g, 
  `inMemoryChats.push(savedMsg);\n      saveLocalData('chats.json', inMemoryChats);`);
  
code = code.replace(/inMemoryChats\.push\(fallbackMsg\);/g, 
  `inMemoryChats.push(fallbackMsg);\n      saveLocalData('chats.json', inMemoryChats);`);

fs.writeFileSync(filePath, code);
