import Database from 'better-sqlite3';
const db = new Database('data/database.sqlite');
const cols = db.prepare('PRAGMA table_info(media_assets)').all().map(r => r.name);
console.log('columns:', cols.join(', '));
const res = db.prepare("SELECT public_url FROM media_assets WHERE public_url LIKE '%_alt.png'").all();
console.log('alt images:', res.map(r => r.public_url));
