export const COMMON_PRODUCT_TEMPLATE_CONTENT_DEFAULTS = {
  heroAvailabilityLabel: 'Dostęp natychmiastowy',
  investmentLabel: 'Inwestycja',
  checkoutButtonLabel: 'Kup Dostęp Teraz',
  purchasedButtonLabel: 'Przejdź do biblioteki',
  checkoutNoteText: 'Natychmiastowy dostęp po opłaceniu · Bezpieczne płatności: Stripe',
  benefitsTitle: 'Co zyskasz?',
  benefitsIntro: 'Trzy najważniejsze jakości, z którymi wyjdziesz po przerobieniu tego materiału.',
  detailsEyebrow: 'Szczegóły',
  faqEyebrow: 'FAQ',
  faqTitle: 'Najczęstsze pytania',
  relatedEyebrow: 'Pozostałe produkty',
  relatedTitle: 'Zobacz także',
  relatedIntro: 'Jeśli ten temat jest Ci bliski, poniżej znajdziesz kolejne materiały, które dobrze uzupełniają tę ścieżkę przygotowania i wsparcia.',
};

export const COURSE_PRODUCT_TEMPLATE_CONTENT_DEFAULTS = {
  heroFeaturesTitle: 'W środku znajdziesz',
  bonusMaterialsFallback: 'Materiały dodatkowe i bonusy do pracy własnej',
  lifetimeAccessFallback: 'Dostęp dożywotni z poziomu panelu klientki',
  courseProgramEyebrow: 'Program kursu',
  courseProgramTitle: 'Zawartość kursu',
  courseProgramIntro: 'Tutaj znajdziesz dokładną rozpiskę modułów, lekcji, nagrań i materiałów dodatkowych.',
  courseProgramEmptyState: 'Program kursu jest właśnie uzupełniany.',
  moduleLabel: 'Moduł',
  lessonLabel: 'Lekcja',
  materialsWord: 'materiałów',
  additionalMaterialsWord: 'materiałów dodatkowych',
};

export const PRODUCT_TEMPLATE_SETTING_SCOPE_PREFIX = {
  common: 'product_template_common_',
  course: 'product_template_course_',
};

export const PRODUCT_TEMPLATE_CONTENT_FIELDS = {
  common: [
    {
      id: 'hero-cta',
      title: 'Hero i CTA',
      fields: [
        { key: 'heroAvailabilityLabel', label: 'Etykieta dostępności', help: 'Krótka informacja pod leadem, np. Dostęp natychmiastowy.' },
        { key: 'investmentLabel', label: 'Etykieta ceny', help: 'Nagłówek nad ceną produktu.' },
        { key: 'checkoutButtonLabel', label: 'Tekst przycisku zakupu', help: 'Główny CTA w hero produktu.' },
        { key: 'purchasedButtonLabel', label: 'Tekst po zakupie', help: 'Etykieta przycisku dla zalogowanej klientki z dostępem.' },
        { key: 'checkoutNoteText', label: 'Notatka pod CTA', help: 'Krótki tekst pod ceną i przyciskiem.', kind: 'textarea', rows: 2 },
      ],
    },
    {
      id: 'section-headings',
      title: 'Nagłówki sekcji',
      fields: [
        { key: 'benefitsTitle', label: 'Tytuł sekcji korzyści' },
        { key: 'benefitsIntro', label: 'Wstęp do sekcji korzyści', kind: 'textarea', rows: 2 },
        { key: 'detailsEyebrow', label: 'Eyebrow sekcji Szczegóły' },
        { key: 'faqEyebrow', label: 'Eyebrow sekcji FAQ' },
        { key: 'faqTitle', label: 'Tytuł sekcji FAQ' },
        { key: 'relatedEyebrow', label: 'Eyebrow sekcji produktów powiązanych' },
        { key: 'relatedTitle', label: 'Tytuł sekcji produktów powiązanych' },
        { key: 'relatedIntro', label: 'Wstęp do sekcji produktów powiązanych', kind: 'textarea', rows: 3 },
      ],
    },
  ],
  course: [
    {
      id: 'course-hero',
      title: 'Hero kursu',
      fields: [
        { key: 'heroFeaturesTitle', label: 'Tytuł listy korzyści w hero' },
        { key: 'bonusMaterialsFallback', label: 'Fallback dla materiałów dodatkowych', help: 'Pokazuje się, gdy kurs nie ma jeszcze policzalnych załączników.', kind: 'textarea', rows: 2 },
        { key: 'lifetimeAccessFallback', label: 'Fallback dla czasu dostępu', help: 'Pokazuje się, gdy kurs nie ma policzonego czasu trwania.', kind: 'textarea', rows: 2 },
      ],
    },
    {
      id: 'course-program',
      title: 'Program kursu',
      fields: [
        { key: 'courseProgramEyebrow', label: 'Eyebrow programu kursu' },
        { key: 'courseProgramTitle', label: 'Tytuł programu kursu' },
        { key: 'courseProgramIntro', label: 'Wstęp do programu kursu', kind: 'textarea', rows: 3 },
        { key: 'courseProgramEmptyState', label: 'Komunikat pustego programu', kind: 'textarea', rows: 2 },
        { key: 'moduleLabel', label: 'Etykieta modułu' },
        { key: 'lessonLabel', label: 'Etykieta lekcji' },
        { key: 'materialsWord', label: 'Słowo dla materiałów', help: 'Np. materiałów.' },
        { key: 'additionalMaterialsWord', label: 'Słowo dla materiałów dodatkowych', help: 'Np. materiałów dodatkowych.' },
      ],
    },
  ],
};

