import express from 'express';
import db from './db.js';

const router = express.Router();

function normalizeBenefitCards(value) {
    let parsed = value;

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return [];
        }

        try {
            parsed = JSON.parse(trimmed);
        } catch (error) {
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
        } catch (error) {
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

function mapProduct(product) {
    return {
        ...product,
        benefits_json: normalizeBenefitCards(product.benefits_json),
        faq_json: normalizeFaqItems(product.faq_json),
        noindex: product.noindex === 1 || product.noindex === true,
    };
}

router.get('/', (req, res) => {
    try {
        const products = db.prepare("SELECT id, title, slug, price, promotional_price, promotional_price_until, lowest_price_30_days, type, thumbnail_url, description, short_description, duration_label, faq_json, meta_title, meta_desc, meta_image_url, canonical_url, noindex FROM products WHERE type != 'service' AND COALESCE(is_published, 1) = 1").all().map(mapProduct);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:slug', (req, res) => {
    try {
        const product = db.prepare("SELECT id, title, slug, description, short_description, price, promotional_price, promotional_price_until, lowest_price_30_days, type, content_url, thumbnail_url, duration_label, long_description, benefits_json, faq_json, meta_title, meta_desc, meta_image_url, canonical_url, noindex, stripe_price_id FROM products WHERE slug = ? AND type != 'service' AND COALESCE(is_published, 1) = 1").get(req.params.slug);
        
        if (!product) return res.status(404).json({ error: 'Product not found' });
        
        let publicProduct = mapProduct(product);
        delete publicProduct.content_url;
        
        res.json(publicProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
