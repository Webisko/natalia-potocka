import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import { requireAdmin } from './authMiddleware.js';
import { enqueuePublicBuild } from './publicBuildQueue.js';
import { PAGE_RESERVED_SLUGS, PAGE_SETTINGS_BY_KEY, PAGE_SETTINGS_DEFAULTS } from '../shared/pageDefaults.js';
import { SERVICE_LANDING_PAGE_BY_KEY, SERVICE_LANDING_PAGE_DEFAULTS } from '../shared/serviceLandingPages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const mediaUploadDir = path.join(projectRoot, 'public', 'uploads', 'media');
const ADMIN_PAGE_SETTINGS_DEFAULTS = [
    PAGE_SETTINGS_BY_KEY.home,
    ...SERVICE_LANDING_PAGE_DEFAULTS,
    PAGE_SETTINGS_BY_KEY.about,
    PAGE_SETTINGS_BY_KEY.contact,
    PAGE_SETTINGS_BY_KEY.privacy,
    PAGE_SETTINGS_BY_KEY.terms,
];
const ADMIN_PAGE_SETTINGS_BY_KEY = {
    ...PAGE_SETTINGS_BY_KEY,
    ...SERVICE_LANDING_PAGE_BY_KEY,
};

fs.mkdirSync(mediaUploadDir, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, mediaUploadDir);
        },
        filename: (req, file, callback) => {
            const extension = path.extname(file.originalname || '').toLowerCase();
            callback(null, `${Date.now()}-${uuidv4()}${extension}`);
        },
    }),
    limits: {
        fileSize: 250 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
        const mimeType = `${file.mimetype || ''}`.toLowerCase();
        const isAllowed = mimeType.startsWith('image/')
            || mimeType.startsWith('audio/')
            || mimeType.startsWith('video/')
            || mimeType === 'application/pdf';

        if (!isAllowed) {
            callback(new Error('Do biblioteki mediów można przesyłać obrazy, audio, wideo oraz pliki PDF.'));
            return;
        }

        callback(null, true);
    },
});

const router = express.Router();

router.use(requireAdmin);

function normalizeBenefitCards(value) {
    let parsed = value;

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return [];
        }

        try {
            parsed = JSON.parse(trimmed);
        } catch {
            return [];
        }
    }

    if (!Array.isArray(parsed)) {
        return [];
    }

    return parsed
        .map((card) => ({
            title: typeof card?.title === 'string' ? card.title.trim() : '',
            description: typeof card?.description === 'string' ? card.description.trim() : '',
            icon: typeof card?.icon === 'string' ? card.icon.trim() : '',
        }))
        .filter((card) => card.title || card.description)
        .slice(0, 3);
}

function normalizeFaqItems(value) {
    let parsed = value;

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return [];
        }

        try {
            parsed = JSON.parse(trimmed);
        } catch {
            return [];
        }
    }

    if (!Array.isArray(parsed)) {
        return [];
    }

    return parsed
        .map((item) => ({
            q: typeof item?.q === 'string' ? item.q.trim() : '',
            a: typeof item?.a === 'string' ? item.a.trim() : '',
        }))
        .filter((item) => item.q || item.a)
        .slice(0, 5);
}

function serializeBenefitCards(value) {
    const cards = normalizeBenefitCards(value);
    return cards.length > 0 ? JSON.stringify(cards) : null;
}

function serializeFaqItems(value) {
    const items = normalizeFaqItems(value);
    return items.length > 0 ? JSON.stringify(items) : null;
}

function emptyToNull(value) {
    if (value == null) {
        return null;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
    }

    return value;
}

function parseBooleanFlag(value) {
    return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
}

