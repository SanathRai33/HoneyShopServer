const express = require('express');
const router = express.Router();
const { cancelOrder, getOrderByUserId, getOrderByVendorId, getAllOrders, getOrderById } = require('../controllers/order.controller.js')
const { authUserMiddleware, authVendorMiddleware, authAdminMiddleware } = require('../middlewares/auth.middleware.js')

// Get all orders for a user
router.get('/user', authUserMiddleware, getOrderByUserId);
// Get single order by order ID for user
router.get('/:orderId', authUserMiddleware, getOrderById);
router.post('/cancel', authUserMiddleware, cancelOrder);
router.get('/vendor', authVendorMiddleware, getOrderByVendorId)
router.get('/', authAdminMiddleware, getAllOrders)

module.exports = router