import fs from 'fs';
let ai = fs.readFileSync('src/services/ai.ts', 'utf8');

ai = ai.replace('const artPrompt = `Você é um Diretor de Arte Sênior. A copy de SEO já foi criada:\\n${seoResponse}\\n\\nO Briefing do Gerente é:\\n${managerResponse}\\n\\n', 'const artPrompt = `Você é um Diretor de Arte Sênior. O Especialista de SEO já fez as otimizações no produto.\\n\\nO Briefing do Gerente é:\\n${managerResponse}\\n\\n');

fs.writeFileSync('src/services/ai.ts', ai, 'utf8');
