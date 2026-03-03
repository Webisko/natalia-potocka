const db = require('./api/db.js').default;
const crypto = require('crypto');

const products = [
  { title: 'Uzdrowienie Traumy Porodowej', slug: 'uzdrowienie-traumy-porodowej', description: 'Metoda Rewind...', price: 250, type: 'service' },
  { title: 'Konsultacja Indywidualna', slug: 'konsultacja-indywidualna', description: 'Spotkanie jeden na jeden...', price: 150, type: 'service' },
  { title: 'Otulić Połóg', slug: 'otulic-polog', description: 'Kompleksowy plan...', price: 79, type: 'video' },
  { title: 'Poród Domowy', slug: 'porod-domowy', description: 'Bezpieczeństwo...', price: 89, type: 'video' },
  { title: 'Głowa w Porodzie', slug: 'glowa-w-porodzie', description: 'Mechanizm lęku...', price: 69, type: 'video' },
  { title: 'Hipnotyczny Obrót', slug: 'hipnotyczny-obrot', description: 'Relaksacja...', price: 49, type: 'audio' }
];

const insert = db.prepare('INSERT OR IGNORE INTO products (id, title, slug, description, price, type) VALUES (?, ?, ?, ?, ?, ?)');

for (const p of products) {
  insert.run(crypto.randomUUID(), p.title, p.slug, p.description, p.price, p.type);
}

console.log('Products seeded');
process.exit(0);
