const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.route.js');
const adminRouter = require('./routes/admin.route.js');
const userRoutes = require('./routes/user.route.js');
const productRouter = require('./routes/product.route.js');
const cartRouter = require('./routes/cart.route.js');
const wishlistRouter = require('./routes/wishlist.route.js');
const orderRouter = require('./routes/order.route.js');
const paymentRouter = require('./routes/payment.route.js');
const contactRouter = require('./routes/contact.route.js');
const blogRouter = require('./routes/blog.route.js');
const analyticsRouter = require('./routes/analytics.route.js');
const reviewRouter = require('./routes/reviews.route.js');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false 
}));

app.use(cors({
  origin: process.env.BACKEND_SERVER_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
  next();
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Devashya Naturals API",
    version: "1.0.0",
    status: "operational",
    endpoints: {
      auth: "/api/auth",
      admin: "/api/admin",
      user: "/api/user",
      product: "/api/product",
      cart: "/api/cart",
      wishlist: "/api/wishlist",
      order: "/api/order",
      payment: "/api/payment",
      contact: "/api/contact",
      blog: "/api/blog",
      analytics: "/api/analytics"
    }
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use('/api/admin', adminRouter);
app.use("/api/user", userRoutes);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/order', orderRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/contact', contactRouter);
app.use('/api/blog', blogRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reviews', reviewRouter);

// app.use('*', (req, res, next) => {
//   if (res.headersSent) return next();
  
//   res.status(404).json({
//     success: false,
//     error: 'Endpoint not found',
//     path: req.originalUrl
//   });
// });

app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;