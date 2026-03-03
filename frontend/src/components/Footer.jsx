import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export default function Footer() {
  const footerRef = useRef(null);
  const [borderRadius, setBorderRadius] = useState(80);

  useEffect(() => {
    const HEADER_H = 64; // h-16

    const handleScroll = () => {
      if (!footerRef.current) return;
      const rect = footerRef.current.getBoundingClientRect();
      // rect.top = distance from viewport top to footer top
      // When rect.top <= HEADER_H the footer has "met" the header
      const distanceBelow = rect.top - HEADER_H;
      // Animate from 80px radius (at distanceBelow >= 120) to 0 (at distanceBelow <= 0)
      const START = 120;
      const progress = Math.max(0, Math.min(1, 1 - distanceBelow / START));
      const r = Math.round(80 * (1 - progress));
      setBorderRadius(r);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer
      id="contact"
      ref={footerRef}
      style={{ borderTopLeftRadius: `${borderRadius}px`, borderTopRightRadius: `${borderRadius}px` }}
      className="bg-mauve text-blush relative z-40 overflow-hidden min-h-[70vh] flex flex-col justify-between shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] transition-[border-radius] duration-300 ease-out"
    >
      {/* Background Glow & Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-rose/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 blur-[100px] pointer-events-none"></div>
      {/* Vein line decoration */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 1440 600" preserveAspectRatio="none">
        <path d="M-100,400 C300,200 700,500 1100,300 C1300,200 1400,350 1600,300" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 18" className="animate-flow-vein-gold" />
        <path d="M-100,450 C300,250 700,550 1100,350 C1300,250 1400,400 1600,350" fill="none" stroke="#E6B8B8" strokeWidth="2" strokeDasharray="14 28" className="animate-flow-vein-rose" />
      </svg>

      <div className="flex-grow flex items-center justify-center py-20 md:py-28 relative z-10 px-6 md:px-12">
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* LEFT: BIG CTA */}
          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-[0.9]">
              Zacznijmy <br /> <span className="text-gold italic">rozmowę.</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-md font-light leading-relaxed">
              Każda podróż zaczyna się od pierwszego kroku. Jestem tu, aby odpowiedzieć na Twoje pytania i rozwiać wątpliwości.
            </p>
            <div className="pt-4">
              <span className="block text-xs uppercase tracking-[0.2em] text-gold mb-2 font-bold">Napisz do mnie</span>
              <a href="mailto:kontakt@nataliapotocka.pl" className="group text-2xl md:text-3xl font-serif text-white hover:text-gold transition-colors flex items-center gap-4">
                kontakt@nataliapotocka.pl
                <svg className="w-6 h-6 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* RIGHT: 2 columns – nav + social */}
          <div className="grid grid-cols-2 gap-10 lg:pt-4">

            {/* NAV */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold/80 font-bold mb-5">Nawigacja</p>
              <nav className="flex flex-col gap-3">
                <Link to="/o-mnie" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group">
                  O mnie<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/#offer" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group">
                  Oferta<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/#opinie" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group">
                  Opinie<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </nav>

              <p className="text-xs uppercase tracking-[0.2em] text-gold/80 font-bold mt-7 mb-4">Produkty</p>
              <nav className="flex flex-col gap-2.5">
                <Link to="/produkty/otulic-polog" className="text-white/50 hover:text-gold transition-colors text-xs font-light">Otulić Połóg</Link>
                <Link to="/produkty/porod-domowy" className="text-white/50 hover:text-gold transition-colors text-xs font-light">Poród Domowy</Link>
                <Link to="/produkty/glowa-w-porodzie" className="text-white/50 hover:text-gold transition-colors text-xs font-light">Głowa w Porodzie</Link>
                <Link to="/produkty/hipnotyczny-obrot" className="text-white/50 hover:text-gold transition-colors text-xs font-light">Hipnotyczny Obrót</Link>
              </nav>

              <p className="text-xs uppercase tracking-[0.2em] text-gold/80 font-bold mt-7 mb-4">Usługi</p>
              <nav className="flex flex-col gap-2.5">
                <Link to="/uslugi/uzdrowienie-traumy-porodowej" className="text-white/50 hover:text-gold transition-colors text-xs font-light">Uzdrowienie Traumy</Link>
                <Link to="/uslugi/konsultacja-indywidualna" className="text-white/50 hover:text-gold transition-colors text-xs font-light">Konsultacja Indywidualna</Link>
              </nav>
            </div>

            {/* CONTACT & SOCIAL */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold/80 font-bold mb-5">Kontakt</p>
              <div className="flex flex-col gap-4 mb-8">
                <a href="mailto:kontakt@nataliapotocka.pl" className="flex items-center gap-3 text-white/60 hover:text-gold transition-colors text-sm font-light group">
                  <div className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  Email
                </a>
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-gold/80 font-bold mb-4">Social Media</p>
              <div className="flex flex-col gap-3">
                <a href="#" className="flex items-center gap-3 text-white/60 hover:text-gold transition-colors text-sm font-light group">
                  <div className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  Instagram
                </a>
                <a href="#" className="flex items-center gap-3 text-white/60 hover:text-gold transition-colors text-sm font-light group">
                  <div className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                    </svg>
                  </div>
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT BAR */}
      <div className="relative z-10 px-6 md:px-12 pb-8">
        <div className="max-w-[1440px] mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30 uppercase tracking-widest">
          <p>© 2024 Natalia Potocka.</p>
          <p>Design with ♥ for mothers.</p>
        </div>
      </div>
    </footer>
  );
}