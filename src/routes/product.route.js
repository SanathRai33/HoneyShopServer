const express = require('express');
const router = express.Router();
const { createProduct, getProductByVendorId, updateProduct, getAllAdminProduct, getAllProducts, getProductFilterOptions } = require('../controllers/product.controller.js')
const { authAdminMiddleware, authVendorMiddleware, authSellerMiddleware } = require('../middlewares/auth.middleware.js');
const { uploadProduct } = require('../fileHelper/fileHelper.js');

router.post('/', authAdminMiddleware, uploadProduct.array('images', 1), createProduct);
router.patch('/:id', authSellerMiddleware, updateProduct )
router.get('/', getAllProducts);
router.get('/products/filter-options', getProductFilterOptions);
router.get('/admin', authAdminMiddleware, getAllAdminProduct)
router.get('/:id', authVendorMiddleware, getProductByVendorId)

module.exports = router;