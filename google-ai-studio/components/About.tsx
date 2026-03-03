import React from 'react';
import { Button } from './Button';

export const About: React.FC = () => {
  return (
    <section id="about" className="py-32 bg-nude relative overflow-hidden">
      {/* Golden Thread */}
      <svg className="absolute top-0 right-0 h-full opacity-30 pointer-events-none" viewBox="0 0 400 900">
        <path d="M400,0 C200,300 100,600 300,900" fill="none" stroke="#D4AF37" strokeWidth="2" strokeDasharray="5,10" />
      </svg>
      
      {/* Breathing Background Elements */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-rose/10 rounded-full blur-[120px] animate-breathe"></div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-16">
          
          <div className="w-full md:w-1/2 order-2 md:order-1">
             <h2 className="text-4xl md:text-5xl font-serif text-mauve mb-8">
               Matematyczka, <br/>która zaufała <span className="text-gold italic">intuicji</span>.
             </h2>
             <div className="space-y-6 text-lg text-mauve/80 font-light leading-relaxed">
               <p>
                 Brzmi jak sprzeczność? Dla mnie to pełnia. Z wykształcenia jestem umysłem ścisłym. Wiem, jak ważne są fakty i rzetelna wiedza.
               </p>
               <p>
                 Ale macierzyństwo nauczyło mnie, że <span className="font-medium text-mauve">najważniejsze dzieje się między słowami</span>. W emocjach. W ciele.
               </p>
               <p>
                 Jako doula i terapeutka traumy łączę te dwa światy. Daję Ci twarde dane, byś czuła się bezpiecznie, i miękką obecność, byś czuła się zaopiekowana.
               </p>
             </div>
             <div className="mt-10">
               <Button variant="primary">Poznaj mnie lepiej</Button>
             </div>
          </div>

          <div className="w-full md:w-1/2 order-1 md:order-2 flex justify-center">
             <div className="relative w-[350px] h-[350px] md:w-[450px] md:h-[450px]">
                
                {/* Organic Background Blob (Animated) */}
                <div className="absolute inset-0 bg-rose/20 animate-morph blur-md transform scale-105"></div>
                <div className="absolute inset-0 border border-gold/40 animate-morph animation-delay-2000 transform rotate-12 scale-105"></div>

                {/* Main Image Container with Organic Shape */}
                <div 
                  className="relative w-full h-full overflow-hidden shadow-2xl transition-all duration-700 hover:scale-[1.02]"
                  style={{ 
                    // Irregular organic shape similar to Hero
                    borderRadius: '56% 44% 30% 70% / 60% 30% 70% 40%' 
                  }}
                >
                   {/* Overlay for warmth */}
                   <div className="absolute inset-0 bg-gold/5 mix-blend-overlay z-10 pointer-events-none"></div>

                   <img 
                    src="https://picsum.photos/600/600" 
                    alt="Natalia Potocka" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Floating Decorative Elements with Heartbeat */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gold/10 rounded-full blur-xl animate-heartbeat"></div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};