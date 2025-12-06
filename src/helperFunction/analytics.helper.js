const orderModel = require("../models/orders.model.js");
const userModel = require("../models/users.model.js");
const productModel = require("../models/products.model.js");
const reviewModel = require("../models/reviews.model.js");
const paymentModel = require("../models/payment.model.js");

const dateHelper = {
  getDateRange: (timeRange) => {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate: now };
  },

  getPreviousPeriod: (currentStartDate, timeRange) => {
    const previousStartDate = new Date(currentStartDate);
    const previousEndDate = new Date(currentStartDate);

    switch (timeRange) {
      case "week":
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case "month":
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
      case "quarter":
        previousStartDate.setMonth(previousStartDate.getMonth() - 3);
        break;
      case "year":
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
    }

    return { previousStartDate, previousEndDate };
  },

  getGroupFormat: (timeRange) => {
    switch (timeRange) {
      case "week":
        return { $dayOfMonth: "$createdAt" };
      case "month":
        return { $week: "$createdAt" };
      case "quarter":
      case "year":
        return { $month: "$createdAt" };
      default:
        return { $week: "$createdAt" };
    }
  }
};

const calculationHelper = {
  calculatePercentageChange: (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  },

  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  },

  formatPercentage: (value) => {
    return `${value.toFixed(1)}%`;
  }
};

const revenueHelper = {
  getTotalRevenue: async (startDate, endDate) => {
    const result = await paymentModel.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
    return result[0]?.total || 0;
  },

  getRevenueTrend: async (startDate, endDate, timeRange) => {
    const groupFormat = dateHelper.getGroupFormat(timeRange);

    const result = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "completed"
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return result.map((item, index) => ({
      name: timeRange === "week" ? `Day ${item._id}` : 
            timeRange === "month" ? `Week ${item._id}` : 
            `Month ${item._id}`,
      revenue: item.revenue,
      orders: item.orders,
      period: index + 1
    }));
  },

  getAverageOrderValue: async (startDate, endDate) => {
    const revenue = await revenueHelper.getTotalRevenue(startDate, endDate);
    const orders = await orderHelper.getTotalOrders(startDate, endDate);
    return orders > 0 ? revenue / orders : 0;
  }
};

const orderHelper = {
  getTotalOrders: async (startDate, endDate) => {
    return await orderModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ["cancelled"] }
    });
  },

  getSalesByCategory: async (startDate, endDate) => {
    const result = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "completed"
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          value: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          count: { $sum: "$items.quantity" }
        }
      },
      { $sort: { value: -1 } }
    ]);

    return result.map(item => ({
      name: item._id || "Uncategorized",
      value: item.value,
      count: item.count
    }));
  }
};

const customerHelper = {
  getNewCustomers: async (startDate, endDate) => {
    return await userModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      role: "customer"
    });
  },

  getCustomerAnalytics: async (startDate, endDate) => {
    const result = await userModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          role: "customer"
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          new: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return result.map(item => ({
      name: `Month ${item._id}`,
      new: item.new,
      returning: Math.floor(item.new * 0.6) 
    }));
  },

  getCustomerLifetimeValue: async (startDate, endDate) => {
    const revenue = await revenueHelper.getTotalRevenue(startDate, endDate);
    const totalCustomers = await userModel.countDocuments({ role: "customer" });
    return totalCustomers > 0 ? revenue / totalCustomers : 0;
  }
};

const productHelper = {
  getTopProducts: async (startDate, endDate, limit = 5) => {
    const result = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "completed"
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails._id",
          name: { $first: "$productDetails.name" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          sales: { $sum: "$items.quantity" },
          category: { $first: "$productDetails.category" }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit }
    ]);

    return result;
  },

  getAverageRating: async (startDate, endDate) => {
    const result = await reviewModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    return {
      rating: result[0]?.averageRating || 0,
      totalReviews: result[0]?.totalReviews || 0
    };
  }
};

const metricsHelper = {
  getConversionRates: async (startDate, endDate) => {
    return [
      { name: "Overall", value: 3.2 },
      { name: "Honey Products", value: 4.5 },
      { name: "Ghee Products", value: 2.8 },
      { name: "Mobile", value: 2.1 },
      { name: "Desktop", value: 4.8 }
    ];
  },

  getTrafficSources: async () => {
    return [
      { name: "Direct", value: 35 },
      { name: "Organic Search", value: 28 },
      { name: "Social Media", value: 20 },
      { name: "Referral", value: 12 },
      { name: "Email", value: 5 }
    ];
  },

  getAdditionalMetrics: async (startDate, endDate) => {
    const [revenue, orders, ratingData] = await Promise.all([
      revenueHelper.getTotalRevenue(startDate, endDate),
      orderHelper.getTotalOrders(startDate, endDate),
      productHelper.getAverageRating(startDate, endDate)
    ]);

    const aov = orders > 0 ? revenue / orders : 0;
    const totalCustomers = await userModel.countDocuments({ role: "customer" });
    const clv = totalCustomers > 0 ? revenue / totalCustomers : 0;

    return {
      aov,
      satisfaction: Math.round(ratingData.rating * 20),
      returnRate: 2.3, 
      inventoryTurnover: 4.2,
      abandonmentRate: 18.7, 
      clv,
      totalReviews: ratingData.totalReviews
    };
  }
};

