const fs = require('fs');
const path = require('path');
const base = 'c:/Users/filip/Webisko/_KLIENCI/Natalia Potocka/natalia-potocka/src/components';
const files = [
  'SiteHeader.astro',
  'product/ServiceProductTemplate.astro',
  'pages/AboutPageContent.astro',
  'pages/OfferPageContent.astro',
  'home/HomeSections.astro'
];

files.forEach(f => {
  const p = path.join(base, f);
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');

  // Replace wrapper
  c = c.replace(/group relative inline-flex h-12(?!0)[^>]*>/g, 'group relative inline-flex h-[54px] min-w-[14rem] w-auto cursor-pointer items-center justify-start border-0 outline-none">');
  c = c.replace(/group relative inline-flex h-\[52px\][^>]*>/g, 'group relative inline-flex h-[54px] min-w-[14rem] w-auto cursor-pointer items-center justify-start border-0 outline-none">');

  // Replace Gold blob
  c = c.replace(/circle absolute left-0 top-0 z-0 block h-12 w-12 rounded-\[40%_60%_70%_30%\/40%_50%_60%_50%\] bg-gold[^>]*>/g, 
    'circle absolute left-0 top-0 z-0 block h-[54px] w-[54px] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gold transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:w-full group-hover:rounded-[1.7rem]" aria-hidden="true">');
  c = c.replace(/circle absolute left-0 top-0 z-0 block h-\[52px\] w-\[52px\] rounded-\[40%_60%_70%_30%\/40%_50%_60%_50%\] bg-gold[^>]*>/g, 
    'circle absolute left-0 top-0 z-0 block h-[54px] w-[54px] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gold transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:w-full group-hover:rounded-[1.7rem]" aria-hidden="true">');

  // Replace Mauve blob (Secondary)
  c = c.replace(/circle absolute left-0 top-0 z-0 block h-12 w-12 rounded-\[40%_60%_70%_30%\/40%_50%_60%_50%\] bg-mauve[^>]*>/g, 
    'circle absolute left-0 top-0 z-0 block h-[54px] w-[54px] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:w-full group-hover:rounded-[1.7rem]" aria-hidden="true">');
  c = c.replace(/circle absolute left-0 top-0 z-0 block h-\[52px\] w-\[52px\] rounded-\[40%_60%_70%_30%\/40%_50%_60%_50%\] bg-mauve[^>]*>/g, 
    'circle absolute left-0 top-0 z-0 block h-[54px] w-[54px] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:w-full group-hover:rounded-[1.7rem]" aria-hidden="true">');

  // Replace Text styling
  c = c.replace(/relative z-10 w-full whitespace-nowrap pl-14 pr-6[^>]*>/g, 
    'relative z-10 w-full whitespace-nowrap pl-16 pr-8 text-center text-[0.875rem] font-bold uppercase tracking-widest text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white">');
  c = c.replace(/relative z-10 w-full whitespace-nowrap px-6 pl-14 font-bold uppercase tracking-\[0\.16em\] text-\[0\.8rem\] text-mauve[^>]*>/g, 
    'relative z-10 w-full whitespace-nowrap pl-16 pr-8 text-center text-[0.875rem] font-bold uppercase tracking-widest text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white">');

  fs.writeFileSync(p, c);
  console.log('Updated ' + f);
});
