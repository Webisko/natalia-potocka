const fs = require('fs');
const glob = require('glob');

const files = [
  'src/components/SiteHeader.astro',
  'src/components/product/ServiceProductTemplate.astro',
  'src/components/pages/AboutPageContent.astro',
  'src/components/pages/OfferPageContent.astro',
  'src/components/home/HomeSections.astro'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');

  // Heights and widths:
  c = c.replace(/h-\[54px\]/g, 'h-[50px]');
  c = c.replace(/min-w-\[14rem\]/g, 'min-w-[12rem]');
  c = c.replace(/w-\[54px\]/g, 'w-[50px]');
  
  // Padding & Text:
  // original: pl-16 pr-8 text-center text-[0.875rem]
  // new: pl-14 pr-6 text-center text-base (which is 16px/1rem, up from 14px)
  c = c.replace(/pl-16 pr-8 text-center text-\[0\.875rem\]/g, 'pl-14 pr-6 text-center text-base');
  
  fs.writeFileSync(file, c);
  console.log(`Updated ${file}`);
});
