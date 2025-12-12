const express = require('express');
const router = express.Router();
const { paymentProcessor, getPaymentData, verifyPayment, getDirectPaymentData } = require('../controllers/payment.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

router.post('/process', paymentProcessor);
router.get('/data/:cartId', authUserMiddleware, getPaymentData);
router.get('/direct/:productId', authUserMiddleware, getDirectPaymentData);
router.post('/verify', authUserMiddleware, verifyPayment);

module.exports = router;