const razorpay = require("../config/razorpay.js");
const cartModel = require("../models/carts.model.js");
const userModel = require("../models/users.model.js");
const paymentModel = require("../models/payment.model");

const getPaymentData = async (req, res) => {
  try {
    const userId = req.user._id;

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
      .findOne({ user: userId })
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

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const userId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data",
      });
    }

    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      const userCart = await cartModel
        .findOne({ user: userId })
        .populate("items.product");
      const userAddress = await userModel.findById(userId).select("address");

      if (!userCart || userCart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      const orderResponse = await apiInstance.post("/order/create", {
        items: userCart.items,
        totalAmount: userCart.totalPrice,
        address: userAddress.address,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        paymentMethod: "razorpay",
        paymentStatus: "success",
      });

      await cartModel.findOneAndUpdate(
        { user: userId },
        {
          items: [],
          totalItems: 0,
          totalPrice: 0,
        }
      );

      await paymentModel.create({
        orderId: orderResponse.data.order._id,
        userId: userId,
        amount: userCart.totalPrice,
        currency: "INR",
        provider: "razorpay",
        status: "success",
        providerPaymentId: razorpay_payment_id,
        providerOrderId: razorpay_order_id,
        paidAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        order: orderResponse.data.order,
        paymentId: razorpay_payment_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

module.exports = {
  paymentProcessor,
  getPaymentData,
  verifyPayment,
};
