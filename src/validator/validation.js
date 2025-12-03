const { body, validationResult } = require('express-validator');

const validateContactForm = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters')
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Please provide a valid phone number'),

  body('subject')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Subject cannot exceed 100 characters')
    .escape(),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters')
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: formattedErrors
      });
    }
    
    next();
  }
];

module.exports = { validateContactForm };