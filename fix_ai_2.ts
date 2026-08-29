import fs from 'fs';
let ai = fs.readFileSync('src/services/ai.ts', 'utf8');

const regex = /const artPrompt = \`Você é um Diretor de Arte Sênior\. A copy de SEO já foi criada:[\s\S]*?\${seoResponse}[\s\S]*?O Briefing do Gerente é:[\s\S]*?\${managerResponse}/;
const replacement = 'const artPrompt = `Você é um Diretor de Arte Sênior. O Especialista de SEO já fez as otimizações no produto.\\n\\nO Briefing do Gerente é:\\n${managerResponse}';

ai = ai.replace(regex, replacement);

fs.writeFileSync('src/services/ai.ts', ai, 'utf8');
