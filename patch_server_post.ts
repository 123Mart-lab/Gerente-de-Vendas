import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const getEndpoint = `app.get('/api/marketing/audit-logs', (req, res) => {
  res.json(globalAuditTasks);
});`;

const postEndpoint = `app.post('/api/marketing/audit-logs', (req, res) => {
  if (req.body && req.body.task) {
    globalAuditTasks.push(req.body.task);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Task is required' });
  }
});`;

if (!content.includes("app.post('/api/marketing/audit-logs'")) {
  content = content.replace(getEndpoint, getEndpoint + '\n\n' + postEndpoint);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log('Added POST audit-logs endpoint');
} else {
  console.log('Endpoint already exists');
}
