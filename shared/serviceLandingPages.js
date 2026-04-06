export const SERVICE_LANDING_PAGE_DEFAULTS = [
  {
    page_key: 'service_birth_trauma',
    page_name: 'Uzdrowienie Traumy Porodowej',
    slug: 'uzdrowienie-traumy-porodowej',
    linked_slug: 'uzdrowienie-traumy-porodowej',
    page_kind: 'service-landing',
    title: 'Uzdrowienie Traumy Porodowej',
    featured_image_url: '/images/hero_doula.png',
    meta_title: 'Uzdrowienie Traumy Porodowej | Natalia Potocka',
    meta_desc: 'Wsparcie online w przepracowaniu traumy porodowej metodą Rewind z Natalią Potocką.',
    meta_image_url: '/images/hero_doula.png',
    canonical_url: '',
    noindex: 0,
  },
  {
    page_key: 'service_consultation',
    page_name: 'Konsultacja Indywidualna',
    slug: 'konsultacja-indywidualna',
    linked_slug: 'konsultacja-indywidualna',
    page_kind: 'service-landing',
    title: 'Konsultacja Indywidualna',
    featured_image_url: '/images/about_doula.png',
    meta_title: 'Konsultacja Indywidualna | Natalia Potocka',
    meta_desc: 'Indywidualna konsultacja okołoporodowa online dopasowana do Twojej sytuacji i potrzeb.',
    meta_image_url: '/images/about_doula.png',
    canonical_url: '',
    noindex: 0,
  },
];

export const SERVICE_LANDING_PAGE_BY_KEY = Object.fromEntries(
  SERVICE_LANDING_PAGE_DEFAULTS.map((page) => [page.page_key, page]),
);

export const SERVICE_LANDING_PAGE_BY_SLUG = Object.fromEntries(
  SERVICE_LANDING_PAGE_DEFAULTS.map((page) => [page.linked_slug, page]),
);