const db = require('./api/db.js').default;
const crypto = require('crypto');

const products = [
  { title: 'Uzdrowienie Traumy Porodowej', slug: 'uzdrowienie-traumy-porodowej', description: 'Metoda Rewind...', price: 250, type: 'service', content_url: null },
  { title: 'Konsultacja Indywidualna', slug: 'konsultacja-indywidualna', description: 'Spotkanie jeden na jeden...', price: 150, type: 'service', content_url: null },
  { title: 'Otulić Połóg', slug: 'otulic-polog', description: 'Kompleksowy plan...', price: 79, type: 'video', content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { title: 'Poród Domowy', slug: 'porod-domowy', description: 'Bezpieczeństwo...', price: 89, type: 'video', content_url: 'https://www.youtube.com/embed/9bZkp7q19f0' },
  { title: 'Głowa w Porodzie', slug: 'glowa-w-porodzie', description: 'Mechanizm lęku...', price: 69, type: 'video', content_url: 'https://www.youtube.com/embed/3JZ_D3ELwOQ' },
  { title: 'Hipnotyczny Obrót', slug: 'hipnotyczny-obrot', description: 'Relaksacja...', price: 49, type: 'audio', content_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }
];

const insert = db.prepare('INSERT OR IGNORE INTO products (id, title, slug, description, price, type, content_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
const updateMissingContentUrl = db.prepare(`
  UPDATE products
  SET content_url = ?, updated_at = CURRENT_TIMESTAMP
  WHERE slug = ?
    AND type = ?
    AND COALESCE(TRIM(content_url), '') = ''
`);

for (const p of products) {
  insert.run(crypto.randomUUID(), p.title, p.slug, p.description, p.price, p.type, p.content_url);

  if (p.content_url) {
    updateMissingContentUrl.run(p.content_url, p.slug, p.type);
  }
}

console.log('Products seeded');
process.exit(0);
