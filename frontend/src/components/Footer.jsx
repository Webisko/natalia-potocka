import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export default function Footer() {
  const footerRef = useRef(null);
  const [borderRadius, setBorderRadius] = useState(80);
  const [maxH, setMaxH] = useState(undefined);

  useEffect(() => {
    const HEADER_H = 64;

    const update = () => {
      if (!footerRef.current) return;

      const viewportH = window.innerHeight;
      const limit = viewportH - HEADER_H;

      // Only apply maxHeight when the footer's natural content fits within the limit.
      // On mobile / small screens the content is taller, so we let it scroll naturally.
      const naturalH = footerRef.current.scrollHeight;
      setMaxH(naturalH <= limit ? `${limit}px` : undefined);

      // Animate border-radius as footer slides up into view
      const rect = footerRef.current.getBoundingClientRect();
      const distanceBelow = rect.top - HEADER_H;
      const START = 160;
      const progress = Math.max(0, Math.min(1, 1 - distanceBelow / START));
      const r = Math.round(80 * (1 - progress));
      setBorderRadius(r);
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <footer
      id="contact"
      ref={footerRef}
      style={{
        borderTopLeftRadius: `${borderRadius}px`,
        borderTopRightRadius: `${borderRadius}px`,
        marginTop: '-160px',
        ...(maxH ? { maxHeight: maxH } : {}),
      }}
      className="bg-mauve text-blush relative z-30 overflow-hidden flex flex-col shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] transition-[border-radius] duration-300 ease-out"
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-rose/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 blur-[100px] pointer-events-none" />
      {/* Vein lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 1440 600" preserveAspectRatio="none">
        <path d="M-100,400 C300,200 700,500 1100,300 C1300,200 1400,350 1600,300" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 18" className="animate-flow-vein-gold" />
        <path d="M-100,450 C300,250 700,550 1100,350 C1300,250 1400,400 1600,350" fill="none" stroke="#E6B8B8" strokeWidth="2" strokeDasharray="14 28" className="animate-flow-vein-rose" />
      </svg>

      <div className="flex-grow flex items-center justify-center py-12 md:py-16 relative z-10 px-8 md:px-16">
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* LEFT: BIG CTA */}
          <div className="space-y-6">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-[0.9]">
              Zacznijmy <br /> <span className="text-gold italic">rozmowę.</span>
            </h2>
            <p className="text-base md:text-lg text-white/70 max-w-md font-light leading-relaxed">
              Każda podróż zaczyna się od pierwszego kroku. Jestem tu, aby odpowiedzieć na Twoje pytania i rozwiać wątpliwości.
            </p>
            <div>
              <span className="block text-xs uppercase tracking-[0.2em] text-gold mb-2 font-bold">Napisz do mnie</span>
              <a href="mailto:kontakt@nataliapotocka.pl" className="group text-xl md:text-2xl font-serif text-white hover:text-gold transition-colors flex items-center gap-4">
                kontakt@nataliapotocka.pl
                <svg className="w-5 h-5 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            {/* Social Media Icons – blob shapes */}
            <div className="flex gap-4">
              <a href="mailto:kontakt@nataliapotocka.pl" aria-label="Email" className="w-12 h-12 border border-white/15 flex items-center justify-center hover:bg-terracotta hover:border-terracotta transition-all duration-500 ease-in-out group hover:-translate-y-1 bg-white/5 backdrop-blur-sm" style={{ borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%' }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="w-12 h-12 border border-white/15 flex items-center justify-center hover:bg-terracotta hover:border-terracotta transition-all duration-500 ease-in-out group hover:-translate-y-1 bg-white/5 backdrop-blur-sm" style={{ borderRadius: '54% 46% 42% 58% / 44% 48% 52% 56%' }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="w-12 h-12 border border-white/15 flex items-center justify-center hover:bg-terracotta hover:border-terracotta transition-all duration-500 ease-in-out group hover:-translate-y-1 bg-white/5 backdrop-blur-sm" style={{ borderRadius: '63% 37% 30% 70% / 50% 45% 55% 50%' }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* RIGHT: Site Map + Copyright */}
          <div className="lg:pt-2 w-full md:w-auto flex flex-col gap-8">
            {/* Two-column sitemap */}
            <div className="grid grid-cols-2 gap-10 md:gap-16">
              {/* Col 1: Pages */}
              <nav className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-gold/80 font-bold mb-1">Mapa strony</p>
                <Link to="/#oferta" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  Oferta<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/o-mnie" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  O mnie<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/#opinie" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  Opinie<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/kontakt" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  Kontakt<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </nav>

              {/* Col 2: Offer */}
              <nav className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-gold/80 font-bold mb-1">Oferta</p>
                <Link to="/oferta/uzdrowienie-traumy-porodowej" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  Uzdrowienie Traumy<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/oferta/konsultacja-indywidualna" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  Konsultacja Indywidualna<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/oferta/otulic-polog" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  Otulić Połóg<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/oferta/porod-domowy" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  Poród Domowy<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/oferta/glowa-w-porodzie" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  Głowa w Porodzie<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/oferta/hipnotyczny-obrot" className="text-white/60 hover:text-gold transition-colors text-sm font-light relative group w-fit">
                  Hipnotyczny Obrót<span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </nav>
            </div>

            {/* Copyright – same vertical level as social icons on the left */}
            <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-white/30 uppercase tracking-widest">
              <p>© {new Date().getFullYear()} Natalia Potocka.</p>
              <p>Designed by <a href="https://webisko.pl" className="hover:text-gold transition-colors" target="_blank" rel="noopener noreferrer">Webisko.pl</a> with ♥</p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}