function parseTemplateContentValue(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return {};
    }

    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function getRelevantDefaults(type) {
  return type === 'course'
    ? { ...COMMON_PRODUCT_TEMPLATE_CONTENT_DEFAULTS, ...COURSE_PRODUCT_TEMPLATE_CONTENT_DEFAULTS }
    : { ...COMMON_PRODUCT_TEMPLATE_CONTENT_DEFAULTS };
}

export function getTemplateContentSettingKey(scope, key) {
  const prefix = PRODUCT_TEMPLATE_SETTING_SCOPE_PREFIX[scope] || PRODUCT_TEMPLATE_SETTING_SCOPE_PREFIX.common;
  return `${prefix}${key}`;
}

export function getGlobalProductTemplateContent(settings = {}, type = 'video') {
  const defaults = getRelevantDefaults(type);
  const normalizedSettings = settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
  const effective = {};

  Object.keys(COMMON_PRODUCT_TEMPLATE_CONTENT_DEFAULTS).forEach((key) => {
    const candidate = normalizedSettings[getTemplateContentSettingKey('common', key)];
    effective[key] = typeof candidate === 'string' && candidate.trim() ? candidate.trim() : COMMON_PRODUCT_TEMPLATE_CONTENT_DEFAULTS[key];
  });

  if (type === 'course') {
    Object.keys(COURSE_PRODUCT_TEMPLATE_CONTENT_DEFAULTS).forEach((key) => {
      const candidate = normalizedSettings[getTemplateContentSettingKey('course', key)];
      effective[key] = typeof candidate === 'string' && candidate.trim() ? candidate.trim() : COURSE_PRODUCT_TEMPLATE_CONTENT_DEFAULTS[key];
    });
  }

  return { ...defaults, ...effective };
}

export function normalizeProductTemplateContent(value, type = 'video', globalSettings = {}) {
  const defaults = getGlobalProductTemplateContent(globalSettings, type);
  const parsed = parseTemplateContentValue(value);
  const normalized = {};

  Object.keys(defaults).forEach((key) => {
    const candidate = parsed[key];
    normalized[key] = typeof candidate === 'string' && candidate.trim() ? candidate.trim() : defaults[key];
  });

  return normalized;
}

export function getProductTemplateContent(productOrValue, type, globalSettings = {}) {
  if (productOrValue && typeof productOrValue === 'object' && !Array.isArray(productOrValue) && ('template_content_json' in productOrValue || 'type' in productOrValue)) {
    return normalizeProductTemplateContent(productOrValue.template_content_json, type ?? productOrValue.type, globalSettings);
  }

  return normalizeProductTemplateContent(productOrValue, type, globalSettings);
}

export function getProductTemplateFieldGroups(type = 'video') {
  return type === 'course'
    ? [...PRODUCT_TEMPLATE_CONTENT_FIELDS.common, ...PRODUCT_TEMPLATE_CONTENT_FIELDS.course]
    : [...PRODUCT_TEMPLATE_CONTENT_FIELDS.common];
}