import React from 'react';
import { Sparkles } from 'lucide-react';

export const QuoteSection: React.FC = () => {
  return (
    <section className="relative py-32 overflow-hidden flex items-center justify-center min-h-[500px] bg-nude">
      
      {/* --- BACKGROUND DECORATION: ORGANIC CORD & FLOW --- */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
         <svg className="absolute w-full h-full opacity-30" viewBox="0 0 1440 600" preserveAspectRatio="none">
            {/* Soft Flowing Curve (Umbilical/Life stream) */}
            <path 
              d="M-200,300 C200,100 600,500 1000,300 C1400,100 1800,400 2200,200" 
              fill="none" 
              stroke="#E6B8B8" 
              strokeWidth="2" 
              className="animate-float" 
              style={{ animationDuration: '10s' }}
            />
            {/* Dashed Pulse Line */}
            <path 
              d="M-200,320 C200,120 600,520 1000,320 C1400,120 1800,420 2200,220" 
              fill="none" 
              stroke="#D4AF37" 
              strokeWidth="1" 
              strokeDasharray="10 30"
              className="animate-flow-slow opacity-60"
            />
         </svg>
         
         {/* Organic Breathing Blob (Placenta/Womb warmth) - Left */}
         <div className="absolute top-1/2 left-[5%] -translate-y-1/2 w-64 h-64 bg-rose/10 rounded-full blur-[60px] animate-breathe mix-blend-multiply"></div>
         
         {/* Organic Breathing Blob (Gold/Sun) - Right */}
         <div className="absolute top-1/2 right-[5%] -translate-y-1/2 w-72 h-72 bg-gold/5 rounded-full blur-[80px] animate-pulse-slow mix-blend-multiply animation-delay-2000"></div>
      </div>

      <div className="mx-auto px-8 md:px-12 max-w-4xl text-center relative z-10">
        
        {/* Decorative Sparkle with Heartbeat */}
        <div className="inline-block relative mb-10">
           <Sparkles className="w-8 h-8 text-gold animate-heartbeat relative z-10" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gold/20 rounded-full blur-xl animate-pulse"></div>
        </div>
        
        <blockquote className="text-2xl md:text-4xl lg:text-[2.75rem] font-serif text-mauve leading-relaxed italic drop-shadow-sm">
          "Macierzyństwo to nie tylko rola, którą przyjmujesz, ale głęboka podróż do wnętrza siebie. Jestem tu, by towarzyszyć Ci w każdym kroku tej drogi."
        </blockquote>
        
        <div className="mt-14 flex flex-col items-center gap-3">
          {/* Organic separator line */}
          <div className="w-24 h-1.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent rounded-full opacity-60"></div>
          
          <span className="text-sm tracking-[0.25em] text-mauve/80 uppercase font-bold mt-2">
            Natalia Potocka
          </span>
        </div>
      </div>
    </section>
  );
};