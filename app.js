import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './api/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(morgan('dev'));

// Stripe Webhook MUST go before express.json()
import webhookRouter from './api/webhook.js';
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }), webhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', apiRouter);

import db from './api/db.js';

app.get('/sitemap.xml', (req, res) => {
    try {
        const products = db.prepare('SELECT slug, updated_at FROM products').all();
        const host = req.protocol + '://' + req.get('host');
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        xml += `\n  <url>\n    <loc>${host}/</loc>\n  </url>`;
        for (const p of products) {
            // Updated at might be just a sqlite string, fall back to current if unparseable
            let lastmod = new Date().toISOString();
            try { lastmod = new Date(p.updated_at).toISOString() } catch(e) {}
            xml += `\n  <url>\n    <loc>${host}/product/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
        }
        xml += `\n</urlset>`;
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        res.status(500).send('Error generating sitemap');
    }
});

app.get('/product/:slug', (req, res, next) => {
    try {
        const product = db.prepare('SELECT title, description, meta_title, meta_desc, thumbnail_url FROM products WHERE slug = ?').get(req.params.slug);
        if (!product) return next();

        const indexPath = path.join(__dirname, 'public', 'index.html');
        if (!fs.existsSync(indexPath)) return next();

        let html = fs.readFileSync(indexPath, 'utf-8');
        
        const pageTitle = product.meta_title || `${product.title} - Natalia Potocka`;
        const pageDesc = product.meta_desc || product.description?.substring(0, 160) || '';
        
        html = html.replace(/<title>.*<\/title>/, `<title>${pageTitle}</title>`);
        html = html.replace('</head>', `
    <meta name="description" content="${pageDesc}" />
    <meta property="og:title" content="${pageTitle}" />
    <meta property="og:description" content="${pageDesc}" />
    ${product.thumbnail_url ? `<meta property="og:image" content="${product.thumbnail_url}" />` : ''}
    <meta property="og:type" content="product" />
</head>`);
        
        res.send(html);
    } catch (err) {
        next(err);
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
