const express = require('express')
const router = express.Router();
const { getUserProfile, updateUserProfile, deleteUserAccount, updatedAddress } = require('../controllers/user.controller.js')
const { authUserMiddleware } = require('../middlewares/auth.middleware.js')

router.get('/', authUserMiddleware, getUserProfile)
router.patch('/', authUserMiddleware, updateUserProfile)
router.delete('/', authUserMiddleware, deleteUserAccount)
router.put('/address', authUserMiddleware, updatedAddress)

module.exports = router;