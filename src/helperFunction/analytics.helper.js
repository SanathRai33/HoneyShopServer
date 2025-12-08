const orderModel = require("../models/orders.model.js");
const userModel = require("../models/users.model.js");
const productModel = require("../models/products.model.js");
const reviewModel = require("../models/reviews.model.js");
const paymentModel = require("../models/payment.model.js");

const getDateRange = (timeRange) => {
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
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return { startDate, endDate: now };
};

const getPreviousPeriod = (currentStartDate, timeRange) => {
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
};

const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

const calculateGrowth = (current, previous) => {
  const change = calculatePercentageChange(current, previous);
  return {
    value: change,
    isPositive: change >= 0,
    trend: change >= 0 ? 'up' : 'down'
  };
};

const getTotalRevenue = async (startDate, endDate) => {
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
};

const getRevenueTrend = async (startDate, endDate, timeRange) => {
  let groupFormat;
  
  switch (timeRange) {
    case "week":
      groupFormat = { $dayOfMonth: "$createdAt" };
      break;
    case "month":
      groupFormat = { $week: "$createdAt" };
      break;
    default:
      groupFormat = { $month: "$createdAt" };
  }

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
    period: item._id,
    name: timeRange === "week" ? `Day ${item._id}` : 
          timeRange === "month" ? `Week ${item._id}` : 
          `Month ${item._id}`,
    revenue: item.revenue,
    orders: item.orders
  }));
};

const getTotalOrders = async (startDate, endDate) => {
  return await orderModel.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $nin: ["cancelled"] }
  });
};

const getSalesByCategory = async (startDate, endDate) => {
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
};

const getNewCustomers = async (startDate, endDate) => {
  return await userModel.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
    role: "customer"
  });
};

const getCustomerAnalyticsTrend = async (startDate, endDate) => {
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
};

const getTopProducts = async (startDate, endDate) => {
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
    { $limit: 5 }
  ]);

  return result;
};

const getAverageRating = async (startDate, endDate) => {
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
};

const getConversionRates = () => {
  return [
    { name: "Overall", value: 3.2 },
    { name: "Honey Products", value: 4.5 },
    { name: "Ghee Products", value: 2.8 },
    { name: "Mobile", value: 2.1 },
    { name: "Desktop", value: 4.8 }
  ];
};

const getTrafficSources = () => {
  return [
    { name: "Direct", value: 35 },
    { name: "Organic Search", value: 28 },
    { name: "Social Media", value: 20 },
    { name: "Referral", value: 12 },
    { name: "Email", value: 5 }
  ];
};

const getAnalyticsData = async (timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange);
  const { previousStartDate, previousEndDate } = getPreviousPeriod(startDate, timeRange);

  const [
    totalRevenue,
    totalOrders,
    newCustomers,
    ratingData,
    revenueData,
    categoryData,
    topProducts,
    customerData
  ] = await Promise.all([
    getTotalRevenue(startDate, endDate),
    getTotalOrders(startDate, endDate),
    getNewCustomers(startDate, endDate),
    getAverageRating(startDate, endDate),
    getRevenueTrend(startDate, endDate, timeRange),
    getSalesByCategory(startDate, endDate),
    getTopProducts(startDate, endDate),
    getCustomerAnalyticsTrend(startDate, endDate)
  ]);

  const [
    prevRevenue,
    prevOrders,
    prevCustomers,
    prevRating
  ] = await Promise.all([
    getTotalRevenue(previousStartDate, previousEndDate),
    getTotalOrders(previousStartDate, previousEndDate),
    getNewCustomers(previousStartDate, previousEndDate),
    getAverageRating(previousStartDate, previousEndDate)
  ]);

  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = await userModel.countDocuments({ role: "customer" });
  const clv = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  return {
    summary: {
      totalRevenue,
      totalOrders,
      newCustomers,
      averageRating: ratingData.rating,
      totalReviews: ratingData.totalReviews
    },
    trends: {
      revenueChange: calculatePercentageChange(totalRevenue, prevRevenue),
      ordersChange: calculatePercentageChange(totalOrders, prevOrders),
      customersChange: calculatePercentageChange(newCustomers, prevCustomers),
      ratingChange: calculatePercentageChange(ratingData.rating, prevRating.rating)
    },
    charts: {
      revenueData,
      categoryData,
      topProducts,
      customerData
    },
    metrics: {
      conversionRates: getConversionRates(),
      trafficSources: getTrafficSources(),
      aov,
      satisfaction: Math.round(ratingData.rating * 20),
      returnRate: 2.3,
      inventoryTurnover: 4.2,
      abandonmentRate: 18.7,
      clv
    }
  };
};

const getRevenueAnalytics = async (timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange);
  const { previousStartDate, previousEndDate } = getPreviousPeriod(startDate, timeRange);

  const [totalRevenue, revenueTrend, categoryData, prevRevenue] = await Promise.all([
    getTotalRevenue(startDate, endDate),
    getRevenueTrend(startDate, endDate, timeRange),
    getSalesByCategory(startDate, endDate),
    getTotalRevenue(previousStartDate, previousEndDate)
  ]);

  const totalOrders = await getTotalOrders(startDate, endDate);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    growth: calculateGrowth(totalRevenue, prevRevenue),
    averageOrderValue: aov,
    trend: revenueTrend,
    byCategory: categoryData,
    period: timeRange
  };
};

const getCustomerAnalytics = async (timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange);
  const { previousStartDate, previousEndDate } = getPreviousPeriod(startDate, timeRange);

  const [newCustomers, customerTrend, prevCustomers] = await Promise.all([
    getNewCustomers(startDate, endDate),
    getCustomerAnalyticsTrend(startDate, endDate),
    getNewCustomers(previousStartDate, previousEndDate)
  ]);

  const totalCustomers = await userModel.countDocuments({ role: "customer" });
  const totalRevenue = await getTotalRevenue(startDate, endDate);
  const clv = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  return {
    newCustomers,
    totalCustomers,
    growth: calculateGrowth(newCustomers, prevCustomers),
    trend: customerTrend,
    customerLifetimeValue: clv,
    period: timeRange
  };
};

const getProductAnalytics = async (timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange);

  const [topProducts, ratingData, categoryData] = await Promise.all([
    getTopProducts(startDate, endDate),
    getAverageRating(startDate, endDate),
    getSalesByCategory(startDate, endDate)
  ]);

  return {
    topProducts,
    rating: ratingData.rating,
    totalReviews: ratingData.totalReviews,
    byCategory: categoryData,
    bestSelling: topProducts[0] || null,
    period: timeRange
  };
};

const getDashboardMetrics = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const [
    todayRevenue,
    todayOrders,
    todayCustomers,
    yesterdayRevenue,
    yesterdayOrders,
    yesterdayCustomers,
    weekRevenue,
    totalCustomers,
    pendingOrders
  ] = await Promise.all([
    getTotalRevenue(today, new Date()),
    getTotalOrders(today, new Date()),
    getNewCustomers(today, new Date()),
    getTotalRevenue(yesterday, today),
    getTotalOrders(yesterday, today),
    getNewCustomers(yesterday, today),
    getTotalRevenue(lastWeek, new Date()),
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
    week: {
      revenue: weekRevenue
    },
    totals: {
      customers: totalCustomers,
      pendingOrders
    },
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  getAnalyticsData,
  getRevenueAnalytics,
  getCustomerAnalytics,
  getProductAnalytics,
  getDashboardMetrics
};