// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Contact form rate limiter
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many contact attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // REMOVE the custom keyGenerator - use default
  // keyGenerator: (req) => {
  //   return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  // },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many contact attempts. Please try again later.'
    });
  }
});

// Global API rate limiter (optional)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.'
  }
});

module.exports = { contactLimiter, apiLimiter };