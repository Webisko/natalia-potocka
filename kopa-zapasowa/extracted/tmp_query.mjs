import Database from 'better-sqlite3';
const db = new Database('data/database.sqlite');
console.log('=== PRODUCTS ===');
const products = db.prepare("SELECT id, title, slug, type, thumbnail_url, secondary_image_url FROM products WHERE type != 'service' ORDER BY title").all();
products.forEach(p => console.log(JSON.stringify(p)));
console.log('=== MEDIA ===');
const media = db.prepare("SELECT id, public_url, alt_text FROM media_assets ORDER BY created_at DESC LIMIT 30").all();
media.forEach(m => console.log(JSON.stringify(m)));
