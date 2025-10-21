const express = require('express');
const router = express.Router();
const { addToCart } = require('../controllers/cart.controller.js');
const { authUserMiddleware } = require('../middlewares/auth.middleware.js');

router.post('/add', authUserMiddleware, addToCart)

module.exports = router