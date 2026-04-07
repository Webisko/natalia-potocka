import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminCheckbox from './AdminCheckbox';
import AdminImagePicker from './AdminImagePicker';
import AdminModalShell from './AdminModalShell';
import RichTextEditor from './RichTextEditor';
import SeoLengthIndicator from './SeoLengthIndicator';

// Pages that have an editable body content field
const LEGAL_CONTENT_PAGES = {
  privacy: {
    settingKey: 'legal_privacy_content',
    label: 'Treść polityki prywatności',
    placeholder: 'Wklej lub wpisz treść polityki prywatności...',
  },
  terms: {
    settingKey: 'legal_terms_content',
    label: 'Treść regulaminu sklepu',
    placeholder: 'Wklej lub wpisz treść regulaminu sklepu...',
  },
};

function buildInitialState(page) {
  return {
    ...page,
    title: page?.title || '',
    slug: page?.slug || '',
    featured_image_url: page?.featured_image_url || '',
    meta_title: page?.meta_title || '',
    meta_desc: page?.meta_desc || '',
    meta_image_url: page?.meta_image_url || '',
    canonical_url: page?.canonical_url || '',
    noindex: Boolean(page?.noindex),
    use_featured_meta_image: Boolean(page?.use_featured_meta_image),
  };
}

