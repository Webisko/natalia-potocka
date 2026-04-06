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
import { buildRobotsTxt, buildSitemapXml } from './src/lib/siteIndex.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const publicSiteDir = path.join(__dirname, 'dist');
const publicAssetsDir = path.join(__dirname, 'public');
const publicUploadsDir = path.join(__dirname, 'public', 'uploads');

function resolveStaticHtmlPath(requestPath) {
    const normalizedPath = `${requestPath || '/'}`.split('?')[0].split('#')[0];
    const decodedPath = decodeURIComponent(normalizedPath);

    if (path.extname(decodedPath)) {
        return null;
    }

    const trimmedPath = decodedPath.replace(/^\/+|\/+$/g, '');
    const candidates = trimmedPath
        ? [path.join(publicSiteDir, trimmedPath, 'index.html'), path.join(publicSiteDir, `${trimmedPath}.html`)]
        : [path.join(publicSiteDir, 'index.html')];

    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(morgan('dev'));

// Stripe Webhook MUST go before express.json()
import webhookRouter from './api/webhook.js';
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }), webhookRouter);
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', apiRouter);

if (fs.existsSync(publicUploadsDir)) {
    app.use('/uploads', express.static(publicUploadsDir));
}

app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(buildSitemapXml());
});

app.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.send(buildRobotsTxt());
});

app.get('/favicon.svg', (req, res, next) => {
    const faviconPath = path.join(publicAssetsDir, 'favicon.svg');
    if (!fs.existsSync(faviconPath)) {
        return next();
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.sendFile(faviconPath);
});

app.get(['/product/:slug', '/uslugi/:slug', '/produkty/:slug'], (req, res) => {
    res.redirect(301, `/oferta/${req.params.slug}`);
});

if (fs.existsSync(publicSiteDir)) {
    app.use(express.static(publicSiteDir));
}

app.get('/', (req, res, next) => {
    const indexPath = path.join(publicSiteDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
        return next();
    }
    res.sendFile(indexPath);
});

app.get(/.*/, (req, res, next) => {
    if (!fs.existsSync(publicSiteDir)) {
        return next();
    }

    const htmlPath = resolveStaticHtmlPath(req.path);
    if (!htmlPath) {
        return next();
    }

    res.sendFile(htmlPath);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
