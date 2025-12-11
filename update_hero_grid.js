const fs = require('fs');
const path = 'components/Hero.module.css';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/grid-template-columns: 1fr 1fr;/, 'grid-template-columns: 1.3fr 1fr;');
fs.writeFileSync(path, content, 'utf8');
console.log('Updated grid columns');