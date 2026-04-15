import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, Eye, LoaderCircle } from 'lucide-react';
import AdminPanelFrame from './AdminPanelFrame.jsx';

function stripRichText(value) {
  return `${value || ''}`
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractLead(value) {
  const text = stripRichText(value);
  return text.split('\n').map((line) => line.trim()).find(Boolean) || '';
}

function extractListItems(value) {
  const listMatches = [...`${value || ''}`.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripRichText(match[1]))
    .filter(Boolean);

  if (listMatches.length > 0) {
    return listMatches;
  }

  return `${value || ''}`
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^\-\s*/, '').trim())
    .filter(Boolean);
}

function renderRichTextToParagraphs(value) {
  return stripRichText(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatPrice(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(2)} PLN` : 'Brak ceny';
}

function CoursePreview({ product, course }) {
  const modules = Array.isArray(course?.modules) ? course.modules : [];
  const totalLessons = modules.reduce((sum, module) => sum + (module?.lessons?.length || 0), 0);
  const totalMaterials = modules.reduce((sum, module) => sum + (module?.lessons || []).reduce((lessonSum, lesson) => lessonSum + (lesson?.attachments?.length || 0), 0), 0);
  const totalDuration = modules.reduce((sum, module) => sum + (module?.lessons || []).reduce((lessonSum, lesson) => lessonSum + (Number(lesson?.duration_minutes) || 0), 0), 0);
  const leadText = product?.short_description || extractLead(product?.description) || 'Podgląd wersji roboczej kursu online.';
  const benefits = Array.isArray(product?.benefits_json) ? product.benefits_json.filter((item) => item?.title || item?.description).slice(0, 3) : [];
  const learningPoints = extractListItems(product?.description || '');
  const faqItems = Array.isArray(product?.faq_json) ? product.faq_json.filter((item) => item?.q && item?.a) : [];
  const descriptionParagraphs = renderRichTextToParagraphs(product?.description || '');
  const longDescriptionParagraphs = renderRichTextToParagraphs(product?.long_description || '');

  return (
    <div className="mx-auto w-full max-w-330 space-y-10 pb-16">
      <div className="flex flex-col gap-6 rounded-[36px] border border-white/80 bg-white/75 p-8 shadow-xs lg:flex-row lg:items-start lg:justify-between lg:p-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3 rounded-full bg-gold/10 px-4 py-2 text-fs-label font-bold uppercase tracking-[0.2em] text-gold">
            <Eye size={14} /> Podgląd administracyjny kursu
          </div>
          <h1 className="mt-6 font-serif text-[2.4rem] leading-[1.1] text-mauve md:text-[3rem]">{product.title}</h1>
          <p className="mt-4 max-w-2xl text-fs-body-lg font-light leading-8 text-mauve/72">{leadText}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-fs-ui text-mauve/55">
            <span className="rounded-full border border-gold/15 bg-nude px-4 py-2">{modules.length} modułów</span>
            <span className="rounded-full border border-gold/15 bg-nude px-4 py-2">{totalLessons} lekcji</span>
            <span className="rounded-full border border-gold/15 bg-nude px-4 py-2">{totalMaterials || 'Bonus'} materiałów</span>
            {totalDuration > 0 ? <span className="rounded-full border border-gold/15 bg-nude px-4 py-2">około {totalDuration} min</span> : null}
          </div>
        </div>

        <div className="w-full max-w-sm rounded-[28px] border border-gold/10 bg-nude p-6">
          <div className="text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/40">Wersja robocza</div>
          <div className="mt-3 font-serif text-4xl text-terracotta">{formatPrice(product?.currentPrice ?? product?.price)}</div>
          {product?.promoActive ? <div className="mt-2 text-fs-ui text-mauve/45 line-through">{formatPrice(product?.price)}</div> : null}
          <p className="mt-4 text-fs-body leading-7 text-mauve/60">Ten ekran widzą tylko osoby z dostępem administracyjnym. Publiczny adres zacznie działać po publikacji produktu.</p>
          <div className="mt-6 rounded-2xl bg-white px-4 py-3 text-fs-ui text-mauve/60">
            Docelowy slug: <span className="font-medium text-mauve">/{product?.slug || 'brak-slugu'}</span>
          </div>
        </div>
      </div>

      {benefits.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <article key={`${benefit.title || 'benefit'}-${index}`} className="rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-xs">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 font-serif text-xl text-gold">✦</div>
              <h2 className="mt-5 font-serif text-2xl text-mauve">{benefit.title || 'Korzyść kursu'}</h2>
              <p className="mt-3 text-fs-body leading-7 text-mauve/68">{benefit.description || 'Opis korzyści pojawi się tutaj po uzupełnieniu treści.'}</p>
            </article>
          ))}
        </div>
      ) : learningPoints.length > 0 ? (
        <section className="rounded-4xl border border-white/80 bg-white/70 p-8 shadow-xs">
          <h2 className="font-serif text-3xl text-mauve">Czego uczy ten kurs</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {learningPoints.map((point, index) => (
              <div key={`${point}-${index}`} className="flex gap-3 rounded-2xl bg-nude px-4 py-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">✓</div>
                <p className="text-fs-body leading-7 text-mauve/68">{point}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {descriptionParagraphs.length > 0 ? (
        <section className="rounded-4xl border border-white/80 bg-white/70 p-8 shadow-xs">
          <h2 className="font-serif text-3xl text-mauve">Opis kursu</h2>
          <div className="mt-6 space-y-4">
            {descriptionParagraphs.map((paragraph, index) => (
              <p key={`description-${index}`} className="text-fs-body leading-8 text-mauve/75">{paragraph}</p>
            ))}
          </div>
          {longDescriptionParagraphs.length > 0 ? (
            <div className="mt-8 space-y-4 border-t border-mauve/10 pt-8">
              {longDescriptionParagraphs.map((paragraph, index) => (
                <p key={`long-description-${index}`} className="text-fs-body leading-8 text-mauve/75">{paragraph}</p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="rounded-4xl border border-white/80 bg-white/70 p-8 shadow-xs">
          <h2 className="font-serif text-3xl text-mauve">Program kursu</h2>
          <div className="mt-8 space-y-4">
            {modules.length > 0 ? modules.map((module, moduleIndex) => (
              <details key={module.id || moduleIndex} className="overflow-hidden rounded-3xl border border-mauve/10 bg-white/75" open={moduleIndex === 0}>
                <summary className="cursor-pointer list-none px-5 py-4 hover:bg-nude/70">
                  <div className="text-fs-label font-bold uppercase tracking-[0.18em] text-gold/80">Moduł {moduleIndex + 1}</div>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h3 className="font-serif text-xl text-mauve">{module.title}</h3>
                    <div className="text-fs-ui text-mauve/45">{module.lessons?.length || 0} lekcji</div>
                  </div>
                  {module.description ? <p className="mt-2 text-fs-ui leading-6 text-mauve/55">{module.description}</p> : null}
                </summary>
                <div className="space-y-3 border-t border-mauve/10 px-4 py-4">
                  {(module.lessons || []).map((lesson, lessonIndex) => (
                    <article key={lesson.id || lessonIndex} className="rounded-2xl border border-mauve/10 bg-nude px-4 py-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-fs-label font-bold uppercase tracking-[0.18em] text-gold/80">
                            {lesson.lesson_type === 'audio' ? 'Audio' : lesson.lesson_type === 'text' ? 'Tekst' : 'Wideo'} • Lekcja {lessonIndex + 1}
                          </div>
                          <h4 className="mt-2 text-lg font-medium text-mauve">{lesson.title}</h4>
                          {lesson.description ? <p className="mt-2 text-fs-body leading-7 text-mauve/65">{lesson.description}</p> : null}
                        </div>
                        <div className="text-fs-ui text-mauve/45 md:text-right">
                          {lesson.duration_minutes ? <div>{lesson.duration_minutes} min</div> : null}
                          <div>{lesson.attachments?.length || 0} materiałów</div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            )) : <div className="rounded-2xl border border-dashed border-mauve/15 bg-white/60 px-5 py-6 text-fs-body text-mauve/50">Program kursu jest jeszcze uzupełniany.</div>}
          </div>
        </div>

        <aside className="rounded-4xl border border-white/80 bg-white/70 p-8 shadow-xs">
          <h2 className="font-serif text-3xl text-mauve">Publikacja</h2>
          <div className="mt-6 space-y-3 text-fs-body leading-7 text-mauve/65">
            <p>Status: <strong className="font-medium text-mauve">{product?.is_published ? 'opublikowany' : 'roboczy'}</strong></p>
            <p>Typ produktu: <strong className="font-medium text-mauve">kurs online</strong></p>
            <p>CTA i checkout będą działały publicznie po publikacji produktu.</p>
          </div>

          {faqItems.length > 0 ? (
            <div className="mt-8 rounded-2xl bg-nude p-5">
              <div className="text-fs-label font-bold uppercase tracking-[0.18em] text-gold/80">FAQ</div>
              <div className="mt-4 space-y-4">
                {faqItems.map((item, index) => (
                  <div key={`${item.q}-${index}`}>
                    <div className="font-medium text-mauve">{item.q}</div>
                    <p className="mt-1 text-fs-ui leading-6 text-mauve/60">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function ProductPreviewContent({ productId }) {
  const [product, setProduct] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async () => {
      setLoading(true);
      setError('');

      try {
        const productsResponse = await axios.get('/api/admin/products');
        const nextProduct = (productsResponse.data || []).find((item) => String(item.id) === String(productId));

        if (!nextProduct) {
          throw new Error('Nie znaleziono produktu do podglądu.');
        }

        let nextCourse = null;
        if (nextProduct.type === 'course') {
          const courseResponse = await axios.get(`/api/courses/by-product/${nextProduct.id}`);
          nextCourse = courseResponse.data;
        }

        if (!cancelled) {
          setProduct(nextProduct);
          setCourse(nextCourse);
        }
      } catch (previewError) {
        if (!cancelled) {
          setError(previewError.response?.data?.error || previewError.message || 'Nie udało się przygotować podglądu.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const publicPath = useMemo(() => {
    const slug = `${product?.slug || ''}`.trim();
    return slug ? `/${slug}` : '/';
  }, [product]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-fs-label font-bold uppercase tracking-[0.2em] text-mauve/55 shadow-xs">
          <LoaderCircle size={16} className="animate-spin" /> Ładowanie podglądu
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl rounded-4xl border border-white/80 bg-white/75 p-8 text-center shadow-xs">
        <h1 className="font-serif text-3xl text-mauve">Nie udało się otworzyć podglądu</h1>
        <p className="mt-4 text-fs-body leading-7 text-mauve/62">{error || 'Produkt nie jest dostępny.'}</p>
        <button type="button" onClick={() => window.history.back()} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gold px-5 py-3 text-fs-label font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold/90">
          <ChevronLeft size={14} /> Wróć
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto mb-6 flex w-full max-w-330 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55 transition hover:text-mauve">
          <ChevronLeft size={14} /> Wróć do panelu
        </button>
        {product.is_published ? (
          <a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-mauve/10 bg-white px-4 py-3 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve transition hover:border-mauve/20 hover:text-gold">
            <Eye size={14} /> Otwórz publiczny adres
          </a>
        ) : null}
      </div>
      <CoursePreview product={product} course={course} />
    </div>
  );
}

export default function ProductPreviewIsland({ productId }) {
  return (
    <AdminPanelFrame title="Podgląd produktu">
      <ProductPreviewContent productId={productId} />
    </AdminPanelFrame>
  );
}