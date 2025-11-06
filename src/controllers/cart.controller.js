const cartModel = require("../models/carts.model.js");
const productModel = require("../models/products.model.js");
const userModel = require("../models/users.model.js");

const getCartItems = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    const userAddress = await userModel.findById(userId).select("address -_id");

    const pincode = userAddress.address.pincode;

    const cart = await cartModel
      .findOne({ user: userId })
      .populate("items.product", "name images price quantity category subCategory");

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart items retrieved successfully",
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        user: cart.user,
      },
      address: pincode ? userAddress : null,
    });
  } catch (error) {
    console.error("Get cart items error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching cart items",
      error: error.message,
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const product = req.body.product;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    if (!product || !product._id || !product.quantity) {
      return res.status(400).json({
        success: false,
        message: "Product information is incomplete.",
      });
    }

    const productExists = await productModel.findById(product._id);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const productPrice = productExists.price?.current;
    const itemTotal = productPrice * product.quantity;

    let cart = await cartModel.findOne({ user: userId });

    if (cart) {
      // Check if product already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === product._id
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += product.quantity;
        cart.items[existingItemIndex].addedAt = Date.now();
      } else {
        cart.items.push({
          product: product._id,
          quantity: product.quantity,
          price: productPrice,
          addedAt: Date.now(),
        });
      }

      cart.totalItems = cart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      await cart.save();
    } else {
      cart = await cartModel.create({
        user: userId,
        items: [
          {
            product: product._id,
            quantity: product.quantity,
            price: productPrice,
            addedAt: Date.now(),
          },
        ],
        totalItems: product.quantity,
        totalPrice: itemTotal,
      });
    }

    await cart.populate("items.product", "name image price");

    return res.status(201).json({
      success: true,
      message: "Product added to cart successfully",
      cart: cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({
      message: "Something went wrong while adding to cart",
      error: error.message,
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, newQuantity } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
        success: false,
      });
    }

    if (!productId || newQuantity === undefined || newQuantity === null) {
      return res.status(400).json({
        message: "Product ID and new quantity are required.",
        success: false,
      });
    }

    if (newQuantity < 0) {
      return res.status(400).json({
        message: "Quantity cannot be negative.",
        success: false,
      });
    }

    if (newQuantity === 0) {
      // If quantity is set to 0, remove the item
      return removeFromCart(req, res);
    }

    // Find user's cart
    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found.",
        success: false,
      });
    }

    // Find the item in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Item not found in cart.",
        success: false,
      });
    }

    // Check product stock if needed
    const product = await productModel.findById(productId);
    if (newQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} items available in stock.`,
        availableStock: product.stock,
        success: false,
      });
    }

    // Calculate the difference in quantity and price
    const oldQuantity = cart.items[itemIndex].quantity;
    const price = cart.items[itemIndex].price;
    const quantityDiff = newQuantity - oldQuantity;
    const priceDiff = quantityDiff * price;

    // Update quantity
    cart.items[itemIndex].quantity = newQuantity;
    cart.items[itemIndex].addedAt = Date.now();

    // Update totals
    cart.totalItems += quantityDiff;
    cart.totalPrice += priceDiff;

    // Save updated cart
    await cart.save();

    // Populate product details for response
    await cart.populate("items.product", "name image price stock");

    return res.status(200).json({
      message: "Cart quantity updated successfully",
      cart: cart,
      updatedItem: {
        product: cart.items[itemIndex].product,
        oldQuantity: oldQuantity,
        newQuantity: newQuantity,
      },
      success: true,
    });
  } catch (error) {
    console.error("Update cart quantity error:", error);
    return res.status(500).json({
      message: "Something went wrong while updating cart quantity",
      error: error.message,
      success: false,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
        success: false,
      });
    }

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required.",
        success: false,
      });
    }

    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found.",
        success: false,
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Item not found in cart.",
        success: false,
      });
    }

    const itemToRemove = cart.items[itemIndex];
    const itemTotalPrice = itemToRemove.price * itemToRemove.quantity;

    cart.items.splice(itemIndex, 1);

    cart.totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();

    await cart.populate("items.product", "name image price");

    return res.status(200).json({
      message: "Item removed from cart successfully",
      cart: cart,
      removedItem: {
        product: itemToRemove.product,
        quantity: itemToRemove.quantity,
      },
      success: true,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({
      message: "Something went wrong while adding to cart",
      error: error.message,
      success: false,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    // Find and delete user's cart
    const result = await cartModel.findOneAndDelete({ user: userId });

    if (!result) {
      return res.status(404).json({
        message: "Cart not found or already empty.",
      });
    }

    return res.status(200).json({
      message: "Cart cleared successfully",
      clearedCart: {
        totalItems: result.totalItems,
        totalPrice: result.totalPrice,
        itemsCount: result.items.length,
      },
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({
      message: "Something went wrong while clearing cart",
      error: error.message,
    });
  }
};

module.exports = {
  getCartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};
