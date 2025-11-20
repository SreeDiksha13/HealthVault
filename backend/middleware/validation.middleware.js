import { body, validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

export const validateEmail = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  validate,
];

export const validatePassword = [
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character (@$!%*?&#)'),
  validate,
];

export const validateRegistration = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character (@$!%*?&#)'),
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can only contain letters and spaces'),
  validate,
];

export const validateLogin = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').trim().notEmpty().withMessage('Password is required'),
  validate,
];

export const validateOtp = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('otp').trim().notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric().withMessage('OTP must contain only numbers'),
  validate,
];

export const validateOtpRegistration = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('otp').trim().notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric().withMessage('OTP must contain only numbers'),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character (@$!%*?&#)'),
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can only contain letters and spaces'),
  validate,
];

export const validateResetPassword = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .trim()
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character (@$!%*?&#)'),
  validate,
];

export default {
  validate,
  validateEmail,
  validatePassword,
  validateRegistration,
  validateLogin,
  validateOtp,
  validateOtpRegistration,
  validateResetPassword,
};
