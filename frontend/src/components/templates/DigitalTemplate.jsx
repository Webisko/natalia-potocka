import { ShoppingBag, PlayCircle, Download, BookOpen, Clock, Users, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Content database based on the opisy/ folder descriptions
const PRODUCT_CONTENT = {
  'otulic-polog': {
    hero: 'Otulić Połóg – kompleksowe przygotowanie na czwarty trymestr',
    lead: 'Co wiesz o czasie PO porodzie? Zadbaj o siebie zanim nadejdzie ten ważny moment.',
    duration: 'ok. 1,5h nagrania',
    benefits: [
      'Dowiesz się jak wygląda połóg pod kątem emocjonalnym i cielesnym',
      'Zrozumiesz, dlaczego ten etap jest tak ważny dla Twojego zdrowia',
      'Będziesz wiedziała, czego się spodziewać w początkowych dniach po porodzie',
      'Przygotujesz siebie i swoich bliskich na pierwsze kilka tygodni',
      'Dostaniesz praktyczne informacje o wsparciu, higieny i odpoczynku',
      'Stworzysz własny plan połogu dostosowany do Twojej sytuacji',
    ],
    topics: ['Czym jest połóg?', 'Jak czujesz się emocjonalnie w czasie połogu?', 'Co się dzieje z Twoim ciałem?', 'Higiena w czasie połogu', 'Dbanie o siebie', 'Plan połogu', 'Rola wioski wsparcia', 'Odżywianie'],
    closing: 'Webinar zawiera nagranie spotkania live na Zoomie.',
  },
  'porod-domowy': {
    hero: 'Poród domowy – czy to dla mnie?',
    lead: 'Mało kobiet wie o tej możliwości. Sprawdź, czy poród domowy to opcja dla Ciebie.',
    duration: 'ok. 1h nagrania',
    benefits: [
      'Dowiesz się, jak wygląda poród domowy krok po kroku',
      'Poznasz fakty o bezpieczeństwie porodu domowego',
      'Zrozumiesz, kto może rodzić w domu, a kto nie',
      'Dowiesz się, co się dzieje w przypadku komplikacji',
      'Poznasz różnice między porodem domowym a szpitalnym',
      'Dowiesz się, ile kosztuje taki poród i jak się czuje kobieta po nim',
    ],
    topics: ['Jak wygląda poród domowy?', 'Kwestia bezpieczeństwa', 'Kwalifikacje do porodu domowego', 'Postępowanie w razie komplikacji', 'Koszty', 'Doświadczenia kobiet'],
    closing: 'Webinar zawiera nagranie spotkania live na Zoomie.',
  },
  'glowa-w-porodzie': {
    hero: 'Poród zaczyna się w głowie – zmień swoje myśli, zmień swój poród',
    lead: 'Twój poród może być najpiękniejszym doświadczeniem w Twoim życiu. Ograniczają Cię tylko własne myśli.',
    duration: 'ok. 1h 15 min nagrania + medytacja',
    benefits: [
      'Dowiesz się, skąd biorą się Twoje lęki porodowe',
      'Zrozumiesz, jak nasze dzieciństwo wpływa na postawy wobec porodu',
      'Odkryjesz, jak myśli wpływają na decyzje i przebieg porodu',
      'Poznasz związek cielesności i seksualności z porodem',
      'Nauczysz się, jak pozbyć się trudnych emocji i je przekuć w siłę',
      'Otrzymasz medytację, która wzmocni pozytywną wizję porodu',
    ],
    topics: ['Skąd takie myśli u Ciebie?', 'Wpływ dzieciństwa na postrzeganie porodu', 'Jak myśli wpływają na decyzje', 'Cielesność i seksualność a poród', 'Jak zmienić negatywne emocje na pozytywne', 'Praktyka medytacyjna'],
    closing: 'Otrzymasz dostęp do nagrania webinaru i medytacji wzmacniającej pozytywną wizję porodu.',
  },
  'hipnotyczny-obrot': {
    hero: 'Hipnotyczny Obrót – medytacja wspierająca obrót dziecka z ułożenia miednicowego',
    lead: 'Dziecko ułożone pośladkowo? Hipnoterapia skuteczna w 80% przypadków, bez skutków ubocznych.',
    duration: 'Nagranie audio',
    benefits: [
      'Bezpieczna metoda bez skutków ubocznych',
      'Skuteczność nawet do 80% według badań',
      'Możliwość stosowania od 37. tygodnia ciąży',
      'Wystarczy wysłuchać nagrania 3 razy',
      'Głęboks relaksacja przy okazji',
      'Możliwość słuchania w domu, w wygodnych warunkach',
    ],
    topics: ['Dlaczego dziecko układa się główką do góry?', 'Jak działa hipnoterapia przy obrocie?', 'Jak słuchać medytacji?', 'Kiedy można stosować?'],
    closing: 'Medytację można stosować od 37. tygodnia ciąży. Wystarczy trzykrotne wysłuchanie.',
  },
};

export default function DigitalTemplate({ product, isPurchased, buying, handleBuy }) {
  const navigate = useNavigate();
  const [showAllTopics, setShowAllTopics] = useState(false);
  const content = PRODUCT_CONTENT[product.slug] || {};

  const isAudio = product.type === 'audio';
  const TypeIcon = isAudio ? Download : PlayCircle;

  return (
    <div className="w-full relative bg-nude overflow-hidden">
      {/* VEIN SVG LINES */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25 -z-10" viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path d="M-100,500 C300,280 700,580 1100,320 C1350,180 1500,380 1700,280" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 18" className="animate-flow-vein-gold" />
        <path d="M-100,560 C300,340 700,640 1100,380 C1350,240 1500,440 1700,340" fill="none" stroke="#E6B8B8" strokeWidth="2.5" strokeDasharray="14 28" className="animate-flow-vein-rose" />
      </svg>
      {/* DECORATIVE BG */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose/10 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3 animate-breathe" />
      <div className="absolute bottom-40 left-0 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[120px] pointer-events-none -z-10 -translate-x-1/2 animate-pulse-slow" />
      <div className="absolute top-1/3 left-[10%] w-24 h-24 border border-gold/15 rounded-full animate-pulse-slow pointer-events-none -z-10 hidden md:block" />
      <div className="absolute top-[60%] right-[8%] w-16 h-16 border border-rose/20 rounded-full animate-heartbeat pointer-events-none -z-10 hidden md:block" />

      {/* HERO */}
      <section className="pt-10 pb-16 px-6 md:px-12 max-w-[1240px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          {/* IMAGE */}
          <div className="w-full lg:w-1/2 relative group flex-shrink-0">
            <div className="aspect-[4/5] max-h-[520px] overflow-hidden rounded-[40px] shadow-2xl relative z-10">
              {product.thumbnail_url ? (
                <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blush/40 to-rose/20 flex items-center justify-center">
                  <TypeIcon size={80} className="text-mauve/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-mauve/30 to-transparent pointer-events-none" />
            </div>
            {/* FLOATING TYPE BADGE */}
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-full shadow-xl z-20 hidden md:flex items-center justify-center w-24 h-24 animate-float border border-gold/10">
              <TypeIcon size={36} className="text-gold" />
            </div>
          </div>

          {/* CONTENT */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="h-px w-8 bg-gold" />
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                {isAudio ? 'Medytacja Audio' : 'Webinar / Wideo'}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif text-mauve leading-tight mb-6">
              {content.hero || product.title}
            </h1>
            <p className="text-mauve/70 text-lg font-light leading-relaxed mb-8">
              {content.lead || product.description}
            </p>

            {/* META */}
            {content.duration && (
              <div className="flex flex-wrap gap-6 mb-8 text-sm text-mauve/60 font-light">
                <span className="flex items-center gap-2"><Clock size={16} className="text-gold" /> {content.duration}</span>
                <span className="flex items-center gap-2"><Users size={16} className="text-gold" /> Dostęp natychmiastowy</span>
              </div>
            )}

            {/* PRICING CARD */}
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-white">
              <div className="font-serif text-4xl text-mauve mb-6 flex items-baseline gap-2">
                {product.price.toFixed(2)} <span className="text-xl text-mauve/50 font-sans font-light">PLN</span>
              </div>
              {isPurchased ? (
                <button onClick={() => navigate('/client')} className="w-full h-14 bg-mauve text-white hover:bg-mauve/90 transition-all rounded-2xl font-medium tracking-wide flex items-center justify-center gap-2">
                  <Check size={18} /> Przejdź do Biblioteki (Posiadasz)
                </button>
              ) : (
                <button onClick={handleBuy} disabled={buying || !product.stripe_price_id}
                  className="w-full h-14 overflow-hidden rounded-2xl bg-gold text-white font-bold tracking-widest uppercase text-sm hover:shadow-xl hover:shadow-gold/20 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2">
                  <ShoppingBag size={18} />
                  {buying ? 'Przygotowywanie...' : product.stripe_price_id ? 'Kup Dostęp Teraz' : 'Tymczasowo Niedostępne'}
                </button>
              )}
              {!isPurchased && (
                <p className="text-xs text-mauve/50 text-center font-light mt-4">
                  Natychmiastowy dostęp po opłaceniu. Bezpieczne płatności: <span className="font-medium text-mauve/70">Stripe</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      {content.benefits && (
        <section className="py-16 px-6 md:px-12 max-w-[1240px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif text-mauve mb-12 text-center">
            Co zyskasz?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/60 p-5 rounded-2xl border border-white/80">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 text-gold font-bold text-sm mt-0.5">
                  ✓
                </div>
                <p className="text-mauve/80 font-light leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TOPICS */}
      {content.topics && (
        <section className="py-12 px-6 md:px-12 max-w-[1240px] mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-mauve mb-8">
            Program {isAudio ? 'nagrania' : 'webinaru'}
          </h2>
          <div className="space-y-3">
            {(showAllTopics ? content.topics : content.topics.slice(0, 5)).map((t, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/40 px-6 py-4 rounded-2xl border border-white/60">
                <span className="text-gold font-bold text-sm w-6 flex-shrink-0">{i + 1}.</span>
                <span className="text-mauve/80 font-light">{t}</span>
                <BookOpen size={14} className="ml-auto text-mauve/30 flex-shrink-0" />
              </div>
            ))}
            {content.topics.length > 5 && (
              <button onClick={() => setShowAllTopics(!showAllTopics)} className="flex items-center gap-2 text-gold text-sm font-medium mt-2 hover:text-gold/70 transition-colors">
                {showAllTopics ? 'Pokaż mniej' : `Pokaż wszystkie (${content.topics.length})`}
                <ChevronDown size={16} className={`transition-transform ${showAllTopics ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          {content.closing && (
            <p className="text-mauve/50 text-sm font-light mt-6 italic">{content.closing}</p>
          )}
        </section>
      )}

      {/* AUTHOR BIO */}
      <section className="pt-16 pb-64 px-6 md:px-12 max-w-[1240px] mx-auto">
        <div className="bg-white/50 rounded-[30px] p-8 md:p-12 border border-white/80">
          <h2 className="text-2xl font-serif text-mauve mb-2">O prowadzącej</h2>
          <h3 className="text-gold font-bold tracking-wider uppercase text-sm mb-6">Natalia Potocka</h3>
          <p className="text-mauve/70 font-light leading-relaxed">
            Edukatorka porodowa, doula i terapeutka traumy okołoporodowej. Certyfikowana instruktorka hipnoporodu. 
            Absolwentka Akademii Wsparcia Okołoporodowego Stowarzyszenia Doula w Polsce. Pasjonatka tematów ciąży, 
            porodu, połogu i rodzicielstwa. Z wykształcenia matematyczka i programistka – łączy ścisłe podejście 
            do wiedzy z ciepłym, nieoceniającym wsparciem.
          </p>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="pb-24 px-6 md:px-12 max-w-[1240px] mx-auto text-center">
        <h2 className="text-3xl font-serif text-mauve mb-4">Gotowa na zmianę?</h2>
        <p className="text-mauve/60 font-light mb-8 max-w-lg mx-auto">
          {isAudio ? 'Zacznij słuchać od razu po zakupie.' : 'Dostęp do nagrania natychmiast po zakupie.'}
        </p>
        {isPurchased ? (
          <button onClick={() => navigate('/client')} className="inline-flex items-center gap-3 px-10 h-14 bg-mauve text-white hover:bg-mauve/90 transition-all rounded-2xl font-medium tracking-wide">
            <Check size={18} /> Przejdź do Biblioteki
          </button>
        ) : (
          <button onClick={handleBuy} disabled={buying || !product.stripe_price_id}
            className="inline-flex items-center gap-3 px-10 h-14 bg-gold text-white font-bold uppercase tracking-widest text-sm hover:shadow-xl hover:shadow-gold/20 disabled:opacity-50 transition-all rounded-2xl">
            <ShoppingBag size={18} />
            {buying ? 'Przygotowywanie...' : `Kup za ${product.price.toFixed(2)} PLN`}
          </button>
        )}
      </section>
    </div>
  );
}
