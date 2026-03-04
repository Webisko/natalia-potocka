import { Heart } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="w-full bg-nude min-h-screen">
      {/* ── HERO ── */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blush/30 via-nude to-white pointer-events-none" />
        
        {/* Vein decoration */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 1440 600" preserveAspectRatio="none">
          <path d="M-100,300 C300,100 700,500 1100,250 C1350,100 1500,300 1700,200" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 18" className="animate-flow-vein-gold" />
          <path d="M-100,360 C300,160 700,560 1100,310 C1350,160 1500,360 1700,260" fill="none" stroke="#E6B8B8" strokeWidth="2.5" strokeDasharray="14 28" className="animate-flow-vein-rose" />
        </svg>

        {/* Blobs */}
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-rose/20 rounded-full blur-[90px] animate-breathe pointer-events-none" />
        <div className="absolute bottom-10 left-[5%] w-80 h-80 bg-goldLight/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />

        <div className="max-w-[900px] mx-auto px-8 md:px-16 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <Heart size={14} className="text-terracotta animate-heartbeat" />
            <span className="text-xs font-bold text-terracotta uppercase tracking-[0.2em]">Kontakt</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.05] text-mauve mb-8">
            Zacznijmy{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#B88A44] italic">rozmowę.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-mauve/70 font-light leading-relaxed max-w-2xl mx-auto mb-14">
            Niezależnie od tego, na jakim etapie jesteś – jestem tu. 
            Napisz do mnie, a odpowiem najszybciej jak mogę.
          </p>

          {/* Contact info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {/* Email */}
            <a href="mailto:kontakt@nataliapotocka.pl" className="blob-card relative group isolate flex flex-col items-center text-center p-8 rounded-[30px] transition-all duration-300">
              <div className="blob-bg absolute top-8 left-1/2 -ml-20 w-40 h-40 bg-white shadow-sm -z-10 transition-all duration-500 ease-out origin-center group-hover:!inset-0 group-hover:!w-full group-hover:!h-full group-hover:!ml-0 group-hover:!top-0 group-hover:!rounded-[30px] group-hover:!bg-white/95 group-hover:!shadow-2xl group-hover:!shadow-mauve/10" style={{ borderRadius: '54% 46% 42% 58% / 44% 48% 52% 56%' }}></div>
              <div className="w-16 h-16 flex items-center justify-center mb-4 relative z-10">
                <svg className="w-8 h-8 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-serif text-mauve mb-2">Email</h3>
                <p className="text-mauve/60 font-light text-sm">kontakt@nataliapotocka.pl</p>
              </div>
            </a>

            {/* Instagram */}
            <a href="#" className="blob-card relative group isolate flex flex-col items-center text-center p-8 rounded-[30px] transition-all duration-300">
              <div className="blob-bg absolute top-8 left-1/2 -ml-20 w-40 h-40 bg-white shadow-sm -z-10 transition-all duration-500 ease-out origin-center group-hover:!inset-0 group-hover:!w-full group-hover:!h-full group-hover:!ml-0 group-hover:!top-0 group-hover:!rounded-[30px] group-hover:!bg-white/95 group-hover:!shadow-2xl group-hover:!shadow-mauve/10" style={{ borderRadius: '35% 65% 63% 37% / 42% 43% 57% 58%' }}></div>
              <div className="w-16 h-16 flex items-center justify-center mb-4 relative z-10">
                <svg className="w-8 h-8 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-serif text-mauve mb-2">Instagram</h3>
                <p className="text-mauve/60 font-light text-sm">@nataliapotocka.doula</p>
              </div>
            </a>

            {/* Facebook */}
            <a href="#" className="blob-card relative group isolate flex flex-col items-center text-center p-8 rounded-[30px] transition-all duration-300">
              <div className="blob-bg absolute top-8 left-1/2 -ml-20 w-40 h-40 bg-white shadow-sm -z-10 transition-all duration-500 ease-out origin-center group-hover:!inset-0 group-hover:!w-full group-hover:!h-full group-hover:!ml-0 group-hover:!top-0 group-hover:!rounded-[30px] group-hover:!bg-white/95 group-hover:!shadow-2xl group-hover:!shadow-mauve/10" style={{ borderRadius: '64% 36% 47% 53% / 61% 53% 47% 39%' }}></div>
              <div className="w-16 h-16 flex items-center justify-center mb-4 relative z-10">
                <svg className="w-8 h-8 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                </svg>
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-serif text-mauve mb-2">Facebook</h3>
                <p className="text-mauve/60 font-light text-sm">Natalia Potocka Doula</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
