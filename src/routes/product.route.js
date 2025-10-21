const express = require('express');
const router = express.Router();
const { createProduct, getAllProduct, getProductByVendorId, updateProduct } = require('../controllers/product.controller.js')
const { authAdminMiddleware, authVendorMiddleware, authSellerMiddleware } = require('../middlewares/auth.middleware.js')
const { uploadProduct } = require('../config/cloudinary.js')

router.post('/', authSellerMiddleware, uploadProduct, createProduct)
router.patch('/:id', authSellerMiddleware, updateProduct )
router.get('/', authAdminMiddleware, getAllProduct)
router.get('/:id', authVendorMiddleware, getProductByVendorId)

module.exports = router;