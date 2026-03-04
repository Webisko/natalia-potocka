import { Link } from 'react-router-dom';
import { Heart, BookOpen, Users, Star } from 'lucide-react';

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

        <div className="max-w-[1440px] mx-auto px-8 md:px-16 relative z-10 flex flex-col md:flex-row items-center gap-16 w-full">
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
            <Link to="/oferta/konsultacja-indywidualna" className="group relative inline-flex items-center justify-start cursor-pointer outline-none border-0 h-12 min-w-[12rem] w-auto">
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
              <div className="absolute inset-0 bg-rose/20 animate-morph blur-md scale-110" style={{ borderRadius: '56% 44% 30% 70% / 60% 30% 70% 40%' }} />
              <div className="absolute inset-0 border border-gold/30 animate-morph scale-110" style={{ animationDelay: '2s', borderRadius: '56% 44% 30% 70% / 60% 30% 70% 40%' }} />
              <div className="relative w-full h-full overflow-hidden shadow-2xl" style={{ borderRadius: '56% 44% 30% 70% / 60% 30% 70% 40%' }}>
                <img src={`${import.meta.env.BASE_URL}images/about_doula.png`} alt="Natalia Potocka" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gold/10 rounded-full blur-xl animate-heartbeat" />
            </div>
          </div>
        </div>
      </section>

      {/* ── HISTORIA (Więcej niż wiedza) – image LEFT, text RIGHT ── */}
      <section className="py-28 px-8 md:px-16 bg-white/40 relative overflow-hidden">
        {/* SVG cord right */}
        <svg className="absolute top-0 right-0 h-full opacity-20 pointer-events-none" viewBox="0 0 300 800">
          <path d="M300,0 C100,200 200,400 50,600 C0,700 100,800 300,800" fill="none" stroke="#D4AF37" strokeWidth="2" strokeDasharray="6 12" className="animate-flow-vein-gold" />
        </svg>
        {/* Blob */}
        <div className="absolute top-1/2 left-[-5%] w-96 h-96 bg-blush/30 rounded-full blur-[80px] animate-breathe pointer-events-none" />

        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            {/* IMAGE – LEFT, bigger */}
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative w-[320px] h-[420px] md:w-[420px] md:h-[540px]">
                <div className="absolute inset-0 bg-rose/20 animate-morph blur-md scale-110" style={{ borderRadius: '40% 60% 60% 40% / 55% 45% 55% 45%' }} />
                <div className="absolute inset-0 border border-gold/30 animate-morph scale-110" style={{ animationDelay: '2s', borderRadius: '40% 60% 60% 40% / 55% 45% 55% 45%' }} />
                <div className="relative w-full h-full overflow-hidden shadow-xl" style={{ borderRadius: '40% 60% 60% 40% / 55% 45% 55% 45%' }}>
                  <img src={`${import.meta.env.BASE_URL}images/hero_doula.png`} alt="Natalia Potocka doula" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-mauve/20 to-transparent" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gold/10 rounded-full blur-xl animate-heartbeat" />
              </div>
            </div>
            {/* TEXT – RIGHT */}
            <div className="lg:w-1/2">
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
          </div>
        </div>
      </section>

      {/* ── WARTOŚCI (Jak pracuję) – exact same styles as homepage blob cards ── */}
      <section className="pt-28 pb-64 px-8 md:px-16 bg-nude relative overflow-hidden">
        <div className="absolute top-[10%] right-[-5%] w-96 h-96 bg-rose/15 rounded-full blur-[80px] animate-breathe pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-5%] w-80 h-80 bg-gold/5 rounded-full blur-[60px] animate-pulse-slow pointer-events-none" />
        <svg className="absolute left-[50%] top-0 h-full opacity-15 pointer-events-none" viewBox="0 0 200 800">
          <path d="M100,0 C50,200 150,400 80,600 C30,750 120,800 100,800" fill="none" stroke="#E6B8B8" strokeWidth="2" strokeDasharray="10 20" className="animate-flow-vein-rose" />
        </svg>

        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4">
              <Star size={14} className="text-gold animate-heartbeat" />
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Moje wartości</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-mauve">Jak pracuję?</h2>
          </div>
          {/* Cards – exact same styles as homepage "Odkryj swoją naturę" */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Item 1: Empatia */}
            <div className="blob-card relative group isolate flex flex-col items-center text-center p-8 rounded-[30px] transition-all duration-300">
              <div className="blob-bg absolute top-8 left-1/2 -ml-20 w-40 h-40 bg-white shadow-sm -z-10 transition-all duration-500 ease-out origin-center group-hover:!inset-0 group-hover:!w-full group-hover:!h-full group-hover:!ml-0 group-hover:!top-0 group-hover:!rounded-[30px] group-hover:!bg-white/95 group-hover:!shadow-2xl group-hover:!shadow-mauve/10" style={{ borderRadius: '54% 46% 42% 58% / 44% 48% 52% 56%' }}></div>
              <div className="w-40 h-40 flex items-center justify-center flex-shrink-0 mb-6 relative z-10">
                <Heart size={48} className="text-terracotta transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-serif text-mauve mb-4">Empatia i obecność</h3>
                <p className="text-mauve/70 leading-relaxed max-w-xs mx-auto font-light">
                  Twoje emocje są ważne. Tworzę przestrzeń, gdzie możesz mówić o wszystkim – bez wstydu i bez cenzury.
                </p>
              </div>
            </div>
            {/* Item 2: Wiedza (highlighted, middle, elevated) */}
            <div className="blob-card relative group isolate flex flex-col items-center text-center p-8 rounded-[30px] transition-all duration-300 md:-mt-8">
              <div className="blob-bg absolute top-8 left-1/2 -ml-20 w-40 h-40 bg-terracotta shadow-xl shadow-terracotta/20 -z-10 transition-all duration-500 ease-out origin-center animate-heartbeat group-hover:!inset-0 group-hover:!w-full group-hover:!h-full group-hover:!ml-0 group-hover:!top-0 group-hover:!rounded-[30px] group-hover:!shadow-2xl group-hover:!animate-none" style={{ borderRadius: '35% 65% 63% 37% / 42% 43% 57% 58%' }}></div>
              <div className="w-40 h-40 flex items-center justify-center flex-shrink-0 mb-6 relative z-10">
                <BookOpen size={56} className="text-white transition-transform duration-500 animate-heartbeat group-hover:scale-110 group-hover:animate-none" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-serif text-mauve mb-4 transition-colors duration-300 group-hover:text-white">Wiedza oparta na faktach</h3>
                <p className="text-mauve/70 leading-relaxed max-w-xs mx-auto font-light transition-colors duration-300 group-hover:text-white/90">
                  Przekazuję tylko sprawdzone, aktualne informacje oparte na badaniach. Żadnych mitów, żadnego straszenia.
                </p>
              </div>
            </div>
            {/* Item 3: Szacunek */}
            <div className="blob-card relative group isolate flex flex-col items-center text-center p-8 rounded-[30px] transition-all duration-300">
              <div className="blob-bg absolute top-8 left-1/2 -ml-20 w-40 h-40 bg-white shadow-sm -z-10 transition-all duration-500 ease-out origin-center group-hover:!inset-0 group-hover:!w-full group-hover:!h-full group-hover:!ml-0 group-hover:!top-0 group-hover:!rounded-[30px] group-hover:!bg-white/95 group-hover:!shadow-2xl group-hover:!shadow-mauve/10" style={{ borderRadius: '64% 36% 47% 53% / 61% 53% 47% 39%' }}></div>
              <div className="w-40 h-40 flex items-center justify-center flex-shrink-0 mb-6 relative z-10">
                <Users size={48} className="text-terracotta transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-serif text-mauve mb-4">Szacunek dla wyborów</h3>
                <p className="text-mauve/70 leading-relaxed max-w-xs mx-auto font-light">
                  Zero oceniania. Poród w domu czy w szpitalu, karmienie piersią czy mlekiem modyfikowanym – każda decyzja jest Twoja.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
