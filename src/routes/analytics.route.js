const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analytics.controller.js');
const { authAdminMiddleware } = require('../middlewares/auth.middleware.js');

router.get('/', authAdminMiddleware, getAnalytics);

module.exports = router;