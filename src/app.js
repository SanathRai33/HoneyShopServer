const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.route.js');
const userRoutes = require('./routes/user.route.js')
const productRouter = require('./routes/product.route.js')
const cartRouter = require('./routes/cart.route.js')
const wishlistRouter = require('./routes/wishlist.route.js')
const orderRouter = require('./routes/order.route.js')

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser())

app.get("/", (req, res)=>{
    res.send("Hello world")
})

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/order', orderRouter);

module.exports = app;