import fs from 'fs';

const filePath = 'src/components/marketing/ProductOptimizer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /addLog\('warning', `\[AGENTE 1\] Analisando SEO do produto: \$\{productName\}`\);/g,
  "addLog('warning', `[GERENTE DE PROJETOS] Orquestrando otimização e enviando briefing do produto: ${productName} para a equipe.`);"
);

content = content.replace(
  /addLog\('success', `\[AGENTES 2 e 3\] Otimização gerada\. Aguardando revisão visual por \$\{currentInterval\} min\.\.\.`\);/g,
  "addLog('success', `[ESPECIALISTA SEO] Recebi o briefing! Otimização técnica concluída com sucesso. Analisando salvamento...`);"
);

content = content.replace(
  /addLog\('warning', `\[AGENTE 4\] Salvando alterações na Nuvemshop\.\.\.`\);/g,
  "addLog('warning', `[ESPECIALISTA SEO] Atitude pró-ativa ativada: Salvando alterações automaticamente na Nuvemshop...`);"
);

content = content.replace(
  /addLog\('success', `\[AGENTES 2 e 3\] Otimização gerada\. Aguardando você clicar em Salvar manual\.\.\.`\);/g,
  "addLog('success', `[ESPECIALISTA SEO] Otimização gerada. Aguardando Gerente aprovar salvamento manual...`);"
);

fs.writeFileSync(filePath, content, 'utf8');
