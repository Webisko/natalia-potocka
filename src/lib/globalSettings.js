import path from 'node:path';
import Database from 'better-sqlite3';

const dbPath = path.resolve(process.cwd(), 'data/database.sqlite');

function withDb(callback) {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return callback(db);
  } finally {
    db.close();
  }
}

function tableExists(db, tableName) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
  return Boolean(row);
}

export function getGlobalSettings() {
  return withDb((db) => {
    if (!tableExists(db, 'settings')) {
      return {};
    }

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  });
}
