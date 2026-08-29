import fs from 'fs';
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(`        evolutionPercentage: meta.ev
      });
    }, saveProductCallback);
    
    res.json({ success: true, result });`, `        evolutionPercentage: meta.ev
      });
    });
    
    res.json({ success: true, result });`);

fs.writeFileSync('server.ts', server, 'utf8');
