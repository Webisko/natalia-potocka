import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminImagePicker from './AdminImagePicker';
import AdminModalShell from './AdminModalShell';

function buildInitialState(review) {
  return {
    author: review?.author || '',
    subtitle: review?.subtitle || '',
    content: review?.content || '',
    thumbnail_url: review?.thumbnail_url || '',
    is_active: review?.is_active == null ? 1 : Number(review.is_active),
  };
}

export default function AdminReviewModal({ initialReview, onClose, onSaved }) {
  const isEditing = Boolean(initialReview?.id);
  const [formData, setFormData] = useState(() => buildInitialState(initialReview));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(buildInitialState(initialReview));
    setError('');
  }, [initialReview]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        is_active: Number(formData.is_active),
      };

      if (isEditing) {
        await axios.put(`/api/reviews/${initialReview.id}`, payload);
      } else {
        await axios.post('/api/reviews', payload);
      }

      onSaved(isEditing ? 'Opinia została zaktualizowana.' : 'Opinia została dodana.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nie udało się zapisać opinii.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModalShell
      eyebrow={isEditing ? 'Edycja opinii' : 'Nowa opinia'}
      title={isEditing ? 'Edytuj opinię' : 'Dodaj opinię'}
      description="Zarządzasz treścią, widocznością i zdjęciem autorki w jednym formularzu."
      onClose={onClose}
      maxWidthClassName="max-w-5xl"
      footer={(
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-mauve/15 bg-white px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/60 transition hover:border-mauve/25 hover:text-mauve"
          >
            Anuluj
          </button>
          <button
            type="submit"
            form="admin-review-form"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gold px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-white transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Zapisywanie...' : isEditing ? 'Zapisz opinię' : 'Dodaj opinię'}
          </button>
        </div>
      )}
    >
      <form id="admin-review-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body text-rose">
                {error}
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Autorka</label>
                  <input
                    required
                    value={formData.author}
                    onChange={(event) => setFormData((prev) => ({ ...prev, author: event.target.value }))}
                    className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Podtytuł</label>
                  <input
                    value={formData.subtitle}
                    onChange={(event) => setFormData((prev) => ({ ...prev, subtitle: event.target.value }))}
                    className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                    placeholder="Np. mama Zuzi"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Treść opinii</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.content}
                    onChange={(event) => setFormData((prev) => ({ ...prev, content: event.target.value }))}
                    className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20 resize-none"
                  />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-start-2">
                  <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Widoczność</label>
                  <select
                    value={formData.is_active}
                    onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.value }))}
                    className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                  >
                    <option value={1}>Widoczna</option>
                    <option value={0}>Ukryta</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <AdminImagePicker
                label="Zdjęcie autorki"
                value={formData.thumbnail_url}
                onChange={(nextValue) => setFormData((prev) => ({ ...prev, thumbnail_url: nextValue }))}
                helperText="Możesz wybrać zdjęcie z biblioteki mediów albo wgrać nowe z komputera."
              />
            </div>
          </div>
      </form>
    </AdminModalShell>
  );
}