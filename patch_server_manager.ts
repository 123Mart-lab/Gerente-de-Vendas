import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const oldGetRole = `    const getRoleMetadata = (step: string) => {
      switch (step) {
        case 'planner':
          return { req: 'Gerente de Projetos', exe: 'Pesquisador de Mercado', oldS: 35, newS: 60, ev: 71 };
        case 'monitor':
          return { req: 'Pesquisador de Mercado', exe: 'Monitor de Concorrência', oldS: 60, newS: 75, ev: 25 };
        case 'seo':
          return { req: 'Monitor de Concorrência', exe: 'Especialista SEO', oldS: 75, newS: 90, ev: 20 };
        case 'art':
          return { req: 'Especialista SEO', exe: 'Diretor de Arte', oldS: 90, newS: 98, ev: 8 };
        default:
          return { req: 'Gerente de Projetos', exe: 'Profissional', oldS: 50, newS: 70, ev: 40 };
      }
    };`;

const newGetRole = `    const getRoleMetadata = (step: string) => {
      switch (step) {
        case 'planner':
          return { req: 'Gerente de Projetos', exe: 'Pesquisador de Mercado', oldS: 35, newS: 60, ev: 71 };
        case 'monitor':
          return { req: 'Pesquisador de Mercado', exe: 'Monitor de Concorrência', oldS: 60, newS: 75, ev: 25 };
        case 'manager':
          return { req: 'Monitor de Concorrência', exe: 'Gerente de Projetos', oldS: 75, newS: 85, ev: 13 };
        case 'seo':
          return { req: 'Gerente de Projetos', exe: 'Especialista SEO', oldS: 85, newS: 95, ev: 11 };
        case 'art':
          return { req: 'Especialista SEO', exe: 'Diretor de Arte', oldS: 95, newS: 98, ev: 3 };
        default:
          return { req: 'Gerente de Projetos', exe: 'Profissional', oldS: 50, newS: 70, ev: 40 };
      }
    };`;

content = content.replace(oldGetRole, newGetRole);
fs.writeFileSync('server.ts', content, 'utf8');
