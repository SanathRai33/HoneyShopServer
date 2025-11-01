const express = require('express');
const router = express.Router();
const { createProduct, getProductByVendorId, updateProduct, getAllAdminProduct, getAllProducts, getProductFilterOptions } = require('../controllers/product.controller.js')
const { authAdminMiddleware, authVendorMiddleware, authSellerMiddleware } = require('../middlewares/auth.middleware.js');
const { uploadProduct } = require('../fileHelper/fileHelper.js');

router.post('/', 
  (req, res, next) => {
    console.log('🚀 Route hit!');
    next();
  },
  (req, res, next) => {
    console.log('✅ Before auth middleware');
    next();
  },
  authAdminMiddleware,
  (req, res, next) => {
    console.log('✅ After auth middleware - req.admin:', req.admin);
    next();
  },
  (req, res, next) => {
    console.log('✅ Before multer');
    next();
  },
  uploadProduct.array('images', 1),
  (req, res, next) => {
    console.log('✅ After multer - files:', req.files);
    next();
  },
  createProduct
);

// Add error handler
router.use((err, req, res, next) => {
  console.error('❌❌❌ Route Error:', err);
  console.error('❌ Error stack:', err.stack);
  res.status(500).json({
    message: 'Internal Server Error in route',
    error: err.message,
    stack: err.stack
  });
});

router.patch('/:id', authSellerMiddleware, updateProduct )
router.get('/', getAllProducts);
router.get('/products/filter-options', getProductFilterOptions);
router.get('/admin', authAdminMiddleware, getAllAdminProduct)
router.get('/:id', authVendorMiddleware, getProductByVendorId)

module.exports = router;