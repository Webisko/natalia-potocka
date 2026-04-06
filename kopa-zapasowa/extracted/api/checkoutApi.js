import express from 'express';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import db, { generateOrderNumber } from './db.js';
import { sendBankTransferEmails, sendOrderSuccessEmails, sendPhpMailer } from './phpMailerBridge.js';

const router = express.Router();

const readSetting = (key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return `${row?.value || ''}`.trim();
};

const getStripeSecretKey = () => readSetting('stripe_secret') || `${process.env.STRIPE_SECRET_KEY || ''}`.trim();

const getStripeClient = () => {
    const key = getStripeSecretKey();
    return key ? new Stripe(key) : null;
};

const getJwtSecret = () => readSetting('jwt_secret') || `${process.env.JWT_SECRET || 'fallback_secret_for_development_do_not_use_in_prod'}`.trim();

const isMockStripeMode = () => {
    const key = getStripeSecretKey();
    return key.includes('mock_for_dev_only');
};

const hasConfiguredStripeKey = () => {
    const key = getStripeSecretKey();
    return Boolean(key) && !key.includes('mock_for_dev_only');
};

const bankTransferConfig = () => ({
    accountName: readSetting('bank_account_name') || process.env.BANK_ACCOUNT_NAME || '',
    accountNumber: readSetting('bank_account_number') || process.env.BANK_ACCOUNT_NUMBER || '',
    bankName: readSetting('bank_name') || process.env.BANK_NAME || '',
    instructions: readSetting('bank_transfer_instructions') || process.env.BANK_TRANSFER_INSTRUCTIONS || '',
});

const normalizeEmail = (value) => `${value || ''}`.trim().toLowerCase();

const validateStrongPassword = (password) => {
    if (typeof password !== 'string' || password.length < 12) {
        return 'Hasło musi mieć co najmniej 12 znaków.';
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z\d]/.test(password)) {
        return 'Hasło musi zawierać małą literę, wielką literę, cyfrę oraz znak specjalny.';
    }

    return null;
};

const sendCheckoutOnboarding = ({ email, confirmUrl, resetUrl, firstName, baseUrl }) => {
    if (confirmUrl) {
        sendPhpMailer('account_confirmation', {
            email,
            confirmUrl,
            context: {
                firstName,
            },
        }, { baseUrl });
    }

    if (resetUrl) {
        sendPhpMailer('password_reset', {
            email,
            resetUrl,
            context: {
                firstName,
            },
        }, { baseUrl });
    }
};

const getUserMailerLinks = (userId, baseUrl) => {
    if (!userId) {
        return {
            confirmUrl: null,
            resetUrl: null,
        };
    }

    const user = db.prepare('SELECT confirm_token, reset_token FROM users WHERE id = ?').get(userId);

    return {
        confirmUrl: user?.confirm_token ? `${baseUrl}/api/auth/confirm/${user.confirm_token}` : null,
        resetUrl: user?.reset_token ? `${baseUrl}/resetowanie-hasla?token=${user.reset_token}` : null,
    };
};

const normalizeCoupon = (coupon) => ({
    ...coupon,
    code: `${coupon.code || ''}`.trim().toUpperCase(),
    discount_type: `${coupon.discount_type || ''}`.trim().toLowerCase(),
    value: Number(coupon.value),
    is_active: Number(coupon.is_active) === 1,
    exclude_sale_items: Number(coupon.exclude_sale_items) === 1,
    usage_limit: coupon.usage_limit == null ? null : Number(coupon.usage_limit),
    usage_limit_per_user: coupon.usage_limit_per_user == null ? null : Number(coupon.usage_limit_per_user),
    times_used: coupon.times_used == null ? 0 : Number(coupon.times_used),
    minimum_spend: coupon.minimum_spend == null ? null : Number(coupon.minimum_spend),
    maximum_spend: coupon.maximum_spend == null ? null : Number(coupon.maximum_spend),
    included_product_ids: `${coupon.included_product_ids || ''}`.split(/[\n,;]+/g).map((item) => item.trim()).filter(Boolean),
    excluded_product_ids: `${coupon.excluded_product_ids || ''}`.split(/[\n,;]+/g).map((item) => item.trim()).filter(Boolean),
    allowed_emails: `${coupon.allowed_emails || ''}`.split(/[\n,;]+/g).map((item) => item.trim().toLowerCase()).filter(Boolean),
});

