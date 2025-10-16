const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.route.js');

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

app.use("/api/auth", authRoutes);

module.exports = app;