const adminModel = require("../models/admins.model.js");
const userModel = require("../models/users.model.js");
const vendorModel = require("../models/vendors.model.js");
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

  const userDevashyaShopToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_TOKEN
  );

  res.cookie("userDevashyaShopToken", userDevashyaShopToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
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

  const userDevashyaShopToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_TOKEN
  );

  res.cookie("userDevashyaShopToken", userDevashyaShopToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
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
  res.clearCookie("userDevashyaShopToken");
  res.status(201).json({
    message: "User Logged out successfully",
  });
}

// Admin Auth Controllers
// 1. Register Admin
const registerAdmin = async (req, res) => {
  const { name, email, phone, password } = req.body;

  const isAdminExist = await adminModel.findOne({
    $or: [{ email: email }, { phone: phone }],
  });

  if (isAdminExist) {
    return res.status(400).json({
      message: "Admin already exists. Try new email or phone...",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const admin = await adminModel.create({
    name,
    email,
    phone,
    password: hashPassword,
  });

  const adminDevashyaShopToken = jwt.sign(
    {
      id: admin._id,
    },
    process.env.JWT_TOKEN
  );
  
    res.cookie("adminDevashyaShopToken", adminDevashyaShopToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.status(201).json({
    message: "Admin registered successfully",
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
    },
  });
};

// 2. Login Admin
async function loginAdmin(req, res) {
  const { name, email, password } = req.body;

  const admin = await adminModel.findOne({
    email,
    name,
  });

  if (!admin) {
    return res.status(400).json({
      message: "Invalid admin or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid admin or password",
    });
  }

  const adminDevashyaShopToken = jwt.sign(
    {
      id: admin._id,
    },
    process.env.JWT_TOKEN
  );

  res.cookie("adminDevashyaShopToken", adminDevashyaShopToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.status(201).json({
    message: "Admin logged in successfully",
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
    },
  });
}

// 3. Logout Admin
function logoutAdmin(req, res) {
  res.clearCookie("adminDevashyaShopToken");
  res.status(201).json({
    message: "Admin Logged out successfully",
  });
}

// Vendor Auth Controllers
// 1. Register Vendor
const registerVendor = async (req, res) => {
  const { businessName, businessEmail, businessPhone, ownerName, password } =
    req.body;

  const isVendorExist = await vendorModel.findOne({
    $or: [
      { businessName: businessName },
      { businessEmail: businessEmail },
      { businessPhone: businessPhone },
    ],
  });

  if (isVendorExist) {
    return res.status(400).json({
      message:
        "Vendor already exists. Try new Bussiness name, Bussiness email or Bussiness phone...",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const vendor = await vendorModel.create({
    businessName,
    businessEmail,
    businessPhone,
    ownerName,
    password: hashPassword,
  });

  const vendorDevashyaShopToken = jwt.sign(
    {
      id: vendor._id,
    },
    process.env.JWT_TOKEN
  );

  res.cookie("vendorDevashyaShopToken", vendorDevashyaShopToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.status(201).json({
    message: "Vendor registered successfully",
    vendor: {
      id: vendor._id,
      businessName: vendor.businessName,
      businessEmail: vendor.businessEmail,
      businessPhone: vendor.businessPhone,
    },
  });
};

// 2. Login Vendor
async function loginVendor(req, res) {
  if (!req.body) {
    return res.status(400).json({
      message: "Request body is missing",
    });
  }
  const { businessEmail, businessName, password } = req.body;

  const vendor = await vendorModel.findOne({ businessEmail, businessName });

  if (!vendor) {
    return res.status(400).json({
      message: "Invalid vendor or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, vendor.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid vendor or password",
    });
  }

  const vendorDevashyaShopToken = jwt.sign(
    {
      id: vendor._id,
    },
    process.env.JWT_TOKEN
  );

  res.cookie("vendorDevashyaShopToken", vendorDevashyaShopToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.status(201).json({
    message: "Vendor logged in successfully",
    vendor: {
      id: vendor._id,
      businessEmail: vendor.businessEmail,
      businessName: vendor.businessName,
    },
  });
}

// 3. Logout Vendor
function logoutVendor(req, res) {
  res.clearCookie("vendorDevashyaShopToken");
  res.status(201).json({
    message: "Logged out successfully",
  });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  registerVendor,
  loginVendor,
  logoutVendor,
};
