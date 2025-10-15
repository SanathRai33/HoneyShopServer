const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('../src/routes/auth.route.js')
const foodRoutes = require('../src/routes/food.route.js')
const partnerRoutes = require('../src/routes/partner.route.js')
const userRoutes = require('../src/routes/user.route.js')
const orderRoutes = require('../src/routes/order.route.js')

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(cookieParser())
app.use(express.json());

app.get("/", (req, res)=>{
    res.send("Hello world")
})

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/order', orderRoutes)

module.exports = app;