export default function AdminPageSettingsModal({ page, onClose, onSaved }) {
  const [formData, setFormData] = useState(() => buildInitialState(page));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isHomePage = page?.page_key === 'home';
  const isLockedSlug = page?.page_kind === 'service-landing' || isHomePage;

  const legalConfig = LEGAL_CONTENT_PAGES[page?.page_key] || null;
  const [legalContent, setLegalContent] = useState('');
  const [legalLoading, setLegalLoading] = useState(false);

  useEffect(() => {
    setFormData(buildInitialState(page));
    setError('');
  }, [page]);

  // Load existing legal content from settings when modal opens for a legal page
  useEffect(() => {
    if (!legalConfig) return;
    setLegalLoading(true);
    axios.get('/api/admin/settings')
      .then((response) => {
        const data = response.data || {};
        setLegalContent(data[legalConfig.settingKey] || '');
      })
      .catch(() => setLegalContent(''))
      .finally(() => setLegalLoading(false));
  }, [legalConfig?.settingKey]);

  const handleChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Save page settings
      const pageResponse = await axios.put(`/api/admin/pages/${page.page_key}`, {
        title: formData.title,
        slug: formData.slug,
        featured_image_url: formData.featured_image_url,
        meta_title: formData.meta_title,
        meta_desc: formData.meta_desc,
        meta_image_url: formData.use_featured_meta_image ? '' : formData.meta_image_url,
        canonical_url: formData.canonical_url,
        noindex: Boolean(formData.noindex),
      });

      // Save legal content alongside page settings if this is a legal page
      if (legalConfig) {
        await axios.post('/api/admin/settings', {
          [legalConfig.settingKey]: legalContent,
        });
      }

      onSaved(pageResponse.data?.message || `Zapisano ustawienia strony: ${page.page_name}`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nie udało się zapisać ustawień strony.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModalShell
      eyebrow="Ustawienia strony"
      title={page.page_name}
      description="Edytujesz ustawienia ogólne, obrazek wyróżniający i komplet danych SEO w jednym modalu zamiast w rozwijanym akordeonie."
      onClose={onClose}
      maxWidthClassName="max-w-6xl"
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
            form="admin-page-settings-form"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gold px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-white transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Zapisywanie...' : 'Zapisz stronę'}
          </button>
        </div>
      )}
    >
      <form id="admin-page-settings-form" onSubmit={handleSubmit} className="space-y-8">
        {error ? (
          <div className="rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-fs-body text-rose">
            {error}
          </div>
        ) : null}

        {isLockedSlug ? (
          <div className="rounded-[28px] border border-gold/10 bg-nude/50 px-5 py-4 text-fs-body text-mauve/65">
            {isHomePage
              ? 'Strona główna ma stały adres i nie można zmienić jej ścieżki URL w panelu.'
              : 'Ten landing page ma stały adres wynikający z routingu usług. W tym miejscu możesz edytować jego SEO i obrazki, ale nie zmienisz ścieżki URL.'}
          </div>
        ) : null}

        <div className="rounded-[28px] border border-mauve/10 bg-white/80 px-5 py-4 text-fs-body text-mauve/65">
          Klucz systemowy: <span className="font-medium text-mauve">{page.page_key}</span>
        </div>

        <section className="space-y-6">
          <div>
            <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Struktura</p>
            <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">Ustawienia ogólne</h3>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/60">Tytuł strony</label>
                <input
                  value={formData.title}
                  onChange={(event) => handleChange('title', event.target.value)}
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/60">Slug</label>
                <input
                  value={formData.slug}
                  onChange={(event) => handleChange('slug', event.target.value)}
                  disabled={isLockedSlug}
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>

            <AdminImagePicker
              label="Obrazek wyróżniający"
              value={formData.featured_image_url}
              onChange={(nextValue) => handleChange('featured_image_url', nextValue)}
              helperText="To główna grafika strony używana w sekcjach hero i kartach podglądu."
            />
          </div>
        </section>

        <div className="border-t border-gold/10" />

        <section className="space-y-6">
          <div>
            <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Widoczność</p>
            <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">SEO</h3>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/60">Tytuł SEO</label>
                <input
                  value={formData.meta_title}
                  onChange={(event) => handleChange('meta_title', event.target.value)}
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
                <div className="mt-3">
                  <SeoLengthIndicator type="title" value={formData.meta_title} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/60">Opis SEO</label>
                <textarea
                  value={formData.meta_desc}
                  onChange={(event) => handleChange('meta_desc', event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20 resize-none"
                />
                <div className="mt-3">
                  <SeoLengthIndicator type="description" value={formData.meta_desc} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/60">Adres kanoniczny</label>
                <input
                  value={formData.canonical_url}
                  onChange={(event) => handleChange('canonical_url', event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>

              <AdminCheckbox
                checked={Boolean(formData.noindex)}
                onChange={(checked) => handleChange('noindex', checked)}
                label="Ustaw noindex dla tej strony"
              />
            </div>

            <div className="space-y-5">
              <AdminCheckbox
                checked={Boolean(formData.use_featured_meta_image)}
                onChange={(checked) => setFormData((previous) => ({
                  ...previous,
                  use_featured_meta_image: checked,
                  meta_image_url: checked ? '' : (previous.meta_image_url || previous.featured_image_url || ''),
                }))}
                label="Obrazek SEO ma być taki sam jak obrazek wyróżniający"
              />

              {formData.use_featured_meta_image ? (
                <div className="rounded-[28px] border border-gold/10 bg-nude/40 px-5 py-5 text-fs-body leading-relaxed text-mauve/65">
                  Gdy to pole jest zaznaczone, strona użyje obrazka wyróżniającego jako grafiki SEO i Open Graph.
                </div>
              ) : (
                <AdminImagePicker
                  label="Obrazek SEO"
                  value={formData.meta_image_url}
                  onChange={(nextValue) => handleChange('meta_image_url', nextValue)}
                  helperText="Ta grafika będzie używana w udostępnieniach i tagach Open Graph."
                />
              )}
            </div>
          </div>
        </section>

        {legalConfig ? (
          <>
            <div className="border-t border-gold/10" />
            <section className="space-y-6">
              <div>
                <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold">Treść dokumentu</p>
                <h3 className="mt-2 font-serif text-fs-title-sm text-mauve">{legalConfig.label}</h3>
                <p className="mt-2 text-fs-body leading-7 text-mauve/60">
                  Edytuj treść dokumentu prawnego bezpośrednio w panelu. Zmiany będą widoczne po ponownej publikacji serwisu.
                  Zostaw puste, by zachować domyślną treść wbudowaną w kod.
                </p>
              </div>
              {legalLoading ? (
                <div className="py-8 text-center text-fs-body text-mauve/50">Ładowanie treści...</div>
              ) : (
                <RichTextEditor
                  label={legalConfig.label}
                  value={legalContent}
                  onChange={setLegalContent}
                  placeholder={legalConfig.placeholder}
                />
              )}
            </section>
          </>
        ) : null}
      </form>
    </AdminModalShell>
  );
}