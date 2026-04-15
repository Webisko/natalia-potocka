import path from 'node:path';
import Database from 'better-sqlite3';
import { getPublicBuildSnapshot } from './publicBuildSnapshot.js';

const dbPath = path.resolve(process.cwd(), 'data/database.sqlite');

function withDb(callback) {
  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    try {
      return callback(db);
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export function getCourseByProductId(productId) {
  const courseFromDb = withDb((db) => {
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
          .all(module.id)
          .map((lesson) => ({
            ...lesson,
            attachments: db
              .prepare('SELECT * FROM lesson_attachments WHERE lesson_id = ? ORDER BY created_at ASC, id ASC')
              .all(lesson.id),
          }));

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

  if (courseFromDb !== null) {
    return courseFromDb;
  }

  const snapshot = getPublicBuildSnapshot();
  const courses = Array.isArray(snapshot?.courses) ? snapshot.courses : [];
  const modules = Array.isArray(snapshot?.modules) ? snapshot.modules : [];
  const lessons = Array.isArray(snapshot?.lessons) ? snapshot.lessons : [];
  const lessonAttachments = Array.isArray(snapshot?.lesson_attachments)
    ? snapshot.lesson_attachments
    : Array.isArray(snapshot?.attachments)
      ? snapshot.attachments
      : [];
  const course = courses.find((item) => `${item?.product_id ?? ''}` === `${productId}`);

  if (!course) {
    return null;
  }

  return {
    ...course,
    modules: modules
      .filter((module) => `${module?.course_id ?? ''}` === `${course.id}`)
      .sort((left, right) => {
        if ((left?.order_index ?? 0) !== (right?.order_index ?? 0)) {
          return (left?.order_index ?? 0) - (right?.order_index ?? 0);
        }

        return `${left?.created_at ?? ''}`.localeCompare(`${right?.created_at ?? ''}`);
      })
      .map((module) => ({
        ...module,
        lessons: lessons
          .filter((lesson) => `${lesson?.module_id ?? ''}` === `${module.id}`)
          .sort((left, right) => {
            if ((left?.order_index ?? 0) !== (right?.order_index ?? 0)) {
              return (left?.order_index ?? 0) - (right?.order_index ?? 0);
            }

            return `${left?.created_at ?? ''}`.localeCompare(`${right?.created_at ?? ''}`);
          })
          .map((lesson) => ({
            ...lesson,
            attachments: lessonAttachments.filter((attachment) => `${attachment?.lesson_id ?? ''}` === `${lesson.id}`),
          })),
      })),
  };
}
