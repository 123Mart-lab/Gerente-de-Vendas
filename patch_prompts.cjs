const fs = require('fs');
const path = require('path');

const plannerPath = path.join(process.cwd(), 'src/prompts/planner.ts');
let plannerCode = fs.readFileSync(plannerPath, 'utf8');

plannerCode = plannerCode.replace(
  /É ESTRITAMENTE PROIBIDO entregar blocos de textos longos, genéricos ou informais\./g,
  "Você DEVE gerar um dossiê EXTENSO, PROFUNDO e EXTREMAMENTE DETALHADO. Não poupe palavras ao analisar os dados, mas evite introduções genéricas. Seja puramente técnico e prolixo na sua análise de dados."
);
plannerCode = plannerCode.replace(
  /utilizando gráficos de barra em texto/g,
  "utilizando INÚMEROS gráficos de barra em texto"
);
fs.writeFileSync(plannerPath, plannerCode);

const monitorPath = path.join(process.cwd(), 'src/prompts/monitor.ts');
let monitorCode = fs.readFileSync(monitorPath, 'utf8');

monitorCode = monitorCode.replace(
  /É ESTRITAMENTE PROIBIDO entregar textos rasos\./g,
  "Você DEVE gerar uma análise EXPLORATÓRIA, DENSA e ALTAMENTE DETALHADA. É ESTRITAMENTE PROIBIDO entregar relatórios curtos ou sucintos. Elabore extensivamente sobre cada ponto com riqueza de cálculos matemáticos."
);
fs.writeFileSync(monitorPath, monitorCode);

console.log('Patched prompts for more detail and verbosity');
