const adminModel = require("../models/admins.model.js");
const userModel = require("../models/users.model.js");
const vendorModel = require("../models/vendors.model.js");
const jwt = require("jsonwebtoken");

async function authAdminMiddleware(req, res, next) {
  const adminDevashyaShopToken = req.cookies.adminDevashyaShopToken;

  if (!adminDevashyaShopToken) {
    return res.status(401).json({
      message: "Unauthorized Admin Token",
    });
  }

  try {
    const decoded = jwt.verify(adminDevashyaShopToken, process.env.JWT_TOKEN);

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
  const userDevashyaShopToken = req.cookies.userDevashyaShopToken;

  if (!userDevashyaShopToken) {
    return res.status(401).json({
      message: "Unauthorized User Token",
    });
  }

  try {
    const decoded = jwt.verify(userDevashyaShopToken, process.env.JWT_TOKEN);

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
  const vendorDevashyaShopToken = req.cookies.vendorDevashyaShopToken;

  if (!vendorDevashyaShopToken) {
    return res.status(401).json({
      message: "Unauthorized Vendor Token",
    });
  }

  try {
    const decoded = jwt.verify(vendorDevashyaShopToken, process.env.JWT_TOKEN);

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
  const adminDevashyaShopToken = req.cookies.adminDevashyaShopToken;
  const vendorDevashyaShopToken = req.cookies.vendorDevashyaShopToken;

  if (!adminDevashyaShopToken && !vendorDevashyaShopToken) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please login as admin or vendor.",
    });
  }

  try {
    if (adminDevashyaShopToken) {
      const decoded = jwt.verify(adminDevashyaShopToken, process.env.JWT_TOKEN);
      const admin = await adminModel.findById(decoded.id);

      if (admin) {
        req.admin = admin;
        req.seller = admin;
        req.sellerType = "admin";
        return next();
      }
    }

    if (vendorDevashyaShopToken) {
      const decoded = jwt.verify(vendorDevashyaShopToken, process.env.JWT_TOKEN);
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
