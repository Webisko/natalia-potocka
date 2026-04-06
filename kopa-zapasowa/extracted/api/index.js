import express from 'express';
import productsApi from './productsApi.js';
import authApi from './authApi.js';
import adminApi from './adminApi.js';
import checkoutApi from './checkoutApi.js';
import clientApi from './clientApi.js';
import testApi from './test.js';
import reviewsApi from './reviewsApi.js';
import coursesApi from './coursesApi.js';
import contactApi from './contactApi.js';

const router = express.Router();

router.use('/products', productsApi);
router.use('/auth', authApi);
router.use('/admin', adminApi);
router.use('/checkout', checkoutApi);
router.use('/client', clientApi);
router.use('/test', testApi);
router.use('/reviews', reviewsApi);
router.use('/courses', coursesApi);
router.use('/contact', contactApi);

router.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;
