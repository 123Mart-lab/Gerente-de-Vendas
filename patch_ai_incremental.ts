import fs from 'fs';

let content = fs.readFileSync('src/services/ai.ts', 'utf8');

// Add callback parameter
content = content.replace(
  "async runOrchestrationPipeline(productData: any) {",
  "async runOrchestrationPipeline(productData: any, onStepComplete?: (step: string, prompt: string, response: string) => void) {"
);

// Add callbacks after each generation
content = content.replace(
  "const plannerResponse = plannerResult.text;",
  "const plannerResponse = plannerResult.text;\n    if (onStepComplete) onStepComplete('planner', plannerPrompt, plannerResponse);"
);

content = content.replace(
  "const monitorResponse = monitorResult.text;",
  "const monitorResponse = monitorResult.text;\n    if (onStepComplete) onStepComplete('monitor', monitorPrompt, monitorResponse);"
);

content = content.replace(
  "const seoResponse = seoResult.text;",
  "const seoResponse = seoResult.text;\n    if (onStepComplete) onStepComplete('seo', seoPrompt, seoResponse);"
);

content = content.replace(
  "const artResponse = artResult.text;",
  "const artResponse = artResult.text;\n    if (onStepComplete) onStepComplete('art', artPrompt, artResponse);"
);

fs.writeFileSync('src/services/ai.ts', content, 'utf8');
console.log('patched ai incremental');
