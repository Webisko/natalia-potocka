import { Heart, Send, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    // For now, simulate a send (can be wired to an API endpoint later)
    await new Promise(r => setTimeout(r, 900));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="w-full bg-nude min-h-screen">
      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center overflow-hidden pt-24 pb-64">
        <div className="absolute inset-0 bg-gradient-to-br from-blush/30 via-nude to-white pointer-events-none" />

        {/* Vein decoration */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 1440 600" preserveAspectRatio="none">
          <path d="M-100,300 C300,100 700,500 1100,250 C1350,100 1500,300 1700,200" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 18" className="animate-flow-vein-gold" />
          <path d="M-100,360 C300,160 700,560 1100,310 C1350,160 1500,360 1700,260" fill="none" stroke="#E6B8B8" strokeWidth="2.5" strokeDasharray="14 28" className="animate-flow-vein-rose" />
        </svg>

        {/* Blobs */}
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-rose/20 rounded-full blur-[90px] animate-breathe pointer-events-none" />
        <div className="absolute bottom-10 left-[5%] w-80 h-80 bg-goldLight/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />

        <div className="max-w-[760px] w-full mx-auto px-8 md:px-16 relative z-10">

          {/* Heading */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6">
              <Heart size={14} className="text-terracotta animate-heartbeat" />
              <span className="text-xs font-bold text-terracotta uppercase tracking-[0.2em]">Kontakt</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif leading-[1.05] text-mauve mb-6">
              Zacznijmy{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#B88A44] italic">rozmowę.</span>
            </h1>
            <p className="text-lg text-mauve/70 font-light leading-relaxed max-w-lg mx-auto">
              Napisz do mnie – opowiedz, czego potrzebujesz. Postaram się odpowiedzieć tak szybko, jak to możliwe.
            </p>
          </div>

          {/* ── CONTACT FORM ── */}
          <div className="relative bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl shadow-rose/10 rounded-[40px] p-8 md:p-12 mb-16">
            {/* Subtle blob background inside form */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gold/5 rounded-full blur-[40px] pointer-events-none" />

            {sent ? (
              <div className="flex flex-col items-center text-center py-8 gap-6">
                <div className="w-20 h-20 flex items-center justify-center bg-gold/10 rounded-full">
                  <CheckCircle size={40} className="text-gold" />
                </div>
                <h2 className="text-3xl font-serif text-mauve">Dziękuję!</h2>
                <p className="text-mauve/60 font-light text-lg max-w-sm leading-relaxed">
                  Twoja wiadomość dotarła do mnie. Odezwę się najszybciej, jak to możliwe. 🌿
                </p>
                <button
                  onClick={() => { setSent(false); setFormData({ name: '', email: '', message: '' }); }}
                  className="text-sm font-bold text-gold uppercase tracking-wider hover:text-terracotta transition-colors mt-2"
                >
                  Wyślij kolejną wiadomość
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-mauve/60 uppercase tracking-[0.2em] mb-2">
                    Imię
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Jak masz na imię?"
                    className="w-full px-6 py-4 bg-nude/60 border border-mauve/10 rounded-2xl text-mauve placeholder:text-mauve/30 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/30 transition-all font-light text-base"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-mauve/60 uppercase tracking-[0.2em] mb-2">
                    Adres e-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="twoj@email.pl"
                    className="w-full px-6 py-4 bg-nude/60 border border-mauve/10 rounded-2xl text-mauve placeholder:text-mauve/30 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/30 transition-all font-light text-base"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-mauve/60 uppercase tracking-[0.2em] mb-2">
                    W czym mogę Ci pomóc?
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Opisz krótko swojego sytuację i czego potrzebujesz. Im więcej wiem, tym lepiej mogę się przygotować. ✨"
                    className="w-full px-6 py-4 bg-nude/60 border border-mauve/10 rounded-2xl text-mauve placeholder:text-mauve/30 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/30 transition-all font-light text-base resize-none"
                  />
                </div>

                {/* Submit – blob button style */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="group relative inline-flex items-center justify-start cursor-pointer outline-none border-0 h-14 min-w-[14rem] w-auto disabled:opacity-60"
                  >
                    <span className="circle absolute left-0 top-0 block w-14 h-14 bg-gold transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] group-hover:w-full group-hover:rounded-[1.625rem] z-0" aria-hidden="true">
                      <span className="icon absolute top-0 bottom-0 m-auto left-[0.85rem] flex items-center">
                        <Send size={18} className="text-white group-hover:translate-x-1 transition-transform duration-500" />
                      </span>
                    </span>
                    <span className="relative z-10 pl-16 pr-8 font-bold uppercase tracking-wider text-sm text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white whitespace-nowrap w-full text-center">
                      {sending ? 'Wysyłam...' : 'Wyślij wiadomość'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── CONTACT CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <h3 className="text-lg font-serif text-mauve mb-1">Email</h3>
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
                <h3 className="text-lg font-serif text-mauve mb-1">Instagram</h3>
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
                <h3 className="text-lg font-serif text-mauve mb-1">Facebook</h3>
                <p className="text-mauve/60 font-light text-sm">Natalia Potocka Doula</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
