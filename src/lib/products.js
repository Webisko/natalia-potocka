import path from 'node:path';
import Database from 'better-sqlite3';
import { stripRichText } from '../../shared/richText.js';
import { normalizeProductTemplateContent } from '../../shared/productTemplateContent.js';
import { getPublicBuildSnapshot } from './publicBuildSnapshot.js';

const dbPath = path.resolve(process.cwd(), 'data/database.sqlite');

function withDb(callback) {
  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    try {
      return callback(db);
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

function isPublished(product) {
  return product?.is_published == null || product.is_published === 1 || product.is_published === true || product.is_published === '1';
}

function getSnapshotProducts() {
  const snapshot = getPublicBuildSnapshot();
  return Array.isArray(snapshot?.products) ? snapshot.products : null;
}

function getSnapshotSettings() {
  const snapshot = getPublicBuildSnapshot();
  return snapshot?.settings && typeof snapshot.settings === 'object' ? snapshot.settings : {};
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

function buildQuery(columns, { publishedOnly = false } = {}) {
  const select = ['id', 'slug', 'title', 'price', 'description', 'type'];
  const optionalColumns = [
    'updated_at',
    'short_description',
    'thumbnail_url',
    'secondary_image_url',
    'template_content_json',
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

  const where = publishedOnly && columns.has('is_published') ? 'WHERE COALESCE(is_published, 1) = 1' : '';
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
    if (!product.long_description) {
      return '';
    }

    return stripRichText(product.long_description)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .find((line) => !line.startsWith('- ')) || '';
  }

  return stripRichText(product.description)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => !line.startsWith('- ')) || '';
}

function normalizeProduct(product, globalSettings = {}) {
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
    template_content_json: normalizeProductTemplateContent(product.template_content_json, product.type, globalSettings),
    noindex: product.noindex === 1 || product.noindex === true,
    excerpt: deriveExcerpt(product),
    promoActive,
    currentPrice,
  };
}

function getAllProducts() {
  const snapshotProducts = getSnapshotProducts();
  if (snapshotProducts) {
    const snapshotSettings = getSnapshotSettings();
    return snapshotProducts.map((product) => normalizeProduct(product, snapshotSettings));
  }

  const rows = withDb((db) => {
    const columns = getColumns(db);
    const products = db.prepare(buildQuery(columns)).all();
    const settingsRows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'product_template_%'").all();

    return {
      products,
      settings: Object.fromEntries(settingsRows.map((row) => [row.key, row.value ?? ''])),
    };
  });

  return Array.isArray(rows?.products)
    ? rows.products.map((product) => normalizeProduct(product, rows.settings || {}))
    : [];
}

function getAllPublishedProducts() {
  return getAllProducts().filter((product) => product.slug && isPublished(product));
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
  const snapshotProducts = getSnapshotProducts();
  if (snapshotProducts) {
    return snapshotProducts
      .filter((product) => product?.type !== 'service')
      .map((product) => String(product.id));
  }

  const rows = withDb((db) => db.prepare("SELECT id FROM products WHERE type != 'service' ORDER BY id DESC").all());
  return Array.isArray(rows) ? rows.map((product) => String(product.id)) : [];
}

export function getProductById(id) {
  return getAllProducts().find((product) => `${product?.id ?? ''}` === `${id}`) || null;
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