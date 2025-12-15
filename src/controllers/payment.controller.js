const crypto = require('crypto');
const razorpay = require("../config/razorpay.js");
const cartModel = require("../models/carts.model.js");
const userModel = require("../models/users.model.js");
const paymentModel = require("../models/payment.model");
const orderModel = require("../models/orders.model.js");
const productModel = require("../models/products.model.js");


const getPaymentData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cartId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    const userdata = await userModel.findOne(
      { _id: userId },
      "fullName email phone"
    );

    if (!userdata) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userAddress = await userModel.findById(userId).select("address");

    const cart = await cartModel
      .findOne({ _id: cartId })
      .populate(
        "items.product",
        "name images price quantity category subCategory"
      );

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

    const originalPrice = cart.items.reduce((sum, item) => {
      const price = item.product?.price?.original || item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    return res.status(200).json({
      success: true,
      message: "Cart items retrieved successfully",
      user: userdata,
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        originalTotal: originalPrice,
        totalPrice: cart.totalPrice,
        user: cart.user,
      },
      address: userAddress.address,
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

const paymentProcessor = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const options = {
      amount: amount,
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      order,
      message: "Payment order created successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

const prepareDirectOrderData = async (userId, productId, quantity = 1) => {
  try {
    const user = await userModel.findById(userId).select("fullName email phone address");
    
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.address) {
      throw new Error("Shipping address not found");
    }

    const product = await productModel.findById(productId).select("name images price quantity category subCategory vendor");
    
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.quantity < quantity) {
      throw new Error(`Only ${product.quantity} units available in stock`);
    }

    const currentPrice = product.price?.current || product.price || 0;
    const originalPrice = product.price?.original || currentPrice;
    const itemsTotal = currentPrice * quantity;
    const originalTotal = originalPrice * quantity;

    const cartItems = [{
      product: {
        _id: product._id,
        name: product.name,
        images: product.images,
        price: product.price,
        quantity: product.quantity,
        category: product.category,
        subCategory: product.subCategory,
        vendor: product.vendor || null
      },
      quantity: quantity,
      price: currentPrice
    }];

    return {
      user,
      cartItems,
      totals: {
        itemsTotal,
        originalTotal,
        totalDiscount: originalTotal - itemsTotal,
        finalAmount: itemsTotal
      },
      productInfo: {
        productId,
        quantity,
        pricePerUnit: currentPrice,
        vendor: product.vendor
      }
    };
  } catch (error) {
    console.error("Error in prepareDirectOrderData:", error);
    throw error;
  }
};

const getDirectPaymentData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity = 1 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    const userdata = await userModel.findOne(
      { _id: userId },
      "fullName email phone"
    );

    if (!userdata) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userAddress = await userModel.findById(userId).select("address");

    const orderData = await prepareDirectOrderData(userId, productId, parseInt(quantity));
    
    return res.status(200).json({
      success: true,
      message: "Product order data retrieved successfully",
      user: {
        fullName: userdata.fullName,
        email: userdata.email,
        phone: userdata.phone
      },
      cart: {
        items: orderData.cartItems,
        totalItems: parseInt(quantity),
        originalTotal: orderData.totals.originalTotal,
        totalPrice: orderData.totals.itemsTotal,
      },
      address: userAddress.address,
      productInfo: orderData.productInfo,
      source: 'direct'
    });
  } catch (error) {
    console.error("Get direct payment data error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching product data",
      error: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      source, 
      productId, 
      quantity = 1, 
      cartId 
    } = req.body;

    console.log('Verify Payment - User ID:', userId); // ADD LOGGING
    console.log('Verify Payment - Source:', source);
    console.log('Verify Payment - Product ID:', productId);
    console.log('Verify Payment - Quantity:', quantity);

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    const secretKey = process.env.RAZORPAY_KEY_SECRET;
    
    if (!secretKey) {
      return res.status(500).json({ 
        success: false,
        message: "Server configuration error",
        error: "RAZORPAY_KEY_SECRET not configured"
      });
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(body)
      .digest('hex');

    console.log('Signature verification:', {
      expected: expectedSignature.substring(0, 20) + '...',
      received: razorpay_signature.substring(0, 20) + '...',
      match: expectedSignature === razorpay_signature
    });

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: "Payment verification failed - signature mismatch" 
      });
    }

    // Fetch user data
    const userData = await userModel.findById(userId).select('fullName email phone address');
    
    if (!userData) {
      return res.status(400).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (!userData.address) {
      return res.status(400).json({ 
        success: false,
        message: "Shipping address not found. Please add an address first." 
      });
    }

    // Prepare shipping address
    const shippingAddress = {
      street: userData.address.street,
      city: userData.address.city,
      state: userData.address.state,
      pincode: userData.address.pincode,
      country: userData.address.country || 'India',
      landmark: userData.address.landmark || '',
    };

    let newOrder;
    let itemsForOrder = [];
    let totalAmount = 0;
    let orderSource = source || 'cart';

    console.log('Processing order for source:', orderSource);

    if (orderSource === 'direct' && productId) {
      // DIRECT PRODUCT PURCHASE
      console.log('Processing direct purchase for product:', productId);
      
      // Fetch product details
      const product = await productModel.findById(productId).select('name price vendor quantity');
      
      if (!product) {
        return res.status(400).json({ 
          success: false,
          message: "Product not found" 
        });
      }

      // Check stock
      if (product.quantity < parseInt(quantity)) {
        return res.status(400).json({ 
          success: false,
          message: `Only ${product.quantity} units available in stock`,
          availableStock: product.quantity
        });
      }

      const currentPrice = product.price?.current || product.price || 0;
      totalAmount = currentPrice * parseInt(quantity);

      // Prepare order items
      itemsForOrder = [{
        product: product._id,
        quantity: parseInt(quantity),
        price: currentPrice,
        seller: product.vendor || null
      }];

      // Update product stock (optimistic update - do this before creating order)
      await productModel.findByIdAndUpdate(
        productId,
        { $inc: { quantity: -parseInt(quantity) } }
      );

      console.log('Product stock updated');

    } else {
      // CART-BASED PURCHASE (original logic)
      console.log('Processing cart purchase');
      
      const userCart = await cartModel
        .findOne({ user: userId })
        .populate('items.product', 'name price vendor quantity');

      if (!userCart || userCart.items.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: "Cart is empty" 
        });
      }

      // Check stock for all cart items
      for (const item of userCart.items) {
        if (item.product.quantity < item.quantity) {
          return res.status(400).json({ 
            success: false,
            message: `Only ${item.product.quantity} items available for ${item.product.name}`,
            productName: item.product.name,
            availableStock: item.product.quantity
          });
        }
      }

      // Prepare order items from cart
      itemsForOrder = userCart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price?.current || item.product.price || 0,
        seller: item.product.vendor || null
      }));

      totalAmount = userCart.totalPrice;

      // Update product stocks
      for (const item of userCart.items) {
        await productModel.findByIdAndUpdate(
          item.product._id,
          { $inc: { quantity: -item.quantity } }
        );
      }

      // Clear cart (only for cart purchases, not direct purchases)
      await cartModel.findOneAndUpdate(
        { user: userId },
        { items: [], totalPrice: 0, totalItems: 0 }
      );
      
      console.log('Cart cleared');
    }

    // Create order ID
    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    
    // Create the order
    newOrder = await orderModel.create({
      orderId,
      user: userId,
      items: itemsForOrder,
      totalAmount: totalAmount,
      finalAmount: totalAmount,
      shippingAddress,
      payment: {
        method: 'upi',
        status: 'completed',
        transactionId: razorpay_payment_id,
        paymentDate: new Date(),
        providerOrderId: razorpay_order_id
      },
      status: 'confirmed',
      source: orderSource
    });

    console.log('Order created:', newOrder.orderId);

    // Create payment record
    await paymentModel.create({
      orderId: newOrder._id,
      userId,
      amount: totalAmount,
      currency: 'INR',
      provider: 'razorpay',
      status: 'success',
      method: 'card',
      providerPaymentId: razorpay_payment_id,
      providerOrderId: razorpay_order_id,
      paidAt: new Date(),
      notes: {
        orderId: newOrder._id,
        userId,
        source: orderSource,
        productId: orderSource === 'direct' ? productId : null,
        quantity: orderSource === 'direct' ? quantity : null
      }
    });

    console.log('Payment record created');

    return res.status(200).json({
      success: true,
      message: "Payment verified and order created successfully",
      order: newOrder,
      payment: { 
        razorpay_payment_id, 
        razorpay_order_id,
        source: orderSource
      }
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  paymentProcessor,
  getPaymentData,
  getDirectPaymentData,
  verifyPayment,
  prepareDirectOrderData, 
};

