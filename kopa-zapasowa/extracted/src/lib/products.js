import path from 'node:path';
import Database from 'better-sqlite3';
import { stripRichText } from '../../shared/richText.js';

const dbPath = path.resolve(process.cwd(), 'data/database.sqlite');

function withDb(callback) {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return callback(db);
  } finally {
    db.close();
  }
}

function getColumns(db) {
  return new Set(db.prepare('PRAGMA table_info(products)').all().map((column) => column.name));
}

function normalizeBenefitCards(value) {
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
    .map((card) => ({
      title: typeof card?.title === 'string' ? card.title.trim() : '',
      description: typeof card?.description === 'string' ? card.description.trim() : '',
      icon: typeof card?.icon === 'string' && card.icon ? card.icon.trim() : 'check',
    }))
    .filter((card) => card.title || card.description)
    .slice(0, 3);
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
    .map((item) => ({
      q: typeof item?.q === 'string' ? item.q.trim() : '',
      a: typeof item?.a === 'string' ? item.a.trim() : '',
    }))
    .filter((item) => item.q || item.a)
    .slice(0, 5);
}

function buildQuery(columns) {
  const select = ['id', 'slug', 'title', 'price', 'description', 'type'];
  const optionalColumns = [
    'updated_at',
    'short_description',
    'thumbnail_url',
    'secondary_image_url',
    'promotional_price',
    'promotional_price_until',
    'lowest_price_30_days',
    'stripe_price_id',
    'duration_label',
    'long_description',
    'benefits_json',
    'faq_json',
    'meta_title',
    'meta_desc',
    'meta_image_url',
    'canonical_url',
    'noindex',
    'is_published',
    'display_order',
  ];

  for (const column of optionalColumns) {
    if (columns.has(column)) {
      select.push(column);
    }
  }

  const where = columns.has('is_published') ? 'WHERE COALESCE(is_published, 1) = 1' : '';
  const orderBy = columns.has('display_order')
    ? 'ORDER BY CASE WHEN display_order IS NULL THEN 1 ELSE 0 END, display_order ASC, id DESC'
    : 'ORDER BY id DESC';

  return `SELECT ${select.join(', ')} FROM products ${where} ${orderBy}`;
}

function deriveExcerpt(product) {
  if (product.short_description) {
    return product.short_description.trim();
  }

  if (!product.description) {
    return '';
  }

  return stripRichText(product.description)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => !line.startsWith('- ')) || '';
}

function normalizeProduct(product) {
  const now = Date.now();
  const promoActive =
    product.promotional_price != null &&
    (!product.promotional_price_until || new Date(product.promotional_price_until).getTime() >= now);
  const currentPrice = promoActive ? Number(product.promotional_price) : Number(product.price);

  return {
    ...product,
    price: Number(product.price),
    promotional_price: product.promotional_price == null ? null : Number(product.promotional_price),
    lowest_price_30_days: product.lowest_price_30_days == null ? null : Number(product.lowest_price_30_days),
    benefits_json: normalizeBenefitCards(product.benefits_json),
    faq_json: normalizeFaqItems(product.faq_json),
    noindex: product.noindex === 1 || product.noindex === true,
    excerpt: deriveExcerpt(product),
    promoActive,
    currentPrice,
  };
}

function getAllPublishedProducts() {
  return withDb((db) => {
    const columns = getColumns(db);
    const rows = db.prepare(buildQuery(columns)).all();
    return rows
      .filter((product) => product.slug)
      .map((product) => normalizeProduct(product));
  });
}

export function getPublishedProducts() {
  return getAllPublishedProducts().filter((product) => product.type !== 'service');
}

export function getPublishedOfferProducts() {
  return getPublishedProducts().filter((product) => product.type === 'video' || product.type === 'audio');
}

export function getPublishedStorefrontProducts() {
  return getPublishedProducts().filter((product) => product.type === 'video' || product.type === 'audio' || product.type === 'course');
}

export function getPublishedServiceProducts() {
  return getAllPublishedProducts().filter((product) => product.type === 'service');
}

export function getAdminProductIds() {
  return withDb((db) => db.prepare("SELECT id FROM products WHERE type != 'service' ORDER BY id DESC").all().map((product) => String(product.id)));
}

export function getProductBySlug(slug) {
  return getPublishedProducts().find((product) => product.slug === slug) || null;
}

export function formatPrice(value) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function getProductKindLabel(type) {
  if (type === 'course') return 'Szkolenie online';
  if (type === 'service') return 'Wsparcie 1:1';
  if (type === 'audio') return 'Medytacja';
  if (type === 'video') return 'Webinar';
  return 'Produkt cyfrowy';
}