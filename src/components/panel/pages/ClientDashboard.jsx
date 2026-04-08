import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext.jsx';
import { PlayCircle, Download, Headphones, BookOpen, ChevronDown, ChevronLeft, Check, 
         Clock, FileText, ShoppingBag, X, Volume2, Play } from 'lucide-react';
import { isDirectVideoUrl, isEmbeddableVideoUrl } from '../utils/media';
import PanelBlobButton from '../PanelBlobButton.jsx';

// Lesson Viewer inline logic is integrated below

function getUserDisplayName(user) {
  const firstName = `${user?.first_name || ''}`.trim();
  if (firstName) {
    return firstName;
  }

  if (user?.email === 'doula.otula.np@gmail.com') {
    return 'Natalia';
  }

  const emailPrefix = `${user?.email || ''}`.split('@')[0]?.trim();
  return emailPrefix || 'nieznajoma';
}

function formatDateTime(value) {
  if (!value) {
    return 'Brak danych';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Brak danych';
  }

  return parsed.toLocaleString('pl-PL');
}

function formatCurrency(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 'Brak danych';
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(numericValue);
}

function renderOrderStatus(status) {
  if (status === 'completed') {
    return 'Opłacone';
  }

  if (status === 'pending_bank_transfer') {
    return 'Czeka na przelew';
  }

  if (status === 'manual') {
    return 'Dostęp ręczny';
  }

  if (status === 'pending') {
    return 'W trakcie';
  }

  if (status === 'failed') {
    return 'Nieopłacone';
  }

  if (status === 'refunded') {
    return 'Zwrócone';
  }

  if (status === 'cancelled') {
    return 'Anulowane';
  }

  return status || 'Brak danych';
}

function renderPaymentMethod(method) {
  if (method === 'stripe') {
    return 'Stripe';
  }

  if (method === 'bank_transfer') {
    return 'Przelew tradycyjny';
  }

  if (method === 'manual') {
    return 'Dostęp ręczny';
  }

  return method || 'Brak danych';
}

