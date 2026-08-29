import fs from 'fs';
let content = fs.readFileSync('src/services/ai.ts', 'utf8');

const oldSeoPrompt = `    // 3. Especialista SEO
    const seoPrompt = \`Você é um Especialista SEO Sênior. Leia o benchmark e a pesquisa sobre o produto "\${productData.name}":

[BENCHMARK]
\${monitorResponse}
[FIM DO BENCHMARK]`;

const newManagerAndSeo = `    // 3. Gerente de Projetos (Synthesizer)
    const managerPrompt = \`Você é um Gerente de Projetos de E-commerce experiente. Sua tarefa é evitar sobrecarga de informação e sintetizar os dados de pesquisa em um briefing executivo claro e conciso para o Especialista SEO.
    
Aqui estão os relatórios originais do produto "\${productData.name}":
[PESQUISA DE MERCADO]
\${plannerResponse}

[BENCHMARK DO MONITOR]
\${monitorResponse}

Crie um "Briefing Executivo" direto ao ponto. Remova detalhes excessivos e foque apenas no que importa para a conversão (diferenciais, objeções a quebrar e oportunidade de posicionamento).\`;

    const managerResult = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: managerPrompt,
      config: { temperature: 0.7 }
    });
    const managerResponse = managerResult.text;
    if (onStepComplete) onStepComplete('manager', managerPrompt, managerResponse || '');

    // 4. Especialista SEO
    const seoPrompt = \`Você é um Especialista SEO Sênior. Leia o briefing executivo sobre o produto "\${productData.name}":

[BRIEFING EXECUTIVO]
\${managerResponse}
[FIM DO BRIEFING]`;

content = content.replace(oldSeoPrompt, newManagerAndSeo);

// Update the return statement of runOrchestrationPipeline
const oldReturn = `    return {
      results: {
        planner: plannerResponse,
        monitor: monitorResponse,
        seo: seoResponse,
        art: artResponse
      },
      prompts: {
        planner: plannerPrompt,
        monitor: monitorPrompt,
        seo: seoPrompt,
        art: artPrompt
      }
    };`;

const newReturn = `    return {
      results: {
        planner: plannerResponse,
        monitor: monitorResponse,
        manager: managerResponse,
        seo: seoResponse,
        art: artResponse
      },
      prompts: {
        planner: plannerPrompt,
        monitor: monitorPrompt,
        manager: managerPrompt,
        seo: seoPrompt,
        art: artPrompt
      }
    };`;

content = content.replace(oldReturn, newReturn);

fs.writeFileSync('src/services/ai.ts', content, 'utf8');
