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

    req.Admin = Admin;

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

    req.Vendor = Vendor;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid Vendor Token",
    });
  }
}

module.exports = { authAdminMiddleware, authUserMiddleware };