const matchesCouponEmailPattern = (email, pattern) => {
    const normalizedEmail = `${email || ''}`.trim().toLowerCase();
    const normalizedPattern = `${pattern || ''}`.trim().toLowerCase();

    if (!normalizedEmail || !normalizedPattern) {
        return false;
    }

    if (!normalizedPattern.includes('*')) {
        return normalizedEmail === normalizedPattern;
    }

    const escapedPattern = normalizedPattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');

    return new RegExp(`^${escapedPattern}$`, 'i').test(normalizedEmail);
};

const findValidCoupon = (rawCode, context = {}) => {
    const couponCode = `${rawCode || ''}`.trim().toUpperCase();
    if (!couponCode) {
        return null;
    }

    const row = db.prepare('SELECT * FROM coupons WHERE code = ?').get(couponCode);
    if (!row) {
        throw new Error('Podany kod rabatowy nie istnieje.');
    }

    const coupon = normalizeCoupon(row);
    const now = new Date();

    if (!coupon.is_active) {
        throw new Error('Ten kod rabatowy nie jest już aktywny.');
    }

    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        throw new Error('Ten kod rabatowy nie jest jeszcze aktywny.');
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        throw new Error('Ten kod rabatowy stracił już ważność.');
    }

    if (coupon.usage_limit != null && coupon.times_used >= coupon.usage_limit) {
        throw new Error('Ten kod rabatowy osiągnął już limit użyć.');
    }

    if (coupon.minimum_spend != null && Number(context.orderAmount) < coupon.minimum_spend) {
        throw new Error(`Ten kod rabatowy działa od kwoty ${coupon.minimum_spend.toFixed(2)} PLN.`);
    }

    if (coupon.maximum_spend != null && Number(context.orderAmount) > coupon.maximum_spend) {
        throw new Error(`Ten kod rabatowy działa do kwoty ${coupon.maximum_spend.toFixed(2)} PLN.`);
    }

    if (coupon.exclude_sale_items && context.hasPromotionalPrice) {
        throw new Error('Ten kod rabatowy nie działa na produkty objęte promocją.');
    }

    if (coupon.included_product_ids.length > 0 && !coupon.included_product_ids.includes(context.productId)) {
        throw new Error('Ten kod rabatowy nie dotyczy wybranego produktu.');
    }

    if (coupon.excluded_product_ids.includes(context.productId)) {
        throw new Error('Ten kod rabatowy nie może zostać użyty z tym produktem.');
    }

    if (coupon.allowed_emails.length > 0 && !coupon.allowed_emails.some((pattern) => matchesCouponEmailPattern(context.customerEmail, pattern))) {
        throw new Error('Ten kod rabatowy nie jest dostępny dla tego adresu e-mail.');
    }

    if (coupon.usage_limit_per_user != null && context.customerEmail) {
        const userUsageCount = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE lower(customer_email) = lower(?) AND upper(COALESCE(applied_coupon_code, '')) = ?").get(context.customerEmail, coupon.code)?.count || 0;
        if (Number(userUsageCount) >= coupon.usage_limit_per_user) {
            throw new Error('Ten kod rabatowy osiągnął już limit użyć dla tego adresu e-mail.');
        }
    }

    return coupon;
};

const applyCouponDiscount = (amount, coupon) => {
    if (!coupon) {
        return Number(amount);
    }

    const baseAmount = Number(amount);
    if (!Number.isFinite(baseAmount)) {
        return NaN;
    }

    let discountedAmount = baseAmount;
    if (coupon.discount_type === 'percent') {
        discountedAmount = baseAmount * (1 - (coupon.value / 100));
    } else {
        discountedAmount = baseAmount - coupon.value;
    }

    return Math.max(0, Number(discountedAmount.toFixed(2)));
};

