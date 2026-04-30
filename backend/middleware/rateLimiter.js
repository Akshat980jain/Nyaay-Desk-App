/**
 * Rate Limiter Middleware — FIX #4
 *
 * Protects sensitive endpoints (login, OTP, register) from brute-force
 * attacks by limiting the number of requests per IP per time window.
 *
 * Install: npm install express-rate-limit
 */
const rateLimit = require('express-rate-limit');

/**
 * General API limiter — 100 requests per 15 minutes per IP.
 * Applied at the app level.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

/**
 * Auth limiter — 10 attempts per 15 minutes per IP.
 * Applied on login and password-reset endpoints.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  }
});

/**
 * OTP limiter — 5 attempts per 10 minutes per IP.
 * Applied on OTP-send and OTP-verify endpoints.
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many OTP requests, please try again after 10 minutes.'
  }
});

/**
 * Registration limiter — 5 accounts per hour per IP.
 * Prevents mass account creation.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many accounts created from this IP, please try again after an hour.'
  }
});

module.exports = { generalLimiter, authLimiter, otpLimiter, registerLimiter };
