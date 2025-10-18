const express = require('express');
const router = express.Router();
const { createProduct } = require('../controllers/product.controller.js')
const { authAdminMiddleware, authVendorMiddleware } = require('../middlewares/auth.middleware.js')

router.post('/admin', authAdminMiddleware, createProduct)
router.post('/vendor', authVendorMiddleware, createProduct)

module.exports = router;