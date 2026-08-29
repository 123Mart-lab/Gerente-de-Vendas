import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Remove the old globalAuditTasks.push block
const oldPushBlock = `    // Save to globalAuditTasks
    globalAuditTasks.push({
      id: \`task-planner-\${Date.now()}\`,
      date: dateStr,
      productName: payload.name,
      
      receivedPrompt: result.prompts.planner,
      sentResponse: result.results.planner,
      status: 'completed',
      role: 'planner'
    });
    
    globalAuditTasks.push({
      id: \`task-monitor-\${Date.now()}\`,
      date: dateStr,
      productName: payload.name,
      
      receivedPrompt: result.prompts.monitor,
      sentResponse: result.results.monitor,
      status: 'completed',
      role: 'monitor'
    });
    
    globalAuditTasks.push({
      id: \`task-seo-\${Date.now()}\`,
      date: dateStr,
      productName: payload.name,
      
      receivedPrompt: result.prompts.seo,
      sentResponse: result.results.seo,
      status: 'completed',
      role: 'seo'
    });
    
    globalAuditTasks.push({
      id: \`task-art-\${Date.now()}\`,
      date: dateStr,
      productName: payload.name,
      
      receivedPrompt: result.prompts.art,
      sentResponse: result.results.art,
      status: 'completed',
      role: 'art'
    });`;

if (content.includes(oldPushBlock)) {
  content = content.replace(oldPushBlock, "");
}

// Update the aiService call
const oldAiCall = `const result = await aiService.runOrchestrationPipeline(payload);
    
    const dateStr = new Date().toLocaleString('pt-BR');`;

const newAiCall = `const dateStr = new Date().toLocaleString('pt-BR');
    const result = await aiService.runOrchestrationPipeline(payload, (step, prompt, response) => {
      globalAuditTasks.push({
        id: \`task-\${step}-\${Date.now()}\`,
        date: dateStr,
        productName: payload.name,
        receivedPrompt: prompt,
        sentResponse: response,
        status: 'completed',
        role: step
      });
    });`;

if (content.includes(oldAiCall)) {
  content = content.replace(oldAiCall, newAiCall);
}

fs.writeFileSync('server.ts', content, 'utf8');
console.log('patched server incremental');
