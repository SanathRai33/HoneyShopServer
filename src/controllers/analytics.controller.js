const { getAnalyticsData, getRevenueAnalytics, getCustomerAnalytics, getProductAnalytics, getDashboardMetrics, } = require("../helperFunction/analytics.helper.js");

const getAnalytics = async (req, res) => {
  try {
    const { timeRange = "month", type = "all", } = req.query;

    let data;

    switch (type) {
      case "revenue":
        data = await getRevenueAnalytics(timeRange);
        break;
      case "customers":
        data = await getCustomerAnalytics(timeRange);
        break;
      case "products":
        data = await getProductAnalytics(timeRange);
        break;
      case "dashboard":
        data = await getDashboardMetrics();
        break;
      case "all":
      default:
        data = await getAnalyticsData(timeRange);
        break;
    }

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      timeRange: type === "dashboard" ? "realtime" : timeRange,
      type,
    });
  } catch (error) {
    console.error("Analytics Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { getAnalytics }