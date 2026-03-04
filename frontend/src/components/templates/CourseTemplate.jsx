import { ShoppingBag, BookOpen, Clock, Play, Headphones, FileText, Download, ChevronDown, Check, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LessonTypeIcon({ type }) {
  if (type === 'audio') return <Headphones size={14} className="text-gold" />;
  if (type === 'text') return <FileText size={14} className="text-mauve/50" />;
  return <Play size={14} className="text-terracotta" />;
}

function ModuleAccordion({ module, unlocked }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-mauve/10 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left bg-white/60 hover:bg-white/80 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-mauve/5 flex items-center justify-center flex-shrink-0">
            <BookOpen size={15} className="text-mauve/40" />
          </div>
          <div>
            <h3 className="font-serif text-mauve font-medium">{module.title}</h3>
            <span className="text-xs text-mauve/40 font-light">{module.lessons?.length || 0} lekcji</span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-mauve/40 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="divide-y divide-mauve/5">
          {module.lessons?.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-4 px-5 py-3 bg-white/30">
              <LessonTypeIcon type={lesson.lesson_type} />
              <span className="text-sm text-mauve/70 font-light flex-1">{lesson.title}</span>
              {lesson.duration_minutes && (
                <span className="text-xs text-mauve/30 font-light flex items-center gap-1">
                  <Clock size={11} /> {lesson.duration_minutes} min
                </span>
              )}
              {!unlocked && <Lock size={13} className="text-mauve/20 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CourseTemplate({ product, isPurchased, buying, handleBuy }) {
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);


  useEffect(() => {
    axios.get(`/api/courses/by-product/${product.id}`)
      .then(res => setCourse(res.data))
      .catch(() => {});
  }, [product.id]);


  const totalLessons = course?.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

  return (
    <div className="w-full relative bg-surface">
      {/* HERO */}
      <section className="relative w-full min-h-[60vh] flex items-center pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {product.thumbnail_url ? (
            <img src={product.thumbnail_url} alt="tło kursu" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-mauve to-mauve/80" />
          )}
          <div className="absolute inset-0 bg-mauve/85 backdrop-blur-sm" />
        </div>
        <div className="max-w-[1240px] mx-auto px-6 md:px-12 relative z-10 w-full pt-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-widest mb-6">
              Kurs Online
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-white leading-tight mb-8">
              {product.title}
            </h1>
            <p className="text-white/75 text-xl font-light leading-relaxed mb-10 max-w-2xl">
              {product.description?.split('\n')[0] || 'Kompleksowy program, który poprowadzi Cię krok po kroku.'}
            </p>
            <div className="flex flex-wrap gap-8 text-white/60 text-sm font-medium tracking-wide">
              <div className="flex items-center gap-2"><BookOpen size={18} className="text-gold" /> {course?.modules?.length || 0} modułów</div>
              <div className="flex items-center gap-2"><Play size={18} className="text-gold" /> {totalLessons} lekcji</div>
              <div className="flex items-center gap-2"><Clock size={18} className="text-gold" /> Dostęp dożywotni</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-surface" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 30%, 0 100%)' }} />
      </section>

      {/* CONTENT + SIDEBAR */}
      <section className="relative pt-8 pb-64 px-6 md:px-12 max-w-[1240px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* MAIN */}
          <div className="flex-1">
            {/* WHAT YOU LEARN */}
            <div className="mb-16">
              <h2 className="text-2xl md:text-3xl font-serif text-mauve mb-8">Czego się nauczysz</h2>
              {product.description && (
                <div className="space-y-3">
                  {product.description.split('\n').filter(l => l.startsWith('- ')).map((line, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 text-gold mt-0.5 text-xs">✓</div>
                      <p className="text-mauve/70 font-light">{line.replace('- ', '')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CURRICULUM */}
            {course && (
              <div className="mb-16">
                <h2 className="text-2xl md:text-3xl font-serif text-mauve mb-8">Program kursu</h2>
                <div className="space-y-3">
                  {course.modules?.map((module) => (
                    <ModuleAccordion key={module.id} module={module} unlocked={isPurchased} />
                  ))}
                </div>
                {!isPurchased && (
                  <p className="text-sm text-mauve/40 font-light mt-4 flex items-center gap-2">
                    <Lock size={12} /> Pełny dostęp po zakupie kursu.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-32 bg-nude rounded-[30px] p-8 shadow-sm border border-gold/10">
              <h3 className="text-2xl font-serif text-mauve mb-2">Dołącz do kursu</h3>
              <p className="text-mauve/50 text-sm mb-6 font-light">Natychmiastowy dostęp do wszystkich materiałów.</p>
              <div className="mb-6">
                <span className="text-5xl font-light text-mauve font-serif">{product.price.toFixed(2)}</span>
                <span className="text-mauve/40 font-sans ml-2 text-sm">PLN</span>
              </div>
              {isPurchased ? (
                <button onClick={() => navigate('/client')} className="w-full h-14 bg-mauve text-white hover:bg-mauve/90 transition-all rounded-xl font-medium tracking-wide shadow-lg flex items-center justify-center gap-2">
                  <Check size={18} /> Rozpocznij Naukę
                </button>
              ) : (
                <button onClick={handleBuy} disabled={buying || !product.stripe_price_id}
                  className="w-full h-14 rounded-xl bg-gold text-white font-bold tracking-widest uppercase text-sm hover:shadow-xl hover:shadow-gold/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  <ShoppingBag size={18} />
                  {buying ? 'Przygotowywanie...' : product.stripe_price_id ? 'Kup Dostęp Teraz' : 'Tymczasowo Niedostępne'}
                </button>
              )}
              <ul className="mt-6 space-y-3 border-t border-mauve/10 pt-6">
                {['Materiały wideo Full HD', 'Ćwiczenia i karty pracy', 'Pliki do pobrania', 'Dostęp dożywotni'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-mauve/60 font-light">
                    <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 text-gold text-xs">✓</div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
