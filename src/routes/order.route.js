const express = require('express');
const router = express.Router();
const { createOrder, cancelOrder, getOrderByUserId, getOrderByVendorId, getAllOrders } = require('../controllers/order.controller.js')
const { authVendorMiddleware, authAdminMiddleware } = require('../middlewares/auth.middleware.js')

router.post('/orders', createOrder);
router.post('/orders/user', getOrderByUserId);
router.post('/cancel', cancelOrder);
router.post('/vendor', authVendorMiddleware, getOrderByVendorId)
router.get('/', authAdminMiddleware, getAllOrders)

module.exports = router