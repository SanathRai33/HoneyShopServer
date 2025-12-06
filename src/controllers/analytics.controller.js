const { getAnalyticsData, getRevenueAnalytics, getCustomerAnalytics, getProductAnalytics, getDashboardMetrics } = require("../helperFunction/analytics.helper.js");

exports.getAnalytics = async (req, res) => {
  try {
    const { timeRange = "month" } = req.query;
    const analyticsData = await getAnalyticsData(timeRange);

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { timeRange = "month" } = req.query;
    const revenueData = await getRevenueAnalytics(timeRange);
    
    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error("Revenue Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching revenue analytics"
    });
  }
};

exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { timeRange = "month" } = req.query;
    const customerData = await getCustomerAnalytics(timeRange);
    
    res.json({
      success: true,
      data: customerData
    });
  } catch (error) {
    console.error("Customer Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer analytics"
    });
  }
};

exports.getProductAnalytics = async (req, res) => {
  try {
    const { timeRange = "month" } = req.query;
    const productData = await getProductAnalytics(timeRange);
    
    res.json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error("Product Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product analytics"
    });
  }
};

exports.getDashboardMetrics = async (req, res) => {
  try {
    const metrics = await getDashboardMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard metrics"
    });
  }
};

// Simple controller for testing
exports.getAnalytics = async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    // Mock data for testing
    const mockData = {
      totalRevenue: 1245678,
      totalOrders: 2345,
      newCustomers: 189,
      averageRating: 4.7,
      revenueChange: 12.5,
      ordersChange: 8.2,
      customersChange: 15.3,
      ratingChange: 2.1,
      revenueData: [
        { name: 'Week 1', revenue: 150000, orders: 200 },
        { name: 'Week 2', revenue: 180000, orders: 220 },
        { name: 'Week 3', revenue: 210000, orders: 250 },
        { name: 'Week 4', revenue: 190000, orders: 230 }
      ],
      categoryData: [
        { name: 'Honey', value: 654321 },
        { name: 'Ghee', value: 432198 },
        { name: 'Accessories', value: 123456 }
      ],
      topProducts: [
        { name: 'Manuka Honey', revenue: 234567, sales: 189 },
        { name: 'Pure Desi Ghee', revenue: 198765, sales: 156 }
      ],
      customerData: [
        { name: 'Month 1', new: 45, returning: 27 },
        { name: 'Month 2', new: 52, returning: 31 }
      ],
      conversionRates: [
        { name: 'Overall', value: 3.2 },
        { name: 'Mobile', value: 2.1 }
      ],
      trafficSources: [
        { name: 'Direct', value: 35 },
        { name: 'Organic Search', value: 28 }
      ],
      aov: 2345,
      satisfaction: 94,
      returnRate: 2.3,
      inventoryTurnover: 4.2,
      abandonmentRate: 18.7,
      clv: 15678
    };

    res.json({
      success: true,
      data: mockData
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
};