import React from 'react';
import { Instagram, Facebook, Mail, ArrowRight } from 'lucide-react';
import { Button } from './Button';

export const Footer: React.FC = () => {
  const socialLinks = [
    { 
      Icon: Instagram, 
      label: 'Instagram',
      shape: '30% 70% 70% 30% / 30% 30% 70% 70%' 
    },
    { 
      Icon: Facebook, 
      label: 'Facebook',
      shape: '63% 37% 30% 70% / 50% 45% 55% 50%' 
    },
    { 
      Icon: Mail, 
      label: 'Email',
      shape: '40% 60% 60% 40% / 60% 30% 70% 40%' 
    }
  ];

  return (
    <footer 
      id="contact" 
      // CHANGED: Added z-20 and shadow-2xl (configured to cast upward shadow) to overlap the sticky SocialProof
      className="bg-mauve text-blush relative z-20 rounded-t-[60px] md:rounded-t-[80px] overflow-hidden min-h-[70vh] flex flex-col justify-between shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)]"
    >
      {/* Background Glow & Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-rose/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 blur-[100px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center py-20 md:py-32 relative z-10 px-6 md:px-12">
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            
            {/* BIG CTA SECTION */}
            <div className="space-y-8">
               <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-[0.9]">
                 Zacznijmy <br/> <span className="text-gold italic">rozmowę.</span>
               </h2>
               <p className="text-lg md:text-xl text-white/70 max-w-md font-light leading-relaxed">
                 Każda podróż zaczyna się od pierwszego kroku. Jestem tu, aby odpowiedzieć na Twoje pytania i rozwiać wątpliwości.
               </p>
               
               <div className="flex flex-col sm:flex-row gap-6 pt-8">
                  <div className="group relative cursor-pointer">
                     <span className="block text-xs uppercase tracking-[0.2em] text-gold mb-2 font-bold">Napisz do mnie</span>
                     <a href="mailto:kontakt@nataliapotocka.pl" className="text-2xl md:text-3xl font-serif text-white group-hover:text-gold transition-colors flex items-center gap-4">
                        kontakt@nataliapotocka.pl
                        <ArrowRight className="w-6 h-6 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                     </a>
                  </div>
               </div>
            </div>

            {/* LINKS & FORM (Placeholder) */}
            <div className="flex flex-col md:items-end justify-center space-y-12">
               
               {/* Social Icons */}
               <div className="flex gap-4">
                  {socialLinks.map(({ Icon, shape, label }, i) => (
                    <a 
                      key={i} 
                      href="#" 
                      aria-label={label}
                      className="w-16 h-16 border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-mauve transition-all duration-700 ease-in-out group hover:-translate-y-2 shadow-lg hover:!rounded-full bg-white/5 backdrop-blur-sm"
                      style={{ borderRadius: shape }}
                    >
                      <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                    </a>
                  ))}
               </div>

               {/* Quick Nav */}
               <nav className="flex flex-wrap gap-x-8 gap-y-4 text-lg md:text-xl font-medium justify-center md:justify-end">
                  {['O mnie', 'Oferta', 'Opinie', 'Blog', 'Regulamin'].map((item) => (
                    <a key={item} href="#" className="text-white/60 hover:text-gold transition-colors relative group">
                      {item}
                      <span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                    </a>
                  ))}
               </nav>

            </div>
        </div>
      </div>

      {/* COPYRIGHT BAR */}
      <div className="relative z-10 px-6 md:px-12 pb-8">
        <div className="max-w-[1440px] mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30 uppercase tracking-widest">
           <p>&copy; 2024 Natalia Potocka.</p>
           <p>Design with ♥ for mothers.</p>
        </div>
      </div>
    </footer>
  );
};