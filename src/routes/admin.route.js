const express = require('express');
const router = express.Router();
const { authAdminMiddleware } = require('../middlewares/auth.middleware');
const { getAllUser } = require('../controllers/admin.controller');

router.get('/users', authAdminMiddleware, getAllUser);

module.exports = router;