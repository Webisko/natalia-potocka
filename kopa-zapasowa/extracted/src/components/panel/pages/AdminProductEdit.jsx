import { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import AdminImagePicker from '../admin/AdminImagePicker';
import AdminMediaPicker from '../admin/AdminMediaPicker';
import SeoLengthIndicator from '../admin/SeoLengthIndicator';
import AdminCheckbox from '../admin/AdminCheckbox';
import AdminModalShell from '../admin/AdminModalShell';
import AdminDateTimeField from '../admin/AdminDateTimeField';
import RichTextEditor from '../admin/RichTextEditor';
import { BENEFIT_ICON_OPTIONS, renderBenefitIcon } from '../utils/benefitIcons';

function createEmptyBenefitCards() {
  return Array.from({ length: 3 }, () => ({ title: '', description: '', icon: 'check' }));
}

function createEmptyFaqItems(count = 3) {
  return Array.from({ length: count }, () => ({ q: '', a: '' }));
}

function normalizeBenefitCards(value) {
  let parsed = value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return createEmptyBenefitCards();
    }

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return createEmptyBenefitCards();
    }
  }

  if (!Array.isArray(parsed)) {
    return createEmptyBenefitCards();
  }

  const cards = parsed
    .slice(0, 3)
    .map((card) => ({
      title: typeof card?.title === 'string' ? card.title : '',
      description: typeof card?.description === 'string' ? card.description : '',
      icon: typeof card?.icon === 'string' && card.icon ? card.icon : 'check',
    }));

  while (cards.length < 3) {
    cards.push({ title: '', description: '', icon: 'check' });
  }

  return cards;
}

function normalizeFaqItems(value) {
  let parsed = value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .slice(0, 5)
    .map((item) => ({
      q: typeof item?.q === 'string' ? item.q : '',
      a: typeof item?.a === 'string' ? item.a : '',
    }))
    .filter((item) => item.q || item.a);
}

function slugifyProductTitle(value) {
  return `${value || ''}`
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (character) => ({
      ą: 'a',
      ć: 'c',
      ę: 'e',
      ł: 'l',
      ń: 'n',
      ó: 'o',
      ś: 's',
      ź: 'z',
      ż: 'z',
    }[character] || character))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildProductPath(slug) {
  return slug ? `/oferta/${slug}` : '/oferta/twoj-slug';
}

function AccordionSection({ title, description, open, onToggle, children }) {
  return (
    <section className="border-t border-gold/10 pt-6 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <h3 className="font-serif text-fs-title-sm text-mauve">{title}</h3>
          {description ? <p className="mt-2 text-fs-body leading-7 text-mauve/60">{description}</p> : null}
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-mauve/10 bg-white text-mauve/55">
          <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open ? <div className="pt-6">{children}</div> : null}
    </section>
  );
}

