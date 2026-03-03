import React from 'react';
import { Button } from './Button';
import { Video, Sparkles, HeartHandshake, User, CheckCircle2, Headphones } from 'lucide-react';

export const Offer: React.FC = () => {
  return (
    <section className="py-24 bg-nude relative w-full overflow-visible">
      
      {/* --- CONNECTING UMBILICAL CORD BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg viewBox="0 0 1440 1600" className="w-full h-full" preserveAspectRatio="none">
           <defs>
             <linearGradient id="cordGradient" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#E6B8B8" stopOpacity="0.0" />
               <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.4" />
               <stop offset="100%" stopColor="#E6B8B8" stopOpacity="0.0" />
             </linearGradient>
           </defs>
           
           <path 
             d="M200,100 C500,300 800,100 1100,300 S1000,800 400,1200" 
             stroke="url(#cordGradient)" 
             strokeWidth="3" 
             fill="none"
             strokeDasharray="20 40"
             className="animate-flow-slow opacity-60"
             strokeLinecap="round"
           />
        </svg>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* === HEADER === */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-mauve mb-6 relative inline-block">
            Wsparcie skrojone na miarę
            <span className="absolute -bottom-2 right-0 w-24 h-1 bg-gold rounded-full opacity-60"></span>
          </h2>
          <p className="text-mauve/70 text-lg font-light">
            Niezależnie od tego, na jakim etapie jesteś – znajdziesz tu bezpieczną przystań.
          </p>
        </div>

        {/* === MAIN CARDS (Trauma & Consultations) === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24 items-stretch">
          
          {/* CARD 1: TRAUMA HEALING */}
          {/* Parent is strictly for layout/grouping - NO OVERFLOW HIDDEN here */}
          <div className="lg:col-span-7 relative group isolate">
             
             {/* 1. BLOB BACKGROUND LAYER (Separated) */}
             <div 
                className="absolute inset-0 bg-white shadow-xl shadow-rose/10 transition-all duration-700 ease-in-out -z-10 group-hover:rounded-[32px] group-hover:shadow-rose/20"
                style={{ 
                   // Aggressive Blob Shape restored
                   borderRadius: '63% 37% 39% 61% / 48% 66% 34% 52%' 
                }}
             >
                {/* Decoration inside the blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                {/* Border on hover */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-rose/10 transition-colors duration-500 rounded-[inherit]"></div>
             </div>

             {/* 2. CONTENT LAYER (Sits on top, not clipped) */}
             <div className="p-10 md:p-14 lg:p-16 h-full flex flex-col justify-center relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-mauve/5 text-mauve text-xs font-bold uppercase tracking-wider mb-6 w-fit border border-mauve/10 backdrop-blur-sm">
                   <HeartHandshake className="w-4 h-4" /> Priorytet
                </div>

                <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif text-mauve mb-6 leading-tight">
                  Uzdrowienie Traumy <br/> <span className="text-gold italic">Porodowej</span>
                </h3>
                
                <p className="text-mauve/70 text-lg mb-8 leading-relaxed font-light max-w-lg">
                  Metoda Rewind to delikatny proces, który pozwala zamknąć trudny rozdział.
                  <span className="block mt-4 font-normal text-mauve/90">Odzyskaj spokój i zaufanie do swojego ciała.</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                  <Button variant="primary" className="shadow-gold/20">Uwolnij się od traumy</Button>
                </div>
             </div>
          </div>

          {/* CARD 2: CONSULTATIONS */}
          <div className="lg:col-span-5 relative group isolate">
             
             {/* 1. BLOB BACKGROUND LAYER */}
             <div 
               className="absolute inset-0 bg-white shadow-lg shadow-gold/5 transition-all duration-700 ease-in-out -z-10 group-hover:rounded-[32px] group-hover:shadow-gold/15 border border-gold/10"
               style={{ 
                  // Aggressive Blob Shape restored
                  borderRadius: '36% 64% 56% 44% / 63% 47% 53% 37%' 
               }}
             >
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold/10 transition-colors duration-500 rounded-[inherit]"></div>
             </div>
             
             {/* 2. CONTENT LAYER */}
             <div className="p-10 md:p-12 h-full flex flex-col relative z-10">
                <div className="mb-auto">
                  <div className="inline-flex items-center gap-2 mb-6">
                    <div className="p-2 bg-gold/10 rounded-full text-mauve">
                       <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-mauve/60">Mentoring 1:1</span>
                  </div>
                  
                  <h3 className="text-3xl font-serif text-mauve mb-4">Konsultacje Indywidualne</h3>
                  <p className="text-mauve/70 font-light mb-6 leading-relaxed">
                    Czas w 100% dla Ciebie. Bezpieczna przestrzeń na omówienie planu porodu czy lęków.
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    {['Analiza planu porodu', 'Wsparcie w laktacji', 'Przygotowanie do VBAC'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-mauve/80 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-gold" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Fixed Button: Removed w-full and conflicting hover classes */}
                <div className="mt-4">
                  <Button variant="outline" className="bg-white/50 backdrop-blur-sm z-20 relative">
                     Umów spotkanie
                  </Button>
                </div>
             </div>
          </div>
        </div>

        {/* === KNOWLEDGE BASE (Webinars + Meditation) === */}
        <div>
           <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-4">
              <div>
                <h3 className="text-3xl md:text-4xl font-serif text-mauve mb-2">
                  Webinary i Medytacje
                </h3>
                <p className="text-mauve/60 text-lg font-light">
                  Wiedza i ukojenie dostępne na wyciągnięcie ręki.
                </p>
              </div>
              <div className="hidden md:block w-32 h-[1px] bg-mauve/10 mb-4"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
             
             {[
               {
                 type: "Webinar",
                 title: "Otulić Połóg",
                 desc: "Kompleksowy plan regeneracji na czwarty trymestr. Dowiedz się, jak zadbać o siebie i niemowlę.",
                 img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2070&auto=format&fit=crop",
                 // True Aggressive Blob A
                 blob: "46% 54% 39% 61% / 55% 38% 62% 45%", 
                 icon: Video
               },
               {
                 type: "Webinar",
                 title: "Poród Domowy",
                 desc: "Poznaj fakty o bezpieczeństwie i kwalifikacji. Sprawdź, czy to rozwiązanie zgodne z Twoją naturą.",
                 img: "https://images.unsplash.com/photo-1628891552573-b26a578912d0?q=80&w=2070&auto=format&fit=crop",
                 // True Aggressive Blob B
                 blob: "35% 65% 60% 40% / 37% 65% 35% 63%",
                 icon: Video
               },
               {
                 type: "Webinar",
                 title: "Głowa w Porodzie",
                 desc: "Zrozum mechanizm lęku i naucz się z nim pracować. Twoje nastawienie zmienia przebieg porodu.",
                 img: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?q=80&w=2072&auto=format&fit=crop",
                 // True Aggressive Blob C
                 blob: "66% 34% 31% 69% / 56% 41% 59% 44%",
                 icon: Video
               },
               {
                 type: "Medytacja",
                 title: "Hipnotyczny Obrót",
                 desc: "Głęboka relaksacja wspierająca obrót dziecka z ułożenia miednicowego. Bezpieczna praca po 37. tygodniu.",
                 img: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070&auto=format&fit=crop", 
                 // True Aggressive Blob D
                 blob: "32% 68% 54% 46% / 64% 32% 68% 36%",
                 icon: Headphones
               }
             ].map((item, index) => (
                <div 
                  key={index} 
                  className="relative group cursor-pointer"
                  // Removed fixed height to allow content to flow naturally
                >
                   {/* 1. IMAGE/BLOB LAYER (Separated) */}
                   <div className="relative h-64 w-full z-0">
                      <div 
                          className="absolute inset-0 bg-white overflow-hidden shadow-lg transition-all duration-700 ease-[cubic-bezier(0.65,0,0.076,1)] transform-gpu group-hover:!rounded-2xl group-hover:shadow-xl"
                          style={{ borderRadius: item.blob }}
                      >
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        />
                        {/* Gradient for depth within the blob */}
                        <div className="absolute inset-0 bg-gradient-to-t from-mauve/40 to-transparent opacity-60"></div>
                      </div>
                   </div>

                   {/* 2. GLASS CARD LAYER (Overlapping & Sticking Out) */}
                   {/* CHANGED: Replaced 'mr-0' with 'mx-4' to add right margin and center the card, making it narrower */}
                   <div className="relative -mt-12 mx-4 z-10">
                      <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
                          <div className="flex justify-between items-start mb-3">
                             <div>
                                <span className="inline-block px-2 py-0.5 rounded-full bg-gold/10 text-[10px] font-bold text-gold uppercase tracking-widest border border-gold/20 mb-1">
                                  {item.type}
                                </span>
                                <h4 className="text-xl font-serif text-mauve leading-tight">
                                   {item.title}
                                </h4>
                             </div>
                             {/* ICON: Prominent placement on the card */}
                             <div className="p-2.5 bg-mauve/5 rounded-full text-mauve group-hover:bg-gold group-hover:text-white transition-colors">
                                <item.icon className="w-5 h-5" />
                             </div>
                          </div>
                          
                          <p className="text-mauve/70 text-sm leading-relaxed font-light line-clamp-3">
                             {item.desc}
                          </p>
                      </div>
                   </div>
                </div>
             ))}

           </div>
        </div>

      </div>
    </section>
  );
};