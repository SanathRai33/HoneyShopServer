const express = require('express');
const router = express.Router();
const { createOrder, cancelOrder, getOrderByUserId } = require('../controllers/order.controller.js')

router.post('/orders', createOrder);
router.post('/orders/user', getOrderByUserId);
router.post('/cancel', cancelOrder)

module.exports = router