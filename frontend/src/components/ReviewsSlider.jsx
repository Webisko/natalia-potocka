import { useState, useEffect } from 'react';
import axios from 'axios';
import { Quote, Star } from 'lucide-react';

const FALLBACK_REVIEWS = [
  {
    id: 1,
    content: '"Natalia to osoba, która potrafi stworzyć bezpieczną przestrzeń i towarzyszyć w najtrudniejszych momentach. Dzięki niej mój poród był świadomy i spokojny."',
    author: 'Anna K.',
    subtitle: 'Mama Zosi',
    thumbnail_url: null,
  },
  {
    id: 2,
    content: '"Webinar Otulić Połóg zmienił moje podejście do czwartego trymestru. Konkretna wiedza podana z ogromną empatią. Polecam każdej przyszłej mamie!"',
    author: 'Marta W.',
    subtitle: 'Mama Leona',
    thumbnail_url: null,
  },
  {
    id: 3,
    content: '"Sesja Rewind była przełomowa. Po traumatycznym pierwszym porodzie, dzięki Natalii, odzyskałam wiarę w siebie i spokojnie przygotowałam się do kolejnego."',
    author: 'Karolina M.',
    subtitle: 'Mama dwójki dzieci',
    thumbnail_url: null,
  },
];

export default function ReviewsSlider() {
  const [reviews, setReviews] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    // Fetch active reviews from API, fallback to static data
    axios.get('/api/reviews')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setReviews(res.data);
        } else {
          setReviews(FALLBACK_REVIEWS);
        }
      })
      .catch(() => {
        setReviews(FALLBACK_REVIEWS);
      });
  }, []);

  if (reviews.length === 0) return null;

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  return (
    <section id="opinie" className="bg-nude overflow-hidden relative z-0 min-h-screen flex flex-col justify-center py-20 pb-80"> 
      {/* BACKGROUND DECORATION: PULSING UMBILICAL CORD */} 
      <div className="absolute inset-0 pointer-events-none z-0"> 
        <svg className="w-full h-full" viewBox="0 0 1440 600" preserveAspectRatio="none"> 
          <defs> 
            <path id="cordPath" d="M-100,300 C200,100 600,500 1000,300 C1400,100 1600,400 1800,300"></path> 
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%"> 
              <stop offset="0%" stopColor="#E6B8B8" stopOpacity="0.1"></stop> 
              <stop offset="50%" stopColor="#E6B8B8" stopOpacity="0.8"></stop> 
              <stop offset="100%" stopColor="#E6B8B8" stopOpacity="0.1"></stop> 
            </linearGradient> 
          </defs> 
          <use href="#cordPath" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.2"></use> 
          <use href="#cordPath" stroke="url(#flowGradient)" strokeWidth="3" fill="none" strokeDasharray="100 400" className="animate-flow-slower" strokeLinecap="round"></use> 
          <path d="M-100,320 C220,120 620,520 1020,320 C1420,120 1620,420 1820,320" fill="none" stroke="#5D4058" strokeWidth="1" opacity="0.1"></path> 
          <path d="M-100,320 C220,120 620,520 1020,320 C1420,120 1620,420 1820,320" fill="none" stroke="#E6B8B8" strokeWidth="1.5" strokeDasharray="50 350" className="animate-flow" opacity="0.4" strokeLinecap="round"></path> 
        </svg> 
      </div> 
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10 w-full"> 
        <div className="max-w-4xl mx-auto text-center relative mt-16"> 
          {/* Big faded quote icon */} 
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 opacity-5 pointer-events-none"> 
            <Quote size={200} className="text-mauve fill-current" strokeWidth={1} />
          </div> 
          
          {/* Arrow LEFT */} 
          {reviews.length > 1 && (
            <button onClick={prevSlide} className="absolute left-0 md:-left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border border-mauve/10 hover:bg-gold hover:border-gold hover:text-white transition-all duration-700 ease-in-out group bg-white/50 backdrop-blur-sm hover:-translate-x-2 shadow-sm" style={{ borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' }} aria-label="Poprzednia opinia"> 
              <svg className="w-5 h-5 md:w-6 md:h-6 text-mauve/50 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> 
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path> 
              </svg> 
            </button> 
          )}
          
          {/* Arrow RIGHT */} 
          {reviews.length > 1 && (
            <button onClick={nextSlide} className="absolute right-0 md:-right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border border-mauve/10 hover:bg-gold hover:border-gold hover:text-white transition-all duration-700 ease-in-out group bg-white/50 backdrop-blur-sm hover:translate-x-2 shadow-sm" style={{ borderRadius: '62% 38% 37% 63% / 59% 56% 44% 41%' }} aria-label="Następna opinia"> 
              <svg className="w-5 h-5 md:w-6 md:h-6 text-mauve/50 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> 
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path> 
              </svg> 
            </button> 
          )}

          {/* Slider Content */} 
          <div className="relative grid grid-cols-1 items-center justify-items-center px-14 md:px-20 min-h-[400px]"> 
            {reviews.map((r, idx) => (
                <div 
                  key={r.id}
                  className={`col-start-1 row-start-1 w-full flex flex-col items-center transition-all duration-700 ease-out transform ${idx === activeSlide ? 'opacity-100 translate-y-0 scale-100 z-10' : 'opacity-0 translate-y-8 scale-95 z-0 pointer-events-none'}`}
                > 
                  <div className="flex gap-1 justify-center mb-6 text-gold">
                    <Star fill="currentColor" size={20} />
                    <Star fill="currentColor" size={20} />
                    <Star fill="currentColor" size={20} />
                    <Star fill="currentColor" size={20} />
                    <Star fill="currentColor" size={20} />
                  </div>
                  <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed font-serif text-mauve italic mb-10 drop-shadow-sm min-h-[1.2em]">
                    {r.content}
                  </p> 
                  <div className="relative"> 
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-rose/20 -z-10 animate-morph mix-blend-multiply"></div> 
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-gold/40 -z-10 animate-morph animation-delay-2000 rounded-full"></div> 
                    <div className="w-20 h-20 rounded-full p-1 border border-white bg-white/50 backdrop-blur-sm shadow-sm flex items-center justify-center text-gold bg-white"> 
                      {r.thumbnail_url ? (
                        <img src={r.thumbnail_url} alt={r.author} className="w-full h-full object-cover rounded-full" loading="lazy" />
                      ) : (
                        <span className="font-serif text-2xl uppercase text-mauve/40 drop-shadow-sm">{r.author.substring(0,2)}</span>
                      )}
                    </div> 
                  </div> 
                  <div className="mt-6 text-center"> 
                    <h4 className="font-bold text-mauve text-xl">{r.author}</h4> 
                    <p className="text-gold text-xs font-bold tracking-[0.2em] uppercase mt-2"> {r.subtitle} </p> 
                  </div> 
                </div> 
            ))}
          </div> 
        </div> 
      </div> 
    </section>
  );
}
