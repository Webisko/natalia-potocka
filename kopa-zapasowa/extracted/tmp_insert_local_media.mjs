import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { statSync } from 'node:fs';

const db = new Database('data/database.sqlite');

const altImages = [
    { file: 'glowa_w_porodzie_alt.png', url: '/images/glowa_w_porodzie_alt.png' },
    { file: 'hipnotyczny_obrot_alt.png', url: '/images/hipnotyczny_obrot_alt.png' },
    { file: 'otulic_polog_alt.png', url: '/images/otulic_polog_alt.png' },
    { file: 'porod_domowy_alt.png', url: '/images/porod_domowy_alt.png' },
];

const insert = db.prepare(`
    INSERT OR IGNORE INTO media_assets (id, file_name, original_name, mime_type, size_bytes, width, height, title, alt_text, public_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

for (const img of altImages) {
    const stats = statSync(`public/images/${img.file}`);
    insert.run(randomUUID(), img.file, img.file, 'image/png', stats.size, img.url);
    console.log('inserted:', img.url);
}

const res = db.prepare("SELECT public_url, size_bytes FROM media_assets WHERE public_url LIKE '%_alt.png'").all();
console.log('local media_assets alt entries:', res);
