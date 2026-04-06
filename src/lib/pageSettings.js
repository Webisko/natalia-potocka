import path from 'node:path';
import Database from 'better-sqlite3';
import { PAGE_SETTINGS_DEFAULTS, PAGE_SETTINGS_BY_KEY } from '../../shared/pageDefaults.js';
import { SERVICE_LANDING_PAGE_BY_KEY, SERVICE_LANDING_PAGE_BY_SLUG, SERVICE_LANDING_PAGE_DEFAULTS } from '../../shared/serviceLandingPages.js';

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

function normalizePageSettings(page) {
  const defaults = PAGE_SETTINGS_BY_KEY[page.page_key] || {};
  return {
    ...defaults,
    ...page,
    noindex: page.noindex === 1 || page.noindex === true,
  };
}

function normalizeServiceLandingPage(page) {
  const defaults = SERVICE_LANDING_PAGE_BY_KEY[page.page_key] || {};
  return {
    ...defaults,
    ...page,
    page_name: defaults.page_name,
    slug: defaults.slug,
    linked_slug: defaults.linked_slug,
    page_kind: defaults.page_kind,
    noindex: page.noindex === 1 || page.noindex === true,
  };
}

export function getPageSettingsMap() {
  return withDb((db) => {
    if (!tableExists(db, 'page_settings')) {
      return Object.fromEntries(PAGE_SETTINGS_DEFAULTS.map((page) => [page.page_key, normalizePageSettings(page)]));
    }

    const rows = db.prepare('SELECT * FROM page_settings').all();
    const byKey = new Map(rows.map((page) => [page.page_key, page]));

    return Object.fromEntries(
      PAGE_SETTINGS_DEFAULTS.map((page) => [
        page.page_key,
        normalizePageSettings(byKey.get(page.page_key) || page),
      ]),
    );
  });
}

export function getPageSettings(pageKey) {
  return getPageSettingsMap()[pageKey] || getServiceLandingPageSettingsMap()[pageKey] || null;
}

export function getPagePathByKey(pageKey) {
  if (pageKey === 'offer') {
    return '/#oferta';
  }

  const page = getPageSettings(pageKey);
  return getPagePath(page || PAGE_SETTINGS_BY_KEY[pageKey] || SERVICE_LANDING_PAGE_BY_KEY[pageKey] || null);
}

export function getPageSettingsBySlug(slug) {
  const normalizedSlug = `${slug || ''}`.replace(/^\/+|\/+$/g, '');
  return Object.values(getPageSettingsMap()).find((page) => page.slug === normalizedSlug)
    || Object.values(getServiceLandingPageSettingsMap()).find((page) => page.slug === normalizedSlug)
    || null;
}

export function getCustomSlugPages() {
  const pageSettingsMap = getPageSettingsMap();
  const customSystemPages = PAGE_SETTINGS_DEFAULTS
    .map((page) => pageSettingsMap[page.page_key])
    .filter((page) => page && page.page_key !== 'home' && page.slug && page.slug !== PAGE_SETTINGS_BY_KEY[page.page_key].slug);

  const serviceLandingPages = Object.values(getServiceLandingPageSettingsMap())
    .filter((page) => page && page.slug);

  return [...customSystemPages, ...serviceLandingPages];
}

export function getPagePath(page) {
  return page?.page_key === 'home' ? '/' : `/${page?.slug || ''}`;
}

export function getServiceLandingPageSettingsMap() {
  return withDb((db) => {
    if (!tableExists(db, 'page_settings')) {
      return Object.fromEntries(SERVICE_LANDING_PAGE_DEFAULTS.map((page) => [page.page_key, normalizeServiceLandingPage(page)]));
    }

    const rows = db.prepare('SELECT * FROM page_settings').all();
    const byKey = new Map(rows.map((page) => [page.page_key, page]));

    return Object.fromEntries(
      SERVICE_LANDING_PAGE_DEFAULTS.map((page) => [
        page.page_key,
        normalizeServiceLandingPage(byKey.get(page.page_key) || page),
      ]),
    );
  });
}

export function getServiceLandingPageSettingsBySlug(slug) {
  const normalizedSlug = `${slug || ''}`.replace(/^\/+|\/+$/g, '');
  const defaults = SERVICE_LANDING_PAGE_BY_SLUG[normalizedSlug];

  if (!defaults) {
    return null;
  }

  return getServiceLandingPageSettingsMap()[defaults.page_key] || normalizeServiceLandingPage(defaults);
}

export function normalizePagePath(pagePath) {
  if (!pagePath || pagePath === '/') {
    return '/';
  }

  return `/${`${pagePath}`.replace(/^\/+|\/+$/g, '')}`;
}