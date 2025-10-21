const wishlistModel = require('../models/wishlist.model.js')
const productModel = require('../models/products.model.js')

const addToWishlist = async (req, res) => {
  try {
    const userId = req.body.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required.",
      });
    }

    // Validate if product exists
    const productExists = await productModel.findById(productId);
    if (!productExists) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    // Find user's wishlist or create new one
    let wishlist = await wishlistModel.findOne({ user: userId });

    if (wishlist) {
      // Check if product already exists in wishlist (prevent duplicates)
      const existingItem = wishlist.items.find(
        item => item.product.toString() === productId
      );

      if (existingItem) {
        return res.status(400).json({
          message: "Product is already in your wishlist.",
        });
      }

      // Add new item to existing wishlist
      wishlist.items.push({
        product: productId,
        addedAt: Date.now(),
      });

      await wishlist.save();
    } else {
      // Create new wishlist
      wishlist = await wishlistModel.create({
        user: userId,
        items: [{
          product: productId,
          addedAt: Date.now(),
        }],
      });
    }

    // Populate product details for response
    await wishlist.populate('items.product', 'name image price stock category');

    return res.status(201).json({
      message: "Product added to wishlist successfully",
      wishlist: wishlist,
    });

  } catch (error) {
    console.error("Add to wishlist error:", error);
    return res.status(500).json({
      message: "Something went wrong while adding to wishlist",
      error: error.message,
    });
  }
};

module.exports = { addToWishlist}