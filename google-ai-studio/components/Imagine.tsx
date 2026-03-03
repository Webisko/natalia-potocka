import React from 'react';
import { Leaf, Heart, BookOpen } from 'lucide-react';

export const Imagine: React.FC = () => {
  return (
    <section className="py-24 bg-nude relative overflow-hidden">
      {/* Background decoration with Breathe Animation */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] bg-blush/40 rounded-full blur-[80px] animate-breathe"></div>
         <div className="absolute bottom-[10%] right-[-5%] w-[300px] h-[300px] bg-gold/5 rounded-full blur-[60px] animate-pulse-slow"></div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-serif text-mauve mb-6">Odkryj swoją naturę</h2>
          <p className="text-mauve/60 text-lg font-light leading-relaxed">
            Moje podejście opiera się na przekonaniu, że poród to instynktowne wydarzenie. 
            Wspólnie budujemy trzy kluczowe filary:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Item 1: Peace */}
          <div className="relative group isolate flex flex-col items-center text-center p-6 rounded-[30px] transition-all duration-300">
             {/* EXPANDING BLOB BACKGROUND */}
             <div 
               className="absolute top-0 left-0 right-0 mx-auto w-48 h-48 bg-white shadow-sm -z-10 transition-all duration-700 ease-in-out group-hover:w-full group-hover:h-full group-hover:inset-0 group-hover:shadow-xl"
               style={{ 
                 borderRadius: '54% 46% 42% 58% / 44% 48% 52% 56%',
               }}
             >
                <style jsx>{`
                  .group:hover > div:first-child {
                    border-radius: 30px !important;
                  }
                `}</style>
             </div>
             
             {/* Icon Container */}
             <div className="w-48 h-48 flex items-center justify-center flex-shrink-0 mb-4 pointer-events-none">
                <Leaf className="w-12 h-12 text-[#E88D67] transition-transform duration-500 group-hover:scale-110" />
             </div>
             
             <div className="relative z-10">
               <h3 className="text-2xl font-serif text-mauve mb-4 transition-colors">Czujesz luz i spokój</h3>
               <p className="text-mauve/70 leading-relaxed max-w-xs mx-auto font-light transition-colors">
                 Zamiast lęku przed porodem, czujesz gotowość i ciekawość nadchodzącego czasu.
               </p>
             </div>
          </div>

          {/* Item 2: Confidence (Middle) */}
          <div className="relative group isolate flex flex-col items-center text-center p-6 rounded-[30px] transition-all duration-300 md:-mt-8">
             {/* EXPANDING BLOB BACKGROUND - TERRACOTTA */}
             <div 
               className="absolute top-0 left-0 right-0 mx-auto w-48 h-48 bg-[#E88D67] shadow-xl shadow-[#E88D67]/20 -z-10 transition-all duration-700 ease-in-out group-hover:w-full group-hover:h-full group-hover:inset-0 group-hover:shadow-2xl animate-heartbeat"
               style={{ borderRadius: '35% 65% 63% 37% / 42% 43% 57% 58%' }}
             >
               <style jsx>{`
                  .group:hover > div:first-child {
                    border-radius: 30px !important;
                    animation: none !important; /* Stop heartbeat when expanded to avoid shaking text */
                    transform: none !important;
                  }
                `}</style>
             </div>
             
             <div className="w-48 h-48 flex items-center justify-center flex-shrink-0 mb-4 pointer-events-none">
                {/* Heart icon - Removed fill-white to match other icons style (outline only) */}
                <Heart className="w-14 h-14 text-white transition-transform duration-500 group-hover:scale-110" />
             </div>
             
             <div className="relative z-10">
               <h3 className="text-2xl font-serif text-mauve mb-4 font-bold transition-colors duration-300 group-hover:text-white">Masz pewność siebie</h3>
               <p className="text-mauve/70 leading-relaxed max-w-xs mx-auto font-light transition-colors duration-300 group-hover:text-white/90">
                 Jesteś pewna swoich kompetencji jako matka i ufasz swojej intuicji.
               </p>
             </div>
          </div>

          {/* Item 3: Knowledge */}
          <div className="relative group isolate flex flex-col items-center text-center p-6 rounded-[30px] transition-all duration-300">
             {/* EXPANDING BLOB BACKGROUND */}
             <div 
               className="absolute top-0 left-0 right-0 mx-auto w-48 h-48 bg-white shadow-sm -z-10 transition-all duration-700 ease-in-out group-hover:w-full group-hover:h-full group-hover:inset-0 group-hover:shadow-xl"
               style={{ borderRadius: '64% 36% 47% 53% / 61% 53% 47% 39%' }}
             >
               <style jsx>{`
                  .group:hover > div:first-child {
                    border-radius: 30px !important;
                  }
                `}</style>
             </div>
             
             <div className="w-48 h-48 flex items-center justify-center flex-shrink-0 mb-4 pointer-events-none">
                <BookOpen className="w-12 h-12 text-[#E88D67] transition-transform duration-500 group-hover:scale-110" />
             </div>
             
             <div className="relative z-10">
               <h3 className="text-2xl font-serif text-mauve mb-4 transition-colors">Masz rzetelną wiedzę</h3>
               <p className="text-mauve/70 leading-relaxed max-w-xs mx-auto font-light transition-colors">
                 Otrzymujesz konkretne informacje o fizjologii, połogu i laktacji, które dają Ci poczucie kontroli i bezpieczeństwa.
               </p>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};