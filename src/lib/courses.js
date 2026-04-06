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

export function getCourseByProductId(productId) {
  return withDb((db) => {
    const course = db.prepare('SELECT * FROM courses WHERE product_id = ?').get(productId);
    if (!course) {
      return null;
    }

    const modules = db
      .prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC, created_at ASC')
      .all(course.id)
      .map((module) => {
        const lessons = db
          .prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index ASC, created_at ASC')
          .all(module.id);

        return {
          ...module,
          lessons,
        };
      });

    return {
      ...course,
      modules,
    };
  });
}
