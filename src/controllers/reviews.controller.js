const mongoose = require('mongoose');
const Review = require('../models/reviews.model.js');
const Product = require('../models/products.model.js');
const Order = require('../models/orders.model.js');

const submitReview = async (req, res) => {
  console.log("Click submit button")
  try {
    const { productId, orderId, rating, title, comment, images } = req.body;
    const userId = req.user._id;

    if (!productId || !orderId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, Order ID, rating, and comment are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: 'delivered'
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not delivered'
      });
    }

    const productInOrder = order.items.find(item => 
      item.product._id.toString() === productId
    );

    if (!productInOrder) {
      return res.status(400).json({
        success: false,
        message: 'Product not found in this order'
      });
    }

    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
      order: orderId
    });

    console.log('-------------------------------------------------------')
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product from this order'
      });
    }

    console.log('_______________________________________________________')
    const review = new Review({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      title: title || 'feedback',
      comment,
      images: images || []
    });

    console.log("review", review)

    await review.save();

    // Update product's average rating and total reviews
    const productReviews = await Review.find({ product: productId });
    const averageRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0) / productReviews.length;
    const totalReviews = productReviews.length;

    await Product.findByIdAndUpdate(productId, {
      $set: {
        'ratings.average': parseFloat(averageRating.toFixed(1)),
        'ratings.total': totalReviews
      }
    });

    // Populate user info for response
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name email profilePicture')
      .populate('product', 'name images');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview
    });

  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sort = 'newest', 
      rating 
    } = req.query;

    // Convert query params to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Validate productId format
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Build query object
    const query = { product: productId };
    
    // Filter by rating if provided
    if (rating) {
      const ratingNum = parseInt(rating);
      if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
        query.rating = ratingNum;
      }
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'highest':
        sortOptions.rating = -1;
        break;
      case 'lowest':
        sortOptions.rating = 1;
        break;
      case 'helpful':
        sortOptions.helpfulCount = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate('user', 'name email images fullName profilePicture')
      .populate('order', 'orderId')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalReviews = await Review.countDocuments(query);

    // Get rating distribution
    const allReviews = await Review.find({ product: productId });
    
    const ratingDistribution = [5, 4, 3, 2, 1].map(ratingValue => {
      const count = allReviews.filter(review => review.rating === ratingValue).length;
      return {
        _id: ratingValue,
        count: count
      };
    });

    // Calculate average rating
    let averageRating = 0;
    let totalRatingSum = 0;
    
    if (allReviews.length > 0) {
      totalRatingSum = allReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRatingSum / allReviews.length;
    }

    // Check if product exists and update its rating
    const product = await Product.findById(productId);
    if (product) {
      // Update product's average rating
      product.ratings = {
        average: parseFloat(averageRating.toFixed(1)),
        total: allReviews.length
      };
      await product.save();
    }

    return res.json({
      success: true,
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limitNum)
      },
      statistics: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: allReviews.length,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Get product reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's reviews
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: userId })
      .populate('product', 'name images price')
      .populate('order', 'orderId createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ user: userId });

    return res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit)
      }
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user reviews'
    });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user._id;

    // Find review
    const review = await Review.findOne({ _id: reviewId, user: userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    // Check if review can be updated (within 24 hours)
    const reviewAge = (new Date() - review.createdAt) / (1000 * 60 * 60);
    if (reviewAge > 24) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be updated within 24 hours of submission'
      });
    }

    // Update review
    if (rating !== undefined) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (images) review.images = images;
    
    review.updatedAt = new Date();

    await review.save();

    // Update product rating
    const productReviews = await Review.find({ product: review.product });
    const averageRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0) / productReviews.length;

    await Product.findByIdAndUpdate(review.product, {
      $set: {
        'ratings.average': parseFloat(averageRating.toFixed(1)),
        'ratings.total': productReviews.length
      }
    });

    const updatedReview = await Review.findById(review._id)
      .populate('user', 'name email profilePicture')
      .populate('product', 'name images');

    return res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Update review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findOne({ _id: reviewId, user: userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    // Store product ID before deletion for rating recalculation
    const productId = review.product;

    await review.deleteOne();

    // Recalculate product rating
    const productReviews = await Review.find({ product: productId });
    
    if (productReviews.length > 0) {
      const averageRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0) / productReviews.length;
      await Product.findByIdAndUpdate(productId, {
        $set: {
          'ratings.average': parseFloat(averageRating.toFixed(1)),
          'ratings.total': productReviews.length
        }
      });
    } else {
      // No reviews left, reset rating
      await Product.findByIdAndUpdate(productId, {
        $set: {
          'ratings.average': 0,
          'ratings.total': 0
        }
      });
    }

    return res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked helpful (you might want to track this separately)
    // For simplicity, we're just incrementing
    review.helpfulCount += 1;
    await review.save();

    return res.json({
      success: true,
      message: 'Marked as helpful',
      helpfulCount: review.helpfulCount
    });

  } catch (error) {
    console.error('Mark helpful error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark as helpful'
    });
  }
};

// Report a review
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Prevent self-reporting
    if (review.user.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report your own review'
      });
    }

    review.reportCount += 1;
    await review.save();

    // You might want to store individual reports in a separate collection
    // For tracking: const report = new Report({ user: userId, review: reviewId, reason });

    return res.json({
      success: true,
      message: 'Review reported successfully'
    });

  } catch (error) {
    console.error('Report review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to report review'
    });
  }
};

exports.vendorReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.user._id;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Reply comment is required'
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.vendorReply && review.vendorReply.comment) {
      return res.status(400).json({
        success: false,
        message: 'Already replied to this review'
      });
    }

    review.vendorReply = {
      comment,
      repliedAt: new Date()
    };

    await review.save();

    return res.json({
      success: true,
      message: 'Reply added successfully',
      review
    });

  } catch (error) {
    console.error('Vendor reply error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add vendor reply'
    });
  }
};

module.exports = {
  submitReview,
  getProductReviews
};