function formatPrice(value) {
  if (value === '' || value == null) {
    return 'Brak danych';
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)} PLN` : 'Brak danych';
}

export default function AdminProductEdit({ productId = 'new', embedded = false, onClose, onSaved }) {
  const id = productId;
  const isNew = id === 'new';
  const [sections, setSections] = useState({ content: false, marketing: false, seo: false });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!isNew);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    promotional_price: '',
    promotional_price_until: '',
    lowest_price_30_days: '',
    stripe_price_id: '',
    type: 'video',
    content_url: '',
    thumbnail_url: '',
    secondary_image_url: '',
    duration_label: '',
    long_description: '',
    benefits_json: createEmptyBenefitCards(),
    faq_json: createEmptyFaqItems(),
    meta_title: '',
    meta_desc: '',
    meta_image_url: '',
    canonical_url: '',
    noindex: false,
    is_published: true,
    use_featured_meta_image: true,
  });
  const [loading, setLoading] = useState(!isNew);
  const isDigitalProduct = formData.type === 'video' || formData.type === 'audio';
  const contentMediaKinds = formData.type === 'audio' ? ['audio'] : ['video'];
  const contentMediaAccept = formData.type === 'audio' ? 'audio/*' : 'video/*';
  const productTypeOptions = [
    { value: 'video', label: 'Webinar' },
    { value: 'audio', label: 'Medytacja' },
    { value: 'course', label: 'Kurs' },
  ];

  if (formData.type && !productTypeOptions.some((option) => option.value === formData.type)) {
    productTypeOptions.push({ value: formData.type, label: `Typ archiwalny (${formData.type})` });
  }

  useEffect(() => {
    if (!isNew) {
      axios.get('/api/admin/products')
        .then(res => {
          const prod = res.data.find(p => p.id === id);
          if (prod) {
            setFormData({
              ...prod,
              short_description: prod.short_description || '',
              description: prod.description || '',
              promotional_price: prod.promotional_price || '',
              promotional_price_until: prod.promotional_price_until ? prod.promotional_price_until.slice(0, 16) : '',
              lowest_price_30_days: prod.lowest_price_30_days || '',
              duration_label: prod.duration_label || '',
              secondary_image_url: prod.secondary_image_url || '',
              long_description: prod.long_description || '',
              benefits_json: normalizeBenefitCards(prod.benefits_json),
              faq_json: normalizeFaqItems(prod.faq_json).length > 0 ? normalizeFaqItems(prod.faq_json) : createEmptyFaqItems(),
              meta_image_url: prod.meta_image_url || '',
              canonical_url: prod.canonical_url || '',
              noindex: Boolean(prod.noindex),
              is_published: prod.is_published == null ? true : Boolean(prod.is_published),
              use_featured_meta_image: !prod.meta_image_url || prod.meta_image_url === prod.thumbnail_url,
            });
          }
          setLoading(false);
        }).catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'slug') {
      setIsSlugManuallyEdited(true);
    }

    setFormData((prev) => {
      const nextValue = type === 'checkbox' ? checked : value;
      const nextState = { ...prev, [name]: nextValue };

      if (name === 'title' && isNew && !isSlugManuallyEdited) {
        nextState.slug = slugifyProductTitle(value);
      }

      return nextState;
    });
  };

  const handleBenefitCardChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      benefits_json: prev.benefits_json.map((card, cardIndex) => (
        cardIndex === index ? { ...card, [field]: value } : card
      )),
    }));
  };

  const handleFaqItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      faq_json: prev.faq_json.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addFaqItem = () => {
    setFormData((prev) => {
      if (prev.faq_json.length >= 5) {
        return prev;
      }

      return {
        ...prev,
        faq_json: [...prev.faq_json, { q: '', a: '' }],
      };
    });
  };

  const removeFaqItem = (index) => {
    setFormData((prev) => {
      const nextItems = prev.faq_json.filter((_, itemIndex) => itemIndex !== index);

      return {
        ...prev,
        faq_json: nextItems.length > 0 ? nextItems : createEmptyFaqItems(1),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      slug: slugifyProductTitle(formData.slug),
      stripe_price_id: '',
      meta_image_url: formData.use_featured_meta_image ? '' : formData.meta_image_url,
    };

    try {
      let response;
      if (isNew) {
        response = await axios.post('/api/admin/products', payload);
      } else {
        response = await axios.put(`/api/admin/products/${id}`, payload);
      }

      if (embedded && typeof onSaved === 'function') {
        onSaved(response?.data?.message || (isNew ? 'Produkt został utworzony.' : 'Produkt został zaktualizowany.'));
        return;
      }

      window.location.assign('/administrator');
    } catch (err) {
      alert(err.response?.data?.error || 'Wystąpił błąd zapisu.');
    }
  };

  if (loading) return <div className="text-fs-body text-mauve/60">Ładowanie...</div>;

  const hasPromo = Number(formData.promotional_price) > 0;
  const productPathPreview = buildProductPath(slugifyProductTitle(formData.slug));
  const productUrlPreview = typeof window === 'undefined' ? productPathPreview : `${window.location.origin}${productPathPreview}`;

  const content = (
    <form id="admin-product-edit-form" onSubmit={handleSubmit} className={embedded ? 'flex min-h-0 flex-1 flex-col' : 'space-y-8'}>
      <div className={embedded ? 'min-h-0 flex-1 overflow-y-auto pb-40 pr-1' : ''}>
      {!embedded && (
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-fs-label font-bold uppercase tracking-[0.24em] text-gold/80">
              {isNew ? 'Nowy produkt' : 'Edycja produktu'}
            </p>
            <h1 className="mt-2 font-serif text-fs-title-md text-mauve">{isNew ? 'Dodaj produkt' : 'Edytuj produkt'}</h1>
          </div>
          <button
            type="button"
            onClick={() => window.location.assign('/administrator')}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-mauve/10 bg-white px-5 text-fs-ui text-mauve/60 transition hover:border-mauve/20 hover:text-mauve"
          >
            Wróć
          </button>
        </div>
      )}

      <div className="space-y-8 px-6 md:px-8">
        <section className="space-y-8 border-b border-gold/10 pb-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Typ produktu</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20">
                  {productTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {!['video', 'audio', 'course'].includes(formData.type) && (
                  <p className="mt-2 text-fs-ui leading-6 text-mauve/55">To jest starszy typ techniczny. Możesz zostawić go bez zmian albo przepisać produkt na webinar, medytację lub kurs.</p>
                )}
                {formData.type === 'course' ? (
                  <p className="mt-2 text-fs-ui leading-6 text-mauve/55">Kurs w tym projekcie służy obecnie jako zamknięty produkt testowy. Publikuj go dopiero wtedy, gdy ma być realnie pokazany w ofercie publicznej.</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Tytuł</label>
                <input name="title" value={formData.title} onChange={handleChange} required className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" />
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Slug (URL)</label>
                <input name="slug" value={formData.slug} onChange={handleChange} required className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" />
                <p className="mt-2 text-fs-ui leading-6 text-mauve/55">Slug uzupełnia się automatycznie na podstawie tytułu, ale możesz go ręcznie zmienić.</p>
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Krótki opis</label>
                <textarea name="short_description" value={formData.short_description} onChange={handleChange} rows={3} className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="To będzie krótki opis przy tytule i na listach produktów." />
                <p className="mt-2 text-fs-ui leading-6 text-mauve/55">Jeśli zostawisz to pole puste, system użyje początku długiego opisu.</p>
              </div>

              {isDigitalProduct ? (
                <AdminMediaPicker
                  label="Link do materiału"
                  value={formData.content_url || ''}
                  onChange={(nextValue) => setFormData((prev) => ({ ...prev, content_url: nextValue }))}
                  helperText="Wybierz plik z biblioteki mediów albo wpisz ręcznie adres z zewnętrznego hostingu, YouTube lub CDN."
                  allowedKinds={contentMediaKinds}
                  accept={contentMediaAccept}
                  emptyStateText={formData.type === 'audio' ? 'Brak wybranego pliku audio.' : 'Brak wybranego pliku wideo.'}
                  currentValueLabel={formData.type === 'audio' ? 'Aktualnie wybrane audio' : 'Aktualnie wybrane wideo'}
                  removeLabel="Usuń materiał"
                  libraryDescription={formData.type === 'audio' ? 'Wybierz istniejący plik audio z biblioteki albo dodaj nowe nagranie z komputera.' : 'Wybierz istniejący plik wideo z biblioteki albo dodaj nowy materiał z komputera.'}
                  uploadButtonLabel={formData.type === 'audio' ? 'Wgraj audio' : 'Wgraj wideo'}
                  allowManualUrl={true}
                  manualUrlLabel={formData.type === 'audio' ? 'Adres pliku audio' : 'Adres wideo lub embed URL'}
                  manualUrlPlaceholder="https://"
                />
              ) : null}
            </div>

            <div>
              <AdminImagePicker
                label="Obrazek produktu"
                value={formData.thumbnail_url || ''}
                onChange={(nextValue) => setFormData((prev) => ({
                  ...prev,
                  thumbnail_url: nextValue,
                  meta_image_url: prev.use_featured_meta_image ? '' : prev.meta_image_url,
                }))}
                helperText="Ten obrazek będzie używany jako główna grafika produktu."
              />
            </div>
          </div>
        </section>

        <AccordionSection
          title="Treść"
          description="Sekcje widoczne na stronie produktu i dane pomocnicze dla materiałów cyfrowych."
          open={sections.content}
          onToggle={() => setSections((prev) => ({ ...prev, content: !prev.content }))}
        >
          <div className="space-y-8">
            {isDigitalProduct ? (
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                <RichTextEditor
                  label="Szczegóły produktu"
                  value={formData.long_description || ''}
                  onChange={(nextValue) => setFormData((prev) => ({ ...prev, long_description: nextValue }))}
                  placeholder="Dodaj główną treść sekcji Szczegóły. Możesz użyć akapitów, list, nagłówków i pogrubień."
                />

                <div className="space-y-5">
                  <AdminImagePicker
                    label="Drugi obrazek produktu"
                    value={formData.secondary_image_url || ''}
                    onChange={(nextValue) => setFormData((prev) => ({ ...prev, secondary_image_url: nextValue }))}
                    helperText="Ten obrazek pojawia się po prawej stronie sekcji Szczegóły, w tym samym stylu organicznym co grafika hero."
                  />

                  <div className="rounded-[24px] border border-gold/10 bg-white px-5 py-4 text-fs-body leading-7 text-mauve/65">
                    W uproszczonym szablonie webinarów i medytacji nie pokazujemy już osobnego bloku „Opis produktu”, ale drugi obrazek nadal wyróżnia produkt w sekcji Szczegóły.
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                <RichTextEditor
                  label="Długi opis"
                  value={formData.description || ''}
                  onChange={(nextValue) => setFormData((prev) => ({ ...prev, description: nextValue }))}
                  placeholder="Dodaj główną treść produktu. Możesz użyć akapitów, list, nagłówków i pogrubień."
                />

                <AdminImagePicker
                  label="Drugi obrazek produktu"
                  value={formData.secondary_image_url || ''}
                  onChange={(nextValue) => setFormData((prev) => ({ ...prev, secondary_image_url: nextValue }))}
                  helperText="Opcjonalny dodatkowy obrazek, który pojawi się niżej na stronie produktu."
                />
              </div>
            )}

            {isDigitalProduct ? (
              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Czas trwania</label>
                  <input name="duration_label" value={formData.duration_label || ''} onChange={handleChange} className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="np. około 1 godzina nagrania" />
                  <p className="mt-2 text-fs-ui leading-6 text-mauve/55">To pole wyświetla się pod krótkim opisem na stronie webinaru lub medytacji.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-mauve/10 bg-white px-5 py-4 text-fs-body leading-7 text-mauve/60">
                Dla kursów możesz uzupełnić sekcję „Co zyskasz”. Pozostałe elementy treści kursu dopracujemy później.
              </div>
            )}

            <div>
              <div className="mb-4">
                <h4 className="font-serif text-fs-title-sm text-mauve">Sekcja „Co zyskasz”</h4>
                <p className="mt-2 text-fs-ui leading-6 text-mauve/55">Każda zaleta ma własną ikonę, tytuł i opis. Po lewej stronie ustawiasz ikonę oraz tytuł, a po prawej opis.</p>
              </div>
              <div className="divide-y divide-gold/10">
                {formData.benefits_json.map((card, index) => (
                  <div key={index} className="py-6 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-gold">Zaleta {index + 1}</p>
                      <p className="mt-1 text-fs-ui text-mauve/55">Po lewej wybierasz ikonę i wpisujesz tytuł.</p>
                    </div>

                    <div className="mt-4 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-fs-ui text-mauve/55">Ikona</label>
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6">
                            {BENEFIT_ICON_OPTIONS.map((option) => {
                              const isSelected = card.icon === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleBenefitCardChange(index, 'icon', option.value)}
                                  className={`flex h-12 items-center justify-center rounded-2xl border transition ${isSelected ? 'border-gold bg-gold/10 text-gold shadow-sm' : 'border-mauve/15 bg-white text-mauve/55 hover:border-gold/30 hover:text-gold'}`}
                                  title={option.label}
                                  aria-label={option.label}
                                >
                                  {renderBenefitIcon(option.value, { size: 18 })}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-fs-ui text-mauve/55">Tytuł</label>
                          <input value={card.title} onChange={(e) => handleBenefitCardChange(index, 'title', e.target.value)} className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-fs-ui text-mauve/55">Opis</label>
                          <textarea value={card.description} onChange={(e) => handleBenefitCardChange(index, 'description', e.target.value)} rows={5} className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-serif text-fs-title-sm text-mauve">FAQ produktu</h4>
                  <p className="mt-2 text-fs-ui leading-6 text-mauve/55">Dodaj od 3 do 5 pytań i odpowiedzi. To treść wyświetlana pod sekcją szczegółów na stronie webinaru lub medytacji.</p>
                </div>
                <button
                  type="button"
                  onClick={addFaqItem}
                  disabled={formData.faq_json.length >= 5}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-gold/20 bg-white px-4 text-fs-ui font-bold uppercase tracking-[0.18em] text-gold transition hover:border-gold/35 hover:bg-gold/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Dodaj pytanie
                </button>
              </div>

              <div className="space-y-5">
                {formData.faq_json.map((item, index) => (
                  <div key={index} className="rounded-[24px] border border-gold/10 bg-white px-5 py-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-gold">Pytanie {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeFaqItem(index)}
                        className="text-fs-ui font-bold uppercase tracking-[0.16em] text-mauve/45 transition hover:text-terracotta"
                      >
                        Usuń
                      </button>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div>
                        <label className="mb-2 block text-fs-ui text-mauve/55">Pytanie</label>
                        <input
                          value={item.q}
                          onChange={(event) => handleFaqItemChange(index, 'q', event.target.value)}
                          className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-fs-ui text-mauve/55">Odpowiedź</label>
                        <textarea
                          value={item.a}
                          onChange={(event) => handleFaqItemChange(index, 'a', event.target.value)}
                          rows={4}
                          className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Ceny i marketing"
          description="Adres produktu oraz ustawienia cenowe i komunikaty promocyjne."
          open={sections.marketing}
          onToggle={() => setSections((prev) => ({ ...prev, marketing: !prev.marketing }))}
        >
          <div className="space-y-6">
            <div>
              <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Adres produktu</label>
              <input value={productUrlPreview} readOnly className="w-full rounded-2xl border border-mauve/15 bg-nude/45 px-4 py-3 text-fs-body text-mauve/75 focus:outline-none" />
              <p className="mt-2 text-fs-ui leading-6 text-mauve/55">Adres aktualizuje się automatycznie na podstawie slugu z sekcji głównej.</p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Cena podstawowa</label>
                  <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" />
                </div>
                <div>
                  <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Cena promocyjna</label>
                  <input type="number" step="0.01" name="promotional_price" value={formData.promotional_price} onChange={handleChange} className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="np. 99.00" />
                </div>
                <div className="md:col-span-2">
                  <AdminDateTimeField
                    label="Promocja ważna do"
                    value={formData.promotional_price_until}
                    onChange={(nextValue) => setFormData((prev) => ({ ...prev, promotional_price_until: nextValue }))}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-gold/10 bg-white px-5 py-4">
                <p className="text-fs-label font-bold uppercase tracking-[0.18em] text-gold/80">Omnibus</p>
                <p className="mt-2 text-fs-body leading-7 text-mauve/70">Najniższa cena z ostatnich 30 dni jest liczona automatycznie na podstawie historii zmian ceny.</p>
                <div className="mt-4">
                  <p className="text-fs-label font-bold uppercase tracking-[0.16em] text-mauve/50">Aktualnie zapisana najniższa cena 30 dni</p>
                  <p className="mt-2 font-serif text-fs-title-sm text-mauve">{hasPromo ? formatPrice(formData.lowest_price_30_days) : 'Brak aktywnej obniżki'}</p>
                </div>
                <p className="mt-3 text-fs-ui leading-6 text-mauve/55">Po zapisaniu produktu system zaktualizuje tę wartość automatycznie, jeśli ustawiasz obniżkę.</p>
              </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="SEO"
          description="Meta title, meta description, canonical i ustawienia indeksowania."
          open={sections.seo}
          onToggle={() => setSections((prev) => ({ ...prev, seo: !prev.seo }))}
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Tytuł SEO</label>
                <input name="meta_title" value={formData.meta_title || ''} onChange={handleChange} className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" />
                <div className="mt-3"><SeoLengthIndicator type="title" value={formData.meta_title || ''} /></div>
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Opis SEO</label>
                <textarea name="meta_desc" value={formData.meta_desc || ''} onChange={handleChange} rows={3} className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" />
                <div className="mt-3"><SeoLengthIndicator type="description" value={formData.meta_desc || ''} /></div>
              </div>
              <div>
                <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">Adres kanoniczny</label>
                <input name="canonical_url" value={formData.canonical_url || ''} onChange={handleChange} className="w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="https://..." />
              </div>
              <AdminCheckbox
                checked={Boolean(formData.noindex)}
                onChange={(checked) => handleChange({ target: { name: 'noindex', type: 'checkbox', checked } })}
                label="Ustaw noindex dla tego produktu"
              />
              <AdminCheckbox
                checked={Boolean(formData.is_published)}
                onChange={(checked) => handleChange({ target: { name: 'is_published', type: 'checkbox', checked } })}
                label="Publikuj ten produkt na sklepie"
                description={formData.type === 'course'
                  ? 'Odznacz, jeśli kurs ma pozostać wyłącznie testowy i ukryty w publicznej ofercie.'
                  : 'Odznacz, jeśli produkt ma zostać dostępny tylko do testów w panelu klienta i ma być ukryty na stronie sklepu.'}
              />
            </div>

            <div className="space-y-5">
              <AdminCheckbox
                checked={Boolean(formData.use_featured_meta_image)}
                onChange={(checked) => setFormData((prev) => ({
                  ...prev,
                  use_featured_meta_image: checked,
                  meta_image_url: checked ? '' : (prev.meta_image_url || prev.thumbnail_url || ''),
                }))}
                label="Obrazek SEO ma być taki sam jak obrazek produktu"
              />

              {formData.use_featured_meta_image ? (
                <div className="text-fs-body leading-7 text-mauve/60">Gdy to pole jest zaznaczone, produkt użyje miniatury produktu jako grafiki SEO i Open Graph.</div>
              ) : (
                <AdminImagePicker
                  label="Obrazek SEO"
                  value={formData.meta_image_url || ''}
                  onChange={(nextValue) => setFormData((prev) => ({ ...prev, meta_image_url: nextValue }))}
                  helperText="Ten obrazek będzie używany m.in. w Open Graph i udostępnieniach."
                />
              )}
            </div>
          </div>
        </AccordionSection>
      </div>

      {!embedded ? (
        <button type="submit" className="w-full rounded-2xl bg-gold py-3 text-fs-label font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold/90">
          Zapisz produkt
        </button>
      ) : null}
      </div>

      {embedded ? null : null}
    </form>
  );

  if (!embedded) {
    return content;
  }

  return (
    <AdminModalShell
      eyebrow={isNew ? 'Nowy produkt' : 'Edycja produktu'}
      title={isNew ? 'Dodaj produkt' : 'Edytuj produkt'}
      description="Zarządzasz treścią sprzedażową, SEO, cenami i publikacją z jednego modala o tym samym układzie co pozostałe sekcje panelu."
      onClose={onClose}
      maxWidthClassName="max-w-6xl"
      bodyClassName="p-0 pt-6 md:pt-8"
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
            type="button"
            onClick={() => document.getElementById('admin-product-edit-form')?.requestSubmit()}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gold px-6 text-fs-label font-bold uppercase tracking-[0.2em] text-white transition hover:bg-gold/90"
          >
            Zapisz produkt
          </button>
        </div>
      )}
    >
      {content}
    </AdminModalShell>
  );
}
