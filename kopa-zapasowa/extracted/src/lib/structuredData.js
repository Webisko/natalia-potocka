import { DEFAULT_SOCIAL_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../../shared/siteConfig.js';

export function toAbsoluteUrl(value = '/') {
  return new URL(value || '/', SITE_URL).toString();
}

function withOptionalFields(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== null && value !== undefined && value !== ''));
}

function normalizeImage(image) {
  return image ? toAbsoluteUrl(image) : toAbsoluteUrl(DEFAULT_SOCIAL_IMAGE);
}

export function buildPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: SITE_NAME,
    url: SITE_URL,
    image: normalizeImage('/images/about_doula.png'),
    jobTitle: 'Doula i terapeutka traumy',
    description: SITE_DESCRIPTION,
    email: 'kontakt@nataliapotocka.pl',
    knowsLanguage: ['pl-PL'],
  };
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: 'pl-PL',
    publisher: {
      '@id': `${SITE_URL}/#person`,
    },
  };
}

/**
 * @param {{
 *   title: string;
 *   description?: string;
 *   path?: string;
 *   type?: string;
 *   image?: string | null;
 * }} options
 */
export function buildWebPageSchema({
  title,
  description,
  path = '/',
  type = 'WebPage',
  image = null,
}) {
  const url = toAbsoluteUrl(path);

  return withOptionalFields({
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'pl-PL',
    isPartOf: {
      '@id': `${SITE_URL}/#website`,
    },
    about: {
      '@id': `${SITE_URL}/#person`,
    },
    primaryImageOfPage: image ? normalizeImage(image) : null,
  });
}

/**
 * @param {{
 *   title: string;
 *   description?: string;
 *   path: string;
 *   image?: string | null;
 *   items?: Array<{ name: string; href?: string | null }>;
 * }} options
 */
export function buildCollectionPageSchema({
  title,
  description,
  path,
  image = null,
  items = [],
}) {
  return withOptionalFields({
    ...buildWebPageSchema({
      title,
      description,
      path,
      type: 'CollectionPage',
      image,
    }),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => withOptionalFields({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.href ? toAbsoluteUrl(item.href) : null,
      })),
    },
  });
}

export function buildBreadcrumbSchema(items = []) {
  const normalizedItems = items
    .filter((item) => item?.name)
    .map((item, index) => withOptionalFields({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.href ? toAbsoluteUrl(item.href) : null,
    }));

  if (normalizedItems.length < 2) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: normalizedItems,
  };
}

/**
 * @param {{
 *   product: Record<string, any>;
 *   path: string;
 *   description?: string;
 *   image?: string | null;
 * }} options
 */
export function buildProductSchema({
  product,
  path,
  description,
  image = null,
}) {
  const url = toAbsoluteUrl(path);
  const imageUrl = image ? normalizeImage(image) : null;
  const currentPrice = Number(product.currentPrice ?? product.price ?? 0).toFixed(2);
  const productType = product.type === 'service' ? 'Service' : 'Product';

  return withOptionalFields({
    '@context': 'https://schema.org',
    '@type': productType,
    name: product.title,
    description,
    image: imageUrl ? [imageUrl] : null,
    url,
    category: product.type === 'service' ? 'Wsparcie 1:1' : 'Produkt cyfrowy',
    brand: product.type === 'service'
      ? null
      : {
          '@type': 'Brand',
          name: SITE_NAME,
        },
    provider: product.type === 'service'
      ? {
          '@id': `${SITE_URL}/#person`,
        }
      : null,
    areaServed: product.type === 'service' ? 'PL' : null,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: currentPrice,
      availability: 'https://schema.org/InStock',
      url,
    },
  });
}

export function buildFaqSchema(items = []) {
  const mainEntity = items
    .filter((item) => item?.q && item?.a)
    .map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }));

  if (mainEntity.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
