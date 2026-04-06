const fs = require('fs');

const files = [
  'frontend/src/components/Header.jsx',
  'frontend/src/pages/AboutPage.jsx',
  'frontend/src/pages/ContactPage.jsx',
  'frontend/src/pages/ClientDashboard.jsx',
  'frontend/src/components/AstroHomeSections.jsx',
  'frontend/src/App.jsx',
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;

  // Button blob text spans: replace text-fs-label with text-fs-ui inside button label spans
  // Pattern: "tracking-wider text-fs-label text-mauve" -> "tracking-wider text-fs-ui font-bold text-mauve"  
  // But careful not to change non-button uses of text-fs-label
  // The unique marker is that it's inside a blob button span with pl-14/pl-16 and uppercase
  c = c.replace(/uppercase tracking-wider text-fs-label text-mauve/g,
    'uppercase tracking-wider text-fs-ui font-bold text-mauve');
  c = c.replace(/uppercase tracking-widest text-fs-label text-mauve/g,
    'uppercase tracking-widest text-fs-ui font-bold text-mauve');

  if (c !== orig) {
    fs.writeFileSync(file, c);
    console.log('Fixed ' + file);
  } else {
    console.log('No change: ' + file);
  }
});
