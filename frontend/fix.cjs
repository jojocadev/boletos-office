const fs = require('fs');

const files = [
  'App.jsx',
  'pages/BoletoImport.jsx',
  'pages/QueueManager.jsx',
  'pages/HistoryLogs.jsx',
  'pages/UsersPage.jsx'
];

files.forEach(f => {
  let p = 'c:/Projetos AI/OFC/Boletos/frontend/src/' + f;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/\\\\`/g, '\\`');
  c = c.replace(/\\\\\\$/g, '$');
  // the exact string is \` and \$, meaning it is a backslash followed by backtick
  // in JS string: "\\`"
  c = c.replace(/\\`/g, '`');
  c = c.replace(/\\\$/g, '$');
  fs.writeFileSync(p, c);
});
console.log('Fixed from fix.js');
