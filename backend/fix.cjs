const fs = require('fs');

const files = [
  'routes/users.js',
  'routes/boletos.js',
  'routes/settings.js',
  'routes/sender.js',
  'services/mailQueue.js'
];

files.forEach(f => {
  let p = 'c:/Projetos AI/OFC/Boletos/backend/' + f;
  if(fs.existsSync(p)) {
      let c = fs.readFileSync(p, 'utf8');
      c = c.replace(/\\\\`/g, '\\`');
      c = c.replace(/\\\\\\$/g, '$');
      c = c.replace(/\\`/g, '`');
      c = c.replace(/\\\$/g, '$');
      fs.writeFileSync(p, c);
  }
});
console.log('Fixed backend files');
