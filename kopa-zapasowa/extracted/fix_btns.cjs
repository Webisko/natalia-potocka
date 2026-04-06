const fs = require('fs');

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

  // Change h-[54px] -> h-[50px]
  c = c.replace(/h-\[54px\]/g, 'h-[50px]');
  // Change min-w-[14rem] -> min-w-[12rem]
  c = c.replace(/min-w-\[14rem\]/g, 'min-w-[12rem]');
  // Change w-[54px] -> w-[50px]
  c = c.replace(/w-\[54px\]/g, 'w-[50px]');
  
  // Padding & Text:
  // original: pl-16 pr-8 text-center text-[0.875rem]
  // new: pl-14 pr-6 text-center text-[0.95rem] (or text-base)
  c = c.replace(/pl-16 pr-8 text-center text-\[0\.875rem\]/g, 'pl-14 pr-6 text-center text-base');
  
  fs.writeFileSync(file, c);
  console.log('Fixed ' + file);
});
