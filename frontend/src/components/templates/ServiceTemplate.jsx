import { Mail, Calendar, MapPin, Heart, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';

// Full landing page content per service slug
const SERVICE_CONTENT = {
  'uzdrowienie-traumy-porodowej': {
    badge: 'Terapia Traumy Porodowej',
    hero: 'Twój poród był trudny? Pozwól sobie zamknąć ten rozdział i odzyskać spokój.',
    subhero: 'Trauma porodowa to ciężar, który możesz – a nawet powinnaś – zrzucić. Nie musisz żyć z powracającymi obrazami, lękiem i poczuciem winy. Pomogę Ci uwolnić się od trudnych emocji metodą Rewind.',
    price: 480,
    priceNote: 'pakiet 3 spotkań online',
    diagnosis: {
      heading: 'Czy czujesz, że „coś było nie tak"?',
      intro: 'Przede wszystkim: liczą się Twoje odczucia. Nawet jeśli personel medyczny lub bliscy mówią „przecież masz zdrowe dziecko", a Ty czujesz ból i lęk – masz do tego prawo.',
      symptoms: [
        'Wracają do Ciebie natrętne myśli lub sny o porodzie',
        'Doświadczasz flashbacków – nagłych, żywych wspomnień',
        'Czujesz panikę lub paraliż na samo wspomnienie porodu',
        'Unikasz rozmów o porodzie lub kontaktu z innymi',
        'Czujesz irytację, gniew, żal lub poczucie winy bez wyraźnej przyczyny',
        'Masz luki w pamięci dotyczące tamtego dnia',
      ],
      closing: 'Jeśli odpowiedziałaś twierdząco na choć jedno pytanie, ten proces jest dla Ciebie.',
    },
    why: {
      heading: 'To nie Twoja wina – to Twój „gadzi mózg"',
      text: 'Trauma ma to do siebie, że zapisuje się w pierwotnej części mózgu. Kiedy coś przypomina Ci o porodzie – dźwięk, zapach, słowo – Twoje ciało reaguje tak, jakby to działo się teraz. Wchodzisz w tryb „walcz lub uciekaj". To błędne koło: każda taka reakcja utrwala traumę i sprawia, że czujesz bezsilność.\n\nJest jednak sposób, by bezpiecznie „przenieść" to wspomnienie tam, gdzie jego miejsce – do archiwum Twojej pamięci.',
    },
    method: {
      heading: 'Jak działa Metoda Rewind?',
      steps: [
        { num: '1', title: 'Głęboki relaks', desc: 'Wprowadzam Cię w stan przyjemnego odprężenia – naturalny stan, jaki znasz np. tuż przed zaśnięciem.' },
        { num: '2', title: 'Przeprocesowanie', desc: 'W tym bezpiecznym stanie Twój mózg „przesuwa" wspomnienie z części gadziej do kory nowej (logicznej).' },
        { num: '3', title: 'Efekt', desc: 'Pamiętasz, co się stało, ale wspomnienie nie wywołuje już bólu ani paniki. Staje się po prostu historią z przeszłości.' },
      ],
    },
    process: {
      heading: 'Jak wygląda nasza współpraca?',
      sessions: [
        { num: 1, title: 'Spotkanie 1', desc: 'Rozmowa, zbudowanie poczucia bezpieczeństwa i pierwsza relaksacja zapoznawcza.' },
        { num: 2, title: 'Spotkanie 2', desc: 'Właściwy proces uzdrowienia traumy – metoda Rewind.' },
        { num: 3, title: 'Spotkanie 3', desc: 'Utrwalenie efektów i domknięcie procesu.' },
      ],
      note: 'Wiem, że życie z maluszkiem jest dynamiczne. Jeśli musisz przerwać na karmienie – robimy to. Jeśli nie możesz na wideo – oferuję opcję hybrydową.',
    },
    benefits: [
      { icon: '✦', title: 'Spokój', desc: 'Uwolnisz się od natrętnych myśli i koszmarów.' },
      { icon: '✦', title: 'Więź', desc: 'Będziesz mogła w pełni cieszyć się macierzyństwem, bez cienia przeszłości.' },
      { icon: '✦', title: 'Siła', desc: 'Poczujesz, że odzyskałaś sprawczość i kontrolę.' },
      { icon: '✦', title: 'Sen', desc: 'Zniknie napięcie, które nie pozwalało Ci spać.' },
    ],
    faq: [
      { q: 'Boję się hipnozy – czy to bezpieczne?', a: 'To naturalny stan, w który wchodzisz codziennie – np. zamyślając się podczas jazdy autem czy zasypiając. Przez cały czas masz pełną kontrolę i słyszysz mój głos.' },
      { q: 'Czy muszę opowiadać o szczegółach porodu?', a: 'Nie. Metoda Rewind pozwala na pracę z traumą bez konieczności szczegółowego opowiadania o drastycznych momentach.' },
      { q: 'Co potrzebuję do spotkania?', a: 'Tylko telefon lub laptop, stabilny internet i ewentualnie słuchawki dla większego komfortu.' },
    ],
    cta: 'Rezerwuję termin pierwszego spotkania',
  },

  'konsultacja-indywidualna': {
    badge: 'Konsultacja Doulowa Online',
    hero: 'Potrzebujesz rozmowy, która ukoi lęk i da konkretne rozwiązania?',
    subhero: 'Macierzyństwo nie musi być samotną podróżą przez gąszcz informacji. Skorzystaj z indywidualnego wsparcia douli, dopasowanego w 100% do Twojej obecnej sytuacji – bez oceniania i presji.',
    price: 160,
    priceNote: '60 minut online',
    diagnosis: {
      heading: 'To spotkanie jest dla Ciebie, jeśli:',
      intro: null,
      symptoms: [
        'Czujesz się zagubiona w sprzecznych informacjach o ciąży i porodzie',
        'Paraliżuje Cię lęk lub niepokój związany z nadchodzącym rozwiązaniem',
        'Chcesz omówić swój Plan Porodu z kimś, kto zna realia szpitalne',
        'Jesteś po porodzie i potrzebujesz wsparcia w laktacji lub pielęgnacji',
        'Czujesz się samotna i brakuje Ci „wioski wsparcia"',
      ],
      closing: null,
    },
    why: {
      heading: 'Ty nadajesz kierunek. Ja daję mapę i wsparcie.',
      text: 'Podczas 60 minut nie mam sztywnego scenariusza. To czas dla Ciebie. Możemy skupić się na jednym obszarze lub połączyć kilka z nich – w zależności od tego, czego teraz najbardziej potrzebujesz.',
    },
    method: {
      heading: 'Czym się zajmiemy?',
      steps: [
        { num: '1', title: 'Edukacja i Wiedza', desc: 'Wyjaśnię Ci fizjologię porodu, procedury szpitalne i połóg. Obalimy mity, które Cię straszą.' },
        { num: '2', title: 'Emocje i „Głowa"', desc: 'Stworzę bezpieczną przestrzeń na Twoje lęki i wątpliwości. Miejsce na wygadanie się bez cenzury.' },
        { num: '3', title: 'Logistyka i Planowanie', desc: 'Spakujemy torbę do szpitala, zaplanujemy kącik dla dziecka i realne wsparcie rodziny.' },
        { num: '4', title: 'Wsparcie Po (Połóg)', desc: 'Trudności z karmieniem? Baby blues? Jestem tu, by pomóc w każdym aspekcie nowej roli mamy.' },
      ],
    },
    process: null,
    benefits: [
      { icon: '✦', title: 'Zero oceniania', desc: 'Każda Twoja decyzja jest dobra, jeśli jest TWOJA. Nie narzucam jednej słusznej drogi.' },
      { icon: '✦', title: 'Kompetencje', desc: 'Certyfikowana doula i instruktorka hipnoporodu z wieloletnim doświadczeniem i wiedzą naukową.' },
      { icon: '✦', title: 'Pełna elastyczność', desc: 'Spotykamy się online. Twój maluszek płacze? Musisz nakarmić? To dla mnie naturalne.' },
    ],
    faq: [
      { q: 'Jak umawiamy termin?', a: 'Po zakupie skontaktuję się z Tobą e-mailem, abyśmy wspólnie dobry wybrały datę i godzinę.' },
      { q: 'Czy muszę mieć kamerę?', a: 'To zależy od Ciebie. Możemy połączyć się wideo lub tylko audio – np. gdy karmisz lub leżysz w łóżku.' },
      { q: 'Czy mogę nagrać rozmowę?', a: 'Tak, jeśli chcesz wrócić do przekazanych informacji, możesz nagrać nasze spotkanie na własny użytek.' },
    ],
    cta: 'Umów rozmowę (60 min)',
  },
};

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-mauve/10 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left gap-4">
        <span className="font-medium text-mauve">{q}</span>
        <ChevronDown size={18} className={`text-gold flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-mauve/60 font-light leading-relaxed pr-6">{a}</p>}
    </div>
  );
}

export default function ServiceTemplate({ product }) {
  const content = SERVICE_CONTENT[product.slug] || {
    badge: 'Usługa',
    hero: product.title,
    subhero: product.description,
    price: product.price,
    priceNote: '',
    benefits: [],
    faq: [],
    cta: 'Zapytaj o termin',
  };

  const displayPrice = content.price || product.price;

  return (
    <div className="w-full bg-nude">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-10 pb-24">
        {/* Vein SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 1440 700" preserveAspectRatio="none">
          <path d="M-100,500 C300,300 700,600 1100,350 C1350,200 1500,400 1700,300" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 18" className="animate-flow-vein-gold" />
          <path d="M-100,560 C300,360 700,660 1100,410 C1350,260 1500,460 1700,360" fill="none" stroke="#E6B8B8" strokeWidth="2.5" strokeDasharray="14 28" className="animate-flow-vein-rose" />
        </svg>
        {/* Blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose/10 via-nude to-nude pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blush/30 rounded-full blur-[100px] opacity-60 -translate-y-1/3 translate-x-1/3 animate-breathe pointer-events-none" />
        <div className="absolute bottom-0 left-[-5%] w-80 h-80 bg-gold/5 rounded-full blur-[80px] animate-pulse-slow pointer-events-none" />
        {/* Decorative ring */}
        <div className="absolute top-24 left-[15%] w-24 h-24 border border-gold/20 rounded-full animate-pulse-slow pointer-events-none hidden md:block" />
        <div className="absolute bottom-20 right-[12%] w-16 h-16 border border-rose/30 rounded-full animate-heartbeat pointer-events-none hidden md:block" />

        <div className="max-w-[1240px] mx-auto px-6 md:px-12 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-8">
              <Heart size={14} className="text-terracotta" />
              <span className="text-xs font-bold text-terracotta uppercase tracking-[0.2em]">{content.badge}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-mauve leading-[1.1] mb-8">
              {content.hero}
            </h1>
            <p className="text-lg md:text-xl text-mauve/70 font-light leading-relaxed mb-10 max-w-xl">
              {content.subhero}
            </p>
            <a href={`mailto:kontakt@nataliapotocka.pl?subject=Umówienie usługi: ${product.title}`}>
              <button className="group inline-flex items-center gap-3 px-8 h-14 bg-terracotta text-white font-bold uppercase tracking-wider text-sm rounded-2xl hover:bg-terracotta/90 hover:shadow-xl transition-all">
                <Mail size={18} />
                {content.cta}
              </button>
            </a>
          </div>

          {/* SIDEBAR CARD */}
          <div className="relative">
            <div className="bg-white rounded-[30px] p-8 shadow-2xl border border-mauve/5 max-w-sm mx-auto lg:ml-auto">
              <div className="text-center border-b border-mauve/10 pb-6 mb-6">
                <span className="text-xs text-mauve/40 uppercase tracking-widest font-bold block mb-2">Inwestycja w siebie</span>
                <div className="font-serif text-5xl text-terracotta">
                  {displayPrice} <span className="text-xl font-sans text-mauve/40 font-light">PLN</span>
                </div>
                {content.priceNote && <p className="text-sm text-mauve/50 font-light mt-2">{content.priceNote}</p>}
              </div>
              <a href={`mailto:kontakt@nataliapotocka.pl?subject=Umówienie usługi: ${product.title}`} className="block">
                <button className="w-full h-12 bg-terracotta text-white rounded-xl font-bold tracking-wider uppercase text-sm hover:bg-terracotta/90 transition-all flex items-center justify-center gap-2">
                  <Mail size={16} /> Zapisz się / Zapytaj
                </button>
              </a>
              <div className="mt-6 space-y-3 pt-6 border-t border-mauve/5">
                <div className="flex items-center gap-3 text-sm text-mauve/60 font-light"><Calendar size={15} className="text-gold flex-shrink-0" /> Terminy dobierane indywidualnie</div>
                <div className="flex items-center gap-3 text-sm text-mauve/60 font-light"><MapPin size={15} className="text-gold flex-shrink-0" /> Online / Gabinet</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIAGNOSIS ── */}
      {content.diagnosis && (
        <section className="py-20 px-6 md:px-12 bg-white/40">
          <div className="max-w-[900px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif text-mauve mb-4 text-center">{content.diagnosis.heading}</h2>
            {content.diagnosis.intro && <p className="text-mauve/60 font-light text-center mb-10 max-w-2xl mx-auto">{content.diagnosis.intro}</p>}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {content.diagnosis.symptoms.map((s, i) => (
                <div key={i} className="flex items-start gap-3 bg-nude/80 p-4 rounded-2xl border border-white">
                  <div className="w-6 h-6 rounded-full bg-rose/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-terracotta" />
                  </div>
                  <p className="text-mauve/70 font-light text-sm leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
            {content.diagnosis.closing && (
              <p className="text-center text-mauve/60 font-light italic">{content.diagnosis.closing}</p>
            )}
          </div>
        </section>
      )}

      {/* ── WHY / EXPLANATION ── */}
      {content.why && (
        <section className="py-20 px-6 md:px-12">
          <div className="max-w-[900px] mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-mauve mb-8">{content.why.heading}</h2>
            {content.why.text.split('\n\n').map((p, i) => (
              <p key={i} className="text-mauve/65 font-light text-lg leading-relaxed mb-4">{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* ── METHOD / STEPS ── */}
      {content.method && (
        <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-blush/20 to-nude">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif text-mauve mb-12 text-center">{content.method.heading}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(content.method.steps.length, 3)}, 1fr)` }}>
              {content.method.steps.map((s) => (
                <div key={s.num} className="bg-white/80 rounded-3xl p-8 border border-white shadow-sm relative">
                  <div className="w-12 h-12 rounded-2xl bg-terracotta/10 flex items-center justify-center text-terracotta font-bold font-serif text-xl mb-5">
                    {s.num}
                  </div>
                  <h3 className="font-serif text-xl text-mauve mb-3">{s.title}</h3>
                  <p className="text-mauve/60 font-light text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PROCESS (only for trauma) ── */}
      {content.process && (
        <section className="py-20 px-6 md:px-12">
          <div className="max-w-[900px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif text-mauve mb-12 text-center">{content.process.heading}</h2>
            <div className="relative flex flex-col gap-0">
              {content.process.sessions.map((s, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-terracotta flex items-center justify-center text-white font-bold flex-shrink-0">{s.num}</div>
                    {i < content.process.sessions.length - 1 && <div className="w-0.5 h-12 bg-terracotta/20 mt-1" />}
                  </div>
                  <div className="pb-8">
                    <h3 className="font-serif text-xl text-mauve mb-2">{s.title}</h3>
                    <p className="text-mauve/60 font-light leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-rose/10 rounded-2xl p-6 mt-4 border border-rose/20">
              <p className="text-mauve/70 font-light leading-relaxed italic">{content.process.note}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── BENEFITS ── */}
      {content.benefits && content.benefits.length > 0 && (
        <section className="py-20 px-6 md:px-12 bg-mauve text-white">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-12 text-center">Odzyskaj kontrolę nad swoim życiem</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(content.benefits.length, 4)}, 1fr)` }}>
              {content.benefits.map((b, i) => (
                <div key={i} className="bg-white/10 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
                  <div className="text-gold text-2xl mb-4">{b.icon}</div>
                  <h3 className="font-serif text-xl text-white mb-2">{b.title}</h3>
                  <p className="text-white/60 font-light text-sm leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {content.faq && content.faq.length > 0 && (
        <section className="py-20 px-6 md:px-12">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif text-mauve mb-12 text-center">Najczęstsze pytania</h2>
            <div className="bg-white/60 rounded-3xl p-6 md:p-10 border border-white/80">
              {content.faq.map((item, i) => <FAQItem key={i} {...item} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── BOTTOM CTA ── */}
      <section className="pt-20 pb-64 px-6 md:px-12 bg-gradient-to-br from-rose/10 via-nude to-blush/20">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-mauve mb-4">Gotowa, by zacząć?</h2>
          <p className="text-mauve/60 font-light mb-10 text-lg">Gwarancja bezpieczeństwa i pełna poufność. Pracujemy w Twoim tempie.</p>
          <a href={`mailto:kontakt@nataliapotocka.pl?subject=Umówienie usługi: ${product.title}`}>
            <button className="inline-flex items-center gap-3 px-10 h-14 bg-terracotta text-white font-bold uppercase tracking-wider text-sm rounded-2xl hover:bg-terracotta/90 hover:shadow-xl transition-all">
              <Mail size={18} /> {content.cta}
            </button>
          </a>
          <p className="text-mauve/40 text-sm mt-6 font-light">Masz pytania? Napisz do mnie: kontakt@nataliapotocka.pl</p>
        </div>
      </section>
    </div>
  );
}
