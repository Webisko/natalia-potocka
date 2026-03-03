import React from 'react';
import { Button } from './Button';

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blush/30 via-nude to-white">
      
      {/* BACKGROUND MOTIF: The "Gold Cord" */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <svg viewBox="0 0 1440 900" className="w-full h-full opacity-40" preserveAspectRatio="none">
          <path 
            d="M-100,600 C200,800 400,200 800,400 C1200,600 1300,100 1600,200" 
            fill="none" 
            stroke="#D4AF37" 
            strokeWidth="1.5"
            className="animate-pulse-slow"
          />
           <path 
            d="M-100,650 C250,850 450,250 850,450 C1250,650 1350,150 1650,250" 
            fill="none" 
            stroke="#E6B8B8" 
            strokeWidth="3"
            strokeDasharray="10,20"
          />
        </svg>
      </div>

      {/* Floating Organic Orbs */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-rose/20 rounded-full blur-[80px] animate-float"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-goldLight/30 rounded-full blur-[100px] animate-pulse-slow"></div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col-reverse md:flex-row items-center gap-12 pt-20">
        
        {/* TEXT CONTENT */}
        <div className="flex-1 text-center md:text-left space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.1] text-mauve drop-shadow-sm">
            Wesprę Cię w drodze do <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#B88A44] italic pr-2">świadomego porodu</span>
          </h1>
          <p className="text-lg md:text-xl text-mauve/80 max-w-xl font-light leading-relaxed">
            Spokój. Zaufanie. Kompetencja. <br/>
            Jestem <strong>Natalią</strong>, Twoją doulą i towarzyszką w podróży przez macierzyństwo.
          </p>
          <div className="pt-6 flex flex-col md:flex-row gap-4 justify-center md:justify-start">
            <Button>Zobacz, jak mogę Ci pomóc</Button>
            <Button variant="outline">Poznaj mnie</Button>
          </div>
        </div>
        
        {/* IMAGE WITH ORGANIC MASK */}
        <div className="flex-1 relative flex justify-center items-center">
           <div className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px]">
             {/* Morphing Blob Background behind image */}
             <div className="absolute inset-0 bg-gold/10 animate-morph mix-blend-multiply scale-110"></div>
             
             {/* Image with irregular border radius */}
             <img 
               src="https://picsum.photos/600/800" 
               alt="Natalia Potocka - Doula" 
               className="relative w-full h-full object-cover shadow-2xl animate-float"
               style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
             />

             {/* Decorative 'Cord' circle */}
             <div className="absolute -bottom-10 -right-10 w-32 h-32 border border-gold rounded-full opacity-40 animate-pulse-slow"></div>
           </div>
        </div>
      </div>

      {/* GRADIENT FADE TO SEAMLESSLY MERGE WITH NEXT SECTION */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-nude via-nude/80 to-transparent z-20 pointer-events-none"></div>
    </section>
  );
};