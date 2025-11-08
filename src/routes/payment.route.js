const express = require('express');
const router = express.Router();
const { paymentProcessor } = require('../controllers/payment.controller');

router.post('/process', paymentProcessor);

module.exports = router;