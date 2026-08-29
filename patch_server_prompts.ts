import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("sentResponse: result.planner,", "receivedPrompt: result.prompts.planner,\n      sentResponse: result.results.planner,");
content = content.replace("receivedPrompt: 'Analise o produto para uso, argumentos de venda e dores.',", "");
content = content.replace("sentResponse: result.monitor,", "receivedPrompt: result.prompts.monitor,\n      sentResponse: result.results.monitor,");
content = content.replace("receivedPrompt: 'Crie um relatório de Oportunidades (Benchmark) e analise preços.',", "");
content = content.replace("sentResponse: result.seo,", "receivedPrompt: result.prompts.seo,\n      sentResponse: result.results.seo,");
content = content.replace("receivedPrompt: 'Crie otimização SEO: Título, Meta e Copy.',", "");
content = content.replace("sentResponse: result.art,", "receivedPrompt: result.prompts.art,\n      sentResponse: result.results.art,");
content = content.replace("receivedPrompt: 'Crie diretrizes visuais para banners focados em conversão.',", "");
content = content.replace("res.json({ success: true, result });", "res.json({ success: true, result: result.results });");

fs.writeFileSync('server.ts', content, 'utf8');
console.log('patched server.ts');
