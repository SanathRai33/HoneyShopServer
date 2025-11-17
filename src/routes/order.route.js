const express = require('express');
const router = express.Router();
const { cancelOrder, getOrderByUserId, getOrderByVendorId, getAllOrders } = require('../controllers/order.controller.js')
const { authUserMiddleware, authVendorMiddleware, authAdminMiddleware } = require('../middlewares/auth.middleware.js')

router.get('/user', authUserMiddleware, getOrderByUserId);
router.post('/cancel', authUserMiddleware, cancelOrder);
router.get('/vendor', authVendorMiddleware, getOrderByVendorId)
router.get('/', authAdminMiddleware, getAllOrders)

module.exports = router