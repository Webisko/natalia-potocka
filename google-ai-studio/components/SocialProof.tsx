import React, { useState, useEffect, useCallback } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

export const SocialProof: React.FC = () => {
  const testimonials = [
    {
      quote: "Dzięki Natalii mój poród był najpiękniejszym doświadczeniem w życiu. Czułam się silna, sprawcza i zaopiekowana. To magia, której życzę każdej kobiecie.",
      author: "Anna Kowalska",
      role: "Mama 2-miesięcznego Leona",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    },
    {
      quote: "Każde spotkanie było jak SPA dla duszy. Czułam się wysłuchana i zaopiekowana w sposób, jakiego brakowało mi w systemie medycznym. To było dokładnie to, czego potrzebowałam w tym wrażliwym czasie.",
      author: "Karolina",
      role: "Mama Tymona",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    },
    {
      quote: "Jestem bardzo zaskoczona pozytywnymi efektami sesji leczenia traumy. Wreszcie mogę myśleć o moim pierwszym porodzie bez ściśniętego gardła i lęku, który towarzyszył mi przez lata.",
      author: "Flora",
      role: "Po terapii metodą Rewind",
      image: "https://images.unsplash.com/photo-1554151228-14d9def656ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    },
    {
      quote: "Natalia zaszczepiła we mnie spokój oraz pozytywny stosunek do porodu. Dzięki niej uwierzyłam, że moje ciało potrafi rodzić i że mam w sobie siłę, o której wcześniej nie wiedziałam.",
      author: "Ewa",
      role: "Przygotowanie do VBAC",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (!isPaused) {
      interval = setInterval(() => {
        nextSlide();
      }, 7000); 
    }
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section 
      id="reviews"
      // CHANGED: sticky top-0 instead of bottom-0. z-0 to stay behind footer. h-screen to fill view.
      className="bg-nude relative overflow-hidden sticky top-0 z-0 h-screen flex flex-col justify-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* --- BACKGROUND DECORATION: PULSING UMBILICAL CORD --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="w-full h-full" viewBox="0 0 1440 600" preserveAspectRatio="none">
          
          <defs>
            <path id="cordPath" d="M-100,300 C200,100 600,500 1000,300 C1400,100 1600,400 1800,300" />
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="#E6B8B8" stopOpacity="0.1" />
               <stop offset="50%" stopColor="#E6B8B8" stopOpacity="0.8" />
               <stop offset="100%" stopColor="#E6B8B8" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <use 
            href="#cordPath" 
            stroke="#D4AF37" 
            strokeWidth="1" 
            fill="none" 
            opacity="0.2" 
          />

          <use 
            href="#cordPath" 
            stroke="url(#flowGradient)" 
            strokeWidth="3" 
            fill="none"
            strokeDasharray="100 400"
            className="animate-flow-slower" 
            strokeLinecap="round"
          />

           <path 
            d="M-100,320 C220,120 620,520 1020,320 C1420,120 1620,420 1820,320" 
            fill="none" 
            stroke="#5D4058"
            strokeWidth="1"
            opacity="0.1"
          />
          <path 
            d="M-100,320 C220,120 620,520 1020,320 C1420,120 1620,420 1820,320" 
            fill="none" 
            stroke="#E6B8B8"
            strokeWidth="1.5"
            strokeDasharray="50 350"
            className="animate-flow"
            opacity="0.4"
            strokeLinecap="round"
          />

        </svg>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10 w-full">
        
        <div className="max-w-4xl mx-auto text-center relative">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 opacity-[0.05] pointer-events-none">
            <Quote size={200} className="fill-mauve" />
          </div>

          {/* Slider Content */}
          <div className="relative grid grid-cols-1 items-center justify-items-center mb-16">
            {testimonials.map((item, index) => {
              const isActive = index === currentIndex;
              return (
                <div 
                  key={index}
                  className={`
                    col-start-1 row-start-1 w-full flex flex-col items-center
                    transition-all duration-700 ease-out transform
                    ${isActive 
                      ? 'opacity-100 translate-y-0 scale-100 z-10' 
                      : 'opacity-0 translate-y-8 scale-95 z-0 pointer-events-none'}
                  `}
                  aria-hidden={!isActive}
                >
                  <p className="text-2xl md:text-3xl lg:text-4xl leading-relaxed font-serif text-mauve italic mb-12 px-4 md:px-12 drop-shadow-sm min-h-[1.2em]">
                    "{item.quote}"
                  </p>
                  
                  <div className="relative">
                     {/* PLACENTA MOTIF */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-rose/20 -z-10 animate-morph mix-blend-multiply"></div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-gold/40 -z-10 animate-morph animation-delay-2000 rounded-full"></div>

                     <div className="w-20 h-20 rounded-full p-1 border border-white bg-white/50 backdrop-blur-sm shadow-sm">
                        <img 
                          src={item.image} 
                          alt={item.author} 
                          className="w-full h-full object-cover rounded-full"
                        />
                     </div>
                  </div>

                  <div className="mt-6 text-center">
                    <h4 className="font-bold text-mauve text-xl">{item.author}</h4>
                    <p className="text-gold text-xs font-bold tracking-[0.2em] uppercase mt-2">
                      {item.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 md:gap-12 relative">
             <button 
               onClick={prevSlide}
               className="w-14 h-14 flex items-center justify-center border border-mauve/10 hover:bg-gold hover:border-gold hover:text-white transition-all duration-700 ease-in-out group bg-white/50 backdrop-blur-sm hover:-translate-x-1 shadow-sm hover:!rounded-full"
               style={{ borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' }}
             >
               <ChevronLeft className="w-6 h-6 text-mauve/50 group-hover:text-white" />
             </button>

             <div className="flex items-center gap-4 h-6">
               {testimonials.map((_, index) => {
                 const isActive = index === currentIndex;
                 return (
                   <button
                     key={index}
                     onClick={() => setCurrentIndex(index)}
                     className="group relative flex items-center justify-center focus:outline-none"
                   >
                      <span 
                        className={`
                          block transition-all duration-700 ease-in-out group-hover:!rounded-full
                          ${isActive 
                            ? 'bg-gold w-4 h-4 shadow-sm' 
                            : 'bg-mauve/20 w-3 h-3 group-hover:bg-mauve/40'}
                        `}
                        style={{
                           borderRadius: isActive 
                             ? '60% 40% 30% 70% / 60% 30% 70% 40%' 
                             : '40% 60% 50% 50% / 50% 50% 60% 40%'
                        }}
                      />
                      {isActive && (
                        <span 
                          className="absolute inset-0 border border-gold/50 animate-ping opacity-75 group-hover:!rounded-full transition-all duration-700 ease-in-out"
                          style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
                        ></span>
                      )}
                   </button>
                 );
               })}
             </div>

             <button 
               onClick={nextSlide}
               className="w-14 h-14 flex items-center justify-center border border-mauve/10 hover:bg-gold hover:border-gold hover:text-white transition-all duration-700 ease-in-out group bg-white/50 backdrop-blur-sm hover:translate-x-1 shadow-sm hover:!rounded-full"
               style={{ borderRadius: '62% 38% 37% 63% / 59% 56% 44% 41%' }}
             >
               <ChevronRight className="w-6 h-6 text-mauve/50 group-hover:text-white" />
             </button>
          </div>

        </div>
      </div>
    </section>
  );
};