import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const filterEndpoint = `
let globalSeoFilters = {
  enabled: false,
  min: 0,
  max: 100,
  ignoreKits: false,
  alteredCondition: 'less',
  alteredDays: 7
};

app.post('/api/marketing/seo-filters', (req, res) => {
  globalSeoFilters = req.body;
  res.json({ success: true });
});

app.get('/api/marketing/seo-filters', (req, res) => {
  res.json(globalSeoFilters);
});
`;

if (!content.includes('globalSeoFilters')) {
  content = content.replace("let globalAuditTasks: any[] = [];", "let globalAuditTasks: any[] = [];\n" + filterEndpoint);
}

// Now we update the orchestrate-optimization endpoint
// we need to find where it is
const optimizeEndpointTarget = `app.post('/api/marketing/orchestrate-optimization', async (req, res) => {`;
const optimizeEndpointReplacement = `app.post('/api/marketing/orchestrate-optimization', async (req, res) => {
  try {
    const { productId, query } = req.body;
    
    // SEO Filters check for direct orders
    if (globalSeoFilters.enabled) {
      const isKit = (query || '').toLowerCase().includes('kit');
      
      if (globalSeoFilters.ignoreKits && isKit) {
         return res.json({ 
           success: true, 
           result: [{ step: 'seo', response: 'Neste momento, os filtros aplicados me impedem de fazer alteração no anúncio (Motivo: Variação de kit ignorada).' }]
         });
      }
      
      // Since we don't have Nuvemshop real dates instantly without fetching, we simulate the date block if needed
      // but let's just add the check logic
    }
`;

if (!content.includes('globalSeoFilters.enabled')) {
  content = content.replace(`app.post('/api/marketing/orchestrate-optimization', async (req, res) => { \n  try {\n    const { productId, query } = req.body;`, optimizeEndpointReplacement);
}

fs.writeFileSync('server.ts', content, 'utf8');
