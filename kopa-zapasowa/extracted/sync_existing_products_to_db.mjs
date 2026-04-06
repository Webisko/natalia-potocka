import { v4 as uuidv4 } from 'uuid';
import db from './api/db.js';
import { getDigitalProductContent } from './src/lib/productContent.js';
import { SERVICE_CONTENT } from './src/lib/serviceContent.js';

const DIGITAL_PRODUCT_SLUGS = [
  'otulic-polog',
  'porod-domowy',
  'glowa-w-porodzie',
  'hipnotyczny-obrot',
];

function stringifyBenefitCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  const normalizedCards = cards
    .map((card) => ({
      title: typeof card?.title === 'string' ? card.title.trim() : '',
      description: typeof card?.description === 'string' ? card.description.trim() : '',
    }))
    .filter((card) => card.title || card.description)
    .slice(0, 3);

  return normalizedCards.length > 0 ? JSON.stringify(normalizedCards) : null;
}

function joinParagraphs(paragraphs) {
  if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
    return null;
  }

  return paragraphs
    .map((paragraph) => `${paragraph}`.trim())
    .filter(Boolean)
    .join('\n\n') || null;
}

const productsBySlug = new Map(
  db.prepare('SELECT * FROM products').all().map((product) => [product.slug, product]),
);

const updateDigitalProduct = db.prepare(`
  UPDATE products
  SET short_description = ?,
      duration_label = ?,
      long_description = ?,
      benefits_json = ?,
      thumbnail_url = COALESCE(NULLIF(thumbnail_url, ''), ?),
      updated_at = CURRENT_TIMESTAMP
  WHERE slug = ?
`);

const upsertServiceProduct = db.prepare(`
  INSERT INTO products (
    id,
    title,
    slug,
    description,
    short_description,
    price,
    type,
    thumbnail_url
  )
  VALUES (?, ?, ?, ?, ?, ?, 'service', ?)
  ON CONFLICT(slug) DO UPDATE SET
    title = excluded.title,
    description = excluded.description,
    short_description = excluded.short_description,
    price = excluded.price,
    type = excluded.type,
    thumbnail_url = excluded.thumbnail_url,
    updated_at = CURRENT_TIMESTAMP
`);

const backfillShortDescription = db.prepare(`
  UPDATE products
  SET short_description = description,
      updated_at = CURRENT_TIMESTAMP
  WHERE short_description IS NULL
    AND description IS NOT NULL
    AND TRIM(description) != ''
`);

const digitalResults = [];
for (const slug of DIGITAL_PRODUCT_SLUGS) {
  const product = productsBySlug.get(slug);
  const content = getDigitalProductContent(slug);

  if (!product || !content) {
    digitalResults.push({ slug, status: 'skipped' });
    continue;
  }

  updateDigitalProduct.run(
    content.lead || null,
    content.duration || null,
    joinParagraphs(content.longDescription),
    stringifyBenefitCards(content.benefitCards),
    content.image || null,
    slug,
  );

  digitalResults.push({ slug, status: 'updated' });
}

const serviceResults = [];
for (const [slug, content] of Object.entries(SERVICE_CONTENT)) {
  upsertServiceProduct.run(
    productsBySlug.get(slug)?.id || uuidv4(),
    content.title,
    slug,
    content.description || null,
    content.description || null,
    Number(content.price || 0),
    content.image ? `/${content.image}` : null,
  );

  serviceResults.push({ slug, status: productsBySlug.has(slug) ? 'updated' : 'inserted' });
}

const shortDescriptionBackfill = backfillShortDescription.run();

const finalRows = db.prepare(`
  SELECT slug, title, type, short_description, duration_label, thumbnail_url
  FROM products
  ORDER BY type, title
`).all();

console.log(JSON.stringify({
  digitalResults,
  serviceResults,
  shortDescriptionBackfill: shortDescriptionBackfill.changes,
  finalRows,
}, null, 2));