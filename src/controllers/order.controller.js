const orderModel = require("../models/orders.model.js");
const productModel = require("../models/products.model.js");
const cartModel = require("../models/carts.model.js");
const adminModel = require("../models/admins.model.js");

const createOrder = async (req, res) => {
  try {
    const userId = req.body._id;
    const {
      items,
      shippingAddress,
      paymentMethod,
      discount = 0,
      shippingCharges = 0,
      taxAmount = 0,
      notes,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one item.",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required.",
      });
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await productModel.findById(item.product);
      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${item.product}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
        weight: product.weight || { value: 0, unit: "g" },
      });
    }

    const finalAmount = totalAmount - discount + shippingCharges + taxAmount;

    // Generate unique order ID
    const orderId = `ORD${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 5)}`.toUpperCase();

    // Get seller ID from first product (assuming single seller per order)
    const firstProduct = await productModel.findById(items[0].product);
    const sellerId = firstProduct.vendor || firstProduct.adminId;

    const order = await orderModel.create({
      orderId,
      user: userId,
      seller: sellerId,
      items: validatedItems,
      totalAmount,
      discount,
      shippingCharges,
      taxAmount,
      finalAmount,
      shippingAddress,
      payment: {
        method: paymentMethod,
        status: paymentMethod === "cod" ? "pending" : "completed",
        // transactionId: { type: String },
        paymentDate: Date.now,
      },
      notes,
      status: "pending",
    });

    // Update product stock
    for (const item of items) {
      await productModel.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user's cart after successful order
    await cartModel.findOneAndDelete({ user: userId });

    // Populate order details for response
    await order.populate("items.product", "name image");
    await order.populate("user", "name email");
    await order.populate("seller", "name email");

    return res.status(201).json({
      message: "Order created successfully",
      order: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      message: "Something went wrong while creating order",
      error: error.message,
    });
  }
};

const updateOrderByAdmin = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const orderId = req.params.orderId;
    const newStatus = req.body.status;

    const admin = await adminModel.findOne({ _id: adminId });

    if (!admin) {
      console.log("Unauthorized activity...");
      return res.status(401).json({
        message: "Unauthorized activity...",
        success: false,
      });
    }

    const product = await orderModel.findOne({ _id: orderId });

    if (!product) {
      console.log("Product not found");
      return res.status(401).json({
        message: "Product not found",
        success: false,
      });
    }

    if (!newStatus) {
      return res.status(400).json({
        message: "Status is required",
        success: false,
      });
    }

    await orderModel.findByIdAndUpdate({ _id: orderId }, { status: newStatus });

    //  return res.status(200).json({
    //   message: "Order status updated successfully"
    // });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      message: "Something went wrong while creating order",
      error: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
        success: false,
      });
    }

    const order = await orderModel
      .findOne({
        $or: [
          { orderId: orderId },
          { _id: orderId }, // Also allow searching by MongoDB _id
        ],
        user: userId,
      })
      .populate("user", "name email phone")
      // .populate('seller', 'name email phone')
      .populate("items.product", "name images category weight seller");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Order retrieved successfully",
      order: order,
      success: true,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching order",
      error: error.message,
      success: false,
    });
  }
};

const getOrderByUserId = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        message: "User ID is required",
        success: false,
      });
    }

    const orders = await orderModel
      .find({ user: userId })
      .populate("items.product", "name images category")
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        message: "No orders found",
        orders: [],
        success: true,
      });
    }

    return res.status(200).json({
      message: "Orders retrieved successfully",
      orders: orders,
      success: true,
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching orders",
      error: error.message,
      success: false,
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.body.id;
    const { orderId, reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    // Find order
    const order = await orderModel
      .findOne({ orderId, user: userId })
      .populate("items.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ["shipped", "delivered", "cancelled"];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled. Current status: ${order.status}`,
      });
    }

    // Update order status
    order.status = "cancelled";
    order.notes = reason ? `Cancelled: ${reason}` : "Order cancelled by user";

    // Update payment status if payment was completed
    if (order.payment.status === "completed") {
      order.payment.status = "refunded";
    }

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await productModel.findByIdAndUpdate(item.product._id, {
        $inc: { stock: item.quantity },
      });
    }

    return res.status(200).json({
      message: "Order cancelled successfully",
      order: order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({
      message: "Something went wrong while cancelling order",
      error: error.message,
    });
  }
};

const getOrderByVendorId = async (req, res) => {
  try {
    const vendorId = req.vendor;
    const { page = 1, limit = 10, status } = req.query;

    if (!vendorId) {
      return res.status(401).json({
        message: "Unauthorized. Vendor ID required.",
      });
    }

    // Build filter
    const filter = { seller: vendorId };
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const orders = await orderModel
      .find(filter)
      .populate("user", "name email phone")
      .populate("items.product", "name image category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await orderModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        message: "No orders found",
        orders: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalOrders: 0,
        },
      });
    }

    return res.status(200).json({
      message: "Orders retrieved successfully",
      orders: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalOrders: totalOrders,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get vendor orders error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching orders",
      error: error.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const adminId = req.admin._id;

    if (!adminId) {
      return res.status(401).json({
        message: "Unauthorized. Admin access required.",
        success: false,
      });
    }

    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query - get all orders without filters
    const orders = await orderModel
      .find({})
      .populate("user", "fullName email phone")
      // .populate('seller', 'name email phone')
      .populate("items.product", "name images category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalOrders = await orderModel.countDocuments({});
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        message: "No orders found",
        orders: [],
        success: true,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalOrders: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    return res.status(200).json({
      message: "Orders retrieved successfully",
      orders: orders,
      success: true,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalOrders: totalOrders,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching orders",
      error: error.message,
      success: false,
    });
  }
};

module.exports = {
  getAllOrders,
  updateOrderByAdmin,
  getOrderByUserId,
  createOrder,
  cancelOrder,
  getOrderByVendorId,
  getOrderById,
};
