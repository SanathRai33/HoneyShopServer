const express = require('express');
const router = express.Router();
const { authUserMiddleware } = require('../middlewares/auth.middleware');
const { submitReview, getProductReviews } = require('../controllers/reviews.controller.js');

// Public routes
router.get('/product/:productId', getProductReviews);

router.post('/', authUserMiddleware, submitReview);
// router.get('/my-reviews', reviewController.getUserReviews);
// router.put('/:reviewId', reviewController.updateReview);
// router.delete('/:reviewId', reviewController.deleteReview);
// router.post('/:reviewId/helpful', reviewController.markHelpful);
// router.post('/:reviewId/report', reviewController.reportReview);

// router.post('/:reviewId/reply', authorize('admin', 'vendor'), reviewController.vendorReply);

module.exports = router;