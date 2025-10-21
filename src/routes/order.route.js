const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/order.controller.js')

router.post('/orders', createOrder);

module.exports = router