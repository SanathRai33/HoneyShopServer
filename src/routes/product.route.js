const express = require('express');
const router = express.Router();
const { createProduct, getAllProduct } = require('../controllers/product.controller.js')
const { authAdminMiddleware, authVendorMiddleware } = require('../middlewares/auth.middleware.js')
const { uploadProduct } = require('../config/cloudinary.js')

router.post('/admin', authAdminMiddleware, uploadProduct, createProduct)
router.post('/vendor', authVendorMiddleware, uploadProduct, createProduct)
router.get('/', authAdminMiddleware, getAllProduct)

module.exports = router;