function parseNullableInteger(value) {
    if (value === '' || value == null) {
        return null;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableFloat(value) {
    if (value === '' || value == null) {
        return null;
    }

    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizePriceSnapshot(product) {
    return {
        price: Number(product?.price || 0),
        promotional_price: parseNullableFloat(product?.promotional_price),
        promotional_price_until: emptyToNull(product?.promotional_price_until),
    };
}

function recordProductPriceSnapshot(productId, snapshot) {
    const normalizedSnapshot = normalizePriceSnapshot(snapshot);
    db.prepare(`
        INSERT INTO product_price_history (id, product_id, price, promotional_price, promotional_price_until, recorded_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
        uuidv4(),
        productId,
        normalizedSnapshot.price,
        normalizedSnapshot.promotional_price,
        normalizedSnapshot.promotional_price_until,
    );
}

function calculateLowestPrice30Days(productId, currentProduct) {
    const historyRows = db.prepare(`
        SELECT price, promotional_price
        FROM product_price_history
        WHERE product_id = ?
          AND recorded_at >= datetime('now', '-30 days')
        ORDER BY recorded_at DESC
    `).all(productId);

    const points = [currentProduct, ...historyRows]
        .map((row) => {
            const price = parseNullableFloat(row?.price);
            const promotionalPrice = parseNullableFloat(row?.promotional_price);

            if (!Number.isFinite(price)) {
                return null;
            }

            return promotionalPrice != null && promotionalPrice > 0
                ? Math.min(price, promotionalPrice)
                : price;
        })
        .filter((value) => value != null);

    if (points.length === 0) {
        return null;
    }

    return Math.min(...points);
}

function shouldShowAutomaticLowestPrice(snapshot) {
    return snapshot.promotional_price != null
        && snapshot.promotional_price > 0
        && snapshot.promotional_price < snapshot.price;
}

function normalizePlatformSettings(rows) {
    return rows.reduce((accumulator, row) => {
        if (!row?.key) {
            return accumulator;
        }

        accumulator[row.key] = row.value ?? '';
        return accumulator;
    }, {});
}

function normalizeSlug(value) {
    return `${value ?? ''}`
        .trim()
        .toLowerCase()
        .replace(/^\/+|\/+$/g, '');
}

function normalizePage(page) {
    const defaults = ADMIN_PAGE_SETTINGS_BY_KEY[page.page_key] || PAGE_SETTINGS_BY_KEY[page.page_key] || {};
    const isServiceLanding = defaults.page_kind === 'service-landing';
    return {
        ...defaults,
        ...page,
        page_name: isServiceLanding ? defaults.page_name : (page.page_name || defaults.page_name),
        slug: isServiceLanding ? defaults.slug : (page.slug ?? defaults.slug),
        linked_slug: isServiceLanding ? defaults.linked_slug : (page.linked_slug ?? defaults.linked_slug),
        page_kind: defaults.page_kind || page.page_kind,
        noindex: parseBooleanFlag(page.noindex),
    };
}

function getPageSettings() {
    const rows = db.prepare('SELECT * FROM page_settings ORDER BY page_name ASC').all();
    return ADMIN_PAGE_SETTINGS_DEFAULTS.map((page) => {
        const existing = rows.find((row) => row.page_key === page.page_key);
        return normalizePage(existing || page);
    });
}

function validatePageSettingsInput(pageKey, payload) {
    const defaults = ADMIN_PAGE_SETTINGS_BY_KEY[pageKey] || PAGE_SETTINGS_BY_KEY[pageKey];
    if (!defaults) {
        return 'Nieznany klucz strony.';
    }

    const normalizedSlug = pageKey === 'home' ? '' : normalizeSlug(payload.slug);
    if (pageKey !== 'home' && !normalizedSlug) {
        return 'Slug strony nie może być pusty.';
    }

    if (defaults.page_kind === 'service-landing' && normalizedSlug !== defaults.slug) {
        return 'Slug landing page usługi jest stały i nie może być zmieniany w panelu.';
    }

    if (PAGE_RESERVED_SLUGS.has(normalizedSlug)) {
        return 'Wybrany slug jest zarezerwowany przez system.';
    }

    const duplicate = db.prepare('SELECT page_key FROM page_settings WHERE slug = ? AND page_key != ?').get(normalizedSlug, pageKey);
    if (duplicate) {
        return 'Ten slug jest już używany przez inną stronę.';
    }

    return null;
}

function mapProduct(product) {
    return {
        ...product,
        benefits_json: normalizeBenefitCards(product.benefits_json),
        faq_json: normalizeFaqItems(product.faq_json),
        noindex: parseBooleanFlag(product.noindex),
        is_published: parseBooleanFlag(product.is_published),
        course_count: Number(product.course_count || 0),
        module_count: Number(product.module_count || 0),
        lesson_count: Number(product.lesson_count || 0),
    };
}

const ORDER_SELECT_SQL = `
    SELECT orders.*, products.title AS product_title,
           users.first_name AS customer_first_name,
           users.last_name AS customer_last_name
    FROM orders
    LEFT JOIN products ON products.id = orders.product_id
    LEFT JOIN users ON lower(users.email) = lower(orders.customer_email)
`;

function normalizePurchasedItems(value) {
    if (Array.isArray(value)) {
        return [...new Set(value.map((item) => `${item ?? ''}`.trim()).filter(Boolean))];
    }

    if (typeof value !== 'string') {
        return [];
    }

    return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

function serializePurchasedItems(value) {
    const items = normalizePurchasedItems(value);
    return items.length > 0 ? items.join(',') : null;
}

function normalizeDelimitedText(value, { lowercase = false } = {}) {
    const rawValues = Array.isArray(value)
        ? value
        : `${value ?? ''}`.split(/[\n,;]+/g);

    return [...new Set(rawValues
        .map((item) => `${item ?? ''}`.trim())
        .filter(Boolean)
        .map((item) => (lowercase ? item.toLowerCase() : item)))];
}

function serializeDelimitedText(value, options) {
    const normalized = normalizeDelimitedText(value, options);
    return normalized.length > 0 ? normalized.join(',') : null;
}

function mapUser(user) {
    const purchasedItems = normalizePurchasedItems(user.purchased_items);
    return {
        ...user,
        is_admin: parseBooleanFlag(user.is_admin),
        email_confirmed: parseBooleanFlag(user.email_confirmed),
        purchased_items: purchasedItems,
        purchased_item_count: purchasedItems.length,
    };
}

function requireUserRecord(userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
        const error = new Error('Nie znaleziono użytkownika.');
        error.statusCode = 404;
        throw error;
    }

    return user;
}

function requireProductRecord(productId) {
    const product = db.prepare("SELECT id, title FROM products WHERE id = ? AND type != 'service'").get(productId);
    if (!product) {
        const error = new Error('Produkt nie istnieje.');
        error.statusCode = 404;
        throw error;
    }

    return product;
}

function normalizeCoupon(row) {
    return {
        ...row,
        code: `${row.code || ''}`.trim().toUpperCase(),
        discount_type: `${row.discount_type || ''}`.trim().toLowerCase(),
        is_active: parseBooleanFlag(row.is_active),
        exclude_sale_items: parseBooleanFlag(row.exclude_sale_items),
        usage_limit: row.usage_limit == null ? null : Number(row.usage_limit),
        usage_limit_per_user: row.usage_limit_per_user == null ? null : Number(row.usage_limit_per_user),
        times_used: row.times_used == null ? 0 : Number(row.times_used),
        value: Number(row.value),
        minimum_spend: row.minimum_spend == null ? null : Number(row.minimum_spend),
        maximum_spend: row.maximum_spend == null ? null : Number(row.maximum_spend),
        included_product_ids: normalizeDelimitedText(row.included_product_ids),
        excluded_product_ids: normalizeDelimitedText(row.excluded_product_ids),
        allowed_emails: normalizeDelimitedText(row.allowed_emails, { lowercase: true }),
    };
}

function validateCouponPayload(payload, { partial = false } = {}) {
    const code = typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : '';
    const discountType = typeof payload.discount_type === 'string' ? payload.discount_type.trim().toLowerCase() : '';
    const numericValue = Number(payload.value);
    const minimumSpend = payload.minimum_spend == null || payload.minimum_spend === '' ? null : Number(payload.minimum_spend);
    const maximumSpend = payload.maximum_spend == null || payload.maximum_spend === '' ? null : Number(payload.maximum_spend);
    const usageLimit = payload.usage_limit == null || payload.usage_limit === '' ? null : Number(payload.usage_limit);
    const usageLimitPerUser = payload.usage_limit_per_user == null || payload.usage_limit_per_user === '' ? null : Number(payload.usage_limit_per_user);
    const includedProductIds = normalizeDelimitedText(payload.included_product_ids);
    const excludedProductIds = normalizeDelimitedText(payload.excluded_product_ids);
    const validFrom = payload.valid_from == null || payload.valid_from === '' ? null : new Date(payload.valid_from);
    const validUntil = payload.valid_until == null || payload.valid_until === '' ? null : new Date(payload.valid_until);

    if (!partial || payload.code != null) {
        if (!code) {
            return 'Kod kuponu jest wymagany.';
        }
    }

    if (!partial || payload.discount_type != null) {
        if (!['percent', 'amount'].includes(discountType)) {
            return 'Typ zniżki musi być równy percent albo amount.';
        }
    }

    if (!partial || payload.value != null) {
        if (!Number.isFinite(numericValue) || numericValue <= 0) {
            return 'Wartość kuponu musi być większa od zera.';
        }

        if (discountType === 'percent' && numericValue > 100) {
            return 'Zniżka procentowa nie może przekroczyć 100%.';
        }
    }

    if ((!partial || payload.minimum_spend != null) && minimumSpend != null && (!Number.isFinite(minimumSpend) || minimumSpend < 0)) {
        return 'Minimalna kwota koszyka musi być liczbą nieujemną.';
    }

    if ((!partial || payload.maximum_spend != null) && maximumSpend != null && (!Number.isFinite(maximumSpend) || maximumSpend < 0)) {
        return 'Maksymalna kwota koszyka musi być liczbą nieujemną.';
    }

    if (minimumSpend != null && maximumSpend != null && minimumSpend > maximumSpend) {
        return 'Minimalna kwota nie może być większa od maksymalnej.';
    }

    if ((!partial || payload.usage_limit != null) && usageLimit != null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
        return 'Limit użyć kuponu musi być liczbą całkowitą większą od zera.';
    }

    if ((!partial || payload.usage_limit_per_user != null) && usageLimitPerUser != null && (!Number.isInteger(usageLimitPerUser) || usageLimitPerUser < 1)) {
        return 'Limit użyć na użytkowniczkę musi być liczbą całkowitą większą od zera.';
    }

    if ((!partial || payload.valid_from != null) && validFrom && Number.isNaN(validFrom.getTime())) {
        return 'Data rozpoczęcia ważności kuponu jest nieprawidłowa.';
    }

    if ((!partial || payload.valid_until != null) && validUntil && Number.isNaN(validUntil.getTime())) {
        return 'Data zakończenia ważności kuponu jest nieprawidłowa.';
    }

    if (validFrom && validUntil && !Number.isNaN(validFrom.getTime()) && !Number.isNaN(validUntil.getTime()) && validFrom > validUntil) {
        return 'Data rozpoczęcia ważności nie może być późniejsza niż data zakończenia.';
    }

    for (const productId of includedProductIds) {
        requireProductRecord(productId);
    }

    for (const productId of excludedProductIds) {
        requireProductRecord(productId);
    }

    if (includedProductIds.some((productId) => excludedProductIds.includes(productId))) {
        return 'Ten sam produkt nie może być jednocześnie dozwolony i wykluczony.';
    }

    return null;
}

function validateUserPayload(payload, { partial = false } = {}) {
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!partial || payload.email != null) {
        if (!email) {
            return 'Adres e-mail jest wymagany.';
        }
    }

    if (password && password.length < 6) {
        return 'Hasło musi mieć co najmniej 6 znaków.';
    }

    const purchasedItems = normalizePurchasedItems(payload.purchased_items);
    for (const productId of purchasedItems) {
        requireProductRecord(productId);
    }

    return null;
}

function buildUserPayload(payload, existingUser = null) {
    const nextPurchasedItems = payload.purchased_items != null
        ? serializePurchasedItems(payload.purchased_items)
        : existingUser?.purchased_items ?? null;

    return {
        first_name: payload.first_name != null ? emptyToNull(payload.first_name) : existingUser?.first_name ?? null,
        last_name: payload.last_name != null ? emptyToNull(payload.last_name) : existingUser?.last_name ?? null,
        email: payload.email != null ? payload.email.trim().toLowerCase() : existingUser?.email,
        purchased_items: nextPurchasedItems,
        is_admin: payload.is_admin != null ? parseBooleanFlag(payload.is_admin) : (existingUser ? parseBooleanFlag(existingUser.is_admin) : false),
        email_confirmed: payload.email_confirmed != null ? parseBooleanFlag(payload.email_confirmed) : (existingUser ? parseBooleanFlag(existingUser.email_confirmed) : true),
    };
}

function buildBaseUrl(req) {
    const explicitBaseUrl = `${process.env.BASE_URL || ''}`.trim().replace(/\/+$/g, '');
    if (explicitBaseUrl) {
        return explicitBaseUrl;
    }

    return `${req.protocol}://${req.get('host')}`.replace(/\/+$/g, '');
}

function addProductAccessToUser(userId, productId) {
    const user = requireUserRecord(userId);
    requireProductRecord(productId);

    const purchasedItems = normalizePurchasedItems(user.purchased_items);
    if (purchasedItems.includes(productId)) {
        return mapUser(user);
    }

    purchasedItems.push(productId);
    db.prepare('UPDATE users SET purchased_items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(serializePurchasedItems(purchasedItems), userId);

    return mapUser(requireUserRecord(userId));
}

function getMediaAssetPath(fileName) {
    return path.join(mediaUploadDir, fileName);
}

const mediaMimeByExtension = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.opus': 'audio/opus',
    '.flac': 'audio/flac',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.m4v': 'video/x-m4v',
    '.ogv': 'video/ogg',
    '.pdf': 'application/pdf',
};


function normalizePathForUrl(filePath) {
    return filePath.split(path.sep).join('/');
}

function walkFilesRecursively(currentDirectory, accumulator) {
    const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(currentDirectory, entry.name);
        if (entry.isDirectory()) {
            walkFilesRecursively(fullPath, accumulator);
            continue;
        }

        if (entry.isFile()) {
            accumulator.push(fullPath);
        }
    }
}

function syncMediaAssetsFromPublicDirectory() {
    if (!fs.existsSync(publicDir)) {
        return;
    }

    const files = [];
    walkFilesRecursively(publicDir, files);

    const existingRows = db.prepare('SELECT id, public_url FROM media_assets').all();
    const existingByPublicUrl = new Map(existingRows.map((row) => [row.public_url, row.id]));

    const insertMedia = db.prepare(`
        INSERT INTO media_assets (
            id, file_name, original_name, mime_type, size_bytes, width, height, title, alt_text, public_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    for (const fullPath of files) {
        const extension = path.extname(fullPath).toLowerCase();
        const mimeType = mediaMimeByExtension[extension];
        if (!mimeType) {
            continue;
        }

        const relativeToPublic = path.relative(publicDir, fullPath);
        if (!relativeToPublic || relativeToPublic.startsWith('..')) {
            continue;
        }

        const publicUrl = `/${normalizePathForUrl(relativeToPublic)}`;
        if (existingByPublicUrl.has(publicUrl)) {
            continue;
        }

        const fileStats = fs.statSync(fullPath);
        insertMedia.run(
            uuidv4(),
            path.basename(fullPath),
            path.basename(fullPath),
            mimeType,
            fileStats.size,
            null,
            null,
            null,
            null,
            publicUrl,
        );
        existingByPublicUrl.set(publicUrl, true);
    }
}

function resolveMediaPathFromPublicUrl(publicUrl) {
    const normalizedPublicUrl = `${publicUrl || ''}`.trim();
    if (!normalizedPublicUrl.startsWith('/')) {
        return null;
    }

    const relativePath = normalizedPublicUrl.slice(1).replace(/\\/g, '/');
    const absolutePath = path.resolve(publicDir, relativePath);
    const normalizedPublicDir = path.resolve(publicDir);
    if (!absolutePath.startsWith(normalizedPublicDir)) {
        return null;
    }

    return absolutePath;
}

function resolveRelatedMediaIds(relatedIds, fallbackId) {
    const normalizedIds = Array.isArray(relatedIds)
        ? [...new Set(relatedIds.map((value) => `${value || ''}`.trim()).filter(Boolean))]
        : [];

    if (normalizedIds.length === 0) {
        return [fallbackId];
    }

    return db.prepare(`SELECT id FROM media_assets WHERE id IN (${normalizedIds.map(() => '?').join(', ')})`).all(...normalizedIds).map((row) => row.id);
}

function deleteMediaRows(mediaRows) {
    for (const mediaRow of mediaRows) {
        const mediaPath = resolveMediaPathFromPublicUrl(mediaRow.public_url);
        if (mediaPath && fs.existsSync(mediaPath)) {
            fs.rmSync(mediaPath, { force: true });
        }
    }
}

const upsertSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
`);

const upsertPageSetting = db.prepare(`
    INSERT INTO page_settings (
        page_key,
        page_name,
        slug,
        title,
        featured_image_url,
        meta_title,
        meta_desc,
        meta_image_url,
        canonical_url,
        noindex,
        updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(page_key) DO UPDATE SET
        page_name = excluded.page_name,
        slug = excluded.slug,
        title = excluded.title,
        featured_image_url = excluded.featured_image_url,
        meta_title = excluded.meta_title,
        meta_desc = excluded.meta_desc,
        meta_image_url = excluded.meta_image_url,
        canonical_url = excluded.canonical_url,
        noindex = excluded.noindex,
        updated_at = CURRENT_TIMESTAMP
`);

router.get('/products', (req, res) => {
    try {
        const products = db.prepare(`
            SELECT
                p.*,
                CASE
                    WHEN p.type = 'course' AND EXISTS (
                        SELECT 1
                        FROM courses c
                        JOIN modules m ON m.course_id = c.id
                        JOIN lessons l ON l.module_id = m.id
                        WHERE c.product_id = p.id
                    ) THEN 'ready'
                    WHEN p.type = 'course' AND EXISTS (
                        SELECT 1
                        FROM courses c
                        WHERE c.product_id = p.id
                    ) THEN 'needs-lessons'
                    WHEN p.type = 'course' THEN 'missing-course'
                    WHEN COALESCE(TRIM(p.content_url), '') <> '' THEN 'ready'
                    ELSE 'missing-content-url'
                END AS delivery_status,
                (
                    SELECT COUNT(*)
                    FROM courses c
                    WHERE c.product_id = p.id
                ) AS course_count,
                (
                    SELECT COUNT(*)
                    FROM modules m
                    JOIN courses c ON c.id = m.course_id
                    WHERE c.product_id = p.id
                ) AS module_count,
                (
                    SELECT COUNT(*)
                    FROM lessons l
                    JOIN modules m ON m.id = l.module_id
                    JOIN courses c ON c.id = m.course_id
                    WHERE c.product_id = p.id
                ) AS lesson_count
            FROM products p
            WHERE p.type != 'service'
            ORDER BY p.created_at DESC
        `).all().map(mapProduct);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/products', (req, res) => {
    try {
        const {
            title,
            slug,
            description,
            short_description,
            price,
            promotional_price,
            promotional_price_until,
            stripe_price_id,
            type,
            content_url,
            thumbnail_url,
            secondary_image_url,
            duration_label,
            long_description,
            benefits_json,
            faq_json,
            meta_title,
            meta_desc,
            meta_image_url,
            canonical_url,
            noindex,
            is_published,
        } = req.body;
        const id = uuidv4();
        const snapshot = normalizePriceSnapshot({ price, promotional_price, promotional_price_until });
        const lowestPrice30Days = shouldShowAutomaticLowestPrice(snapshot) ? snapshot.price : null;

        db.prepare(`
            INSERT INTO products (
                id, title, slug, description, short_description, price, promotional_price, promotional_price_until,
                lowest_price_30_days, stripe_price_id, type, content_url, thumbnail_url, secondary_image_url, duration_label,
                long_description, benefits_json, faq_json, meta_title, meta_desc, meta_image_url, canonical_url, noindex, is_published
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            title,
            slug,
            emptyToNull(description),
            emptyToNull(short_description),
            price,
            emptyToNull(promotional_price),
            emptyToNull(promotional_price_until),
            lowestPrice30Days,
            emptyToNull(stripe_price_id),
            type,
            emptyToNull(content_url),
            emptyToNull(thumbnail_url),
            emptyToNull(secondary_image_url),
            emptyToNull(duration_label),
            emptyToNull(long_description),
            serializeBenefitCards(benefits_json),
            serializeFaqItems(faq_json),
            emptyToNull(meta_title),
            emptyToNull(meta_desc),
            emptyToNull(meta_image_url),
            emptyToNull(canonical_url),
            parseBooleanFlag(noindex),
            parseBooleanFlag(is_published),
        );

        recordProductPriceSnapshot(id, snapshot);

        const build = enqueuePublicBuild(`product created: ${slug || id}`);

        res.status(201).json({ id, message: `Produkt utworzony. ${build.message}`, publicBuild: build });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/products/:id', (req, res) => {
    try {
        const existingProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Nie znaleziono produktu.' });
        }

        const {
            title,
            slug,
            description,
            short_description,
            price,
            promotional_price,
            promotional_price_until,
            stripe_price_id,
            type,
            content_url,
            thumbnail_url,
            secondary_image_url,
            duration_label,
            long_description,
            benefits_json,
            faq_json,
            meta_title,
            meta_desc,
            meta_image_url,
            canonical_url,
            noindex,
            is_published,
        } = req.body;

        const nextSnapshot = normalizePriceSnapshot({ price, promotional_price, promotional_price_until });
        const existingSnapshot = normalizePriceSnapshot(existingProduct);
        const priceChanged = existingSnapshot.price !== nextSnapshot.price
            || existingSnapshot.promotional_price !== nextSnapshot.promotional_price
            || existingSnapshot.promotional_price_until !== nextSnapshot.promotional_price_until;

        if (priceChanged) {
            recordProductPriceSnapshot(req.params.id, existingSnapshot);
        }

        const lowestPrice30Days = shouldShowAutomaticLowestPrice(nextSnapshot)
            ? calculateLowestPrice30Days(req.params.id, existingSnapshot)
            : null;

        db.prepare(`
            UPDATE products
            SET title = ?, slug = ?, description = ?, short_description = ?, price = ?, promotional_price = ?, promotional_price_until = ?, lowest_price_30_days = ?, stripe_price_id = ?, type = ?, content_url = ?, thumbnail_url = ?, secondary_image_url = ?, duration_label = ?, long_description = ?, benefits_json = ?, faq_json = ?, meta_title = ?, meta_desc = ?, meta_image_url = ?, canonical_url = ?, noindex = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            title,
            slug,
            emptyToNull(description),
            emptyToNull(short_description),
            price,
            emptyToNull(promotional_price),
            emptyToNull(promotional_price_until),
            lowestPrice30Days,
            emptyToNull(stripe_price_id),
            type,
            emptyToNull(content_url),
            emptyToNull(thumbnail_url),
            emptyToNull(secondary_image_url),
            emptyToNull(duration_label),
            emptyToNull(long_description),
            serializeBenefitCards(benefits_json),
            serializeFaqItems(faq_json),
            emptyToNull(meta_title),
            emptyToNull(meta_desc),
            emptyToNull(meta_image_url),
            emptyToNull(canonical_url),
            parseBooleanFlag(noindex),
            parseBooleanFlag(is_published),
            req.params.id,
        );

        if (priceChanged) {
            recordProductPriceSnapshot(req.params.id, nextSnapshot);
        }

        const build = enqueuePublicBuild(`product updated: ${slug || req.params.id}`);

        res.json({ message: `Produkt zaktualizowany. ${build.message}`, publicBuild: build });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/products/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        const build = enqueuePublicBuild(`product deleted: ${req.params.id}`);
        res.json({ message: `Produkt usunięty. ${build.message}`, publicBuild: build });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/orders', (req, res) => {
    try {
        const orders = db.prepare(`${ORDER_SELECT_SQL} ORDER BY orders.created_at DESC`).all();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/orders/:id', (req, res) => {
    try {
        const order = db.prepare(`${ORDER_SELECT_SQL} WHERE orders.id = ?`).get(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Nie znaleziono zamówienia.' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/orders/:id', (req, res) => {
    try {
        const existingOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
        if (!existingOrder) {
            return res.status(404).json({ error: 'Nie znaleziono zamówienia.' });
        }

        const customerEmail = String(req.body?.customer_email || '').trim().toLowerCase();
        const productId = String(req.body?.product_id || '').trim();
        const amountTotal = Number(req.body?.amount_total);
        const status = String(req.body?.status || '').trim();
        const allowedStatuses = new Set(['completed', 'pending_bank_transfer', 'manual', 'pending', 'failed', 'refunded', 'cancelled']);

        if (!customerEmail || !customerEmail.includes('@')) {
            return res.status(400).json({ error: 'Podaj prawidłowy adres e-mail klientki.' });
        }

        if (!productId) {
            return res.status(400).json({ error: 'Wybierz produkt przypisany do zamówienia.' });
        }

        if (!Number.isFinite(amountTotal) || amountTotal < 0) {
            return res.status(400).json({ error: 'Kwota zamówienia musi być liczbą nieujemną.' });
        }

        if (!allowedStatuses.has(status)) {
            return res.status(400).json({ error: 'Wybrano nieprawidłowy status zamówienia.' });
        }

        const productExists = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
        if (!productExists) {
            return res.status(400).json({ error: 'Wybrany produkt nie istnieje.' });
        }

        db.prepare(`
            UPDATE orders
            SET customer_email = ?, product_id = ?, amount_total = ?, status = ?
            WHERE id = ?
        `).run(customerEmail, productId, amountTotal, status, req.params.id);

        const updatedOrder = db.prepare(`${ORDER_SELECT_SQL} WHERE orders.id = ?`).get(req.params.id);

        res.json({ message: 'Zamówienie zostało zaktualizowane.', order: updatedOrder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/orders/:id', (req, res) => {
    try {
        const existingOrder = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
        if (!existingOrder) {
            return res.status(404).json({ error: 'Nie znaleziono zamówienia.' });
        }

        db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
        res.json({ message: 'Zamówienie zostało usunięte.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/users', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM users ORDER BY is_admin DESC, created_at DESC').all().map(mapUser);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/users', async (req, res) => {
    try {
        const validationError = validateUserPayload(req.body || {});
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const payload = buildUserPayload(req.body || {});
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(payload.email);
        if (existingUser) {
            return res.status(409).json({ error: 'Użytkownik z tym adresem e-mail już istnieje.' });
        }

        const passwordHash = req.body.password ? await bcrypt.hash(req.body.password, 12) : null;
        const userId = uuidv4();

        db.prepare(`
            INSERT INTO users (
                id, first_name, last_name, email, password_hash, purchased_items, is_admin, email_confirmed, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(
            userId,
            payload.first_name,
            payload.last_name,
            payload.email,
            passwordHash,
            payload.purchased_items,
            payload.is_admin,
            payload.email_confirmed,
        );

        res.status(201).json({ message: 'Użytkownik został utworzony.', user: mapUser(requireUserRecord(userId)) });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const existingUser = requireUserRecord(req.params.id);
        const validationError = validateUserPayload(req.body || {}, { partial: true });
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const payload = buildUserPayload(req.body || {}, existingUser);
        const duplicate = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(payload.email, req.params.id);
        if (duplicate) {
            return res.status(409).json({ error: 'Inny użytkownik używa już tego adresu e-mail.' });
        }

        if (existingUser.is_admin && !payload.is_admin) {
            const adminCount = db.prepare('SELECT COUNT(*) AS count FROM users WHERE is_admin = 1').get().count;
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Nie można odebrać uprawnień ostatniemu administratorowi.' });
            }
        }

        const passwordHash = req.body.password ? await bcrypt.hash(req.body.password, 12) : existingUser.password_hash;

        db.prepare(`
            UPDATE users
            SET first_name = ?, last_name = ?, email = ?, password_hash = ?, purchased_items = ?, is_admin = ?, email_confirmed = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            payload.first_name,
            payload.last_name,
            payload.email,
            passwordHash,
            payload.purchased_items,
            payload.is_admin,
            payload.email_confirmed,
            req.params.id,
        );

        res.json({ message: 'Użytkownik został zaktualizowany.', user: mapUser(requireUserRecord(req.params.id)) });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get('/users/:id', (req, res) => {
    try {
        const user = mapUser(requireUserRecord(req.params.id));
        const productRows = db.prepare("SELECT id, title, type, slug FROM products WHERE type != 'service' ORDER BY title COLLATE NOCASE ASC").all();
        const orders = db.prepare(`${ORDER_SELECT_SQL} WHERE lower(orders.customer_email) = lower(?) ORDER BY orders.created_at DESC`).all(user.email);

        const latestOrderByProductId = new Map();
        orders.forEach((order) => {
            const productId = `${order.product_id || ''}`.trim();
            if (productId && !latestOrderByProductId.has(productId)) {
                latestOrderByProductId.set(productId, order);
            }
        });

        const purchasedProducts = user.purchased_items
            .map((productId) => {
                const product = productRows.find((entry) => entry.id === productId);
                if (!product) {
                    return null;
                }

                const matchingOrder = latestOrderByProductId.get(productId);

                return {
                    ...product,
                    purchased_at: matchingOrder?.created_at || null,
                    order_id: matchingOrder?.id || null,
                    order_status: matchingOrder?.status || null,
                    amount_total: matchingOrder?.amount_total ?? null,
                    access_source: matchingOrder ? 'order' : 'manual',
                };
            })
            .filter(Boolean);

        res.json({
            user,
            purchased_products: purchasedProducts,
            orders,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.post('/users/:id/reset-password-link', (req, res) => {
    try {
        const user = requireUserRecord(req.params.id);
        if (!user.email) {
            return res.status(400).json({ error: 'Użytkownik nie ma przypisanego adresu e-mail.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        db.prepare('UPDATE users SET reset_token = ?, reset_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(resetToken, resetExpires, req.params.id);

        res.json({
            message: 'Link resetu hasła został wygenerowany.',
            reset_url: `${buildBaseUrl(req)}/resetowanie-hasla?token=${resetToken}`,
            expires_at: resetExpires,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.delete('/users/:id', (req, res) => {
    try {
        const existingUser = requireUserRecord(req.params.id);
        if (existingUser.is_admin) {
            const adminCount = db.prepare('SELECT COUNT(*) AS count FROM users WHERE is_admin = 1').get().count;
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Nie można usunąć ostatniego administratora.' });
            }
        }

        if (req.user?.id === req.params.id) {
            return res.status(400).json({ error: 'Nie możesz usunąć aktualnie zalogowanego administratora.' });
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
        res.json({ message: 'Użytkownik został usunięty.' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.post('/users/:id/grant-access', (req, res) => {
    try {
        const { product_id: productId } = req.body || {};
        if (!productId) {
            return res.status(400).json({ error: 'Brak produktu do nadania.' });
        }

        const user = addProductAccessToUser(req.params.id, productId);
        res.json({ message: 'Dostęp został nadany.', user });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get('/settings', (req, res) => {
    try {
        const rows = db.prepare('SELECT key, value FROM settings ORDER BY key ASC').all();
        res.json(normalizePlatformSettings(rows));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings', (req, res) => {
    try {
        for (const [key, value] of Object.entries(req.body || {})) {
            upsertSetting.run(key, value == null ? '' : `${value}`);
        }

        res.json({ message: 'Ustawienia zapisane' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/pages', (req, res) => {
    try {
        res.json(getPageSettings());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/pages/:pageKey', (req, res) => {
    try {
        const pageKey = req.params.pageKey;
        const defaults = ADMIN_PAGE_SETTINGS_BY_KEY[pageKey] || PAGE_SETTINGS_BY_KEY[pageKey];
        if (!defaults) {
            return res.status(404).json({ error: 'Nie znaleziono takiej strony.' });
        }

        const validationError = validatePageSettingsInput(pageKey, req.body || {});
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        upsertPageSetting.run(
            pageKey,
            defaults.page_name,
            pageKey === 'home' ? '' : defaults.page_kind === 'service-landing' ? defaults.slug : normalizeSlug(req.body.slug),
            emptyToNull(req.body.title) || defaults.title,
            emptyToNull(req.body.featured_image_url),
            emptyToNull(req.body.meta_title),
            emptyToNull(req.body.meta_desc),
            emptyToNull(req.body.meta_image_url),
            emptyToNull(req.body.canonical_url),
            parseBooleanFlag(req.body.noindex),
        );

        const build = enqueuePublicBuild(`page updated: ${pageKey}`);

        res.json({ message: `Ustawienia strony zapisane. ${build.message}`, publicBuild: build });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/coupons', (req, res) => {
    try {
        const coupons = db.prepare('SELECT * FROM coupons ORDER BY is_active DESC, created_at DESC').all().map(normalizeCoupon);
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/coupons', (req, res) => {
    try {
        const validationError = validateCouponPayload(req.body || {});
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const code = req.body.code.trim().toUpperCase();
        const duplicate = db.prepare('SELECT id FROM coupons WHERE code = ?').get(code);
        if (duplicate) {
            return res.status(409).json({ error: 'Kupon z takim kodem już istnieje.' });
        }

        const couponId = uuidv4();
        db.prepare(`
            INSERT INTO coupons (
                id, code, discount_type, value, description, is_active, valid_from, valid_until,
                minimum_spend, maximum_spend, usage_limit, usage_limit_per_user,
                included_product_ids, excluded_product_ids, allowed_emails, exclude_sale_items,
                times_used, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(
            couponId,
            code,
            req.body.discount_type.trim().toLowerCase(),
            Number(req.body.value),
            emptyToNull(req.body.description),
            req.body.is_active == null ? 1 : parseBooleanFlag(req.body.is_active),
            emptyToNull(req.body.valid_from),
            emptyToNull(req.body.valid_until),
            parseNullableFloat(req.body.minimum_spend),
            parseNullableFloat(req.body.maximum_spend),
            parseNullableInteger(req.body.usage_limit),
            parseNullableInteger(req.body.usage_limit_per_user),
            serializeDelimitedText(req.body.included_product_ids),
            serializeDelimitedText(req.body.excluded_product_ids),
            serializeDelimitedText(req.body.allowed_emails, { lowercase: true }),
            parseBooleanFlag(req.body.exclude_sale_items),
        );

        res.status(201).json({ message: 'Kupon został utworzony.', coupon: normalizeCoupon(db.prepare('SELECT * FROM coupons WHERE id = ?').get(couponId)) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/coupons/:id', (req, res) => {
    try {
        const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
        if (!coupon) {
            return res.status(404).json({ error: 'Nie znaleziono kuponu.' });
        }

        const validationError = validateCouponPayload(req.body || {}, { partial: true });
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const nextCode = req.body.code != null ? req.body.code.trim().toUpperCase() : coupon.code;
        const duplicate = db.prepare('SELECT id FROM coupons WHERE code = ? AND id != ?').get(nextCode, req.params.id);
        if (duplicate) {
            return res.status(409).json({ error: 'Inny kupon używa już tego kodu.' });
        }

        db.prepare(`
            UPDATE coupons
            SET code = ?, discount_type = ?, value = ?, description = ?, is_active = ?, valid_from = ?, valid_until = ?, minimum_spend = ?, maximum_spend = ?, usage_limit = ?, usage_limit_per_user = ?, included_product_ids = ?, excluded_product_ids = ?, allowed_emails = ?, exclude_sale_items = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            nextCode,
            req.body.discount_type != null ? req.body.discount_type.trim().toLowerCase() : coupon.discount_type,
            req.body.value != null ? Number(req.body.value) : coupon.value,
            req.body.description != null ? emptyToNull(req.body.description) : coupon.description,
            req.body.is_active != null ? parseBooleanFlag(req.body.is_active) : coupon.is_active,
            req.body.valid_from != null ? emptyToNull(req.body.valid_from) : coupon.valid_from,
            req.body.valid_until != null ? emptyToNull(req.body.valid_until) : coupon.valid_until,
            req.body.minimum_spend != null ? parseNullableFloat(req.body.minimum_spend) : coupon.minimum_spend,
            req.body.maximum_spend != null ? parseNullableFloat(req.body.maximum_spend) : coupon.maximum_spend,
            req.body.usage_limit != null ? parseNullableInteger(req.body.usage_limit) : coupon.usage_limit,
            req.body.usage_limit_per_user != null ? parseNullableInteger(req.body.usage_limit_per_user) : coupon.usage_limit_per_user,
            req.body.included_product_ids != null ? serializeDelimitedText(req.body.included_product_ids) : coupon.included_product_ids,
            req.body.excluded_product_ids != null ? serializeDelimitedText(req.body.excluded_product_ids) : coupon.excluded_product_ids,
            req.body.allowed_emails != null ? serializeDelimitedText(req.body.allowed_emails, { lowercase: true }) : coupon.allowed_emails,
            req.body.exclude_sale_items != null ? parseBooleanFlag(req.body.exclude_sale_items) : coupon.exclude_sale_items,
            req.params.id,
        );

        res.json({ message: 'Kupon został zaktualizowany.', coupon: normalizeCoupon(db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id)) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/coupons/:id', (req, res) => {
    try {
        const deleted = db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
        if (!deleted.changes) {
            return res.status(404).json({ error: 'Nie znaleziono kuponu.' });
        }

        res.json({ message: 'Kupon został usunięty.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/media', (req, res) => {
    try {
        syncMediaAssetsFromPublicDirectory();
        const media = db.prepare('SELECT * FROM media_assets ORDER BY created_at DESC').all();
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/media/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nie przesłano pliku.' });
        }

        const mediaId = uuidv4();
        const publicUrl = `/uploads/media/${req.file.filename}`;

        db.prepare(`
            INSERT INTO media_assets (
                id, file_name, original_name, mime_type, size_bytes, width, height, title, alt_text, public_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(
            mediaId,
            req.file.filename,
            req.file.originalname,
            req.file.mimetype,
            req.file.size,
            null,
            null,
            emptyToNull(req.body.title),
            emptyToNull(req.body.alt_text),
            publicUrl,
        );

        res.status(201).json({
            message: 'Plik został dodany do biblioteki mediów.',
            media: db.prepare('SELECT * FROM media_assets WHERE id = ?').get(mediaId),
        });
    } catch (error) {
        if (req.file?.filename) {
            fs.rmSync(getMediaAssetPath(req.file.filename), { force: true });
        }
        res.status(500).json({ error: error.message });
    }
});

router.delete('/media/:id', (req, res) => {
    try {
        const media = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(req.params.id);
        if (!media) {
            return res.status(404).json({ error: 'Nie znaleziono medium.' });
        }

        const targetIds = resolveRelatedMediaIds(req.body?.related_ids, req.params.id);
        if (targetIds.length === 0) {
            return res.status(400).json({ error: 'Brak mediów do usunięcia.' });
        }

        const mediaRows = db.prepare(`SELECT * FROM media_assets WHERE id IN (${targetIds.map(() => '?').join(', ')})`).all(...targetIds);
        deleteMediaRows(mediaRows);
        db.prepare(`DELETE FROM media_assets WHERE id IN (${targetIds.map(() => '?').join(', ')})`).run(...targetIds);

        res.json({ message: targetIds.length > 1 ? 'Medium i wszystkie jego wersje zostały usunięte.' : 'Medium zostało usunięte.', deleted_ids: targetIds });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/media/:id', (req, res) => {
    try {
        const media = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(req.params.id);
        if (!media) {
            return res.status(404).json({ error: 'Nie znaleziono medium.' });
        }

        const targetIds = resolveRelatedMediaIds(req.body?.related_ids, req.params.id);

        if (targetIds.length === 0) {
            return res.status(400).json({ error: 'Brak mediów do aktualizacji.' });
        }

        const title = emptyToNull(req.body?.title);
        const altText = emptyToNull(req.body?.alt_text);
        const placeholders = targetIds.map(() => '?').join(', ');

        db.prepare(`
            UPDATE media_assets
            SET title = ?, alt_text = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id IN (${placeholders})
        `).run(title, altText, ...targetIds);

        res.json({
            message: 'Szczegóły medium zostały zaktualizowane.',
            media: db.prepare('SELECT * FROM media_assets WHERE id = ?').get(req.params.id),
            updated_ids: targetIds,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/grant-access', (req, res) => {
    try {
        const { email, product_id: productId } = req.body || {};
        if (!email || !productId) {
            return res.status(400).json({ error: 'Brak emaila lub ID produktu.' });
        }

        requireProductRecord(productId);
        const normalizedEmail = email.trim().toLowerCase();
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

        if (!user) {
            const userId = uuidv4();
            db.prepare(`
                INSERT INTO users (id, email, password_hash, purchased_items, email_confirmed, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `).run(userId, normalizedEmail, null, productId);
            user = requireUserRecord(userId);
            return res.json({
                message: 'Utworzono nowego użytkownika i nadano mu dostęp. Przypomnij o ustawieniu hasła.',
                user: mapUser(user),
            });
        }

        const updatedUser = addProductAccessToUser(user.id, productId);
        res.json({ message: 'Dostęp nadany istniejącemu użytkownikowi.', user: updatedUser });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: `Błąd uploadu: ${error.message}` });
    }

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    next();
});

export default router;