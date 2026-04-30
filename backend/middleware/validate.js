/**
 * Input Validation Middleware — FIX #5
 *
 * Uses express-validator to validate request bodies before they reach
 * route handlers. Consolidates all validation rules in one place.
 *
 * Install: npm install express-validator
 */
const { body, validationResult } = require('express-validator');

/**
 * Middleware: runs after validation rules and returns errors if any.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// ────────────────────────────────────────────────────────────
// Advocate Validators
// ────────────────────────────────────────────────────────────
const validateAdvocateLogin = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors
];

const validateAdvocateRegister = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('enrollment_no').notEmpty().withMessage('Enrollment number is required.'),
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.'),
  body('dob').isISO8601().withMessage('A valid date of birth is required.'),
  body('iCOP_number').notEmpty().withMessage('iCOP number is required.'),
  body('barId').notEmpty().withMessage('Bar ID is required.'),
  handleValidationErrors
];

// ────────────────────────────────────────────────────────────
// Litigant Validators
// ────────────────────────────────────────────────────────────
const validateLitigantLogin = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors
];

const validateLitigantRegister = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('party_type').isIn(['plaintiff', 'respondent']).withMessage('Party type must be plaintiff or respondent.'),
  body('gender').notEmpty().withMessage('Gender is required.'),
  body('email').isEmail(),
  body('mobile').isMobilePhone().withMessage('A valid mobile number is required.'),
  handleValidationErrors
];

const validatePasswordReset = [
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match.');
    }
    return true;
  }),
  handleValidationErrors
];

// ────────────────────────────────────────────────────────────
// Clerk Validators
// ────────────────────────────────────────────────────────────
const validateClerkLogin = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors
];

const validateClerkRegister = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('district').notEmpty().withMessage('District is required.'),
  body('court_name').notEmpty().withMessage('Court name is required.'),
  body('court_no').notEmpty().withMessage('Court number is required.'),
  body('mobile').isMobilePhone().withMessage('A valid mobile number is required.'),
  handleValidationErrors
];

module.exports = {
  validateAdvocateLogin,
  validateAdvocateRegister,
  validateLitigantLogin,
  validateLitigantRegister,
  validatePasswordReset,
  validateClerkLogin,
  validateClerkRegister,
  handleValidationErrors
};