const getAnalyticsData = async (timeRange) => {
  const { startDate, endDate } = dateHelper.getDateRange(timeRange);
  const { previousStartDate, previousEndDate } = dateHelper.getPreviousPeriod(startDate, timeRange);

  const [
    totalRevenue,
    totalOrders,
    newCustomers,
    ratingData,
    revenueData,
    categoryData,
    topProducts,
    customerData,
    conversionRates,
    trafficSources,
    additionalMetrics
  ] = await Promise.all([
    revenueHelper.getTotalRevenue(startDate, endDate),
    orderHelper.getTotalOrders(startDate, endDate),
    customerHelper.getNewCustomers(startDate, endDate),
    productHelper.getAverageRating(startDate, endDate),
    revenueHelper.getRevenueTrend(startDate, endDate, timeRange),
    orderHelper.getSalesByCategory(startDate, endDate),
    productHelper.getTopProducts(startDate, endDate),
    customerHelper.getCustomerAnalytics(startDate, endDate),
    metricsHelper.getConversionRates(startDate, endDate),
    metricsHelper.getTrafficSources(),
    metricsHelper.getAdditionalMetrics(startDate, endDate)
  ]);

  const [
    prevRevenue,
    prevOrders,
    prevCustomers,
    prevRating
  ] = await Promise.all([
    revenueHelper.getTotalRevenue(previousStartDate, previousEndDate),
    orderHelper.getTotalOrders(previousStartDate, previousEndDate),
    customerHelper.getNewCustomers(previousStartDate, previousEndDate),
    productHelper.getAverageRating(previousStartDate, previousEndDate)
  ]);

  return {
    totalRevenue,
    totalOrders,
    newCustomers,
    averageRating: ratingData.rating,
    totalReviews: ratingData.totalReviews,
    revenueChange: calculationHelper.calculatePercentageChange(totalRevenue, prevRevenue),
    ordersChange: calculationHelper.calculatePercentageChange(totalOrders, prevOrders),
    customersChange: calculationHelper.calculatePercentageChange(newCustomers, prevCustomers),
    ratingChange: calculationHelper.calculatePercentageChange(ratingData.rating, prevRating.rating),
    revenueData,
    categoryData,
    topProducts,
    customerData,
    conversionRates,
    trafficSources,
    ...additionalMetrics
  };
};

const getRevenueAnalytics = async (timeRange) => {
  const { startDate, endDate } = dateHelper.getDateRange(timeRange);
  
  const [totalRevenue, revenueTrend, aov, byCategory] = await Promise.all([
    revenueHelper.getTotalRevenue(startDate, endDate),
    revenueHelper.getRevenueTrend(startDate, endDate, timeRange),
    revenueHelper.getAverageOrderValue(startDate, endDate),
    orderHelper.getSalesByCategory(startDate, endDate)
  ]);

  return {
    totalRevenue,
    revenueTrend,
    averageOrderValue: aov,
    byCategory,
    formattedTotal: calculationHelper.formatCurrency(totalRevenue),
    formattedAOV: calculationHelper.formatCurrency(aov)
  };
};

const getCustomerAnalytics = async (timeRange) => {
  const { startDate, endDate } = dateHelper.getDateRange(timeRange);
  
  const [newCustomers, customerTrend, clv] = await Promise.all([
    customerHelper.getNewCustomers(startDate, endDate),
    customerHelper.getCustomerAnalytics(startDate, endDate),
    customerHelper.getCustomerLifetimeValue(startDate, endDate)
  ]);

  const totalCustomers = await userModel.countDocuments({ role: "customer" });

  return {
    newCustomers,
    totalCustomers,
    customerTrend,
    customerLifetimeValue: clv,
    returningCustomers: Math.floor(newCustomers * 0.6), 
    formattedCLV: calculationHelper.formatCurrency(clv)
  };
};

const getProductAnalytics = async (timeRange) => {
  const { startDate, endDate } = dateHelper.getDateRange(timeRange);
  
  const [topProducts, ratingData, categorySales] = await Promise.all([
    productHelper.getTopProducts(startDate, endDate),
    productHelper.getAverageRating(startDate, endDate),
    orderHelper.getSalesByCategory(startDate, endDate)
  ]);

  return {
    topProducts,
    averageRating: ratingData.rating,
    totalReviews: ratingData.totalReviews,
    categorySales,
    bestSellingProduct: topProducts[0] || null,
    totalCategories: categorySales.length
  };
};

const getDashboardMetrics = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const [
    todayRevenue,
    todayOrders,
    todayCustomers,
    yesterdayRevenue,
    yesterdayOrders,
    yesterdayCustomers,
    totalCustomers,
    pendingOrders
  ] = await Promise.all([
    revenueHelper.getTotalRevenue(today, new Date()),
    orderHelper.getTotalOrders(today, new Date()),
    customerHelper.getNewCustomers(today, new Date()),
    revenueHelper.getTotalRevenue(yesterday, today),
    orderHelper.getTotalOrders(yesterday, today),
    customerHelper.getNewCustomers(yesterday, today),
    userModel.countDocuments({ role: "customer" }),
    orderModel.countDocuments({ status: "pending" })
  ]);

  return {
    today: {
      revenue: todayRevenue,
      orders: todayOrders,
      customers: todayCustomers
    },
    yesterday: {
      revenue: yesterdayRevenue,
      orders: yesterdayOrders,
      customers: yesterdayCustomers
    },
    totals: {
      customers: totalCustomers,
      pendingOrders
    },
    changes: {
      revenue: calculationHelper.calculatePercentageChange(todayRevenue, yesterdayRevenue),
      orders: calculationHelper.calculatePercentageChange(todayOrders, yesterdayOrders),
      customers: calculationHelper.calculatePercentageChange(todayCustomers, yesterdayCustomers)
    }
  };
};

module.exports = {
  getAnalyticsData,
  getRevenueAnalytics,
  getCustomerAnalytics,
  getProductAnalytics,
  getDashboardMetrics,
  
  dateHelper,
  calculationHelper,
  revenueHelper,
  orderHelper,
  customerHelper,
  productHelper,
  metricsHelper
};