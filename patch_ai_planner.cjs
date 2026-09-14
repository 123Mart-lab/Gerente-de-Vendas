const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'services', 'ai.ts');
let code = fs.readFileSync(filePath, 'utf8');

// Ensure import is there
if (!code.includes("import { buildPlannerPrompt }")) {
  code = code.replace("import { GoogleGenAI } from '@google/genai';", "import { GoogleGenAI } from '@google/genai';\nimport { buildPlannerPrompt } from '../prompts/planner';");
}

const oldPromptRegex = /const plannerPrompt = `\[ORDEM DE SERVIÇO - GERÊNCIA DE PROJETOS\][\s\S]*?Formate com negritos, listas e hierarquia visual clara\.`;/g;

code = code.replace(oldPromptRegex, "const plannerPrompt = buildPlannerPrompt(productData, realTrends);");

fs.writeFileSync(filePath, code);
