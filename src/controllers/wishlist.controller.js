const wishlistModel = require("../models/wishlist.model.js");
const productModel = require("../models/products.model.js");

const getWishlist = async (req, res) => {
  try {
    const userId = req.body.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    // Find user's wishlist and populate product details
    const wishlist = await wishlistModel
      .findOne({ user: userId })
      .populate("items.product", "name image price stock category discount");

    if (!wishlist || wishlist.items.length === 0) {
      return res.status(200).json({
        message: "Wishlist is empty",
        wishlist: {
          items: [],
          totalItems: 0,
        },
      });
    }

    // Add total items count
    const wishlistWithCount = {
      ...wishlist.toObject(),
      totalItems: wishlist.items.length,
    };

    return res.status(200).json({
      message: "Wishlist retrieved successfully",
      wishlist: wishlistWithCount,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching wishlist",
      error: error.message,
    });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    const productExists = await productModel.findById(productId);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    let wishlist = await wishlistModel.findOne({ user: userId });

    if (wishlist) {
      const existingItemIndex = wishlist.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Product exists - REMOVE it
        wishlist.items.splice(existingItemIndex, 1);
        await wishlist.save();
        
        await wishlist.populate("items.product", "name images price quantity category");

        return res.status(200).json({
          success: true,
          message: "Product removed from wishlist",
          wishlist: wishlist,
          action: "removed"
        });
      } else {
        // Product doesn't exist - ADD it
        wishlist.items.push({
          product: productId,
          addedAt: Date.now(),
        });
        await wishlist.save();
      }
    } else {
      // Create new wishlist with product
      wishlist = await wishlistModel.create({
        user: userId,
        items: [
          {
            product: productId,
            addedAt: Date.now(),
          },
        ],
      });
    }

    await wishlist.populate("items.product", "name images price quantity category");

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist successfully",
      wishlist: wishlist,
      action: "added"
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while adding to wishlist",
      error: error.message,
    });
  }
};


const removeFromWishlist = async (req, res) => {
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

    // Find user's wishlist
    const wishlist = await wishlistModel.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found.",
      });
    }

    // Find the item in wishlist
    const itemIndex = wishlist.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Product not found in your wishlist.",
      });
    }

    // Remove item from wishlist
    const removedItem = wishlist.items.splice(itemIndex, 1)[0];

    // If wishlist becomes empty, delete the wishlist document
    if (wishlist.items.length === 0) {
      await wishlistModel.findByIdAndDelete(wishlist._id);
      return res.status(200).json({
        message: "Product removed from wishlist. Wishlist is now empty.",
        wishlist: null,
      });
    }

    // Save updated wishlist
    await wishlist.save();

    // Populate remaining items for response
    await wishlist.populate("items.product", "name image price stock category");

    return res.status(200).json({
      message: "Product removed from wishlist successfully",
      wishlist: wishlist,
      removedProductId: productId,
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return res.status(500).json({
      message: "Something went wrong while removing from wishlist",
      error: error.message,
    });
  }
};

const clearWishlist = async (req, res) => {
  try {
    const userId = req.body.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    // Find and delete user's wishlist
    const result = await wishlistModel.findOneAndDelete({ user: userId });

    if (!result) {
      return res.status(404).json({
        message: "Wishlist not found or already empty.",
      });
    }

    return res.status(200).json({
      message: "Wishlist cleared successfully",
      clearedItems: {
        totalItems: result.items.length,
        items: result.items,
      },
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);
    return res.status(500).json({
      message: "Something went wrong while clearing wishlist",
      error: error.message,
    });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
