import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const oldParams = `    const params: any = { per_page: 20 };
    if (query) {
      params.q = query;
    }`;

const newParams = `    const params: any = { 
      per_page: Number(req.query.limit) || 200,
      page: Number(req.query.page) || 1
    };
    if (query) {
      params.q = query;
    }`;

content = content.replace(oldParams, newParams);
fs.writeFileSync('server.ts', content, 'utf8');
