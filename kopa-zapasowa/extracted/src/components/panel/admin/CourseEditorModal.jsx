import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen, Check, Edit, FileText, GripVertical, Plus, Save, Star, Trash2, Video, Volume2 } from 'lucide-react';
import AdminModalShell from './AdminModalShell';
import AdminMediaPicker from './AdminMediaPicker';

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (lesson?.id) {
        await axios.put(`/api/courses/lessons/${lesson.id}`, form);
      } else {
        await axios.post(`/api/courses/modules/${moduleId}/lessons`, form);
      }
      onSave();
    } catch (error) {
      alert('Błąd: ' + (error.response?.data?.error || error.message));
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
    <form onSubmit={handleSubmit} className="mt-2 rounded-2xl border border-mauve/10 bg-nude/60 p-5">
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-fs-label font-bold uppercase tracking-wider text-mauve/50">Tytuł lekcji *</label>
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="w-full rounded-xl border border-mauve/15 bg-white px-4 py-2.5 text-fs-body text-mauve placeholder:text-mauve/30 focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Tytuł lekcji..." />
        </div>
        <div>
          <label className="mb-1 block text-fs-label font-bold uppercase tracking-wider text-mauve/50">Typ lekcji</label>
          <div className="flex gap-2">
            {typeOptions.map((typeOption) => (
              <button type="button" key={typeOption.value} onClick={() => setForm({ ...form, lesson_type: typeOption.value })} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-fs-label font-bold uppercase tracking-wider transition-all ${form.lesson_type === typeOption.value ? 'border-mauve bg-mauve text-white' : 'border-mauve/15 bg-white text-mauve/50 hover:border-mauve/30'}`}>
                {typeOption.icon} {typeOption.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-fs-label font-bold uppercase tracking-wider text-mauve/50">Czas trwania (min)</label>
          <input type="number" value={form.duration_minutes} onChange={(event) => setForm({ ...form, duration_minutes: event.target.value })} className="w-full rounded-xl border border-mauve/15 bg-white px-4 py-2.5 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="np. 20" />
        </div>
        {(form.lesson_type === 'video' || form.lesson_type === 'audio') && (
          <div className="sm:col-span-2">
            <AdminMediaPicker
              label={form.lesson_type === 'video' ? 'Materiał wideo' : 'Materiał audio'}
              value={form.content_url}
              onChange={(nextValue) => setForm({ ...form, content_url: nextValue })}
              helperText={form.lesson_type === 'video' ? 'Możesz wybrać plik wideo z biblioteki albo wkleić embed URL z zewnętrznej platformy.' : 'Możesz wybrać plik audio z biblioteki albo wkleić bezpośredni adres nagrania.'}
              allowedKinds={form.lesson_type === 'video' ? ['video'] : ['audio']}
              accept={form.lesson_type === 'video' ? 'video/*' : 'audio/*'}
              emptyStateText={form.lesson_type === 'video' ? 'Brak wybranego materiału wideo.' : 'Brak wybranego materiału audio.'}
              currentValueLabel={form.lesson_type === 'video' ? 'Aktualnie wybrane wideo' : 'Aktualnie wybrane audio'}
              removeLabel="Usuń materiał"
              libraryDescription={form.lesson_type === 'video' ? 'Wybierz plik wideo z biblioteki mediów albo dodaj nowe nagranie.' : 'Wybierz plik audio z biblioteki mediów albo dodaj nowe nagranie.'}
              uploadButtonLabel={form.lesson_type === 'video' ? 'Wgraj wideo' : 'Wgraj audio'}
              allowManualUrl={true}
              manualUrlLabel={form.lesson_type === 'video' ? 'Adres wideo lub embed URL' : 'Adres pliku audio'}
              manualUrlPlaceholder="https://..."
            />
          </div>
        )}
        {form.lesson_type === 'text' && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-fs-label font-bold uppercase tracking-wider text-mauve/50">Treść lekcji (Markdown)</label>
            <textarea value={form.content_text} onChange={(event) => setForm({ ...form, content_text: event.target.value })} rows={8} className="w-full resize-y rounded-xl border border-mauve/15 bg-white px-4 py-2.5 font-mono text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="# Nagłówek&#10;&#10;Tekst lekcji..." />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-fs-label font-bold uppercase tracking-wider text-mauve/50">Opis (widoczny dla klientki)</label>
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} className="w-full resize-none rounded-xl border border-mauve/15 bg-white px-4 py-2.5 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Krótki opis lekcji..." />
        </div>
        <div>
          <label className="mb-1 block text-fs-label font-bold uppercase tracking-wider text-mauve/50">Kolejność</label>
          <input type="number" value={form.order_index} onChange={(event) => setForm({ ...form, order_index: Number.parseInt(event.target.value || '0', 10) })} className="w-full rounded-xl border border-mauve/15 bg-white px-4 py-2.5 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 rounded-xl bg-mauve/5 px-4 py-2 text-fs-ui font-medium text-mauve/50 transition-colors hover:bg-mauve/10">
          <X size={14} /> Anuluj
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-fs-label font-bold uppercase tracking-wider text-white transition-colors hover:bg-gold/90 disabled:opacity-50">
          <Save size={14} /> {saving ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </div>
    </form>
  );
}

function ModuleEditor({ module, onRefresh }) {
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
    } catch (error) {
      alert('Błąd: ' + error.message);
    }
  };

  const deleteModule = async () => {
    if (!window.confirm('Usunąć moduł i wszystkie jego lekcje?')) return;
    try {
      await axios.delete(`/api/courses/modules/${module.id}`);
      onRefresh();
    } catch (error) {
      alert('Błąd: ' + error.message);
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Usunąć tę lekcję?')) return;
    try {
      await axios.delete(`/api/courses/lessons/${lessonId}`);
      onRefresh();
    } catch (error) {
      alert('Błąd: ' + error.message);
    }
  };

  const LessonTypeIcon = ({ type }) => {
    if (type === 'audio') return <Volume2 size={13} className="shrink-0 text-gold" />;
    if (type === 'text') return <FileText size={13} className="shrink-0 text-mauve/40" />;
    return <Video size={13} className="shrink-0 text-terracotta" />;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-mauve/10 bg-white/60">
      {editingModule ? (
        <div className="border-b border-mauve/10 bg-gold/5 p-4">
          <input value={moduleForm.title} onChange={(event) => setModuleForm({ ...moduleForm, title: event.target.value })} className="mb-2 w-full rounded-xl border border-mauve/15 bg-white px-3 py-2 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" />
          <input value={moduleForm.description} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} className="mb-3 w-full rounded-xl border border-mauve/15 bg-white px-3 py-2 text-fs-body text-mauve/60 focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Opis modułu (opcjonalny)..." />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditingModule(false)} className="rounded-lg bg-mauve/5 px-3 py-1.5 text-fs-label font-medium text-mauve/50 transition-colors hover:bg-mauve/10">Anuluj</button>
            <button onClick={saveModule} className="flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-fs-label font-bold uppercase tracking-wider text-white transition-colors hover:bg-gold/90">
              <Check size={12} /> Zapisz
            </button>
          </div>
        </div>
      ) : (
        <div className="flex cursor-pointer items-center p-4 transition-colors hover:bg-white/80" onClick={() => setOpen(!open)}>
          <GripVertical size={16} className="mr-3 shrink-0 text-mauve/20" />
          <div className="min-w-0 flex-1">
            <span className="font-serif font-medium text-mauve">{module.title}</span>
            {module.description && <span className="ml-2 text-fs-label font-light text-mauve/40">– {module.description}</span>}
            <span className="ml-2 text-fs-label font-light text-mauve/30">({module.lessons?.length || 0} lekcji)</span>
          </div>
          <div className="ml-2 flex items-center gap-2">
            <button onClick={(event) => { event.stopPropagation(); setEditingModule(true); }} className="rounded-lg p-1.5 text-mauve/40 transition-colors hover:bg-mauve/10 hover:text-mauve">
              <Edit size={14} />
            </button>
            <button onClick={(event) => { event.stopPropagation(); deleteModule(); }} className="rounded-lg p-1.5 text-mauve/30 transition-colors hover:bg-red-50 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="border-t border-mauve/5">
          {module.lessons?.length === 0 && <p className="px-5 py-4 text-fs-label italic font-light text-mauve/30">Brak lekcji. Dodaj pierwszą lekcję poniżej.</p>}
          {module.lessons?.map((lesson) => (
            <div key={lesson.id}>
              <div className="flex items-center gap-3 border-b border-mauve/5 px-4 py-3 transition-colors hover:bg-nude/40">
                <GripVertical size={14} className="shrink-0 text-mauve/15" />
                <LessonTypeIcon type={lesson.lesson_type} />
                <span className="flex-1 text-fs-ui font-light text-mauve/70">{lesson.title}</span>
                {lesson.duration_minutes && <span className="text-fs-label font-light text-mauve/30">{lesson.duration_minutes} min</span>}
                <button onClick={() => setEditingLesson(editingLesson?.id === lesson.id ? null : lesson)} className="rounded-lg p-1.5 text-mauve/40 transition-colors hover:bg-mauve/10 hover:text-mauve">
                  <Edit size={13} />
                </button>
                <button onClick={() => deleteLesson(lesson.id)} className="rounded-lg p-1.5 text-mauve/30 transition-colors hover:bg-red-50 hover:text-red-400">
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

          <div className="px-4 pb-3 pt-2">
            {addingLesson ? (
              <LessonForm moduleId={module.id} onSave={() => { setAddingLesson(false); onRefresh(); }} onCancel={() => setAddingLesson(false)} />
            ) : (
              <button onClick={() => setAddingLesson(true)} className="flex items-center gap-2 py-2 text-fs-label font-bold uppercase tracking-wider text-gold transition-colors hover:text-gold/70">
                <Plus size={13} /> Dodaj lekcję
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseEditorModal({ productId, productTitle, onClose }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', thumbnail_url: '' });
  const [addingModule, setAddingModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order_index: 0 });

  const loadCourse = useCallback(async () => {
    try {
      const response = await axios.get(`/api/courses/by-product/${productId}`);
      setCourse(response.data);
      setCourseForm({ title: response.data.title, description: response.data.description || '', thumbnail_url: response.data.thumbnail_url || '' });
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const createCourse = async () => {
    try {
      await axios.post('/api/courses', { product_id: productId, ...courseForm });
      loadCourse();
    } catch (error) {
      alert('Błąd: ' + error.message);
    }
  };

  const saveCourse = async () => {
    try {
      await axios.put(`/api/courses/${course.id}`, courseForm);
      loadCourse();
    } catch (error) {
      alert('Błąd: ' + error.message);
    }
  };

  const addModule = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`/api/courses/${course.id}/modules`, moduleForm);
      setModuleForm({ title: '', description: '', order_index: course?.modules?.length || 0 });
      setAddingModule(false);
      loadCourse();
    } catch (error) {
      alert('Błąd: ' + error.message);
    }
  };

  if (loading) {
    return (
      <AdminModalShell
        eyebrow="Edytor kursu"
        title="Ładowanie kursu"
        description={productTitle}
        onClose={onClose}
        maxWidthClassName="max-w-4xl"
        alignClassName="items-start"
        dialogClassName="my-4"
      >
        <div className="py-8 text-center text-fs-body text-mauve/40">Ładowanie...</div>
      </AdminModalShell>
    );
  }

  return (
    <AdminModalShell
      eyebrow="Edytor kursu"
      title="Ustawienia kursu"
      description={productTitle}
      onClose={onClose}
      maxWidthClassName="max-w-4xl"
      alignClassName="items-start"
      dialogClassName="my-4"
      bodyClassName="space-y-6"
      footer={(
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-mauve/15 bg-white px-5 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/60 transition hover:border-mauve/25 hover:text-mauve"
          >
            Anuluj
          </button>
          {course ? (
            <button
              type="button"
              onClick={saveCourse}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-fs-label font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold/90"
            >
              <Save size={14} /> Zapisz ustawienia kursu
            </button>
          ) : (
            <button
              type="button"
              onClick={createCourse}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-fs-label font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold/90"
            >
              <Plus size={14} /> Utwórz kurs
            </button>
          )}
        </div>
      )}
    >
          <div className="rounded-[32px] border border-white/80 bg-white/75 p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-mauve"><BookOpen size={16} className="text-gold" /> Ustawienia kursu</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-wider text-mauve/50">Tytuł kursu *</label>
                <input value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} className="w-full rounded-xl border border-mauve/15 bg-white px-4 py-2.5 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Tytuł..." />
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-wider text-mauve/50">URL miniaturki</label>
                <input value={courseForm.thumbnail_url} onChange={(event) => setCourseForm({ ...courseForm, thumbnail_url: event.target.value })} className="w-full rounded-xl border border-mauve/15 bg-white px-4 py-2.5 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="https://..." />
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-wider text-mauve/50">Opis</label>
                <textarea value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} rows={3} className="w-full resize-none rounded-xl border border-mauve/15 bg-white px-4 py-2.5 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Opis kursu..." />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              {course ? (
                <button onClick={saveCourse} className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-fs-label font-bold uppercase tracking-wider text-white transition-colors hover:bg-gold/90">
                  <Save size={14} /> Zapisz zmiany
                </button>
              ) : (
                <button onClick={createCourse} className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-fs-label font-bold uppercase tracking-wider text-white transition-colors hover:bg-gold/90">
                  <Plus size={14} /> Utwórz kurs
                </button>
              )}
            </div>
          </div>

          {course && (
            <div className="rounded-[32px] border border-white/80 bg-white/75 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-serif text-mauve"><Star size={15} className="text-gold" /> Moduły ({course.modules?.length || 0})</h3>
                <button onClick={() => setAddingModule(!addingModule)} className="flex items-center gap-2 text-fs-label font-bold uppercase tracking-wider text-gold transition-colors hover:text-gold/70">
                  <Plus size={13} /> Dodaj moduł
                </button>
              </div>

              {addingModule && (
                <form onSubmit={addModule} className="mb-4 rounded-2xl border border-mauve/10 bg-white/70 p-4">
                  <input value={moduleForm.title} onChange={(event) => setModuleForm({ ...moduleForm, title: event.target.value })} required className="mb-2 w-full rounded-xl border border-mauve/15 bg-white px-4 py-2.5 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Tytuł modułu..." />
                  <input value={moduleForm.description} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} className="mb-3 w-full rounded-xl border border-mauve/15 bg-white px-4 py-2.5 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Opis (opcjonalny)..." />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setAddingModule(false)} className="rounded-lg bg-mauve/5 px-3 py-1.5 text-fs-label font-medium text-mauve/50 transition-colors hover:bg-mauve/10">Anuluj</button>
                    <button type="submit" className="rounded-lg bg-gold px-3 py-1.5 text-fs-label font-bold uppercase tracking-wider text-white transition-colors hover:bg-gold/90">Utwórz moduł</button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {course.modules?.length === 0 ? (
                  <p className="py-6 text-center text-fs-body italic font-light text-mauve/30">Brak modułów. Dodaj pierwszy moduł, aby zorganizować lekcje.</p>
                ) : (
                  course.modules.map((module) => <ModuleEditor key={module.id} module={module} onRefresh={loadCourse} />)
                )}
              </div>
            </div>
          )}
    </AdminModalShell>
  );
}