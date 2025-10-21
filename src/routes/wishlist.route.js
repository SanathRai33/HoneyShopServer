const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist } = require('../controllers/wishlist.controller.js')
const { authUserMiddleware } = require('../middlewares/auth.middleware.js')

router.post('/add', authUserMiddleware, addToWishlist)
router.delete('/remove', authUserMiddleware, removeFromWishlist)

module.exports = router