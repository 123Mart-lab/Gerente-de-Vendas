import fs from 'fs';

let content = fs.readFileSync('src/services/ai.ts', 'utf8');

content = content.replace(
  "return {\n      planner: plannerResponse,\n      monitor: monitorResponse,\n      seo: seoResponse,\n      art: artResponse\n    };",
  "return {\n      results: {\n        planner: plannerResponse,\n        monitor: monitorResponse,\n        seo: seoResponse,\n        art: artResponse\n      },\n      prompts: {\n        planner: plannerPrompt,\n        monitor: monitorPrompt,\n        seo: seoPrompt,\n        art: artPrompt\n      }\n    };"
);

fs.writeFileSync('src/services/ai.ts', content, 'utf8');
console.log('patched ai.ts');
