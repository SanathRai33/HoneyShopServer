const orderModel = require('../models/orders.model.js')
const productModel = require('../models/products.model.js')
const cartModel = require('../models/carts.model.js')

const createOrder = async (req, res) => {
  try {
    const userId = req.body.id;
    const {
      items,
      shippingAddress,
      paymentMethod,
      discount = 0,
      shippingCharges = 0,
      taxAmount = 0,
      notes
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

    // Validate items and calculate totals
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
        weight: product.weight || { value: 0, unit: 'g' }
      });
    }

    // Calculate final amount
    const finalAmount = totalAmount - discount + shippingCharges + taxAmount;

    // Generate unique order ID
    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    // Get seller ID from first product (assuming single seller per order)
    const firstProduct = await productModel.findById(items[0].product);
    const sellerId = firstProduct.vendor || firstProduct.adminId;

    // Create order
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
        status: paymentMethod === 'cod' ? 'completed' : 'pending'
      },
      notes,
      status: 'pending'
    });

    // Update product stock
    for (const item of items) {
      await productModel.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear user's cart after successful order
    await cartModel.findOneAndDelete({ user: userId });

    // Populate order details for response
    await order.populate('items.product', 'name image');
    await order.populate('user', 'name email');
    await order.populate('seller', 'name email');

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

const getOrderByUserId = async (req, res) => {
  try {
    const userId = req.body.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized. Please Login and Try again...",
      });
    }

    // Build filter
    const filter = { user: userId };
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const orders = await orderModel.find(filter)
      .populate('seller', 'name email phone')
      .populate('items.product', 'name image category')
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
          totalOrders: 0
        }
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
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error("Get user orders error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching orders",
      error: error.message,
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
    const order = await orderModel.findOne({ orderId, user: userId })
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ['shipped', 'delivered', 'cancelled'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled. Current status: ${order.status}`,
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.notes = reason ? `Cancelled: ${reason}` : 'Order cancelled by user';
    
    // Update payment status if payment was completed
    if (order.payment.status === 'completed') {
      order.payment.status = 'refunded';
    }

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await productModel.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: item.quantity } }
      );
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
    const orders = await orderModel.find(filter)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image category')
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
          totalOrders: 0
        }
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
        hasPrev: parseInt(page) > 1
      }
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
      });
    }

    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      sellerId,
      userId
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (sellerId) filter.seller = sellerId;
    if (userId) filter.user = userId;

    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const orders = await orderModel.find(filter)
      .populate('user', 'name email phone')
      .populate('seller', 'name email phone')
      .populate('items.product', 'name image category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await orderModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    // Get order statistics
    const stats = await orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    const statistics = stats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0
    };

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        message: "No orders found",
        orders: [],
        statistics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalOrders: 0
        }
      });
    }

    return res.status(200).json({
      message: "Orders retrieved successfully",
      orders: orders,
      statistics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalOrders: totalOrders,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error("Get all orders error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching orders",
      error: error.message,
    });
  }
};

module.exports = { getAllOrders, createOrder, getOrderByUserId, cancelOrder, getOrderByVendorId }