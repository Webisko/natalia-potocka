import express from 'express';
import crypto from 'crypto';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import db, { generateOrderNumber } from './db.js';
import { sendOrderFailureEmails, sendOrderSuccessEmails } from './phpMailerBridge.js';

const router = express.Router();

const readSetting = (key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return `${row?.value || ''}`.trim();
};

const normalizeEmail = (value) => `${value || ''}`.trim().toLowerCase();

const getStripeSecretKey = () => readSetting('stripe_secret') || `${process.env.STRIPE_SECRET_KEY || ''}`.trim();
const getStripeWebhookSecret = () => readSetting('stripe_webhook_secret') || `${process.env.STRIPE_WEBHOOK_SECRET || ''}`.trim();

const getStripeClient = () => {
    const key = getStripeSecretKey();
    return key ? new Stripe(key) : null;
};

const logWebhook = (message) => {
    console.log(`[Stripe Webhook] ${message}`);
};

const getCustomerEmail = (session) => normalizeEmail(session?.customer_details?.email || session?.customer_email || '');

router.post('/', async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = getStripeWebhookSecret();
    const stripe = getStripeClient();

    let event;

    if (!endpointSecret) {
        return res.status(500).send('Webhook Error: missing Stripe webhook secret');
    }

    if (!stripe) {
        return res.status(500).send('Webhook Error: missing Stripe secret key');
    }

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (error) {
        console.error(`Webhook Signature Verification Failed: ${error.message}`);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
        const session = event.data.object;
        const paymentStatus = session.payment_status;

        if (event.type === 'checkout.session.completed' && paymentStatus !== 'paid') {
            logWebhook(`Checkout session ${session.id} completed but payment_status is '${paymentStatus}'. Waiting for async success event.`);
            return res.send({ received: true });
        }

        logWebhook(`Received ${event.type} for session: ${session.id}`);

        try {
            await handleSuccessfulCheckout(session, `${req.protocol}://${req.get('host')}`);
        } catch (error) {
            console.error('Error handling checkout session:', error);
            return res.status(500).json({ error: 'Database transaction failed' });
        }
    } else if (event.type === 'checkout.session.async_payment_failed') {
        const session = event.data.object;
        await handleFailedCheckout(session, `${req.protocol}://${req.get('host')}`);
        logWebhook(`Async payment failed for session ${session.id}.`);
    }

    return res.send({ received: true });
});

async function handleSuccessfulCheckout(session, baseUrl) {
    const customerEmail = getCustomerEmail(session);
    const productId = session.client_reference_id || session.metadata?.productId;
    const couponCode = `${session.metadata?.couponCode || ''}`.trim().toUpperCase();
    const consent = db.prepare('SELECT user_id FROM purchase_consents WHERE stripe_session_id = ?').get(session.id);

    if (!customerEmail || !productId) {
        throw new Error('Missing customer email or product ID in session');
    }

    logWebhook(`Processing payment for ${customerEmail}, Product ID: ${productId}`);

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) {
        throw new Error(`Product with ID ${productId} not found in database`);
    }

    const normalizedEmail = customerEmail.trim().toLowerCase();
    let user = db.prepare('SELECT id, purchased_items, email_confirmed, confirm_token, reset_token FROM users WHERE email = ?').get(normalizedEmail);

    if (user) {
        logWebhook(`User exists (${user.id}). Updating purchases...`);
        const purchases = user.purchased_items ? user.purchased_items.split(',').filter(Boolean) : [];
        if (!purchases.includes(productId)) {
            purchases.push(productId);
            db.prepare('UPDATE users SET purchased_items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(purchases.join(','), user.id);
            logWebhook(`Added product ${productId} to user ${user.id}`);
        }
    } else {
        logWebhook(`User does not exist. Creating new user for ${normalizedEmail}...`);
        const newUserId = uuidv4();
        const confirmToken = crypto.randomBytes(32).toString('hex');

        db.prepare(`
            INSERT INTO users (id, first_name, last_name, email, password_hash, purchased_items, email_confirmed, confirm_token)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        `).run(newUserId, null, null, normalizedEmail, null, productId, confirmToken);

        if (consent && !consent.user_id) {
            db.prepare('UPDATE purchase_consents SET user_id = ? WHERE stripe_session_id = ?').run(newUserId, session.id);
        }

        user = {
            id: newUserId,
            purchased_items: productId,
            email_confirmed: 0,
            confirm_token: confirmToken,
            reset_token: null,
        };

        logWebhook(`Created new user ${newUserId} with product ${productId}`);
    }

    const orderId = `stripe_${session.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const existingOrder = db.prepare('SELECT id FROM orders WHERE id = ?').get(orderId);

    if (existingOrder) {
        logWebhook(`Order ${orderId} already recorded. Skipping duplicate fulfillment.`);
        return;
    }

    const amountTotal = (session.amount_total ?? 0) / 100;
    const orderCreatedAt = session.created ? new Date(session.created * 1000).toISOString() : new Date().toISOString();
    const orderNumber = generateOrderNumber(orderCreatedAt);
    db.prepare(`
        INSERT INTO orders (id, order_number, customer_email, product_id, amount_total, applied_coupon_code, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, orderNumber, normalizedEmail, productId, amountTotal, couponCode || null, 'completed', orderCreatedAt);

    if (couponCode) {
        db.prepare('UPDATE coupons SET times_used = times_used + 1, updated_at = CURRENT_TIMESTAMP WHERE code = ?').run(couponCode);
    }

    const productInfo = db.prepare('SELECT title, slug FROM products WHERE id = ?').get(productId) || { title: productId, slug: null };
    sendOrderSuccessEmails({
        orderId,
        productTitle: `${productInfo.title || productId}`,
        amountTotal,
        customerEmail: normalizedEmail,
        couponCode: couponCode || null,
        libraryUrl: `${baseUrl}/panel`,
        confirmUrl: !Number(user?.email_confirmed) && user?.confirm_token ? `${baseUrl}/api/auth/confirm/${user.confirm_token}` : null,
        resetUrl: user?.reset_token ? `${baseUrl}/resetowanie-hasla?token=${user.reset_token}` : null,
        adminUrl: `${baseUrl}/administrator/`,
    }, {
        baseUrl,
    });

    logWebhook(`Recorded order ${orderId} for ${amountTotal} PLN`);
}

async function handleFailedCheckout(session, baseUrl) {
    const customerEmail = getCustomerEmail(session);
    const productId = session.client_reference_id || session.metadata?.productId;
    const amountTotal = (session.amount_total ?? 0) / 100;
    let productTitle = 'zamówienie';
    let retryUrl = null;

    if (productId) {
        const product = db.prepare('SELECT title, slug FROM products WHERE id = ?').get(productId);
        if (product) {
            productTitle = `${product.title || productId}`;
            if (product.slug) {
                retryUrl = `${baseUrl}/oferta/${product.slug}`;
            }
        }
    }

    if (!customerEmail) {
        return;
    }

    sendOrderFailureEmails({
        sessionId: `${session.id || ''}`,
        productTitle,
        amountTotal,
        customerEmail,
        retryUrl,
        adminUrl: `${baseUrl}/administrator/`,
    }, {
        baseUrl,
    });
}

export default router;
