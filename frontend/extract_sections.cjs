const fs = require('fs');

let b = fs.readFileSync('../extracted_body.html', 'utf8');

// Pre-strip astro-dev-toolbar to prevent its nested <section>s from being matched
b = b.replace(/<astro-dev-toolbar[\s\S]*?<\/astro-dev-toolbar>/g, '');

let sectionsArray = Array.from(b.matchAll(/<section[\s\S]*?<\/section>/g))
  .map(m => m[0])
  .filter(s => !s.includes('astro-dev-toolbar'))
  .filter(s => !s.includes('id="reviews"'));
let sections = sectionsArray.join('\n');

sections = sections.replace(/http:\/\/localhost:3002/g, '');
sections = sections.replace(/\.\/Natalia Potocka _ Doula i Terapeutka Traumy_files\//g, '/images/');

fs.writeFileSync(
    'src/components/AstroHomeSections.jsx',
    `import parse from 'html-react-parser';\nexport default function AstroHomeSections() { return (<>\n{parse(\`${sections.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)}\n</>); }`
);
