const cartModel = require("../models/carts.model.js");
const productModel = require("../models/products.model.js");

const addToCart = async (req, res) => {
  try {
    const userId = req.body.id;
    const product = req.body.product;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    if (!product || !product._id || !product.quantity) {
      return res.status(400).json({
        message: "Product information is incomplete.",
      });
    }

    const productExists = await productModel.findById(product._id);
    if (!productExists) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    // Use product price from database to prevent tampering
    const productPrice = productExists.price;
    const itemTotal = productPrice * product.quantity;

    // Find existing cart or create new one
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


const removeFromCart = async (req, res) => {
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

    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found.",
      });
    }

        const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Item not found in cart.",
      });
    }

    const itemToRemove = cart.items[itemIndex];
    const itemTotalPrice = itemToRemove.price * itemToRemove.quantity;

    cart.items.splice(itemIndex, 1);

    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await cart.save();

    await cart.populate('items.product', 'name image price');

    return res.status(200).json({
      message: "Item removed from cart successfully",
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


module.exports = { addToCart, removeFromCart }