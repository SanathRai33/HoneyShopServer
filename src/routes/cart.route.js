const express = require('express');
const router = express.Router();
const { addToCart, removeFromCart, getCartItems, updateCartQuantity, clearCart } = require('../controllers/cart.controller.js');
const { authUserMiddleware } = require('../middlewares/auth.middleware.js');

router.post('/get', authUserMiddleware, getCartItems)
router.post('/add', authUserMiddleware, addToCart)
router.put('/update', authUserMiddleware, updateCartQuantity)
router.delete('/remove', authUserMiddleware, removeFromCart)
router.delete('/deleteAll', authUserMiddleware, clearCart)

module.exports = router