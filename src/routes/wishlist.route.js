const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist, clearWishlist } = require('../controllers/wishlist.controller.js')
const { authUserMiddleware } = require('../middlewares/auth.middleware.js')

router.post('/get', authUserMiddleware, getWishlist)
router.post('/add', authUserMiddleware, addToWishlist)
router.delete('/remove', authUserMiddleware, removeFromWishlist)
router.delete('/deleteAll', authUserMiddleware, clearWishlist)

module.exports = router