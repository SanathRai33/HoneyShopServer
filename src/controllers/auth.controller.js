const adminModel = require("../models/admin.model.js");
const userModel = require("../models/user.model.js");
const vendorModel = require("../models/vendors.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// User Auth Controllers
// 1. Register User
const registerUser = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const isUserExist = await userModel.findOne({
    $or: [{ email: email }, { phone: phone }],
  });

  if (isUserExist) {
    return res.status(400).json({
      message: "User already exists. Try new email or phone...",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    fullName,
    email,
    phone,
    password: hashPassword,
  });

  const userToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_TOKEN
  );

  res.cookie("userToken", userToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },
  });
};

// 2. Login User
async function loginUser(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({
    email,
  });

  if (!user) {
    return res.status(400).json({
      message: "Invalid user or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid user or password",
    });
  }

  const userToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_TOKEN
  );

  res.cookie("userToken", userToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.status(201).json({
    message: "User logged in successfully",
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    },
  });
}

// 3. Logout User
function logoutUser(req, res) {
  res.clearCookie("userToken");
  res.status(201).json({
    message: "Logged out successfully",
  });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
