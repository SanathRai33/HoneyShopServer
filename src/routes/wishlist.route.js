const express = require('express');
const router = express.Router();
const { addToWishlist } = require('../controllers/wishlist.controller.js')
const { authUserMiddleware } = require('../middlewares/auth.middleware.js')

router.post('/add', authUserMiddleware, addToWishlist)

module.exports = router