const serializeAppliedCoupon = (coupon, originalAmount, discountedAmount) => {
    if (!coupon) {
        return null;
    }

    return {
        code: coupon.code,
        discountType: coupon.discount_type,
        value: coupon.value,
        originalAmount,
        discountedAmount,
    };
};

const normalizePurchasedItems = (value) => {
    if (typeof value !== 'string' || !value.trim()) {
        return [];
    }

    return value.split(',').map((item) => item.trim()).filter(Boolean);
};

const ensurePurchasedAccess = ({ customerEmail, userId, productId }) => {
    const normalizedEmail = customerEmail.trim().toLowerCase();
    let user = null;

    if (userId) {
        user = db.prepare('SELECT id, email, purchased_items FROM users WHERE id = ?').get(userId);
    }

    if (!user) {
        user = db.prepare('SELECT id, email, purchased_items FROM users WHERE email = ?').get(normalizedEmail);
    }

    if (user) {
        const purchases = normalizePurchasedItems(user.purchased_items);
        if (!purchases.includes(productId)) {
            purchases.push(productId);
            db.prepare('UPDATE users SET purchased_items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(purchases.join(','), user.id);
        }

        return user.id;
    }

    const newUserId = crypto.randomUUID();
    db.prepare(`
        INSERT INTO users (id, first_name, last_name, email, password_hash, purchased_items, email_confirmed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(newUserId, null, null, normalizedEmail, null, productId);

    return newUserId;
};

const prepareGuestCheckoutUser = async (customer = {}, baseUrl) => {
    const firstName = `${customer.firstName || customer.first_name || ''}`.trim();
    const lastName = `${customer.lastName || customer.last_name || ''}`.trim();
    const email = normalizeEmail(customer.email);
    const setPasswordNow = Boolean(customer.setPasswordNow);
    const password = `${customer.password || ''}`;
    const passwordConfirm = `${customer.passwordConfirm || customer.password_confirm || ''}`;

    if (!firstName || !lastName || !email) {
        const error = new Error('Podaj imię, nazwisko i adres e-mail, aby przejść do płatności.');
        error.statusCode = 400;
        throw error;
    }

    let passwordHash = null;
    if (setPasswordNow) {
        if (password !== passwordConfirm) {
            const error = new Error('Hasła nie są identyczne.');
            error.statusCode = 400;
            throw error;
        }

        const passwordValidationError = validateStrongPassword(password);
        if (passwordValidationError) {
            const error = new Error(passwordValidationError);
            error.statusCode = 400;
            throw error;
        }

        passwordHash = await bcrypt.hash(password, 12);
    }

    const existingUser = db.prepare(`
        SELECT id, email, password_hash, email_confirmed, confirm_token
        FROM users
        WHERE lower(email) = lower(?)
    `).get(email);

    const confirmToken = existingUser?.confirm_token || crypto.randomBytes(32).toString('hex');
    const shouldCreateResetLink = !setPasswordNow && !existingUser?.password_hash;
    const resetToken = shouldCreateResetLink ? crypto.randomBytes(32).toString('hex') : null;
    const resetExpires = shouldCreateResetLink ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null;
    const confirmUrl = `${baseUrl}/api/auth/confirm/${confirmToken}`;
    const resetUrl = resetToken ? `${baseUrl}/resetowanie-hasla?token=${resetToken}` : null;

    if (existingUser) {
        if (existingUser.password_hash && Number(existingUser.email_confirmed) === 1) {
            const error = new Error('Konto z tym adresem e-mail już istnieje. Zaloguj się, aby dokończyć zakup.');
            error.statusCode = 409;
            throw error;
        }

        db.prepare(`
            UPDATE users
            SET first_name = ?,
                last_name = ?,
                password_hash = COALESCE(?, password_hash),
                confirm_token = COALESCE(confirm_token, ?),
                reset_token = COALESCE(?, reset_token),
                reset_expires = COALESCE(?, reset_expires),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(firstName, lastName, passwordHash, confirmToken, resetToken, resetExpires, existingUser.id);

        if (!Number(existingUser.email_confirmed) || shouldCreateResetLink) {
            sendCheckoutOnboarding({ email, confirmUrl, resetUrl, firstName, baseUrl });
        }

        return {
            id: existingUser.id,
            email,
            requiresEmailConfirmation: !Number(existingUser.email_confirmed),
            hasPassword: Boolean(passwordHash || existingUser.password_hash),
        };
    }

    const userId = crypto.randomUUID();
    db.prepare(`
        INSERT INTO users (
            id, first_name, last_name, email, password_hash, purchased_items,
            email_confirmed, confirm_token, reset_token, reset_expires, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(userId, firstName, lastName, email, passwordHash, '', confirmToken, resetToken, resetExpires);

    sendCheckoutOnboarding({ email, confirmUrl, resetUrl, firstName, baseUrl });

    return {
        id: userId,
        email,
        requiresEmailConfirmation: true,
        hasPassword: Boolean(passwordHash),
    };
};

const resolveCheckoutIdentity = async (req, customer) => {
    try {
        const authUser = resolveAuthenticatedCheckoutUser(req);
        return {
            id: authUser.id,
            email: authUser.email,
            requiresEmailConfirmation: false,
            hasPassword: true,
            isAuthenticated: true,
        };
    } catch (error) {
        if (error.statusCode && error.statusCode !== 401) {
            throw error;
        }
    }

    return prepareGuestCheckoutUser(customer, `${req.protocol}://${req.get('host')}`);
};

const recordConsent = ({ userId, email, productId, sessionId, acceptedAt }) => {
    db.prepare(`
        INSERT INTO purchase_consents (
            id, user_id, email, product_id, stripe_session_id, terms_accepted_at, digital_content_consent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        crypto.randomUUID(),
        userId,
        email,
        productId,
        sessionId,
        acceptedAt,
        acceptedAt
    );
};

const normalizeOrderTimestamp = (value) => {
    const candidate = value ? new Date(value) : new Date();
    return Number.isNaN(candidate.getTime()) ? new Date().toISOString() : candidate.toISOString();
};

const recordCompletedOrder = ({ orderId, customerEmail, productId, amountTotal, appliedCouponCode = null, createdAt = new Date() }) => {
    const existingOrder = db.prepare('SELECT id FROM orders WHERE id = ?').get(orderId);
    if (existingOrder) {
        return;
    }

    const orderNumber = generateOrderNumber(createdAt);
    db.prepare('INSERT INTO orders (id, order_number, customer_email, product_id, amount_total, applied_coupon_code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(orderId, orderNumber, customerEmail, productId, amountTotal, appliedCouponCode, 'completed', normalizeOrderTimestamp(createdAt));
};

const incrementCouponUsage = (coupon) => {
    if (!coupon) {
        return;
    }

    db.prepare('UPDATE coupons SET times_used = times_used + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(coupon.id);
};

const getEffectivePrice = (product) => {
    const hasPromo = product.promotional_price != null
        && product.promotional_price !== ''
        && (!product.promotional_price_until || new Date(product.promotional_price_until) >= new Date());

    const amount = hasPromo ? Number(product.promotional_price) : Number(product.price);
    return Number.isFinite(amount) ? amount : NaN;
};

const resolveAuthenticatedCheckoutUser = (req) => {
    const authToken = req.cookies?.auth_token;
    if (!authToken) {
        const error = new Error('Brak dostępu - wymagane zalogowanie.');
        error.statusCode = 401;
        throw error;
    }

    let decoded;
    try {
        decoded = jwt.verify(authToken, getJwtSecret());
    } catch {
        const error = new Error('Nieprawidłowy token autoryzacji.');
        error.statusCode = 401;
        throw error;
    }

    const normalizedEmail = `${decoded.email || ''}`.trim().toLowerCase();
    if (!normalizedEmail) {
        const error = new Error('Sesja użytkownika jest nieprawidłowa. Zaloguj się ponownie, aby dokończyć zakup.');
        error.statusCode = 401;
        throw error;
    }

    let user = null;
    if (decoded.id) {
        user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(decoded.id);
    }

    if (!user) {
        user = db.prepare('SELECT id, email FROM users WHERE lower(email) = lower(?)').get(normalizedEmail);
    }

    if (!user) {
        const error = new Error('Nie znaleziono konta powiązanego z aktywną sesją. Zaloguj się ponownie i spróbuj jeszcze raz.');
        error.statusCode = 401;
        throw error;
    }

    return {
        id: user.id,
        email: `${user.email}`.trim().toLowerCase(),
    };
};

// Create checkout session (public/semi-public)
router.post('/create-session', async (req, res) => {
    try {
        const { productId, paymentMethod = 'stripe', termsAccepted, digitalContentAccepted, couponCode, customer } = req.body;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        if (!productId) return res.status(400).json({ error: 'Brak ID produktu.' });
        if (!termsAccepted || !digitalContentAccepted) {
            return res.status(400).json({ error: 'Aby kontynuować, zaakceptuj wymagane zgody.' });
        }
        
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
        if (!product) return res.status(404).json({ error: 'Produkt nie istnieje.' });
        if (product.type === 'service') {
            return res.status(400).json({ error: 'Usługi są umawiane przez kontakt i nie mogą zostać kupione online.' });
        }

        const checkoutIdentity = await resolveCheckoutIdentity(req, customer);
        const customerEmail = checkoutIdentity.email;
        const userId = checkoutIdentity.id;
        const mailerLinks = getUserMailerLinks(userId, baseUrl);
        
        if (!customerEmail) {
            return res.status(400).json({ error: 'Brak adresu e-mail do zamówienia.' });
        }

        const hasPromotionalPrice = product.promotional_price != null
            && product.promotional_price !== ''
            && (!product.promotional_price_until || new Date(product.promotional_price_until) >= new Date());
        const effectivePrice = getEffectivePrice(product);
        const coupon = findValidCoupon(couponCode, {
            productId: product.id,
            customerEmail,
            orderAmount: effectivePrice,
            hasPromotionalPrice,
        });
        const discountedPrice = applyCouponDiscount(effectivePrice, coupon);
        const unitAmount = Math.round(discountedPrice * 100);
        if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
            return res.status(400).json({ error: 'Produkt ma nieprawidłową cenę.' });
        }

        const appliedCoupon = serializeAppliedCoupon(coupon, effectivePrice, discountedPrice);

        if (paymentMethod === 'bank_transfer') {
            const bankConfig = bankTransferConfig();
            if (!bankConfig.accountName || !bankConfig.accountNumber) {
                return res.status(500).json({ error: 'Przelew tradycyjny nie jest skonfigurowany w środowisku lokalnym.' });
            }

            const orderId = `bank_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
            const acceptedAt = new Date().toISOString();
            const orderNumber = generateOrderNumber(acceptedAt);
            const transferTitle = `Zamówienie ${orderNumber} - ${product.title}`;

            db.prepare('INSERT INTO orders (id, order_number, customer_email, product_id, amount_total, applied_coupon_code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                .run(orderId, orderNumber, customerEmail, product.id, discountedPrice, coupon?.code || null, 'pending_bank_transfer', acceptedAt);

            incrementCouponUsage(coupon);
            recordConsent({ userId, email: customerEmail, productId: product.id, sessionId: `bank_transfer:${orderId}`, acceptedAt });

            sendBankTransferEmails({
                orderId,
                productTitle: product.title,
                amountTotal: discountedPrice,
                customerEmail,
                bankAccountName: bankConfig.accountName,
                bankAccountNumber: bankConfig.accountNumber,
                bankName: bankConfig.bankName,
                bankTransferTitle: transferTitle,
                bankInstructions: bankConfig.instructions,
                confirmUrl: checkoutIdentity.requiresEmailConfirmation ? mailerLinks.confirmUrl : null,
                resetUrl: !checkoutIdentity.hasPassword ? mailerLinks.resetUrl : null,
                adminUrl: `${baseUrl}/administrator/`,
            }, {
                baseUrl,
            });

            return res.json({
                message: 'Instrukcje przelewu zostały przygotowane.',
                bankTransfer: {
                    amount: discountedPrice,
                    accountName: bankConfig.accountName,
                    accountNumber: bankConfig.accountNumber,
                    bankName: bankConfig.bankName,
                    transferTitle,
                    instructions: bankConfig.instructions,
                },
                appliedCoupon,
                checkoutIdentity: {
                    requiresEmailConfirmation: checkoutIdentity.requiresEmailConfirmation,
                    hasPassword: checkoutIdentity.hasPassword,
                },
            });
        }

        if (isMockStripeMode()) {
            const acceptedAt = new Date().toISOString();
            const mockSessionId = `mock_stripe:${crypto.randomUUID()}`;
            const effectiveUserId = ensurePurchasedAccess({ customerEmail, userId, productId: product.id });

            recordConsent({ userId: effectiveUserId, email: customerEmail, productId: product.id, sessionId: mockSessionId, acceptedAt });
            recordCompletedOrder({
                orderId: `mock_${mockSessionId.replace(/[^a-zA-Z0-9_]/g, '_')}`,
                customerEmail,
                productId: product.id,
                amountTotal: discountedPrice,
                appliedCouponCode: coupon?.code || null,
                createdAt: acceptedAt,
            });
            incrementCouponUsage(coupon);

            const effectiveMailerLinks = getUserMailerLinks(effectiveUserId, baseUrl);
            sendOrderSuccessEmails({
                orderId: `mock_${mockSessionId.replace(/[^a-zA-Z0-9_]/g, '_')}`,
                productTitle: product.title,
                amountTotal: discountedPrice,
                customerEmail,
                couponCode: coupon?.code || null,
                libraryUrl: `${baseUrl}/panel`,
                confirmUrl: checkoutIdentity.requiresEmailConfirmation ? effectiveMailerLinks.confirmUrl : null,
                resetUrl: !checkoutIdentity.hasPassword ? effectiveMailerLinks.resetUrl : null,
                adminUrl: `${baseUrl}/administrator/`,
            }, {
                baseUrl,
            });

            return res.json({
                url: `${baseUrl}/panel?success=true&mockCheckout=true`,
                appliedCoupon,
                mockCheckout: true,
                checkoutIdentity: {
                    requiresEmailConfirmation: checkoutIdentity.requiresEmailConfirmation,
                    hasPassword: checkoutIdentity.hasPassword,
                },
            });
        }

        if (!hasConfiguredStripeKey()) {
            return res.status(503).json({ error: 'Płatności Stripe nie są jeszcze skonfigurowane w środowisku lokalnym.' });
        }

        const sessionConfig = {
            payment_method_types: ['card', 'blik', 'p24'], // Add polish methods if desired
            line_items: [
                {
                    price_data: {
                        currency: 'pln',
                        unit_amount: unitAmount,
                        product_data: {
                            name: product.title,
                            ...(product.description ? { description: product.description.slice(0, 500) } : {}),
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${baseUrl}/panel?success=true`,
            cancel_url: `${baseUrl}/oferta/${product.slug}?canceled=true`,
            customer_email: customerEmail,
            client_reference_id: product.id,
            metadata: {
                productId: product.id,
                userId: userId || '',
                couponCode: coupon?.code || '',
            }
        };

        const stripe = getStripeClient();
        if (!stripe) {
            return res.status(503).json({ error: 'Płatności Stripe nie są jeszcze skonfigurowane.' });
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        const acceptedAt = new Date().toISOString();
        recordConsent({ userId, email: customerEmail, productId: product.id, sessionId: session.id, acceptedAt });

        res.json({
            url: session.url,
            appliedCoupon,
            checkoutIdentity: {
                requiresEmailConfirmation: checkoutIdentity.requiresEmailConfirmation,
                hasPassword: checkoutIdentity.hasPassword,
            },
        });
    } catch (error) {
        if (/Invalid API Key provided/i.test(error.message || '')) {
            return res.status(503).json({ error: 'Płatności Stripe nie są jeszcze skonfigurowane w środowisku lokalnym.' });
        }

        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
