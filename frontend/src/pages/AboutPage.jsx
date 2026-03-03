import { Link } from 'react-router-dom';
import { Heart, BookOpen, Star, Users, Sparkles } from 'lucide-react';

// Decorative vein SVG shared component
function VeinDecoration({ className = '' }) {
  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} viewBox="0 0 1440 600" preserveAspectRatio="none">
      <path d="M-100,300 C300,100 700,500 1100,250 C1350,100 1500,300 1700,200" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 18" className="animate-flow-vein-gold" />
      <path d="M-100,360 C300,160 700,560 1100,310 C1350,160 1500,360 1700,260" fill="none" stroke="#E6B8B8" strokeWidth="2.5" strokeDasharray="14 28" className="animate-flow-vein-rose" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="w-full bg-nude">

      {/* ── HERO INTRO ── */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-10 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blush/30 via-nude to-white pointer-events-none" />
        <VeinDecoration className="opacity-30" />
        {/* Blobs */}
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-rose/20 rounded-full blur-[90px] animate-breathe pointer-events-none" />
        <div className="absolute bottom-10 left-[5%] w-80 h-80 bg-goldLight/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
        {/* Pulsing circle */}
        <div className="absolute top-1/2 right-[20%] w-32 h-32 border border-gold/20 rounded-full animate-pulse-slow pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-6 md:px-12 relative z-10 flex flex-col md:flex-row items-center gap-16 w-full">
          {/* TEXT */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 mb-8">
              <Heart size={14} className="text-terracotta animate-heartbeat" />
              <span className="text-xs font-bold text-terracotta uppercase tracking-[0.2em]">O mnie</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.05] text-mauve mb-8">
              Matematyczka,<br />która zaufała{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#B88A44] italic">intuicji.</span>
            </h1>
            <p className="text-lg md:text-xl text-mauve/70 font-light leading-relaxed max-w-2xl mb-10">
              Jestem edukatorką okołoporodową, doulą i terapeutką traumy. 
              Łączę analityczny umysł z głęboką empatią – by być przy Tobie 
              w sposób, który naprawdę ma znaczenie.
            </p>
            <Link to="/uslugi/konsultacja-indywidualna" className="group relative inline-flex items-center justify-start cursor-pointer outline-none border-0 h-12 min-w-[12rem] w-auto">
              <span className="circle absolute left-0 top-0 block w-12 h-12 bg-gold transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] group-hover:w-full group-hover:rounded-[1.625rem] z-0" aria-hidden="true">
                <span className="icon arrow absolute top-0 bottom-0 m-auto left-[0.625rem] w-[1.125rem] h-[0.125rem] bg-white transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:translate-x-2">
                  <span className="absolute -top-[0.29rem] right-[0.0625rem] w-[0.625rem] h-[0.625rem] border-t-[0.125rem] border-r-[0.125rem] border-white rotate-45"></span>
                </span>
              </span>
              <span className="relative z-10 pl-14 pr-6 font-bold uppercase tracking-wider text-xs md:text-sm text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white whitespace-nowrap w-full text-center">
                Umów konsultację
              </span>
            </Link>
          </div>

          {/* PHOTO */}
          <div className="flex-shrink-0 flex justify-center">
            <div className="relative w-[300px] h-[380px] md:w-[380px] md:h-[480px]">
              <div className="absolute inset-0 bg-rose/20 animate-morph blur-md scale-110" />
              <div className="absolute inset-0 border border-gold/30 animate-morph scale-110" style={{ animationDelay: '2s' }} />
              <div className="relative w-full h-full overflow-hidden shadow-2xl" style={{ borderRadius: '56% 44% 30% 70% / 60% 30% 70% 40%' }}>
                <img src="/images/924-600x600.jpg" alt="Natalia Potocka" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gold/10 rounded-full blur-xl animate-heartbeat" />
            </div>
          </div>
        </div>
      </section>

      {/* ── HISTORIA ── */}
      <section className="py-28 px-6 md:px-12 bg-white/40 relative overflow-hidden">
        {/* SVG cord right */}
        <svg className="absolute top-0 right-0 h-full opacity-20 pointer-events-none" viewBox="0 0 300 800">
          <path d="M300,0 C100,200 200,400 50,600 C0,700 100,800 300,800" fill="none" stroke="#D4AF37" strokeWidth="2" strokeDasharray="6 12" className="animate-flow-vein-gold" />
        </svg>
        {/* Blob */}
        <div className="absolute top-1/2 left-[-5%] w-96 h-96 bg-blush/30 rounded-full blur-[80px] animate-breathe pointer-events-none" />

        <div className="max-w-[1100px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 mb-6">
                <BookOpen size={14} className="text-gold" />
                <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Moja historia</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif text-mauve mb-8 leading-tight">
                Więcej niż wiedza –<br /><span className="text-gold italic">zaopiekowane emocje.</span>
              </h2>
              <div className="space-y-5 text-mauve/70 font-light leading-relaxed text-lg">
                <p>
                  Jestem edukatorką okołoporodową, ale wiedza to nie wszystko. 
                  Wierzę, że w przygotowaniu do macierzyństwa kluczowe są zaopiekowane emocje.
                </p>
                <p>
                  Łączę analityczny umysł (z wykształcenia jestem matematyczką!) z głęboką empatią 
                  douli i kompetencjami terapeutki traumy. Jestem tu, by wesprzeć Cię we wszystkim, 
                  co aktualnie przeżywasz – <span className="text-mauve font-medium">bez oceniania</span>.
                </p>
                <p>
                  Macierzyństwo nie powinno być samotną podróżą przez gąszcz sprzecznych informacji. 
                  Moją rolą jest być przy Tobie – jako przewodniczka, edukatorka i po prostu 
                  ktoś, komu możesz zaufać.
                </p>
                <p>
                  Pracuję w nurcie hipnoterapii (technika Rewind), edukacji okołoporodowej opartej 
                  na dowodach naukowych i doulingu. Każda kobieta jest inna – dlatego moje podejście 
                  jest zawsze dopasowane do Ciebie.
                </p>
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2 flex justify-center">
              <div className="relative w-[280px] h-[380px] md:w-[360px] md:h-[460px]">
                <div className="absolute inset-0 bg-gold/10 animate-morph scale-105" style={{ animationDelay: '1s' }} />
                <div className="relative w-full h-full overflow-hidden shadow-xl" style={{ borderRadius: '40% 60% 60% 40% / 55% 45% 55% 45%' }}>
                  <img src="/images/836-600x800.jpg" alt="Natalia Potocka doula" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-mauve/20 to-transparent" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-20 h-20 border border-gold/40 rounded-full animate-pulse-slow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LICZBY ── */}
      <section className="py-20 px-6 md:px-12 bg-mauve relative overflow-hidden">
        <VeinDecoration className="opacity-10" />
        <div className="max-w-[1100px] mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: '200+', label: 'kobiet we wsparciu' },
              { num: '5+', label: 'lat jako doula' },
              { num: '3', label: 'certyfikaty specjalizacji' },
              { num: '100%', label: 'bez oceniania' },
            ].map((item) => (
              <div key={item.num} className="text-center">
                <div className="text-4xl md:text-5xl font-serif text-gold mb-2">{item.num}</div>
                <div className="text-white/60 text-sm font-light uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WARTOŚCI ── */}
      <section className="py-28 px-6 md:px-12 bg-nude relative overflow-hidden">
        <div className="absolute top-[10%] right-[-5%] w-96 h-96 bg-rose/15 rounded-full blur-[80px] animate-breathe pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-5%] w-80 h-80 bg-gold/5 rounded-full blur-[60px] animate-pulse-slow pointer-events-none" />
        <svg className="absolute left-[50%] top-0 h-full opacity-15 pointer-events-none" viewBox="0 0 200 800">
          <path d="M100,0 C50,200 150,400 80,600 C30,750 120,800 100,800" fill="none" stroke="#E6B8B8" strokeWidth="2" strokeDasharray="10 20" className="animate-flow-vein-rose" />
        </svg>

        <div className="max-w-[1100px] mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <Star size={14} className="text-gold animate-heartbeat" />
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Moje wartości</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-mauve">Jak pracuję?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart size={28} className="text-terracotta" />,
                title: 'Empatia i obecność',
                desc: 'Twoje emocje są ważne. Tworzę przestrzeń, gdzie możesz mówić o wszystkim – bez wstydu i bez cenzury.',
                blob: 'border-radius: 54% 46% 42% 58% / 44% 48% 52% 56%;',
              },
              {
                icon: <BookOpen size={28} className="text-white" />,
                title: 'Wiedza oparta na faktach',
                desc: 'Przekazuję tylko sprawdzone, aktualne informacje oparte na badaniach. Żadnych mitów, żadnego straszenia.',
                blob: 'border-radius: 35% 65% 63% 37% / 42% 43% 57% 58%;',
                highlight: true,
              },
              {
                icon: <Users size={28} className="text-terracotta" />,
                title: 'Szacunek dla wyborów',
                desc: 'Zero oceniania. Poród w domu czy w szpitalu, karmienie piersią czy mlekiem modyfikowanym – każda decyzja jest Twoja.',
                blob: 'border-radius: 64% 36% 47% 53% / 61% 53% 47% 39%;',
              },
            ].map((item) => (
              <div key={item.title} className="blob-card relative group isolate flex flex-col items-center text-center p-8 rounded-[30px] transition-all duration-300">
                <div
                  className={`blob-bg absolute top-8 left-1/2 -ml-20 w-40 h-40 shadow-sm -z-10 transition-all duration-500 ease-out origin-center group-hover:!inset-0 group-hover:!w-full group-hover:!h-full group-hover:!ml-0 group-hover:!top-0 group-hover:!rounded-[30px] group-hover:!shadow-2xl ${item.highlight ? 'bg-terracotta shadow-terracotta/20 animate-heartbeat group-hover:animate-none' : 'bg-white group-hover:!bg-white/95 group-hover:!shadow-mauve/10'}`}
                  style={{ borderRadius: item.blob }}
                />
                <div className="w-20 h-20 flex items-center justify-center flex-shrink-0 mb-6 relative z-10">
                  {item.icon}
                </div>
                <div className="relative z-10">
                  <h3 className={`text-xl font-serif text-mauve mb-3 transition-colors duration-300 ${item.highlight ? 'group-hover:text-white' : ''}`}>{item.title}</h3>
                  <p className={`text-mauve/65 font-light text-sm leading-relaxed ${item.highlight ? 'group-hover:text-white/90' : ''} transition-colors duration-300`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-rose/10 via-nude to-blush/20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose/10 rounded-full blur-[100px] animate-breathe" />
        </div>
        <div className="max-w-[700px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles size={14} className="text-gold animate-heartbeat" />
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Zacznijmy</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-mauve mb-6">
            Gotowa, by porozmawiać?
          </h2>
          <p className="text-mauve/60 font-light text-lg mb-10 leading-relaxed">
            Niezależnie od tego, na jakim etapie jesteś – jestem tu. 
            Napisz do mnie lub umów pierwszą konsultację.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/uslugi/konsultacja-indywidualna" className="group relative inline-flex items-center justify-start cursor-pointer outline-none border-0 h-12 min-w-[12rem] w-auto">
              <span className="circle absolute left-0 top-0 block w-12 h-12 bg-gold transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] group-hover:w-full group-hover:rounded-[1.625rem] z-0" aria-hidden="true">
                <span className="icon arrow absolute top-0 bottom-0 m-auto left-[0.625rem] w-[1.125rem] h-[0.125rem] bg-white transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:translate-x-2">
                  <span className="absolute -top-[0.29rem] right-[0.0625rem] w-[0.625rem] h-[0.625rem] border-t-[0.125rem] border-r-[0.125rem] border-white rotate-45"></span>
                </span>
              </span>
              <span className="relative z-10 pl-14 pr-6 font-bold uppercase tracking-wider text-xs md:text-sm text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white whitespace-nowrap w-full text-center">
                Umów konsultację
              </span>
            </Link>
            <a href="mailto:kontakt@nataliapotocka.pl" className="group relative inline-flex items-center justify-start cursor-pointer outline-none border-0 h-12 min-w-[12rem] w-auto">
              <span className="circle absolute left-0 top-0 block w-12 h-12 bg-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] group-hover:w-full group-hover:rounded-[1.625rem] z-0" aria-hidden="true">
                <span className="icon arrow absolute top-0 bottom-0 m-auto left-[0.625rem] w-[1.125rem] h-[0.125rem] bg-white transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:translate-x-2">
                  <span className="absolute -top-[0.29rem] right-[0.0625rem] w-[0.625rem] h-[0.625rem] border-t-[0.125rem] border-r-[0.125rem] border-white rotate-45"></span>
                </span>
              </span>
              <span className="relative z-10 pl-14 pr-6 font-bold uppercase tracking-wider text-xs md:text-sm text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white whitespace-nowrap w-full text-center">
                Napisz do mnie
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
