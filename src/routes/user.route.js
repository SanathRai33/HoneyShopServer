const express = require('express')
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/user.controller.js')
const { authUserMiddleware } = require('../middlewares/auth.middleware.js')

router.get('/', authUserMiddleware, getUserProfile)
router.patch('/', authUserMiddleware, updateUserProfile)
router.delete('/', authUserMiddleware, deleteUserAccount)

module.exports = router;