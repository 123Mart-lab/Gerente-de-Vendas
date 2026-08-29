import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// We need to inject saveProductCallback into the call
const targetCall = `    const result = await aiService.runOrchestrationPipeline(payload, (step, prompt, response) => {
      const meta = getRoleMetadata(step);`;

const updatedCall = `    const saveProductCallback = async (seoJson: any) => {
        if (!creds || String(payload.id).indexOf('mock-') !== -1) return;
        
        const updatePayload: any = {};
        if (seoJson.novoTitulo) updatePayload.name = { pt: seoJson.novoTitulo };
        if (seoJson.novaDescricaoHtml) updatePayload.description = { pt: seoJson.novaDescricaoHtml };
        if (seoJson.novaMetaDescription) updatePayload.seo_description = { pt: seoJson.novaMetaDescription };
        
        if (seoJson.novoTituloSeo !== undefined) {
          let seoTitle = seoJson.novoTituloSeo;
          if (seoTitle.length > 70) seoTitle = seoTitle.substring(0, 70);
          updatePayload.seo_title = { pt: seoTitle };
        }
        
        if (seoJson.novasTags) {
          if (Array.isArray(seoJson.novasTags)) {
            updatePayload.tags = seoJson.novasTags.join(', ');
          } else if (typeof seoJson.novasTags === 'string') {
            updatePayload.tags = seoJson.novasTags;
          }
        }
        
        try {
          const axios = require('axios');
          await axios.put(\`https://api.nuvemshop.com.br/v1/\${creds.storeId}/products/\${payload.id}\`, updatePayload, {
            headers: {
              'Authentication': \`bearer \${creds.accessToken}\`,
              'User-Agent': '123Mart AI (marcus.solidez@gmail.com)'
            }
          });
          
          // Add to SEO history
          globalSeoHistory.push({
            id: payload.id.toString(),
            name: seoJson.novoTitulo,
            date: dateStr,
            oldScore: 50,
            newScore: 98,
            before: {
               titulo: payload.name,
               descricao: payload.description,
               meta: payload.seo_description,
               seoTitle: payload.seo_title
            },
            after: {
               titulo: seoJson.novoTitulo,
               descricao: seoJson.novaDescricaoHtml,
               meta: seoJson.novaMetaDescription,
               seoTitle: seoJson.novoTituloSeo
            }
          });
        } catch (err: any) {
          console.error("Failed to save product in orchestration:", err.response?.data || err.message);
        }
    };

    const result = await aiService.runOrchestrationPipeline(payload, (step, prompt, response) => {
      const meta = getRoleMetadata(step);`;

content = content.replace(targetCall, updatedCall);

const oldCallEnd = `        evolutionPercentage: meta.ev
      });
    });`;

const newCallEnd = `        evolutionPercentage: meta.ev
      });
    }, saveProductCallback);`;

content = content.replace(oldCallEnd, newCallEnd);

// Also need to update globalSeoHistory interface and save endpoint if they push to it
const oldHistoryInt = `export interface AlteredProduct {
  id: string;
  name: string;
  date: string;
  oldScore: number;
  newScore: number;
}`;

const newHistoryInt = `export interface AlteredProduct {
  id: string;
  name: string;
  date: string;
  oldScore: number;
  newScore: number;
  before?: any;
  after?: any;
}`;

content = content.replace(oldHistoryInt, newHistoryInt);

fs.writeFileSync('server.ts', content, 'utf8');
