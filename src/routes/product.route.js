const express = require('express');
const router = express.Router();
const { createProduct, getProductByVendorId, updateProduct, getAllAdminProduct, getAllProducts, getProductFilterOptions, getProductById, getRelatedProducts } = require('../controllers/product.controller.js')
const { authAdminMiddleware, authVendorMiddleware, authSellerMiddleware, authUserMiddleware } = require('../middlewares/auth.middleware.js');
const { uploadProduct } = require('../fileHelper/fileHelper.js');

router.post('/', authAdminMiddleware, uploadProduct.array('images', 1), createProduct);
router.patch('/:id', authSellerMiddleware, updateProduct )
router.get('/', authUserMiddleware, getAllProducts);
router.get('/related', authUserMiddleware, getRelatedProducts);
router.get('/:id', authUserMiddleware, getProductById);
router.get('/products/filter-options', getProductFilterOptions);
router.get('/admin/get', authAdminMiddleware, getAllAdminProduct)
router.get('/vendor/:id', authVendorMiddleware, getProductByVendorId)

module.exports = router;