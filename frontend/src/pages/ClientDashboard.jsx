import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlayCircle, Download, Headphones, BookOpen, ChevronDown, ChevronLeft, Check, 
         Clock, FileText, Star, ShoppingBag, X, Volume2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Lesson Viewer ────────────────────────────────────────────────────────────
function LessonViewer({ lesson, onClose }) {
  if (!lesson) return null;
  return (
    <div className="fixed inset-0 z-50 bg-mauve/95 backdrop-blur-md flex flex-col" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h3 className="text-white font-serif text-lg">{lesson.title}</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-2">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {lesson.lesson_type === 'video' && lesson.content_url && (
            <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-8">
              <iframe src={lesson.content_url} className="w-full h-full" allowFullScreen title={lesson.title} />
            </div>
          )}
          {lesson.lesson_type === 'audio' && lesson.content_url && (
            <div className="bg-white/10 rounded-2xl p-8 mb-8 flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center">
                <Volume2 size={40} className="text-gold" />
              </div>
              <audio controls src={lesson.content_url} className="w-full max-w-lg" style={{ colorScheme: 'dark' }}>
                Twoja przeglądarka nie obsługuje elementu audio.
              </audio>
            </div>
          )}
          {lesson.description && (
            <p className="text-white/70 font-light leading-relaxed mb-8">{lesson.description}</p>
          )}
          {lesson.content_text && (
            <div className="prose prose-invert max-w-none text-white/80 prose-headings:text-white prose-strong:text-white leading-relaxed">
              {lesson.content_text.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-serif text-white mt-8 mb-4">{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-serif text-white/90 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-white mb-2">{line.slice(2, -2)}</p>;
                if (line.startsWith('- ')) return <li key={i} className="text-white/70 ml-4 mb-1 font-light">{line.replace('- ', '')}</li>;
                if (line.match(/^\d+\./)) return <li key={i} className="text-white/70 ml-4 mb-1 font-light">{line}</li>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="text-white/70 font-light mb-3 leading-relaxed">{line}</p>;
              })}
            </div>
          )}
          {/* ATTACHMENTS */}
          {lesson.attachments?.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-8">
              <h4 className="text-white/60 text-sm font-bold uppercase tracking-wider mb-4">Pliki do pobrania</h4>
              <div className="space-y-2">
                {lesson.attachments.map(att => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 rounded-xl text-white/80 text-sm">
                    <Download size={16} className="text-gold flex-shrink-0" />
                    {att.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LMS Course Player ────────────────────────────────────────────────────────
function CourseLMS({ product, onBack }) {
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState({ progress: {}, total: 0, completed: 0 });
  const [activeLesson, setActiveLesson] = useState(null);
  const [openModuleIds, setOpenModuleIds] = useState([]);
  const [loading, setLoading] = useState(true);

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
        } catch {}
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
      <div className="text-mauve/40 font-light">Ładowanie kursu...</div>
    </div>
  );

  if (!course) return (
    <div className="text-center py-16">
      <p className="text-mauve/40">Kurs nie jest jeszcze dostępny.</p>
    </div>
  );

  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* LMS HEADER */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-mauve/50 hover:text-mauve text-sm font-light mb-6 transition-colors">
          <ChevronLeft size={16} /> Wróć do biblioteki
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-gold uppercase tracking-widest block mb-1">Kurs Online</span>
            <h2 className="text-2xl md:text-3xl font-serif text-mauve">{product.title}</h2>
          </div>
          <div className="text-right">
            <span className="text-sm text-mauve/40 font-light">{progress.completed} / {progress.total} lekcji</span>
            <div className="text-2xl font-serif text-mauve">{pct}%</div>
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
                    <h3 className="font-serif text-mauve font-medium text-left">{module.title}</h3>
                    <span className="text-xs text-mauve/40 font-light">{completedInModule}/{module.lessons?.length || 0} lekcji ukończonych</span>
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
                          <span className={`text-sm font-light flex-1 min-w-0 truncate ${done ? 'text-mauve/40 line-through' : 'text-mauve/80 group-hover:text-mauve'}`}>
                            {lesson.title}
                          </span>
                        </button>
                        {/* META */}
                        {lesson.duration_minutes && (
                          <span className="text-xs text-mauve/30 font-light flex items-center gap-1 flex-shrink-0">
                            <Clock size={10} /> {lesson.duration_minutes} min
                          </span>
                        )}
                        {lesson.attachments?.length > 0 && (
                          <Download size={12} className="text-mauve/20 flex-shrink-0" />
                        )}
                        {/* OPEN LESSON */}
                        <button onClick={() => setActiveLesson(lesson)}
                          className="ml-1 px-3 py-1 bg-mauve/5 hover:bg-mauve/10 rounded-lg text-xs text-mauve/50 hover:text-mauve whitespace-nowrap transition-colors flex-shrink-0">
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

      {/* LESSON VIEWER MODAL */}
      {activeLesson && (
        <LessonViewer lesson={activeLesson} onClose={() => setActiveLesson(null)} />
      )}
    </div>
  );
}

// ─── Digital Product Viewer ───────────────────────────────────────────────────
function DigitalProductCard({ item }) {
  const isAudio = item.type === 'audio';
  const isVideo = item.type === 'video';

  return (
    <div className="bg-white/60 rounded-2xl border border-white/80 overflow-hidden hover:shadow-lg transition-shadow">
      {item.thumbnail_url && (
        <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${item.thumbnail_url})` }} />
      )}
      {!item.thumbnail_url && (
        <div className={`h-40 flex items-center justify-center ${isAudio ? 'bg-gradient-to-br from-gold/10 to-blush/20' : 'bg-gradient-to-br from-rose/10 to-nude'}`}>
          {isAudio ? <Headphones size={40} className="text-gold/40" /> : <PlayCircle size={40} className="text-terracotta/40" />}
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gold uppercase tracking-widest">{item.type === 'audio' ? 'Medytacja' : 'Webinar'}</span>
          <Check size={14} className="text-gold" />
        </div>
        <h3 className="font-serif text-xl text-mauve mb-2">{item.title}</h3>
        <p className="text-mauve/50 text-sm font-light mb-6 line-clamp-2">{item.description}</p>
        <div className="space-y-2">
          {isAudio && item.content_url ? (
            <div>
              <p className="text-xs text-mauve/40 font-medium mb-2 uppercase tracking-wider">Odtwórz Audio</p>
              <audio controls src={item.content_url} className="w-full h-10 outline-none" />
            </div>
          ) : isVideo && item.content_url ? (
            <a href={item.content_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-mauve text-white rounded-xl text-sm font-medium hover:bg-mauve/90 transition-colors">
              <PlayCircle size={16} /> Odtwórz Webinar
            </a>
          ) : null}
          {item.content_url && (
            <a href={item.content_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-mauve/5 hover:bg-mauve/10 text-mauve/60 hover:text-mauve rounded-xl text-sm font-light border border-mauve/5 transition-colors">
              <Download size={14} /> Pobierz plik
            </a>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    axios.get('/api/client/library')
      .then(res => setLibrary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-nude flex items-center justify-center">
      <div className="text-mauve/40 font-light animate-pulse">Ładowanie biblioteki...</div>
    </div>
  );

  const courses = library.filter(i => i.type === 'course');
  const digitals = library.filter(i => i.type !== 'course');

  if (activeCourse) {
    return (
      <div className="min-h-screen bg-nude">
        <div className="max-w-[1000px] mx-auto px-6 md:px-12 py-8">
          <CourseLMS product={activeCourse} onBack={() => setActiveCourse(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nude">
      {/* TOP DECORATIONS */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose/10 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-10">

        {/* HEADER */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
              <Star size={18} className="text-gold" />
            </div>
            <span className="text-gold text-xs font-bold uppercase tracking-widest">Moje Konto</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-mauve mb-2">Witaj, {user?.email?.split('@')[0]}!</h1>
          <p className="text-mauve/50 font-light">Twoje zakupione produkty i kursy.</p>
        </div>

        {library.length === 0 ? (
          <div className="text-center py-20 bg-white/40 rounded-3xl border border-white/80">
            <ShoppingBag size={48} className="text-mauve/15 mx-auto mb-6" />
            <h2 className="text-2xl font-serif text-mauve/40 mb-3">Twoja biblioteka jest pusta</h2>
            <p className="text-mauve/30 font-light mb-8">Odkryj naszą ofertę i zacznij swoją podróż.</p>
            <Link to="/" className="inline-flex items-center gap-2 px-8 h-12 bg-gold text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:shadow-xl transition-all">
              Przejrzyj Ofertę
            </Link>
          </div>
        ) : (
          <>
            {/* COURSES */}
            {courses.length > 0 && (
              <section className="mb-16">
                <h2 className="text-xl font-serif text-mauve mb-6 flex items-center gap-3">
                  <BookOpen size={18} className="text-gold" /> Moje Kursy
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map(item => (
                    <div key={item.id} className="bg-white/60 rounded-2xl border border-white/80 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => setActiveCourse(item)}>
                      {item.thumbnail_url ? (
                        <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${item.thumbnail_url})` }}>
                          <div className="absolute inset-0 bg-mauve/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={40} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-mauve/10 to-mauve/20 flex items-center justify-center relative">
                          <BookOpen size={40} className="text-mauve/20" />
                          <div className="absolute inset-0 bg-mauve/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={40} className="text-white" />
                          </div>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gold uppercase tracking-widest">Kurs Online</span>
                          <Check size={14} className="text-gold" />
                        </div>
                        <h3 className="font-serif text-xl text-mauve mb-1">{item.title}</h3>
                        <p className="text-mauve/40 text-sm font-light mb-4 line-clamp-2">{item.description?.split('\n')[0]}</p>
                        <span className="inline-flex items-center gap-2 text-sm text-mauve/60 group-hover:text-mauve transition-colors font-medium">
                          <Play size={14} /> Rozpocznij naukę
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DIGITAL PRODUCTS */}
            {digitals.length > 0 && (
              <section>
                <h2 className="text-xl font-serif text-mauve mb-6 flex items-center gap-3">
                  <PlayCircle size={18} className="text-gold" /> Webinary i Medytacje
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {digitals.map(item => <DigitalProductCard key={item.id} item={item} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
