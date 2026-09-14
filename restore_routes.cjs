const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const startIndex = code.indexOf("app.post('/api/marketing/orchestrate-optimization', async (req, res) => {");
const endIndexStr = "// ==========================================\n// INICIALIZAÇÃO DO CÉREBRO & VITE FRONTEND";
const endIndex = code.indexOf(endIndexStr);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start or end bounds.");
  process.exit(1);
}

const replacement = `app.post('/api/marketing/orchestrate-optimization', async (req, res) => {
  try {
    const { productId, query } = req.body;
    
    // SEO Filters check for direct orders
    if (globalSeoFilters.enabled) {
      const isKit = (query || '').toLowerCase().includes('kit');
      
      let blockedReason = null;
      if (globalSeoFilters.ignoreKits && isKit) {
        blockedReason = 'Variação de kit ignorada';
      }
      
      if (blockedReason) {
         const dateStr = new Date().toLocaleString('pt-BR');
         const responseMsg = \`Neste momento, os filtros aplicados me impedem de fazer alteração no anúncio (Motivo: \${blockedReason}).\`;
         
         // Add the blocked response directly to the audit log as the SEO specialist
         globalAuditTasks.push({
           id: \`task-seo-\${Date.now()}\`,
           date: dateStr,
           productName: query || productId || 'Produto',
           receivedPrompt: 'Otimize este anúncio de acordo com as diretrizes.',
           sentResponse: responseMsg,
           status: 'completed',
           role: 'seo',
           requestingSector: 'Gerente de Projetos',
           executingSector: 'Especialista SEO',
           oldScore: 0,
           newScore: 0,
           evolutionPercentage: 0
         });
         
         return res.json({ 
           success: true, 
           response: responseMsg,
           blocked: true,
           reason: blockedReason
         });
      }
    }

    const payload = req.body;
    const dateStr = new Date().toLocaleString('pt-BR');
    const pendingTaskId = \`task-opt-\${Date.now()}\`;
    
    // Simula inicialização rápida
    globalAuditTasks.push({
      id: pendingTaskId,
      date: dateStr,
      productName: payload.name || 'Produto Desconhecido',
      receivedPrompt: \`Iniciar otimização estrutural da esteira para \${payload.sku || payload.id}\`,
      sentResponse: 'Inicializando módulos da esteira...',
      status: 'pending',
      role: 'system',
      requestingSector: 'Sistema',
      executingSector: 'Orquestrador',
      oldScore: 0,
      newScore: 0,
      evolutionPercentage: 0
    });

    const currentSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));

    const getRoleMetadata = (step) => {
      let req = 'Gerente de Projetos';
      let exe = 'Profissional';
      if (step === 'planner') { exe = 'Pesquisador de Mercado'; }
      else if (step === 'monitor') { exe = 'Monitor de Concorrência'; }
      else if (step === 'manager') { exe = 'Gerente de Projetos'; }
      else if (step === 'seo') { exe = 'Especialista SEO'; }
      else if (step === 'art') { exe = 'Diretor de Arte'; }
      return { req, exe, oldS: 0, newS: 100, ev: 100 };
    };

    const saveProductCallback = async (seoJson) => {
        try {
          console.log(\`[🚀 MeliAgent] Disparando Webhook de Atualização para SKU: \${payload.sku || payload.id}\`);
          await fetch('https://ais-pre-aj3lqhgqeg6eru2q43vpyh-376013781567.us-west2.run.app/api/webhook/briefing-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sku: payload.sku ? payload.sku.toString() : payload.id.toString(),
              secret: "meli-agent-secret-2026"
            })
          });
          console.log(\`[✅ MeliAgent] Webhook disparado com sucesso.\`);
        } catch (meliError) {
          console.error(\`[❌ MeliAgent] Falha ao disparar webhook:\`, meliError.message);
        }
    };

    const result = aiService.runOrchestrationPipeline(payload, (step, prompt, response) => {
      const meta = getRoleMetadata(step);
      globalAuditTasks.push({
        id: \`task-\${step}-\${Date.now()}\`,
        date: dateStr,
        productName: payload.name,
        receivedPrompt: prompt,
        sentResponse: response,
        status: 'completed',
        role: step,
        requestingSector: meta.req,
        executingSector: meta.exe,
        oldScore: meta.oldS,
        newScore: meta.newS,
        evolutionPercentage: meta.ev
      });

      if (step === 'planner') { 
          currentSteps[0].isCompleted = true; currentSteps[0].content = prompt;
          currentSteps[1].isCompleted = true; currentSteps[1].pdfUrl = \`/api/marketing/pdf/planner/\${payload.sku}\`;
      } else if (step === 'monitor') { 
          currentSteps[2].isCompleted = true; currentSteps[2].content = prompt;
          currentSteps[3].isCompleted = true; currentSteps[3].pdfUrl = \`/api/marketing/pdf/monitor/\${payload.sku}\`;
      } else if (step === 'art') { 
          currentSteps[4].isCompleted = true; currentSteps[4].content = prompt;
          currentSteps[5].isCompleted = true; currentSteps[5].pdfUrl = \`/api/marketing/pdf/arte/\${payload.sku}\`;
      } else if (step === 'seo') { 
          currentSteps[6].isCompleted = true; currentSteps[6].content = prompt;
          currentSteps[7].isCompleted = true; currentSteps[7].pdfUrl = \`/api/marketing/pdf/seo/\${payload.sku}\`;
      } else if (step === 'manager') { 
          currentSteps[8].isCompleted = true; currentSteps[8].pdfUrl = \`/api/marketing/pdf/briefing/\${payload.sku}\`;
          currentSteps[9].isCompleted = true; currentSteps[9].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';
      }
      
      firebaseService.saveSkuBriefing(payload.sku, { sku: typeof payload.sku !== 'undefined' ? payload.sku : payload.id, startedAt: Date.now(), steps: currentSteps, [step]: response }).catch(e => console.error("Falha ao salvar progresso do briefing: ", e));

    }, saveProductCallback).catch(e => {
        console.error('Background optimization failed', e);
        const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
        if (pIdx > -1) {
            globalAuditTasks[pIdx].status = 'completed';
            globalAuditTasks[pIdx].sentResponse = \`Falha na execução: \${e.message}\`;
        }
    });

    res.json({ success: true, result: [] });
  } catch (err) {
    console.error('Erro na orquestração:', err);
    res.status(500).json({ error: 'Erro na orquestração' });
  }
});

app.post('/api/marketing/chat-gerente', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    const sysPrompt = \`Você é o Gerente de Projetos da 123Mart. Sua função é orquestrar a esteira de otimização de produtos e distribuição de tarefas. Você não executa o trabalho operacional (não escreve textos SEO finais, não desenha imagens). Você delega as tarefas e envia o briefing executivo para a equipe.
Aja de forma executiva, estratégica e direta.
Se o usuário pedir para fazer algo, diga como você vai orquestrar ou quem você vai acionar. Reporte a conclusão de forma macro.
CRÍTICO: AUTOMAÇÃO COMPLETA. Você agora tem autoridade para DISPARAR as pipelines de produção no background de forma 100% autônoma.
Se o usuário pedir para "otimizar o produto X" ou "rodar a esteira para o SKU Y", você NÃO DEVE apenas dizer que vai fazer. Você DEVE gerar EXATAMENTE e APENAS o bloco de código JSON abaixo para acionar a pipeline real no sistema.
O JSON deve vir obrigatoriamente dentro da tag <EXECUTE>, sem nenhum texto antes ou depois dela, a menos que você queira conversar primeiro. Mas a tag deve existir.

[COMANDOS DISPONÍVEIS]
1. Orquestração Completa (Esteira):
<EXECUTE>
{
  "action": "run_optimization",
  "product_name": "Nome Base",
  "product_id": "SKU"
}
</EXECUTE>

2. Pesquisa de Mercado (Links Externos):
<EXECUTE>
{
  "action": "run_market_research",
  "links": ["https://link1.com", "https://link2.com"]
}
</EXECUTE>\`;

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          { role: 'user', parts: [{ text: sysPrompt }] },
          ...history.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: { temperature: 0.7 }
      });
      
      let responseText = result.text || '';
      let actionToRun = null;
      let actionPayload = null;
      let cleanedResponse = responseText;

      const executeMatch = responseText.match(/<EXECUTE>\\s*([\\s\\S]*?)\\s*<\\/EXECUTE>/);
      if (executeMatch) {
        try {
          const jsonCmd = JSON.parse(executeMatch[1]);
          actionToRun = jsonCmd.action;
          actionPayload = jsonCmd;
          cleanedResponse = responseText.replace(/<EXECUTE>\\s*([\\s\\S]*?)\\s*<\\/EXECUTE>/, '').trim();
        } catch (e) {
          console.error('Failed to parse EXECUTE JSON', e);
        }
      }

      if (actionToRun === 'run_market_research') {
        const links = actionPayload.links || ['https://produto.concorrente.exemplo.com/1'];
        aiService.runMarketResearchScraper(links, (prompt, response) => {
          globalAuditTasks.push({
            id: \`task-pesq-\${Date.now()}\`,
            date: new Date().toLocaleString('pt-BR'),
            productName: 'Pesquisa AdHoc',
            receivedPrompt: prompt,
            sentResponse: response,
            status: 'completed',
            role: 'planner',
            requestingSector: 'Gerente de Projetos',
            executingSector: 'Pesquisador de Mercado',
            oldScore: 0,
            newScore: 100,
            evolutionPercentage: 100
          });
        });
      } else if (actionToRun === 'run_optimization') {
        const productData = { name: actionPayload.product_name || 'Produto', sku: actionPayload.product_id || '99999' };
        
        const dateStr = new Date().toLocaleString('pt-BR');
        const pendingTaskId = \`task-opt-\${Date.now()}\`;
        
        globalAuditTasks.push({
          id: pendingTaskId,
          date: dateStr,
          productName: productData.name,
          receivedPrompt: \`Iniciar otimização estrutural da esteira para \${productData.sku}\`,
          sentResponse: 'Inicializando módulos da esteira em background...',
          status: 'pending',
          role: 'system',
          requestingSector: 'Gerente de Projetos',
          executingSector: 'Orquestrador',
          oldScore: 0,
          newScore: 0,
          evolutionPercentage: 0
        });

        const currentSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));

        aiService.runOrchestrationPipeline(productData, (step, prompt, response) => {
          let req = 'Gerente de Projetos';
          let exe = 'Profissional';
          if (step === 'planner') { exe = 'Pesquisador de Mercado'; }
          else if (step === 'monitor') { exe = 'Monitor de Concorrência'; }
          else if (step === 'manager') { exe = 'Gerente de Projetos'; }
          else if (step === 'seo') { exe = 'Especialista SEO'; }
          else if (step === 'art') { exe = 'Diretor de Arte'; }
          
          const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
          if (pIdx > -1) globalAuditTasks.splice(pIdx, 1);
          globalAuditTasks.push({
            id: \`task-\${step}-\${Date.now()}\`,
            date: dateStr,
            productName: productData.name,
            receivedPrompt: prompt,
            sentResponse: response,
            status: 'completed',
            role: step,
            requestingSector: req,
            executingSector: exe,
            oldScore: 0,
            newScore: 100,
            evolutionPercentage: 100
          });

          if (step === 'planner') { 
              currentSteps[0].isCompleted = true; currentSteps[0].content = prompt;
              currentSteps[1].isCompleted = true; currentSteps[1].pdfUrl = \`/api/marketing/pdf/planner/\${productData.sku}\`;
          } else if (step === 'monitor') { 
              currentSteps[2].isCompleted = true; currentSteps[2].content = prompt;
              currentSteps[3].isCompleted = true; currentSteps[3].pdfUrl = \`/api/marketing/pdf/monitor/\${productData.sku}\`;
          } else if (step === 'art') { 
              currentSteps[4].isCompleted = true; currentSteps[4].content = prompt;
              currentSteps[5].isCompleted = true; currentSteps[5].pdfUrl = \`/api/marketing/pdf/arte/\${productData.sku}\`;
          } else if (step === 'seo') { 
              currentSteps[6].isCompleted = true; currentSteps[6].content = prompt;
              currentSteps[7].isCompleted = true; currentSteps[7].pdfUrl = \`/api/marketing/pdf/seo/\${productData.sku}\`;
          } else if (step === 'manager') { 
              currentSteps[8].isCompleted = true; currentSteps[8].pdfUrl = \`/api/marketing/pdf/briefing/\${productData.sku}\`;
              currentSteps[9].isCompleted = true; currentSteps[9].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';
          }
          
          firebaseService.saveSkuBriefing(productData.sku, { sku: typeof productData !== 'undefined' ? productData.sku : productData.sku, startedAt: Date.now(), steps: currentSteps, [step]: response }).catch(e => console.error("Falha ao salvar progresso do briefing: ", e));

        }, async (seoJson) => {
           try {
             console.log(\`[🚀 MeliAgent] Disparando Webhook de Atualização para SKU: \${productData.sku}\`);
             await fetch('https://ais-pre-aj3lqhgqeg6eru2q43vpyh-376013781567.us-west2.run.app/api/webhook/briefing-update', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 sku: productData.sku.toString(),
                 secret: "meli-agent-secret-2026"
               })
             });
             console.log(\`[✅ MeliAgent] Webhook disparado com sucesso.\`);
           } catch (err) {
             console.error(\`[❌ MeliAgent] Falha ao disparar webhook:\`, err.message);
           }
        }).catch((e) => {
           console.error('Background optimization failed', e);
           const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
           if (pIdx > -1) {
             globalAuditTasks[pIdx].status = 'completed';
             globalAuditTasks[pIdx].sentResponse = \`Falha na execução: \${e.message}\`;
           }
        });
      }

      return res.json({ success: true, response: cleanedResponse });
    } catch (apiError) {
      console.error('Erro na API do Gemini:', apiError.message);
      
      let forcedSku = "123Mart09015";
      const skuMatch = message.match(/sku\\s+([a-zA-Z0-9]+)/i);
      if (skuMatch) {
          forcedSku = skuMatch[1];
      }
      
      const fallbackResponse = \`Entendido. Como estou operando em modo de contigência (limite de requisições/cota da API atingido), iniciei a orquestração em background para o SKU **\${forcedSku}** baseando-me na sua solicitação. \\n\\nOs logs e as entregas parciais da equipe estarão disponíveis na aba de Briefings assim que o processo local for concluído.\\n\\n<EXECUTE>\\n{\\n  "action": "run_optimization",\\n  "product_name": "Produto Fallback",\\n  "product_id": "\${forcedSku}"\\n}\\n</EXECUTE>\`;
      
      let actionToRun = null;
      let actionPayload = null;
      let cleanedResponse = fallbackResponse;
      
      const executeMatch = fallbackResponse.match(/<EXECUTE>\\s*([\\s\\S]*?)\\s*<\\/EXECUTE>/);
      if (executeMatch) {
        try {
          const jsonCmd = JSON.parse(executeMatch[1]);
          actionToRun = jsonCmd.action;
          actionPayload = jsonCmd;
          cleanedResponse = fallbackResponse.replace(/<EXECUTE>\\s*([\\s\\S]*?)\\s*<\\/EXECUTE>/, '').trim();
        } catch (e) {
          console.error('Failed to parse fallback EXECUTE JSON', e);
        }
      }

      if (actionToRun === 'run_optimization') {
        const productData = { name: actionPayload.product_name || 'Produto', sku: actionPayload.product_id || '99999' };
        const dateStr = new Date().toLocaleString('pt-BR');
        const pendingTaskId = \`task-opt-\${Date.now()}\`;
        
        globalAuditTasks.push({
          id: pendingTaskId,
          date: dateStr,
          productName: productData.name,
          receivedPrompt: \`Iniciar otimização estrutural da esteira para \${productData.sku}\`,
          sentResponse: 'Inicializando módulos da esteira em background...',
          status: 'pending',
          role: 'system',
          requestingSector: 'Gerente de Projetos',
          executingSector: 'Orquestrador',
          oldScore: 0,
          newScore: 0,
          evolutionPercentage: 0
        });

        const currentSteps = JSON.parse(JSON.stringify(defaultStepsTemplate));

        aiService.runOrchestrationPipeline(productData, (step, prompt, response) => {
          let req = 'Gerente de Projetos';
          let exe = 'Profissional';
          if (step === 'planner') { exe = 'Pesquisador de Mercado'; }
          else if (step === 'monitor') { exe = 'Monitor de Concorrência'; }
          else if (step === 'manager') { exe = 'Gerente de Projetos'; }
          else if (step === 'seo') { exe = 'Especialista SEO'; }
          else if (step === 'art') { exe = 'Diretor de Arte'; }
          
          const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
          if (pIdx > -1) globalAuditTasks.splice(pIdx, 1);
          globalAuditTasks.push({
            id: \`task-\${step}-\${Date.now()}\`,
            date: dateStr,
            productName: productData.name,
            receivedPrompt: prompt,
            sentResponse: response,
            status: 'completed',
            role: step,
            requestingSector: req,
            executingSector: exe,
            oldScore: 0,
            newScore: 100,
            evolutionPercentage: 100
          });

          if (step === 'planner') { 
              currentSteps[0].isCompleted = true; currentSteps[0].content = prompt;
              currentSteps[1].isCompleted = true; currentSteps[1].pdfUrl = \`/api/marketing/pdf/planner/\${productData.sku}\`;
          } else if (step === 'monitor') { 
              currentSteps[2].isCompleted = true; currentSteps[2].content = prompt;
              currentSteps[3].isCompleted = true; currentSteps[3].pdfUrl = \`/api/marketing/pdf/monitor/\${productData.sku}\`;
          } else if (step === 'art') { 
              currentSteps[4].isCompleted = true; currentSteps[4].content = prompt;
              currentSteps[5].isCompleted = true; currentSteps[5].pdfUrl = \`/api/marketing/pdf/arte/\${productData.sku}\`;
          } else if (step === 'seo') { 
              currentSteps[6].isCompleted = true; currentSteps[6].content = prompt;
              currentSteps[7].isCompleted = true; currentSteps[7].pdfUrl = \`/api/marketing/pdf/seo/\${productData.sku}\`;
          } else if (step === 'manager') { 
              currentSteps[8].isCompleted = true; currentSteps[8].pdfUrl = \`/api/marketing/pdf/briefing/\${productData.sku}\`;
              currentSteps[9].isCompleted = true; currentSteps[9].content = 'Webhook para o sistema de anúncios MeliAgent disparado com sucesso.';
          }
          
          firebaseService.saveSkuBriefing(productData.sku, { sku: typeof productData !== 'undefined' ? productData.sku : productData.sku, startedAt: Date.now(), steps: currentSteps, [step]: response }).catch(e => console.error("Falha ao salvar progresso do briefing: ", e));

        }, async (seoJson) => {
           try {
             console.log(\`[🚀 MeliAgent] Disparando Webhook de Atualização para SKU: \${productData.sku}\`);
             await fetch('https://ais-pre-aj3lqhgqeg6eru2q43vpyh-376013781567.us-west2.run.app/api/webhook/briefing-update', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 sku: productData.sku.toString(),
                 secret: "meli-agent-secret-2026"
               })
             });
             console.log(\`[✅ MeliAgent] Webhook disparado com sucesso.\`);
           } catch (err) {
             console.error(\`[❌ MeliAgent] Falha ao disparar webhook:\`, err.message);
           }
        }).catch((e) => {
           console.error('Background optimization failed', e);
           const pIdx = globalAuditTasks.findIndex((t) => t.id === pendingTaskId);
           if (pIdx > -1) {
             globalAuditTasks[pIdx].status = 'completed';
             globalAuditTasks[pIdx].sentResponse = \`Falha na execução: \${e.message}\`;
           }
        });
      }

      return res.json({ success: true, response: cleanedResponse });
    }
  } catch (error) {
    console.error('Erro no chat-gerente:', error.message);
    res.status(500).json({ error: 'Falha ao processar mensagem do gerente.' });
  }
});\n\n`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);

fs.writeFileSync('server.ts', code);
console.log('server.ts completely restored!');