// ─── LMS Course Player ────────────────────────────────────────────────────────
function CourseLMS({ product, onBack }) {
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState({ progress: {}, total: 0, completed: 0 });
  const [activeLesson, setActiveLesson] = useState(null);
  const [openModuleIds, setOpenModuleIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadCourse = useCallback(async () => {
    try {
      const [courseRes] = await Promise.all([
        axios.get(`/api/courses/by-product/${product.id}`),
      ]);
      setCourse(courseRes.data);
      if (courseRes.data?.modules?.[0]) {
        setOpenModuleIds([courseRes.data.modules[0].id]);
      }
      // Load progress
      if (courseRes.data?.id) {
        try {
          const progRes = await axios.get(`/api/courses/progress/${courseRes.data.id}`);
          setProgress(progRes.data);
        } catch (err) {
          console.error("Progress not found or error loading it", err);
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [product.id]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  const toggleModule = (id) => setOpenModuleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleComplete = async (lessonId) => {
    const isCompleted = progress.progress[lessonId];
    try {
      await axios.post('/api/courses/progress', { lesson_id: lessonId, completed: !isCompleted });
      setProgress(prev => ({
        ...prev,
        progress: { ...prev.progress, [lessonId]: !isCompleted },
        completed: !isCompleted ? prev.completed + 1 : prev.completed - 1,
      }));
    } catch (err) { console.error(err); }
  };

  const LessonIcon = ({ type }) => {
    if (type === 'audio') return <Headphones size={14} className="text-gold flex-shrink-0" />;
    if (type === 'text') return <FileText size={14} className="text-mauve/40 flex-shrink-0" />;
    return <Play size={14} className="text-terracotta flex-shrink-0" />;
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="text-fs-body text-mauve/60">Ładowanie kursu...</div>
    </div>
  );

  if (!course) return (
    <div className="text-center py-16">
      <p className="text-fs-body text-mauve/60">Kurs nie jest jeszcze dostępny.</p>
    </div>
  );

  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  if (activeLesson) {
    const flatLessons = [];
    course.modules?.forEach(m => m.lessons?.forEach(l => flatLessons.push(l)));
    const currIndex = flatLessons.findIndex(l => l.id === activeLesson.id);
    const prevLesson = currIndex > 0 ? flatLessons[currIndex - 1] : null;
    const nextLesson = currIndex < flatLessons.length - 1 ? flatLessons[currIndex + 1] : null;
    const isDone = !!progress.progress[activeLesson.id];

    return (
      <div className="flex flex-col lg:flex-row gap-6 -mx-4 sm:-mx-6 lg:-mx-8">
        {/* SIDEBAR NAVIGATION */}
        <div className={`w-full lg:w-80 flex-shrink-0 bg-white rounded-3xl shadow-sm border border-gold/10 p-6 transition-all ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
          <button onClick={() => setActiveLesson(null)} className="mb-8 flex items-center gap-2 text-fs-body text-mauve/70 transition-colors hover:text-mauve">
            <ChevronLeft size={16} /> Zamknij lekcję
          </button>
          
          <div className="mb-8 border-b border-gold/10 pb-6">
            <h3 className="font-serif text-fs-title-sm text-mauve leading-tight">{course.title}</h3>
            <div className="mt-2 text-fs-body text-mauve/60">{progress.completed} / {progress.total} ukończonych</div>
            <div className="h-1.5 bg-mauve/5 rounded-full mt-4 overflow-hidden border border-gold/5">
              <div className="h-full bg-gradient-to-r from-gold to-terracotta rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            {course.modules?.map((module) => {
              const isOpen = openModuleIds.includes(module.id);
              return (
                <div key={module.id} className="border border-gold/5 rounded-2xl overflow-hidden bg-surface/30">
                  <button onClick={() => toggleModule(module.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-white/40 transition-colors">
                    <span className="font-serif text-fs-ui text-mauve/90 font-medium line-clamp-1">{module.title}</span>
                    <ChevronDown size={14} className={`text-mauve/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-gold/5 border-t border-gold/5">
                      {module.lessons?.map((lesson) => {
                        const done = !!progress.progress[lesson.id];
                        const isActive = activeLesson.id === lesson.id;
                        return (
                          <button key={lesson.id} onClick={() => setActiveLesson(lesson)} 
                            className={`w-full flex items-center gap-3 p-4 text-left transition-all ${isActive ? 'bg-gold/5 border-l-4 border-gold' : 'hover:bg-white/60 border-l-4 border-transparent'}`}>
                            <div className="flex-shrink-0">
                              {done ? <Check size={14} className="text-gold" /> : <LessonIcon type={lesson.lesson_type} />}
                            </div>
                            <span className={`text-fs-ui leading-relaxed ${isActive ? 'text-mauve font-semibold' : 'text-mauve/80'} line-clamp-2`}>{lesson.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN LESSON CONTENT */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gold/10 p-6 md:p-10 min-h-[70vh]">
          <div className="max-w-3xl mx-auto">
            <div className="flex lg:hidden items-center justify-between mb-6">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-fs-ui text-gold uppercase tracking-wider font-bold flex items-center gap-2">
                <BookOpen size={16} /> Spis Treści
              </button>
            </div>
            
            <h1 className="text-fs-title-lg font-serif text-mauve mb-8">{activeLesson.title}</h1>

            {activeLesson.lesson_type === 'video' && activeLesson.content_url && (
              <div className="aspect-video bg-surface rounded-2xl overflow-hidden mb-10 shadow-md">
                {isDirectVideoUrl(activeLesson.content_url) ? (
                  <video controls src={activeLesson.content_url} className="w-full h-full" />
                ) : isEmbeddableVideoUrl(activeLesson.content_url) ? (
                  <iframe src={activeLesson.content_url} className="w-full h-full" allowFullScreen title={activeLesson.title} />
                ) : null}
              </div>
            )}
            
            {activeLesson.lesson_type === 'audio' && activeLesson.content_url && (
              <div className="bg-nude rounded-2xl p-8 mb-10 flex flex-col items-center gap-6 border border-gold/10 shadow-sm">
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center">
                  <Volume2 size={32} className="text-gold" />
                </div>
                <audio controls src={activeLesson.content_url} className="w-full max-w-lg">
                  Twoja przeglądarka nie obsługuje elementu audio.
                </audio>
              </div>
            )}

            {activeLesson.description && (
              <p className="text-mauve/70 font-light leading-relaxed mb-8 text-fs-body-lg">{activeLesson.description}</p>
            )}

            {activeLesson.content_text && (
              <div className="prose prose-p:text-mauve/70 max-w-none text-mauve/80 mb-10 leading-relaxed font-light">
                {activeLesson.content_text.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h2 key={i} className="text-fs-title-md font-serif text-mauve mt-8 mb-4">{line.replace('## ', '')}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} className="text-fs-title-sm font-serif text-mauve/90 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-mauve mb-2">{line.slice(2, -2)}</p>;
                  if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>;
                  if (line.match(/^\d+\./)) return <li key={i} className="ml-4 mb-1">{line}</li>;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i} className="mb-3">{line}</p>;
                })}
              </div>
            )}

            {activeLesson.attachments?.length > 0 && (
              <div className="mt-8 mb-12 bg-nude rounded-2xl p-6 border border-gold/10">
                <h4 className="text-gold text-fs-label font-bold uppercase tracking-wider mb-4">Pliki do pobrania</h4>
                <div className="space-y-2">
                  {activeLesson.attachments.map(att => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white hover:bg-white/80 transition-colors px-4 py-3 rounded-xl text-mauve/80 text-fs-ui shadow-sm border border-gold/5">
                      <Download size={16} className="text-gold flex-shrink-0" />
                      {att.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* NAVIGATION FOOTER */}
            <div className="border-t border-gold/10 pt-10 mt-16 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="w-full md:w-1/3">
                {prevLesson && (
                  <button onClick={() => setActiveLesson(prevLesson)} 
                    className="flex w-full items-center gap-3 justify-center text-mauve/55 transition-all group md:justify-start hover:text-mauve">
                    <div className="w-10 h-10 rounded-full border border-gold/10 flex items-center justify-center group-hover:bg-gold/5 transition-colors">
                      <ChevronLeft size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-fs-label uppercase tracking-widest font-bold text-gold/60">Poprzednia</div>
                      <div className="text-fs-ui font-medium line-clamp-1">{prevLesson.title}</div>
                    </div>
                  </button>
                )}
              </div>
              
              <div className="w-full md:w-1/3 flex justify-center">
                <button 
                  onClick={() => toggleComplete(activeLesson.id)}
                  className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold tracking-widest uppercase text-fs-label transition-all w-full shadow-lg ${isDone ? 'bg-mauve/5 text-mauve border border-mauve/10' : 'bg-gold text-white hover:scale-[1.02] hover:shadow-gold/20'}`}>
                  {isDone ? (
                    <> <Check size={18} className="text-gold" /> Oznaczono jako ukończone </>
                  ) : (
                    <> Oznacz jako ukończone </>
                  )}
                </button>
              </div>

              <div className="w-full md:w-1/3">
                {nextLesson && (
                  <button onClick={() => { setActiveLesson(nextLesson); if (!isDone) toggleComplete(activeLesson.id); }} 
                    className="flex w-full items-center gap-3 justify-center text-right text-mauve/55 transition-all group md:justify-end hover:text-terracotta">
                    <div className="text-right">
                      <div className="text-fs-label uppercase tracking-widest font-bold text-gold/60">Następna</div>
                      <div className="text-fs-ui font-medium line-clamp-1">{nextLesson.title}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-gold/10 flex items-center justify-center group-hover:bg-terracotta/5 transition-colors">
                      <ChevronLeft size={20} className="rotate-180" />
                    </div>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="mb-8">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-fs-body text-mauve/65 transition-colors hover:text-mauve">
          <ChevronLeft size={16} /> Wróć do panelu
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-fs-label font-bold text-gold uppercase tracking-widest block mb-1">Kurs Online</span>
            <h2 className="text-fs-title-md font-serif text-mauve">{product.title}</h2>
          </div>
          <div className="text-right">
            <span className="text-fs-body text-mauve/60">{progress.completed} / {progress.total} lekcji</span>
            <div className="text-fs-title-md font-serif text-mauve">{pct}%</div>
          </div>
        </div>
        {/* PROGRESS BAR */}
        <div className="h-2 bg-mauve/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold to-terracotta rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* MODULES */}
      <div className="space-y-4">
        {course.modules?.map((module) => {
          const isOpen = openModuleIds.includes(module.id);
          const completedInModule = module.lessons?.filter(l => progress.progress[l.id]).length || 0;
          const isModuleComplete = module.lessons?.length > 0 && completedInModule === module.lessons.length;
          return (
            <div key={module.id} className="bg-white/60 rounded-2xl border border-white/80 overflow-hidden">
              <button onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isModuleComplete ? 'bg-gold' : 'bg-mauve/10'}`}>
                    {isModuleComplete ? <Check size={16} className="text-white" /> : <BookOpen size={15} className="text-mauve/40" />}
                  </div>
                  <div>
                    <h3 className="font-serif text-fs-body text-mauve font-medium text-left">{module.title}</h3>
                    <span className="text-fs-label text-mauve/55">{completedInModule}/{module.lessons?.length || 0} lekcji ukończonych</span>
                  </div>
                </div>
                <ChevronDown size={16} className={`text-mauve/30 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="border-t border-mauve/5 divide-y divide-mauve/5">
                  {module.lessons?.map((lesson) => {
                    const done = !!progress.progress[lesson.id];
                    return (
                      <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/40 transition-colors group">
                        {/* COMPLETE TOGGLE */}
                        <button onClick={() => toggleComplete(lesson.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? 'border-gold bg-gold' : 'border-mauve/20 hover:border-gold'}`}>
                          {done && <Check size={12} className="text-white" />}
                        </button>
                        {/* LESSON INFO */}
                        <button onClick={() => setActiveLesson(lesson)} className="flex items-center gap-2 flex-1 text-left min-w-0">
                          <LessonIcon type={lesson.lesson_type} />
                          <span className={`flex-1 min-w-0 truncate text-fs-body ${done ? 'text-mauve/50 line-through' : 'text-mauve/80 group-hover:text-mauve'}`}>
                            {lesson.title}
                          </span>
                        </button>
                        {/* META */}
                        {lesson.duration_minutes && (
                          <span className="flex flex-shrink-0 items-center gap-1 text-fs-label text-mauve/50">
                            <Clock size={10} /> {lesson.duration_minutes} min
                          </span>
                        )}
                        {lesson.attachments?.length > 0 && (
                          <Download size={12} className="text-mauve/20 flex-shrink-0" />
                        )}
                        {/* OPEN LESSON */}
                        <button onClick={() => setActiveLesson(lesson)}
                          className="ml-1 rounded-lg bg-mauve/5 px-3 py-1 text-fs-label whitespace-nowrap text-mauve/65 transition-colors flex-shrink-0 hover:bg-mauve/10 hover:text-mauve">
                          Otwórz
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ─── Digital Product Viewer ───────────────────────────────────────────────────
function DigitalProductViewer({ item, onClose }) {
  if (!item) return null;
  const isAudio = item.type === 'audio';
  const hasPlayableContent = Boolean(item.content_url);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-mauve/60 backdrop-blur-md" />
      <div className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-gold/5">
          <div>
            <span className="text-fs-label font-bold text-gold uppercase tracking-[0.2em] mb-1 block">
              {isAudio ? 'Sesja Audio' : 'Webinar Wideo'}
            </span>
            <h3 className="text-fs-title-sm font-serif text-mauve">{item.title}</h3>
          </div>
          <button onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/10 text-mauve/55 transition-all hover:bg-gold/5 hover:text-mauve">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {item.type === 'video' && item.content_url && (
            <div className="aspect-video bg-surface rounded-3xl overflow-hidden shadow-2xl border border-gold/10 mb-8">
              {isDirectVideoUrl(item.content_url) ? (
                <video controls src={item.content_url} className="w-full h-full" />
              ) : isEmbeddableVideoUrl(item.content_url) ? (
                <iframe src={item.content_url} className="w-full h-full" allowFullScreen title={item.title} />
              ) : null}
            </div>
          )}
          
          {item.type === 'audio' && item.content_url && (
            <div className="bg-nude rounded-[30px] p-8 md:p-12 mb-8 flex flex-col items-center gap-8 border border-gold/10">
              <div className="w-32 h-32 rounded-full bg-white shadow-xl flex items-center justify-center border border-gold/5">
                <Volume2 size={48} className="text-gold animate-pulse-slow" />
              </div>
              <div className="w-full max-w-lg">
                <audio controls src={item.content_url} className="w-full shadow-lg rounded-full" />
              </div>
            </div>
          )}

          {!hasPlayableContent && (
            <div className="mb-8 rounded-[30px] border border-rose/10 bg-rose/5 px-6 py-5 text-fs-body leading-relaxed text-mauve/70">
              Treść tego produktu nie została jeszcze podpięta w panelu administracyjnym. Skontaktuj się z administratorką, aby uzupełnić adres nagrania.
            </div>
          )}

          <div className="max-w-2xl">
            <p className="mb-8 text-fs-body-lg leading-relaxed text-mauve/70">
              {item.description}
            </p>

            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {item.allow_download === 1 && item.content_url && (
                <PanelBlobButton
                  href={item.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  minWidthClassName="min-w-[11rem]"
                  icon={<Download size={18} />}
                >
                  Pobierz plik
                </PanelBlobButton>
              )}
              <PanelBlobButton
                tone="secondary"
                onClick={onClose}
                minWidthClassName="min-w-[11rem]"
                icon={<X size={18} />}
              >
                Zamknij podgląd
              </PanelBlobButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DigitalProductCard({ item, onOpen }) {
  const isAudio = item.type === 'audio';
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div onClick={() => onOpen(item)} className="bg-white/60 rounded-[35px] border border-gold/10 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer group hover:-translate-y-2 flex flex-col h-full">
      <div className="h-48 relative overflow-hidden">
        {item.thumbnail_url && !imageFailed ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isAudio ? 'bg-gradient-to-br from-gold/5 to-blush/20' : 'bg-gradient-to-br from-terracotta/5 to-nude'}`}>
            {isAudio ? <Headphones size={48} className="text-gold/30" /> : <PlayCircle size={48} className="text-terracotta/30" />}
          </div>
        )}
        <div className="absolute inset-0 bg-mauve/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-mauve shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
            {isAudio ? <Headphones size={24} /> : <Play size={24} />}
          </div>
        </div>
      </div>
      <div className="p-8 flex flex-col flex-1">
        <div className="mb-3">
          <span className="text-fs-label font-bold text-gold uppercase tracking-[0.2em]">{isAudio ? 'Medytacja' : 'Webinar'}</span>
        </div>
                    <h3 className="font-serif text-fs-body-lg text-mauve mb-3 leading-tight group-hover:text-terracotta transition-colors">{item.title}</h3>
        <p className="mb-5 flex-1 line-clamp-2 text-fs-body leading-relaxed text-mauve/60">{item.description}</p>
        <div className="pt-4 border-t border-gold/5">
          <PanelBlobButton minWidthClassName="min-w-[11rem]">Otwórz teraz</PanelBlobButton>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const [library, setLibrary] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [libraryError, setLibraryError] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeDigital, setActiveDigital] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    Promise.allSettled([
      axios.get('/api/client/library'),
      axios.get('/api/client/orders'),
    ])
      .then(([libraryResult, ordersResult]) => {
        if (libraryResult.status === 'fulfilled') {
          setLibrary(libraryResult.value.data || []);
          setLibraryError('');
        } else {
          console.error(libraryResult.reason);
          setLibraryError('Nie udało się wczytać biblioteki materiałów. Odśwież stronę albo spróbuj ponownie za chwilę.');
        }

        if (ordersResult.status === 'fulfilled') {
          setOrders(ordersResult.value.data || []);
          setOrdersError('');
        } else {
          console.error(ordersResult.reason);
          setOrdersError('Nie udało się pobrać historii zakupów. Spróbuj ponownie za chwilę.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-nude flex items-center justify-center">
      <div className="animate-pulse text-fs-body text-mauve/60">Ładowanie biblioteki...</div>
    </div>
  );

  const courses = library.filter(i => i.type === 'course');
  const digitals = library.filter(i => i.type !== 'course');

  if (activeCourse) {
    return (
      <div className="w-full relative">
        <div className="max-w-6xl mx-auto py-4">
          <CourseLMS product={activeCourse} onBack={() => setActiveCourse(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-x-hidden">
      <div className="absolute right-0 top-0 h-[260px] w-[260px] rounded-full bg-rose/10 blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute left-0 top-20 h-[220px] w-[220px] rounded-full bg-gold/10 blur-[100px] pointer-events-none -z-10 -translate-x-1/3" />
      <div className="max-w-6xl mx-auto py-4">
        <h1 className="font-serif text-fs-title-md text-mauve">Hej, {getUserDisplayName(user)}!</h1>

        <div className="mt-10">
          {library.length === 0 ? (
            <section className="mb-16">
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="flex items-center gap-3 font-serif text-fs-title-sm text-mauve">
                    <BookOpen size={18} className="text-gold" /> Biblioteka materiałów
                  </h2>
                  <p className="mt-2 max-w-2xl text-fs-body leading-relaxed text-mauve/60">Tutaj znajdziesz wszystkie kursy, webinary i materiały cyfrowe dostępne na Twoim koncie.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[28px] border border-white/80 bg-white/60 px-5 py-4 text-fs-ui text-mauve/70">
                    <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Dostępne materiały</p>
                    <p className="mt-2 font-serif text-fs-title-sm text-mauve">{library.length}</p>
                  </div>
                  <div className="rounded-[28px] border border-white/80 bg-white/60 px-5 py-4 text-fs-ui text-mauve/70">
                    <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/45">Zamówienia</p>
                    <p className="mt-2 font-serif text-fs-title-sm text-mauve">{orders.length}</p>
                  </div>
                </div>
              </div>

              {libraryError ? (
                <div className="mb-8 rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body leading-relaxed text-mauve/80">
                  {libraryError}
                </div>
              ) : null}

              <div className="rounded-3xl border border-white/80 bg-white/40 py-20 text-center">
                <ShoppingBag size={48} className="mx-auto mb-6 text-mauve/15" />
                <h2 className="mb-3 text-fs-title-sm font-serif text-mauve/60">Twoja biblioteka jest pusta</h2>
                <p className="mb-8 text-fs-body text-mauve/55">Odkryj ofertę i wróć tutaj po zakupie materiałów.</p>
                <div className="flex justify-center">
                  <PanelBlobButton href="/" minWidthClassName="min-w-[11.5rem]">Przejrzyj ofertę</PanelBlobButton>
                </div>
              </div>
            </section>
          ) : (
            <>
              {libraryError ? (
                <div className="mb-8 rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body leading-relaxed text-mauve/80">
                  {libraryError}
                </div>
              ) : null}

              {courses.length > 0 ? (
                <section className="mb-16">
                  <div className="mb-6">
                    <h2 className="flex items-center gap-3 font-serif text-fs-title-sm text-mauve">
                      <BookOpen size={18} className="text-gold" /> Biblioteka kursów
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map(item => (
                      <div
                        key={item.id}
                        className="flex h-full cursor-pointer flex-col overflow-hidden rounded-[35px] border border-gold/10 bg-white/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl group"
                        onClick={() => setActiveCourse(item)}
                      >
                        {item.thumbnail_url ? (
                          <div className="relative h-48 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${item.thumbnail_url})` }}>
                            <div className="absolute inset-0 flex items-center justify-center bg-mauve/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-[2px]">
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-mauve shadow-xl transition-transform group-hover:scale-100 scale-75">
                                <Play size={24} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-mauve/10 to-mauve/20">
                            <BookOpen size={48} className="text-mauve/20" />
                            <div className="absolute inset-0 flex items-center justify-center bg-mauve/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-[2px]">
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-mauve shadow-xl transition-transform group-hover:scale-100 scale-75">
                                <Play size={24} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-1 flex-col p-8">
                          <div className="mb-3">
                            <span className="text-fs-label font-bold uppercase tracking-[0.2em] text-gold">Kurs online</span>
                          </div>
                          <h3 className="mb-3 font-serif text-fs-body-lg leading-tight text-mauve transition-colors group-hover:text-terracotta">{item.title}</h3>
                          <p className="mb-5 flex-1 line-clamp-2 text-fs-body leading-relaxed text-mauve/60">{item.description?.split('\n')[0]}</p>
                          <div className="border-t border-gold/5 pt-4">
                            <PanelBlobButton minWidthClassName="min-w-[12rem]">Rozpocznij naukę</PanelBlobButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {digitals.length > 0 ? (
                <section className="mb-16">
                  <div className="mb-8">
                    <h2 className="flex items-center gap-3 font-serif text-fs-title-sm text-mauve">
                      <PlayCircle size={20} className="text-gold" /> Webinary i medytacje
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {digitals.map(item => <DigitalProductCard key={item.id} item={item} onOpen={setActiveDigital} />)}
                  </div>
                </section>
              ) : null}

              {activeDigital ? <DigitalProductViewer item={activeDigital} onClose={() => setActiveDigital(null)} /> : null}
            </>
          )}

          {ordersError ? (
            <div className="mb-8 rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body leading-relaxed text-mauve/80">
              {ordersError}
            </div>
          ) : null}

          <section className="mb-16">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="flex items-center gap-3 font-serif text-fs-title-sm text-mauve">
                  <ShoppingBag size={20} className="text-gold" /> Historia zakupów
                </h2>
                <p className="mt-2 max-w-2xl text-fs-body leading-relaxed text-mauve/60">W tym miejscu widać wszystkie zamówienia przypisane do Twojego adresu e-mail, razem ze statusem płatności i numerem zamówienia.</p>
              </div>
            </div>

            {orders.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {orders.map((order) => (
                  <article key={order.id} className="rounded-[32px] border border-white/80 bg-white/70 p-6 shadow-[0_18px_55px_rgba(67,56,70,0.06)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-gold">{order.order_number || 'Zamówienie'}</p>
                        <h3 className="mt-3 font-serif text-fs-body-lg text-mauve">{order.product_title || 'Produkt'}</h3>
                        <p className="mt-2 text-fs-body text-mauve/60">{formatDateTime(order.created_at)}</p>
                        {order.product_slug ? (
                          <a href={`/oferta/${order.product_slug}`} className="mt-3 inline-flex text-fs-ui font-medium text-terracotta transition hover:text-gold">
                            Zobacz stronę produktu
                          </a>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 md:items-end">
                        <span className="inline-flex items-center rounded-full bg-nude px-3 py-1.5 text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/55">
                          {renderOrderStatus(order.status)}
                        </span>
                        <p className="text-fs-body font-medium text-mauve">{formatCurrency(order.amount_total)}</p>
                        <p className="text-fs-ui text-mauve/50">{renderPaymentMethod(order.payment_method)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/80 bg-white/40 py-16 text-center">
                <ShoppingBag size={48} className="mx-auto mb-6 text-mauve/15" />
                <h3 className="mb-3 text-fs-title-sm font-serif text-mauve/60">Historia zakupów jest jeszcze pusta</h3>
                <p className="text-fs-body text-mauve/55">Po pierwszym zakupie numer i status zamówienia pojawią się właśnie tutaj.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
