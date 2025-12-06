const express = require('express');
const router = express.Router();
const { getRevenueAnalytics, getCustomerAnalytics, getProductAnalytics, getDashboardMetrics, getAnalytics } = require('../controllers/analytics.controller.js');
const { authAdminMiddleware } = require('../middlewares/auth.middleware.js');

router.get('/revenue', authAdminMiddleware,  getRevenueAnalytics);
router.get('/customers', authAdminMiddleware, getCustomerAnalytics);
router.get('/products', authAdminMiddleware, getProductAnalytics);
router.get('/dashboard-metrics', authAdminMiddleware, getDashboardMetrics);
router.get('/', authAdminMiddleware, getAnalytics);

module.exports = router;