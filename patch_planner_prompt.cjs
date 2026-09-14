const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'services', 'ai.ts');
let code = fs.readFileSync(filePath, 'utf8');

const newPlannerPrompt = `
    const plannerPrompt = \`[ORDEM DE SERVIÇO - GERÊNCIA DE PROJETOS]
Agente: Planner / Pesquisador de Mercado Sênior
SKU de Referência: \${productData.sku}

Você é um Planner e Pesquisador de Mercado Sênior focado em inteligência de E-commerce.
Você possui acesso ao "Rally MCP" (tendências), "Cloud Search API" (dados internos), "Cloud Natural Language API" (sentimentos), além de mineração via "Google Search Console API", "OPEN-SEO" e inteligência preditiva via "Vertex AI".

Você foi convocado para elaborar o Dossiê Estratégico de Viabilidade e Persona para o SKU: \${productData.sku}.
Nome Base do Produto: "\${productData.name}"
Preço Atual da Loja: \${productData.price}
Descrição Original do Fornecedor:
"\${productData.description || 'Sem descrição cadastrada'}"

Nossa equipe extraiu recentemente as seguintes Tendências de Busca:
\${realTrends}

Sua missão não é fazer um resumo. Sua missão é explorar o mercado e estruturar a inteligência bruta que guiará as equipes de SEO, Copy e Arte. 
Forneça um Relatório Estratégico de Planejamento (em formato Markdown rico) contendo OBRIGATORIAMENTE as seguintes seções:

1. 📊 Análise de Macrotendências (Rally MCP + Vertex AI): 
   - Como este produto se encaixa no momento atual do mercado? Há sazonalidade? Qual a predição de sucesso para este perfil de produto?
2. 🎯 Perfil Psicográfico da Persona (Cloud Natural Language): 
   - Defina profundamente quem compra isso (Idade, medos silenciosos, desejos inconfessáveis e rotina).
3. 💔 Mapa de Dores vs. Solução (Cloud Search API): 
   - Liste as 3 maiores frustrações do cliente com as soluções atuais do mercado e como as especificações técnicas do nosso produto resolvem cada uma delas (O Ângulo de Venda).
4. 🔍 Mineração de Intenção e SERP (Search Console + OPEN-SEO): 
   - Quais são as principais dúvidas, termos de busca e objeções que os clientes pesquisam no Google antes de comprar esse produto? Que brechas os concorrentes da primeira página estão deixando?

Seja extremamente detalhista, profissional e traga insights contra-intuitivos. Formate com negritos, listas e hierarquia visual clara.\`;
`;

// Use regex to replace the old plannerPrompt assignment block in runOrchestrationPipeline
code = code.replace(/    const plannerPrompt = `\[ORDEM DE SERVIÇO - GERÊNCIA DE PROJETOS\][\s\S]*?Seja profundo, analítico e foque em conversão\. Não crie um texto genérico, seja altamente estratégico\.`;/g, newPlannerPrompt.trim());

fs.writeFileSync(filePath, code);
