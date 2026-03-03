import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer id="contact" className="bg-mauve text-blush relative z-40 overflow-hidden min-h-[70vh] flex flex-col justify-between shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-700 ease-in-out rounded-t-[60px] md:rounded-t-[80px]">
      {/* Background Glow & Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-rose/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 blur-[100px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center py-20 md:py-32 relative z-10 px-6 md:px-12">
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          
          {/* BIG CTA SECTION */}
          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-[0.9]">
              Zacznijmy <br /> <span className="text-gold italic">rozmowę.</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-md font-light leading-relaxed">
              Każda podróż zaczyna się od pierwszego kroku. Jestem tu, aby odpowiedzieć na Twoje pytania i rozwiać wątpliwości.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <div className="group relative cursor-pointer">
                <span className="block text-xs uppercase tracking-[0.2em] text-gold mb-2 font-bold">Napisz do mnie</span>
                <a href="mailto:kontakt@nataliapotocka.pl" className="text-2xl md:text-3xl font-serif text-white group-hover:text-gold transition-colors flex items-center gap-4">
                  kontakt@nataliapotocka.pl
                  <svg className="w-6 h-6 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* LINKS */}
          <div className="flex flex-col md:items-end justify-center space-y-12">
            <div className="flex gap-4">
              <a href="#" aria-label="Instagram" className="w-16 h-16 border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-mauve transition-all duration-700 ease-in-out group hover:-translate-y-2 shadow-lg hover:!rounded-full bg-white/5 backdrop-blur-sm" style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}>
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="w-16 h-16 border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-mauve transition-all duration-700 ease-in-out group hover:-translate-y-2 shadow-lg hover:!rounded-full bg-white/5 backdrop-blur-sm" style={{ borderRadius: '63% 37% 30% 70% / 50% 45% 55% 50%' }}>
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                </svg>
              </a>
              <a href="mailto:kontakt@nataliapotocka.pl" aria-label="Email" className="w-16 h-16 border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-mauve transition-all duration-700 ease-in-out group hover:-translate-y-2 shadow-lg hover:!rounded-full bg-white/5 backdrop-blur-sm" style={{ borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%' }}>
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </a>
            </div>
            
            <nav className="flex flex-wrap gap-x-8 gap-y-4 text-lg md:text-xl font-medium justify-center md:justify-end">
              <Link to="/#about" className="text-white/60 hover:text-gold transition-colors relative group">
                O mnie<span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link to="/#offer" className="text-white/60 hover:text-gold transition-colors relative group">
                Oferta<span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link to="/#opinie" className="text-white/60 hover:text-gold transition-colors relative group">
                Opinie<span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>
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