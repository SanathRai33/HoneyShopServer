const adminModel = require("../models/admins.model.js");
const userModel = require("../models/users.model.js");
const orderModel = require("../models/orders.model.js");
const productModel = require("../models/products.model.js");

const getAllUser = async (req, res) => {
  const adminId = req.admin;
  const adminExist = await adminModel.find(adminId);

  if (!adminExist) {
    return res.status(403).json({
      message: "Admin authentication need for user list",
    });
  }

  const allUsers = await userModel.find();

  if (allUsers.length <= 0) {
    return res.status(404).json({
      message: "No user login yet",
    });
  }

  return res.status(200).json({
    message: "Successfully fetched users",
    users: allUsers,
  });
};

const getAdminData = async (req, res) => {
  try {
    const totalOrders = await orderModel.countDocuments();
    const totalProducts = await productModel.countDocuments();
    const totalCustomers = await userModel.countDocuments({ role: "customer" });

    const revenueData = await orderModel.aggregate([
      { $match: { "payment.status": "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    const pendingOrders = await orderModel.countDocuments({
      status: "pending",
    });

    const lowStockProducts = await productModel.countDocuments({
      $or: [{ stock: { $lte: 10 } }, { quantity: { $lte: 10 } }],
    });

    const recentOrders = await orderModel
      .find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderId totalAmount status createdAt")
      .lean();

    const formattedOrders = recentOrders.map((order) => ({
      id: order.orderId,
      customer: order.user?.fullName || "Unknown Customer",
      amount: order.totalAmount,
      status: order.status,
      date: order.createdAt.toISOString().split("T")[0],
    }));

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthRevenue = await orderModel.aggregate([
      {
        $match: {
          "payment.status": "completed",
          createdAt: { $gte: lastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const previousMonthRevenue =
      revenueData.length > 0 ? revenueData[0].total : 0;
    const revenueChange =
      previousMonthRevenue > 0
        ? (
            ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) *
            100
          ).toFixed(1)
        : 0;

    const trends = {
      revenue: parseFloat(revenueChange),
      orders: 8.2, 
      products: 5.7,
      customers: 15.3,
      pendingOrders: -3.2,
    };

    const response = {
      success: true,
      data: {
        stats: {
          totalRevenue,
          totalOrders,
          totalProducts,
          totalCustomers,
          pendingOrders,
          lowStockProducts,
        },
        recentOrders: formattedOrders,
        trends,
        performance: {
          conversionRate: 3.2,
          averageOrderValue: 2156,
          customerSatisfaction: 4.8,
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching admin data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin data",
      error: error.message,
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const stats = await getAdminData(req, res);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};

module.exports = { getAllUser, getAdminData, getDashboardStats };
