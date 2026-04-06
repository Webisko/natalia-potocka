const fs = require('fs');

const files = [
  'src/components/SiteHeader.astro',
  'src/components/product/ServiceProductTemplate.astro',
  'src/components/pages/AboutPageContent.astro',
  'src/components/pages/OfferPageContent.astro',
  'src/components/home/HomeSections.astro',
  'src/components/ProductCheckout.astro',
  'src/components/product/DigitalProductTemplate.astro',
  'src/components/pages/ContactPageContent.astro',
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');

  // In blob button text spans: replace text-base with text-fs-ui
  // Pattern: "text-center text-base font-bold"
  c = c.replace(/text-center text-base font-bold/g, 'text-center text-fs-ui font-bold');
  
  // Also handle "text-fs-label font-bold" in button spans (some files use this)
  // We only want to change it inside button blob spans, identified by the tracking-widest or tracking-wider context
  // Replace "text-fs-label relative z-10 w-full whitespace-nowrap ... font-bold"  
  c = c.replace(/text-fs-label relative z-10 w-full whitespace-nowrap ([^ ]*) text-center text-base font-bold/g,
    'text-fs-ui relative z-10 w-full whitespace-nowrap $1 text-center font-bold');

  // Also handle pl-xx pr-xx font-bold uppercase tracking-widest text-mauve ...text-center text-fs-label
  // For service product template which has "text-fs-label" already on span
  // - replace "text-fs-label relative z-10 w-full whitespace-nowrap pl-14 pr-6 text-center"
  c = c.replace(/text-fs-label (relative z-10 w-full whitespace-nowrap .{0,20} text-center)/g,
    'text-fs-ui $1');

  fs.writeFileSync(file, c);
  console.log('Fixed ' + file);
});
