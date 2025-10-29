const express = require('express');
const router = express.Router();
const { createProduct, getProductByVendorId, updateProduct, getAllAdminProduct, getAllProducts, getProductFilterOptions } = require('../controllers/product.controller.js')
const { authAdminMiddleware, authVendorMiddleware, authSellerMiddleware } = require('../middlewares/auth.middleware.js');
const { uploadProduct } = require('../fileHelper/fileHelper.js');

router.post('/', uploadProduct.single("image"), authAdminMiddleware, createProduct)
router.get('/test', (req, res)=>{
    console.log(req)
    return res.status(200).json({
        message: req.body
    })
})
router.patch('/:id', authSellerMiddleware, updateProduct )
router.get('/', getAllProducts);
router.get('/products/filter-options', getProductFilterOptions);
router.get('/admin', authAdminMiddleware, getAllAdminProduct)
router.get('/:id', authVendorMiddleware, getProductByVendorId)

module.exports = router;