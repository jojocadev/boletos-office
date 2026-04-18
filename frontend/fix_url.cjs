const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
    const target = path.join(dir, f);
    let content = fs.readFileSync(target, 'utf8');
    
    // Using Regex to safely replace http://localhost:3001 with modern template literals or variables.
    // Example: fetch('http://localhost:3001/api/auth') => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth`)
    content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}$1`");

    fs.writeFileSync(target, content);
});

console.log("URLs updated.");
