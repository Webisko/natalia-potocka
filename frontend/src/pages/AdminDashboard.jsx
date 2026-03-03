import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, BookOpen, ChevronDown, ChevronRight, GripVertical, 
         Video, Volume2, FileText, Plus, Save, X, Check, Star, Users } from 'lucide-react';

// ─── Lesson Form ──────────────────────────────────────────────────────────────
function LessonForm({ moduleId, lesson, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    lesson_type: lesson?.lesson_type || 'video',
    content_url: lesson?.content_url || '',
    content_text: lesson?.content_text || '',
    duration_minutes: lesson?.duration_minutes || '',
    order_index: lesson?.order_index || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (lesson?.id) {
        await axios.put(`/api/courses/lessons/${lesson.id}`, form);
      } else {
        await axios.post(`/api/courses/modules/${moduleId}/lessons`, form);
      }
      onSave();
    } catch (err) {
      alert('Błąd: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = [
    { value: 'video', label: 'Wideo', icon: <Video size={14} /> },
    { value: 'audio', label: 'Audio', icon: <Volume2 size={14} /> },
    { value: 'text', label: 'Tekst', icon: <FileText size={14} /> },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-nude/60 rounded-2xl p-5 border border-mauve/10 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">Tytuł lekcji *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
            className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve placeholder:text-mauve/30 text-sm" placeholder="Tytuł lekcji..." />
        </div>
        <div>
          <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">Typ lekcji</label>
          <div className="flex gap-2">
            {typeOptions.map(t => (
              <button type="button" key={t.value} onClick={() => setForm({ ...form, lesson_type: t.value })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${form.lesson_type === t.value ? 'bg-mauve text-white border-mauve' : 'bg-white text-mauve/50 border-mauve/15 hover:border-mauve/30'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">Czas trwania (min)</label>
          <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
            className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm" placeholder="np. 20" />
        </div>
        {(form.lesson_type === 'video' || form.lesson_type === 'audio') && (
          <div className="sm:col-span-2">
            <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">URL {form.lesson_type === 'video' ? 'wideo (embed)' : 'audio'}</label>
            <input value={form.content_url} onChange={e => setForm({ ...form, content_url: e.target.value })}
              className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm" placeholder="https://..." />
          </div>
        )}
        {form.lesson_type === 'text' && (
          <div className="sm:col-span-2">
            <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">Treść lekcji (Markdown)</label>
            <textarea value={form.content_text} onChange={e => setForm({ ...form, content_text: e.target.value })} rows={8}
              className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm font-mono resize-y" placeholder="# Nagłówek&#10;&#10;Tekst lekcji..." />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">Opis (widoczny dla ucznia)</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
            className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm resize-none" placeholder="Krótki opis lekcji..." />
        </div>
        <div>
          <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">Kolejność</label>
          <input type="number" value={form.order_index} onChange={e => setForm({ ...form, order_index: parseInt(e.target.value) })}
            className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-mauve/5 text-mauve/50 text-sm font-medium hover:bg-mauve/10 transition-colors">
          <X size={14} /> Anuluj
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-white text-sm font-bold uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50">
          <Save size={14} /> {saving ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </div>
    </form>
  );
}

// ─── Module Editor ────────────────────────────────────────────────────────────
function ModuleEditor({ module, courseId, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: module.title, description: module.description || '', order_index: module.order_index });
  const [addingLesson, setAddingLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  const saveModule = async () => {
    try {
      await axios.put(`/api/courses/modules/${module.id}`, moduleForm);
      setEditingModule(false);
      onRefresh();
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const deleteModule = async () => {
    if (!window.confirm('Usunąć moduł i wszystkie jego lekcje?')) return;
    try {
      await axios.delete(`/api/courses/modules/${module.id}`);
      onRefresh();
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Usunąć tę lekcję?')) return;
    try {
      await axios.delete(`/api/courses/lessons/${lessonId}`);
      onRefresh();
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const LessonTypeIcon = ({ type }) => {
    if (type === 'audio') return <Volume2 size={13} className="text-gold flex-shrink-0" />;
    if (type === 'text') return <FileText size={13} className="text-mauve/40 flex-shrink-0" />;
    return <Video size={13} className="text-terracotta flex-shrink-0" />;
  };

  return (
    <div className="border border-mauve/10 rounded-2xl overflow-hidden bg-white/60">
      {/* MODULE HEADER */}
      {editingModule ? (
        <div className="p-4 bg-gold/5 border-b border-mauve/10">
          <input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
            className="w-full px-3 py-2 border border-mauve/15 rounded-xl bg-white text-sm text-mauve mb-2 focus:outline-none focus:ring-2 focus:ring-gold/30" />
          <input value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-mauve/15 rounded-xl bg-white text-sm text-mauve/60 mb-3 focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Opis modułu (opcjonalny)..." />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditingModule(false)} className="px-3 py-1.5 rounded-lg bg-mauve/5 text-mauve/50 text-xs font-medium hover:bg-mauve/10 transition-colors">Anuluj</button>
            <button onClick={saveModule} className="px-3 py-1.5 rounded-lg bg-gold text-white text-xs font-bold uppercase tracking-wider hover:bg-gold/90 transition-colors flex items-center gap-1">
              <Check size={12} /> Zapisz
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center p-4 cursor-pointer hover:bg-white/80 transition-colors" onClick={() => setOpen(!open)}>
          <GripVertical size={16} className="text-mauve/20 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-serif text-mauve font-medium">{module.title}</span>
            {module.description && <span className="text-xs text-mauve/40 font-light ml-2">– {module.description}</span>}
            <span className="text-xs text-mauve/30 font-light ml-2">({module.lessons?.length || 0} lekcji)</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button onClick={e => { e.stopPropagation(); setEditingModule(true); }} className="p-1.5 hover:bg-mauve/10 rounded-lg text-mauve/40 hover:text-mauve transition-colors">
              <Edit size={14} />
            </button>
            <button onClick={e => { e.stopPropagation(); deleteModule(); }} className="p-1.5 hover:bg-red-50 rounded-lg text-mauve/30 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
            <ChevronDown size={15} className={`text-mauve/30 transition-transform ml-1 ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      )}

      {/* LESSONS */}
      {open && (
        <div className="border-t border-mauve/5">
          {module.lessons?.length === 0 && (
            <p className="px-5 py-4 text-xs text-mauve/30 font-light italic">Brak lekcji. Dodaj pierwszą lekcję poniżej.</p>
          )}
          {module.lessons?.map(lesson => (
            <div key={lesson.id}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-mauve/5 hover:bg-nude/40 transition-colors">
                <GripVertical size={14} className="text-mauve/15 flex-shrink-0" />
                <LessonTypeIcon type={lesson.lesson_type} />
                <span className="text-sm text-mauve/70 flex-1 font-light">{lesson.title}</span>
                {lesson.duration_minutes && <span className="text-xs text-mauve/30 font-light">{lesson.duration_minutes} min</span>}
                <button onClick={() => setEditingLesson(editingLesson?.id === lesson.id ? null : lesson)}
                  className="p-1.5 hover:bg-mauve/10 rounded-lg text-mauve/40 hover:text-mauve transition-colors">
                  <Edit size={13} />
                </button>
                <button onClick={() => deleteLesson(lesson.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-mauve/30 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
              {editingLesson?.id === lesson.id && (
                <div className="px-4 pb-4">
                  <LessonForm moduleId={module.id} lesson={lesson} onSave={() => { setEditingLesson(null); onRefresh(); }} onCancel={() => setEditingLesson(null)} />
                </div>
              )}
            </div>
          ))}

          {/* ADD LESSON */}
          <div className="px-4 pb-3 pt-2">
            {addingLesson ? (
              <LessonForm moduleId={module.id} onSave={() => { setAddingLesson(false); onRefresh(); }} onCancel={() => setAddingLesson(false)} />
            ) : (
              <button onClick={() => setAddingLesson(true)}
                className="flex items-center gap-2 text-xs text-gold font-bold uppercase tracking-wider hover:text-gold/70 transition-colors py-2">
                <Plus size={13} /> Dodaj lekcję
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Course Editor ────────────────────────────────────────────────────────────
function CourseEditor({ productId, productTitle, onClose }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', thumbnail_url: '' });
  const [addingModule, setAddingModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order_index: 0 });

  const loadCourse = useCallback(async () => {
    try {
      const res = await axios.get(`/api/courses/by-product/${productId}`);
      setCourse(res.data);
      setCourseForm({ title: res.data.title, description: res.data.description || '', thumbnail_url: res.data.thumbnail_url || '' });
    } catch {
      // No course yet
    } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  const createCourse = async () => {
    try {
      await axios.post('/api/courses', { product_id: productId, ...courseForm });
      loadCourse();
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const saveCourse = async () => {
    try {
      await axios.put(`/api/courses/${course.id}`, courseForm);
      loadCourse();
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const addModule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/courses/${course.id}/modules`, moduleForm);
      setModuleForm({ title: '', description: '', order_index: course?.modules?.length || 0 });
      setAddingModule(false);
      loadCourse();
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  if (loading) return <div className="p-8 text-center text-mauve/40">Ładowanie...</div>;

  return (
    <div className="fixed inset-0 z-50 bg-mauve/20 backdrop-blur-sm flex items-start justify-center p-4 overflow-auto">
      <div className="bg-nude w-full max-w-3xl rounded-3xl shadow-2xl border border-mauve/10 my-4">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-mauve/10">
          <div>
            <h2 className="font-serif text-xl text-mauve">Edytor Kursu</h2>
            <p className="text-sm text-mauve/40 font-light">{productTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-mauve/10 rounded-xl text-mauve/40 hover:text-mauve transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* COURSE SETTINGS */}
          <div className="bg-white/60 rounded-2xl p-5 border border-white/80">
            <h3 className="font-serif text-mauve mb-4 flex items-center gap-2"><BookOpen size={16} className="text-gold" /> Ustawienia kursu</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">Tytuł kursu *</label>
                <input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm" placeholder="Tytuł..." />
              </div>
              <div>
                <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">URL miniaturki</label>
                <input value={courseForm.thumbnail_url} onChange={e => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-mauve/50 font-bold uppercase tracking-wider mb-1 block">Opis</label>
                <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm resize-none" placeholder="Opis kursu..." />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              {course ? (
                <button onClick={saveCourse} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-gold/90 transition-colors">
                  <Save size={14} /> Zapisz zmiany
                </button>
              ) : (
                <button onClick={createCourse} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-gold/90 transition-colors">
                  <Plus size={14} /> Utwórz kurs
                </button>
              )}
            </div>
          </div>

          {/* MODULES */}
          {course && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-mauve flex items-center gap-2"><Star size={15} className="text-gold" /> Moduły ({course.modules?.length || 0})</h3>
                <button onClick={() => setAddingModule(!addingModule)}
                  className="flex items-center gap-2 text-xs text-gold font-bold uppercase tracking-wider hover:text-gold/70 transition-colors">
                  <Plus size={13} /> Dodaj moduł
                </button>
              </div>

              {addingModule && (
                <form onSubmit={addModule} className="bg-white/70 rounded-2xl p-4 border border-mauve/10 mb-4">
                  <input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} required
                    className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm mb-2" placeholder="Tytuł modułu..." />
                  <input value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm mb-3" placeholder="Opis (opcjonalny)..." />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setAddingModule(false)} className="px-3 py-1.5 rounded-lg bg-mauve/5 text-mauve/50 text-xs font-medium hover:bg-mauve/10 transition-colors">Anuluj</button>
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-gold text-white text-xs font-bold uppercase tracking-wider hover:bg-gold/90 transition-colors">Utwórz moduł</button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {course.modules?.length === 0 && (
                  <p className="text-sm text-mauve/30 font-light italic text-center py-6">Brak modułów. Dodaj pierwszy moduł, aby zorganizować lekcje.</p>
                )}
                {course.modules?.map(m => (
                  <ModuleEditor key={m.id} module={m} courseId={course.id} onRefresh={loadCourse} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantProductId, setGrantProductId] = useState('');
  const [grantMessage, setGrantMessage] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null); // { productId, productTitle }

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/admin/products');
      setProducts(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Na pewno usunąć ten produkt?')) return;
    try {
      await axios.delete(`/api/admin/products/${id}`);
      fetchProducts();
    } catch (err) { alert('Błąd usuwania: ' + err.message); }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    setGrantMessage(null);
    try {
      const res = await axios.post('/api/admin/grant-access', { email: grantEmail, product_id: grantProductId });
      setGrantMessage({ type: 'success', text: res.data.message });
      setGrantEmail(''); setGrantProductId('');
    } catch (err) {
      setGrantMessage({ type: 'error', text: err.response?.data?.error || 'Wystąpił błąd' });
    }
  };

  const typeLabel = (type) => {
    const labels = { video: 'Webinar', audio: 'Medytacja', service: 'Usługa', course: 'Kurs Online' };
    return labels[type] || type;
  };
  const typeColor = (type) => {
    const colors = { video: 'text-terracotta bg-terracotta/10', audio: 'text-gold bg-gold/10', service: 'text-mauve bg-mauve/10', course: 'text-blue-600 bg-blue-50' };
    return colors[type] || 'text-mauve/40 bg-mauve/5';
  };

  return (
    <div className="min-h-screen bg-nude">
      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-10">
        {/* HEADER */}
        <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-serif text-mauve mb-1">Panel Administratora</h1>
            <p className="text-mauve/40 font-light text-sm">Zarządzaj produktami, kursami i opiniami.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/admin/reviews" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-mauve/10 text-mauve/60 text-sm font-medium rounded-xl hover:bg-mauve/5 transition-colors">
              <Star size={16} /> Opinie
            </Link>
            <Link to="/admin/product/new" className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-gold/90 transition-colors">
              <PlusCircle size={16} /> Nowy Produkt
            </Link>
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="bg-white/60 rounded-3xl border border-white/80 shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-5 border-b border-mauve/5 flex items-center justify-between">
            <h2 className="font-serif text-xl text-mauve">Produkty ({products.length})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-mauve/30 font-light">Ładowanie...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-mauve/5">
                    {['Tytuł', 'Typ', 'Slug', 'Cena', 'Akcje'].map(h => (
                      <th key={h} className="px-6 py-3 text-xs text-mauve/40 font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-mauve/5">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-mauve text-sm">{p.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${typeColor(p.type)}`}>{typeLabel(p.type)}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-mauve/40 font-mono">{p.slug}</td>
                      <td className="px-6 py-4 font-serif text-mauve">{p.price.toFixed(2)} zł</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link to={`/admin/product/${p.id}`} className="p-2 hover:bg-mauve/10 rounded-xl text-mauve/40 hover:text-mauve transition-colors" title="Edytuj produkt">
                            <Edit size={15} />
                          </Link>
                          {p.type === 'course' && (
                            <button onClick={() => setEditingCourse({ productId: p.id, productTitle: p.title })}
                              className="p-2 hover:bg-gold/10 rounded-xl text-mauve/40 hover:text-gold transition-colors" title="Edytuj kurs / lekcje">
                              <BookOpen size={15} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 rounded-xl text-mauve/30 hover:text-red-400 transition-colors" title="Usuń">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-10 text-center text-mauve/30 italic font-light">Brak produktów.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GRANT ACCESS */}
        <div className="bg-white/60 rounded-3xl border border-white/80 shadow-sm p-6">
          <h2 className="font-serif text-xl text-mauve mb-4 flex items-center gap-2"><Users size={18} className="text-gold" /> Ręczne nadawanie dostępu</h2>
          {grantMessage && (
            <div className={`p-3 rounded-xl text-sm mb-4 ${grantMessage.type === 'success' ? 'bg-gold/10 text-gold' : 'bg-red-50 text-red-600'}`}>
              {grantMessage.text}
            </div>
          )}
          <form onSubmit={handleGrantAccess} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <input type="email" placeholder="E-mail klienta" value={grantEmail}
              onChange={e => setGrantEmail(e.target.value)} required
              className="flex-1 px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm" />
            <select required value={grantProductId} onChange={e => setGrantProductId(e.target.value)}
              className="px-4 py-2.5 border border-mauve/15 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-mauve text-sm">
              <option value="">Wybierz produkt...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <button type="submit" className="px-5 py-2.5 bg-mauve text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-mauve/90 transition-colors whitespace-nowrap">
              Nadaj Dostęp
            </button>
          </form>
        </div>
      </div>

      {/* COURSE EDITOR MODAL */}
      {editingCourse && (
        <CourseEditor productId={editingCourse.productId} productTitle={editingCourse.productTitle} onClose={() => setEditingCourse(null)} />
      )}
    </div>
  );
}
