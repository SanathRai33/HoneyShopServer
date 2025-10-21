const express = require('express');
const router = express.Router();
const { addToCart, removeFromCart } = require('../controllers/cart.controller.js');
const { authUserMiddleware } = require('../middlewares/auth.middleware.js');

router.post('/add', authUserMiddleware, addToCart)
router.delete('/remove', authUserMiddleware, removeFromCart)

module.exports = router