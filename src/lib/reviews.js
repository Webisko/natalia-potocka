import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(currentDir, '../../data/database.sqlite');

const FALLBACK_REVIEWS = [
  {
    id: 'fallback-1',
    content: '"Natalia potrafi stworzyć bezpieczną przestrzeń i towarzyszyć w najtrudniejszych momentach. Dzięki niej mój poród był świadomy i spokojny."',
    author: 'Anna K.',
    subtitle: 'Mama Zosi',
    thumbnail_url: null,
  },
  {
    id: 'fallback-2',
    content: '"Webinar Otulić Połóg zmienił moje podejście do czwartego trymestru. Konkretna wiedza podana z ogromną empatią."',
    author: 'Marta W.',
    subtitle: 'Mama Leona',
    thumbnail_url: null,
  },
  {
    id: 'fallback-3',
    content: '"Sesja Rewind była przełomowa. Po traumatycznym pierwszym porodzie odzyskałam wiarę w siebie i spokojniej przygotowałam się do kolejnego."',
    author: 'Karolina M.',
    subtitle: 'Mama dwójki dzieci',
    thumbnail_url: null,
  },
];

function withDb(callback) {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return callback(db);
  } catch {
    return FALLBACK_REVIEWS;
  } finally {
    db.close();
  }
}

export function getActiveReviews() {
  const reviews = withDb((db) => db.prepare('SELECT * FROM reviews WHERE is_active = 1 ORDER BY order_index ASC').all());
  return Array.isArray(reviews) && reviews.length > 0 ? reviews : FALLBACK_REVIEWS;
}