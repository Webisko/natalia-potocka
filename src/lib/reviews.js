import path from 'node:path';
import Database from 'better-sqlite3';

const dbPath = path.resolve(process.cwd(), 'data/database.sqlite');

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
  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    try {
      return callback(db);
    } finally {
      db.close();
    }
  } catch {
    return FALLBACK_REVIEWS;
  }
}

export function getActiveReviews() {
  const reviews = withDb((db) => db.prepare('SELECT * FROM reviews WHERE is_active = 1 ORDER BY order_index ASC').all());
  return Array.isArray(reviews) && reviews.length > 0 ? reviews : FALLBACK_REVIEWS;
}