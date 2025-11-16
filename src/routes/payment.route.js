const express = require('express');
const router = express.Router();
const { paymentProcessor, getPaymentData, verifyPayment } = require('../controllers/payment.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

router.post('/process', paymentProcessor);
router.get('/data', authUserMiddleware, getPaymentData);
router.post('/verify', authUserMiddleware, verifyPayment);

module.exports = router;