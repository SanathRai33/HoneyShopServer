const express = require('express');
const { contactLimiter } = require('../config/rateLimiter.js');
const { submitContactForm, checkEmailService } = require('../controllers/contact.controller.js');
const { validateContactForm } = require('../validator/validation.js');
const router = express.Router();

// Public routes
router.post('/submit',contactLimiter, validateContactForm, submitContactForm );

router.get('/health', checkEmailService);

module.exports = router;