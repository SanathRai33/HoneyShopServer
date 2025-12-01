const express = require('express');
const router = express.Router();
const { authAdminMiddleware } = require('../middlewares/auth.middleware');
const { getAllUser, getAdminData, getDashboardStats, getAdminProfile } = require('../controllers/admin.controller');

router.get('/', authAdminMiddleware, getAdminProfile);
router.get('/users', authAdminMiddleware, getAllUser);
router.get('/data', authAdminMiddleware, getAdminData);
router.get('/stats', authAdminMiddleware, getDashboardStats);

module.exports = router;