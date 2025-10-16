const express = require('express')
const router = express.Router();
const { registerAdmin, loginAdmin, logoutAdmin, registerUser, loginUser, logoutUser, registerVendor, loginVendor, logoutVendor } = require('../controllers/auth.controller.js');

// Admin authentication
router.post("/admin/register", registerAdmin)
router.post("/admin/login", loginAdmin)
router.get("/admin/logout", logoutAdmin)    

// User authentication
router.post("/user/register", registerUser)
router.post("/user/login", loginUser)
router.get("/user/logout", logoutUser)

// Vendor authentication
router.post("/vendor/register", registerVendor)
router.post("/vendor/login", loginVendor)
router.get("/vendor/logout", logoutVendor)

module.exports = router;