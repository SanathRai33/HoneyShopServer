const adminModel = require("../models/admins.model.js");
const userModel = require("../models/users.model.js");
const vendorModel = require("../models/vendors.model.js");
const jwt = require("jsonwebtoken");

async function authAdminMiddleware(req, res, next) {
  const adminToken = req.cookies.adminToken;

  if (!adminToken) {
    return res.status(401).json({
      message: "Unauthorized Admin Token",
    });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_TOKEN);

    const Admin = await adminModel.findById(decoded.id);

    if (!Admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = Admin;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid Admin Token",
    });
  }
}

async function authUserMiddleware(req, res, next) {
  const userToken = req.cookies.userToken;

  if (!userToken) {
    return res.status(401).json({
      message: "Unauthorized User Token",
    });
  }

  try {
    const decoded = jwt.verify(userToken, process.env.JWT_TOKEN);

    const User = await userModel.findById(decoded.id);

    req.user = User;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid User Token",
    });
  }
}

async function authVendorMiddleware(req, res, next) {
  const vendorToken = req.cookies.vendorToken;

  if (!vendorToken) {
    return res.status(401).json({
      message: "Unauthorized Vendor Token",
    });
  }

  try {
    const decoded = jwt.verify(vendorToken, process.env.JWT_TOKEN);

    const Vendor = await vendorModel.findById(decoded.id);

    req.vendor = Vendor;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid Vendor Token",
    });
  }
}

async function authSellerMiddleware(req, res, next) {
  const adminToken = req.cookies.adminToken;
  const vendorToken = req.cookies.vendorToken;

  if (!adminToken && !vendorToken) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please login as admin or vendor.",
    });
  }

  try {
    if (adminToken) {
      const decoded = jwt.verify(adminToken, process.env.JWT_TOKEN);
      const admin = await adminModel.findById(decoded.id);

      if (admin) {
        req.admin = admin;
        req.seller = admin;
        req.sellerType = "admin";
        return next();
      }
    }

    if (vendorToken) {
      const decoded = jwt.verify(vendorToken, process.env.JWT_TOKEN);
      const vendor = await vendorModel.findById(decoded.id);

      if (vendor) {
        req.vendor = vendor;
        req.seller = vendor;
        req.sellerType = "vendor";
        return next();
      }
    }
  } catch (err) {
    console.error("Auth middleware error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token format.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
}

module.exports = {
  authAdminMiddleware,
  authUserMiddleware,
  authVendorMiddleware,
  authSellerMiddleware
};
