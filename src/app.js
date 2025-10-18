const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.route.js');
const userRoutes = require('./routes/user.route.js')
const productRouter = require('./routes/product.route.js')

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
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

module.exports = app;