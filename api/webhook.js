import express from 'express';
import Stripe from 'stripe';
import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const logWebhook = (msg) => {
    console.log(`[Stripe Webhook] ${msg}`);
};

/**
 * Handle Stripe webhook events
 * We export a single async function or router that doesn't parse body inside, since app.js handles raw body
 */
// Actually, app.js now maps router directly from the required path.
// But we want to use the router properly. 
// app.js has: app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }), webhookRouter);
// where webhookRouter is the whole router.
// So this router receives the base / instead of /stripe, if app.js did express.raw(...) it might be better handled.

router.post('/', async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            endpointSecret
        );
    } catch (err) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        logWebhook(`Received successful checkout for session: ${session.id}`);

        try {
            await handleSuccessfulCheckout(session);
        } catch (error) {
            console.error('Error handling checkout session:', error);
            return res.status(500).json({ error: 'Database transaction failed' });
        }
    }

    res.send({ received: true });
});

async function handleSuccessfulCheckout(session) {
    const customerEmail = session.customer_details?.email;
    const productId = session.client_reference_id || session.metadata?.productId;

    if (!customerEmail || !productId) {
        throw new Error('Missing customer email or product ID in session');
    }

    logWebhook(`Processing payment for ${customerEmail}, Product ID: ${productId}`);

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) throw new Error(`Product with ID ${productId} not found in database`);

    let user = db.prepare('SELECT id, purchased_items FROM users WHERE email = ?').get(customerEmail);

    if (user) {
        logWebhook(`User exists (${user.id}). Updating purchases...`);
        let purchases = user.purchased_items ? user.purchased_items.split(',') : [];
        if (!purchases.includes(productId)) {
            purchases.push(productId);
            db.prepare('UPDATE users SET purchased_items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
              .run(purchases.join(','), user.id);
            logWebhook(`Added product ${productId} to user ${user.id}`);
        }
    } else {
        logWebhook(`User does not exist. Creating new user for ${customerEmail}...`);
        const newUserId = uuidv4();
        const initialPurchases = [productId].join(',');
        
        db.prepare(`
            INSERT INTO users (id, email, password_hash, purchased_items)
            VALUES (?, ?, ?, ?)
        `).run(newUserId, customerEmail, null, initialPurchases);

        logWebhook(`Created new user ${newUserId} with product ${productId}`);
    }
}

export default router;
