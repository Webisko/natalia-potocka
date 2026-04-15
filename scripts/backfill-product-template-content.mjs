import path from 'node:path';
import Database from 'better-sqlite3';
import { normalizeProductTemplateContent } from '../shared/productTemplateContent.js';

const projectRoot = process.cwd();
const dbPath = path.resolve(projectRoot, 'data/database.sqlite');
const db = new Database(dbPath);

try {
  const columns = new Set(db.prepare('PRAGMA table_info(products)').all().map((column) => column.name));
  if (!columns.has('template_content_json')) {
    db.exec('ALTER TABLE products ADD COLUMN template_content_json TEXT');
  }

  const rows = db.prepare("SELECT id, type, template_content_json FROM products WHERE type IN ('video', 'audio', 'course')").all();
  const update = db.prepare('UPDATE products SET template_content_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

  let updatedCount = 0;
  const transaction = db.transaction(() => {
    for (const row of rows) {
      const currentValue = `${row.template_content_json || ''}`.trim();
      if (currentValue) {
        continue;
      }

      const normalized = normalizeProductTemplateContent({}, row.type || 'video');
      update.run(JSON.stringify(normalized), row.id);
      updatedCount += 1;
    }
  });

  transaction();
  console.log(JSON.stringify({ updatedCount }, null, 2));
} finally {
  db.close();
}
