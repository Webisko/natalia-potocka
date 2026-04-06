import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PAGE_SETTINGS_DEFAULTS } from '../shared/pageDefaults.js';
import { SERVICE_LANDING_PAGE_DEFAULTS } from '../shared/serviceLandingPages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath, { 
    verbose: console.log,
    fileMustExist: false
});

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function normalizeOrderDate(value) {
    const candidate = value ? new Date(value) : new Date();
    return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
}

function getOrderDateKey(value) {
    const date = normalizeOrderDate(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}${month}${day}`;
}

function formatOrderNumber(dateKey, sequence) {
    return `NP-${dateKey}-${`${sequence}`.padStart(3, '0')}`;
}

function parseOrderNumber(value) {
    const match = `${value || ''}`.trim().match(/^NP-(\d{8})-(\d{3,})$/);
    if (!match) {
        return null;
    }

    return {
        dateKey: match[1],
        sequence: Number(match[2]),
    };
}

function getExistingOrderCounters() {
    const counters = new Map();
    const rows = db.prepare(`
        SELECT order_number
        FROM orders
        WHERE order_number IS NOT NULL AND trim(order_number) != ''
    `).all();

    for (const row of rows) {
        const parsed = parseOrderNumber(row.order_number);
        if (!parsed) {
            continue;
        }

        counters.set(parsed.dateKey, Math.max(counters.get(parsed.dateKey) || 0, parsed.sequence));
    }

    return counters;
}

export function generateOrderNumber(createdAt = new Date()) {
    const dateKey = getOrderDateKey(createdAt);
    const latestRow = db.prepare(`
        SELECT order_number
        FROM orders
        WHERE order_number LIKE ?
        ORDER BY order_number DESC
        LIMIT 1
    `).get(`NP-${dateKey}-%`);
    const latestSequence = parseOrderNumber(latestRow?.order_number)?.sequence || 0;

    return formatOrderNumber(dateKey, latestSequence + 1);
}

function backfillMissingOrderNumbers() {
    const missingOrders = db.prepare(`
        SELECT id, created_at
        FROM orders
        WHERE order_number IS NULL OR trim(order_number) = ''
        ORDER BY COALESCE(datetime(created_at), created_at) ASC, id ASC
    `).all();

    if (missingOrders.length === 0) {
        return;
    }

    const counters = getExistingOrderCounters();
    const updateOrderNumber = db.prepare('UPDATE orders SET order_number = ? WHERE id = ?');
    const transaction = db.transaction((rows) => {
        for (const row of rows) {
            const dateKey = getOrderDateKey(row.created_at);
            const nextSequence = (counters.get(dateKey) || 0) + 1;
            counters.set(dateKey, nextSequence);
            updateOrderNumber.run(formatOrderNumber(dateKey, nextSequence), row.id);
        }
    });

    transaction(missingOrders);
}

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        short_description TEXT,
        price REAL NOT NULL,
        promotional_price REAL,
        promotional_price_until DATETIME,
        lowest_price_30_days REAL,
        stripe_price_id TEXT,
        type TEXT NOT NULL,
        content_url TEXT,
        allow_download INTEGER DEFAULT 1,
        thumbnail_url TEXT,
        secondary_image_url TEXT,
        faq_json TEXT,
        meta_title TEXT,
        meta_desc TEXT,
        meta_image_url TEXT,
        canonical_url TEXT,
        noindex INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS page_settings (
        page_key TEXT PRIMARY KEY,
        page_name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        featured_image_url TEXT,
        meta_title TEXT,
        meta_desc TEXT,
        meta_image_url TEXT,
        canonical_url TEXT,
        noindex INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        purchased_items TEXT,
        phone TEXT,
        is_admin INTEGER DEFAULT 0,
        email_confirmed INTEGER DEFAULT 0,
        confirm_token TEXT,
        pending_email TEXT,
        email_change_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_email TEXT NOT NULL,
        product_id TEXT NOT NULL,
        amount_total REAL NOT NULL,
        applied_coupon_code TEXT,
        order_number TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        subtitle TEXT,
        content TEXT NOT NULL,
        thumbnail_url TEXT,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        thumbnail_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        lesson_type TEXT NOT NULL DEFAULT 'video',
        content_url TEXT,
        content_text TEXT,
        duration_minutes INTEGER,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lesson_attachments (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        completed INTEGER DEFAULT 0,
        completed_at DATETIME,
        UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS purchase_consents (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        email TEXT NOT NULL,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        stripe_session_id TEXT NOT NULL UNIQUE,
        terms_accepted_at DATETIME NOT NULL,
        digital_content_consent_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        value REAL NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        valid_from DATETIME,
        valid_until DATETIME,
        minimum_spend REAL,
        maximum_spend REAL,
        usage_limit_per_user INTEGER,
        included_product_ids TEXT,
        excluded_product_ids TEXT,
        allowed_emails TEXT,
        exclude_sale_items INTEGER DEFAULT 0,
        usage_limit INTEGER,
        times_used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        alt_text TEXT,
        public_url TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_price_history (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        price REAL NOT NULL,
        promotional_price REAL,
        promotional_price_until DATETIME,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log('Database initialized successfully.');

function getTableColumns(tableName) {
    return db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
}

function ensureColumn(tableName, columnName, definition) {
    const columns = new Set(getTableColumns(tableName));
    if (columns.has(columnName)) {
        return;
    }

    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

// Migration: add columns for existing databases
ensureColumn('users', 'email_confirmed', 'INTEGER DEFAULT 0');
ensureColumn('users', 'confirm_token', 'TEXT');
ensureColumn('users', 'first_name', 'TEXT');
ensureColumn('users', 'last_name', 'TEXT');
ensureColumn('users', 'phone', 'TEXT');
ensureColumn('users', 'reset_token', 'TEXT');
ensureColumn('users', 'reset_expires', 'DATETIME');
ensureColumn('users', 'pending_email', 'TEXT');
ensureColumn('users', 'email_change_token', 'TEXT');
ensureColumn('products', 'allow_download', 'INTEGER DEFAULT 1');
ensureColumn('products', 'short_description', 'TEXT');
ensureColumn('products', 'promotional_price', 'REAL');
ensureColumn('products', 'promotional_price_until', 'DATETIME');
ensureColumn('products', 'lowest_price_30_days', 'REAL');
ensureColumn('products', 'duration_label', 'TEXT');
ensureColumn('products', 'long_description', 'TEXT');
ensureColumn('products', 'benefits_json', 'TEXT');
ensureColumn('products', 'faq_json', 'TEXT');
ensureColumn('products', 'secondary_image_url', 'TEXT');
ensureColumn('products', 'meta_title', 'TEXT');
ensureColumn('products', 'meta_desc', 'TEXT');
ensureColumn('products', 'meta_image_url', 'TEXT');
ensureColumn('products', 'canonical_url', 'TEXT');
ensureColumn('products', 'noindex', 'INTEGER DEFAULT 0');
ensureColumn('products', 'is_published', 'INTEGER DEFAULT 1');
ensureColumn('settings', 'updated_at', 'DATETIME');
ensureColumn('page_settings', 'featured_image_url', 'TEXT');
ensureColumn('page_settings', 'meta_title', 'TEXT');
ensureColumn('page_settings', 'meta_desc', 'TEXT');
ensureColumn('page_settings', 'meta_image_url', 'TEXT');
ensureColumn('page_settings', 'canonical_url', 'TEXT');
ensureColumn('page_settings', 'noindex', 'INTEGER DEFAULT 0');
ensureColumn('page_settings', 'updated_at', 'DATETIME');
ensureColumn('coupons', 'description', 'TEXT');
ensureColumn('coupons', 'is_active', 'INTEGER DEFAULT 1');
ensureColumn('coupons', 'valid_from', 'DATETIME');
ensureColumn('coupons', 'valid_until', 'DATETIME');
ensureColumn('coupons', 'minimum_spend', 'REAL');
ensureColumn('coupons', 'maximum_spend', 'REAL');
ensureColumn('coupons', 'usage_limit_per_user', 'INTEGER');
ensureColumn('coupons', 'included_product_ids', 'TEXT');
ensureColumn('coupons', 'excluded_product_ids', 'TEXT');
ensureColumn('coupons', 'allowed_emails', 'TEXT');
ensureColumn('coupons', 'exclude_sale_items', 'INTEGER DEFAULT 0');
ensureColumn('coupons', 'usage_limit', 'INTEGER');
ensureColumn('coupons', 'times_used', 'INTEGER DEFAULT 0');
ensureColumn('coupons', 'updated_at', 'DATETIME');
ensureColumn('orders', 'applied_coupon_code', 'TEXT');
ensureColumn('orders', 'order_number', 'TEXT');
ensureColumn('media_assets', 'width', 'INTEGER');
ensureColumn('media_assets', 'height', 'INTEGER');
ensureColumn('media_assets', 'title', 'TEXT');
ensureColumn('media_assets', 'alt_text', 'TEXT');
ensureColumn('media_assets', 'updated_at', 'DATETIME');

db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number
    ON orders(order_number)
    WHERE order_number IS NOT NULL
`);

backfillMissingOrderNumbers();

const insertDefaultPageSettings = db.prepare(`
    INSERT OR IGNORE INTO page_settings (
        page_key,
        page_name,
        slug,
        title,
        featured_image_url,
        meta_title,
        meta_desc,
        meta_image_url,
        canonical_url,
        noindex
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const page of [...PAGE_SETTINGS_DEFAULTS, ...SERVICE_LANDING_PAGE_DEFAULTS]) {
    insertDefaultPageSettings.run(
        page.page_key,
        page.page_name,
        page.slug,
        page.title,
        page.featured_image_url,
        page.meta_title,
        page.meta_desc,
        page.meta_image_url,
        page.canonical_url,
        page.noindex,
    );
}

const syncServiceLandingPageDefinition = db.prepare(`
    UPDATE page_settings
    SET page_name = ?, slug = ?
    WHERE page_key = ?
`);

for (const page of SERVICE_LANDING_PAGE_DEFAULTS) {
    syncServiceLandingPageDefinition.run(
        page.page_name,
        page.slug,
        page.page_key,
    );
}

export default db;
