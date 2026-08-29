import fs from 'fs';

// 1. Fix TaskAuditPanel
let audit = fs.readFileSync('src/components/publicidade/TaskAuditPanel.tsx', 'utf8');
if (audit.indexOf('Sparkles') !== -1 && audit.indexOf('Sparkles') > audit.indexOf('lucide-react')) {
  audit = audit.replace('CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Building2, Target }', 'CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Building2, Target, Sparkles }');
  fs.writeFileSync('src/components/publicidade/TaskAuditPanel.tsx', audit, 'utf8');
}

// 2. Fix ai.ts
let ai = fs.readFileSync('src/services/ai.ts', 'utf8');
ai = ai.replace('const seoResponsePayload = JSON.stringify({', 'const seoResponsePayloadJSON = JSON.stringify({');
ai = ai.replace("if (onStepComplete) onStepComplete('seo', seoPrompt, seoResponsePayload);", "if (onStepComplete) onStepComplete('seo', seoPrompt, seoResponsePayloadJSON);");
ai = ai.replace("const seoResponse = seoResult.text;", "");
fs.writeFileSync('src/services/ai.ts', ai, 'utf8');

// 3. Fix server.ts
let server = fs.readFileSync('server.ts', 'utf8');

// Fix the closing bracket of runOrchestrationPipeline
server = server.replace(`        evolutionPercentage: meta.ev
      });
    });`, `        evolutionPercentage: meta.ev
      });
    }, saveProductCallback);`);

// Fix globalSeoHistory and creds
const fixSave = `          // Add to SEO history
          const history = await firebaseService.getSeoHistory();
          history.unshift({
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
          await firebaseService.saveSeoHistory(history);`;

server = server.replace(`          // Add to SEO history
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
          });`, fixSave);

// Fix creds block which was likely missing or incomplete in that context
// But wait, the patch I wrote had `if (!creds || ...` but `creds` is not defined in `saveProductCallback`!
const credsFix = `    const saveProductCallback = async (seoJson: any) => {
        let creds: any = null;
        if (process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
          creds = { accessToken: process.env.NUVEMSHOP_ACCESS_TOKEN.replace(/[^a-zA-Z0-9]/g, ''), storeId: process.env.NUVEMSHOP_STORE_ID.replace(/[^0-9]/g, '') };
        } else {
          try { creds = await firebaseService.getNuvemshopCredentials(); } catch (err) {}
        }
        
        if (!creds || String(payload.id).indexOf('mock-') !== -1) return;`;

server = server.replace(`    const saveProductCallback = async (seoJson: any) => {
        if (!creds || String(payload.id).indexOf('mock-') !== -1) return;`, credsFix);
        
server = server.replace(`        if (seoJson.novoTitulo) updatePayload.name = { pt: seoJson.novoTitulo };
        if (seoJson.novaDescricaoHtml) updatePayload.description = { pt: seoJson.novaDescricaoHtml };
        if (seoJson.novaMetaDescription) updatePayload.seo_description = { pt: seoJson.novaMetaDescription };`, `        if (seoJson.novoTitulo) updatePayload.name = { pt: seoJson.novoTitulo };
        if (seoJson.novaDescricaoHtml) updatePayload.description = { pt: seoJson.novaDescricaoHtml };
        if (seoJson.novaMetaDescription) updatePayload.seo_description = { pt: seoJson.novaMetaDescription };`);
        
// The previous linter errors:
// server.ts(542,30): error TS2551: Property 'seo_description' does not exist on type '{ id: any; name: any; price: any; description: any; }'. Did you mean 'description'?
server = server.replace(`meta: payload.seo_description,`, `meta: (payload as any).seo_description,`);
server = server.replace(`seoTitle: payload.seo_title`, `seoTitle: (payload as any).seo_title`);

fs.writeFileSync('server.ts', server, 'utf8');
