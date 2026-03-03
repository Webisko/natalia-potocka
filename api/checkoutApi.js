import express from 'express';
import Stripe from 'stripe';
import db from './db.js';
import { requireAuth } from './authMiddleware.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session (public/semi-public)
// E-mail can be passed from the body (if not logged in) or taken from req.user (if logged in)
router.post('/create-session', async (req, res) => {
    try {
        const { productId, email } = req.body;
        
        if (!productId) return res.status(400).json({ error: 'Brak ID produktu.' });
        
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
        if (!product) return res.status(404).json({ error: 'Produkt nie istnieje.' });
        if (!product.stripe_price_id) return res.status(400).json({ error: 'Produkt nie jest na sprzedaż (Brak Price ID).' });

        // Optional: If user is logged in, grab email from cookie/auth token and pass as customer_email if not provided in body
        let customerEmail = email;
        const authToken = req.cookies?.auth_token;
        if (!customerEmail && authToken) {
             const jwt = await import('jsonwebtoken');
             try {
                const decoded = jwt.default.verify(authToken, process.env.JWT_SECRET);
                customerEmail = decoded.email;
             } catch(e) {}
        }
        
        if (!customerEmail) {
            return res.status(400).json({ error: 'Brak adresu e-mail do zamówienia.' });
        }

        const sessionConfig = {
            payment_method_types: ['card', 'blik', 'p24'], // Add polish methods if desired
            line_items: [
                {
                    price: product.stripe_price_id,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/client?success=true`,
            cancel_url: `${req.protocol}://${req.get('host')}/product/${product.slug}?canceled=true`,
            customer_email: customerEmail,
            client_reference_id: product.id,
            metadata: {
                productId: product.id
            }
        };

        const session = await stripe.checkout.sessions.create(sessionConfig);
        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
