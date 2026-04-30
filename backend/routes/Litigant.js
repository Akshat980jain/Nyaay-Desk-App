/**
 * Litigant Auth Routes — FIX #3 (Modularization)
 *
 * Extracted from the monolithic app.js. Handles all litigant authentication:
 * registration, email OTP verification, login, logout, profile,
 * forgot password, and reset password.
 *
 * Mounted at: /api/litigant
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Litigant = require('../models/Litigant');
const BlacklistedToken = require('../models/Blaclisttoken');
const { sendEmailOTP, sendResetPasswordOTP } = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, otpLimiter, registerLimiter } = require('../middleware/rateLimiter');
const {
  validateLitigantLogin,
  validateLitigantRegister,
  validatePasswordReset
} = require('../middleware/validate');

// Helper: generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── POST /api/litigant/register ───────────────────────────
router.post('/register', registerLimiter, validateLitigantRegister, async (req, res, next) => {
  try {
    const { party_type, full_name, parentage, gender, street, city, district, state, pincode, email, mobile, password } = req.body;

    if (!party_type || !full_name || !parentage || !gender || !street || !city || !district || !state || !email || !mobile || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingLitigant = await Litigant.findOne({ 'contact.email': email });
    if (existingLitigant) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const emailOTP = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    const litigant = new Litigant({
      party_id: 'LIT' + Date.now(),
      party_type, full_name, parentage, gender,
      address: { street, city, district, state, pincode },
      contact: { email, mobile },
      password: hashedPassword,
      emailOTP,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
    });

    await litigant.save();
    await sendEmailOTP(email, emailOTP);

    res.status(201).json({
      message: 'Registration initiated. Please verify your email.',
      party_id: litigant.party_id
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/litigant/verify-email ───────────────────────
router.post('/verify-email', otpLimiter, async (req, res, next) => {
  try {
    const { party_id, otp } = req.body;
    const litigant = await Litigant.findOne({
      party_id,
      emailOTP: otp,
      otpExpiry: { $gt: new Date() }
    });

    if (!litigant) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    litigant.isEmailVerified = true;
    litigant.emailOTP = undefined;
    litigant.status = 'active';
    await litigant.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/litigant/login ──────────────────────────────
router.post('/login', authLimiter, validateLitigantLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const litigant = await Litigant.findOne({ 'contact.email': email });

    if (!litigant || !(await bcrypt.compare(password, litigant.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!litigant.isEmailVerified) {
      return res.status(401).json({ message: 'Please complete email verification' });
    }
    if (litigant.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    litigant.lastLogin = new Date();
    await litigant.save();

    const token = jwt.sign(
      { party_id: litigant.party_id, email: litigant.contact.email, user_type: 'litigant', party_type: litigant.party_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      litigant: {
        party_id: litigant.party_id,
        full_name: litigant.full_name,
        email: litigant.contact.email,
        party_type: litigant.party_type,
        gender: litigant.gender,
        address: litigant.address,
        mobile: litigant.contact.mobile,
        status: litigant.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/litigant/profile ─────────────────────────────
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.user_type !== 'litigant') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const litigant = await Litigant.findOne({ party_id: req.user.party_id }).select('-password -emailOTP');
    if (!litigant) return res.status(404).json({ message: 'Litigant not found' });
    res.json({ litigant });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/litigant/logout ─────────────────────────────
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.user_type !== 'litigant') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const token = req.headers.authorization?.split(' ')[1];
    await new BlacklistedToken({ token, user_id: req.user.party_id, user_type: 'litigant' }).save();
    await Litigant.findOneAndUpdate({ party_id: req.user.party_id }, { lastLogout: new Date() });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/litigant/forgot-password ────────────────────
router.post('/forgot-password', otpLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    const litigant = await Litigant.findOne({ 'contact.email': email });
    if (!litigant) {
      // Security: don't reveal whether email exists
      return res.json({ message: 'If this email is registered, a reset code will be sent.' });
    }

    const resetOTP = generateOTP();
    litigant.resetPasswordOTP = resetOTP;
    litigant.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await litigant.save();

    await sendResetPasswordOTP(litigant.contact.email, resetOTP);

    res.json({
      message: 'Password reset OTP sent to your email',
      party_id: litigant.party_id
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/litigant/reset-password ────────────────────
router.post('/reset-password', validatePasswordReset, async (req, res, next) => {
  try {
    const { party_id, otp, newPassword } = req.body;

    const litigant = await Litigant.findOne({
      party_id,
      resetPasswordOTP: otp,
      resetPasswordExpiry: { $gt: new Date() }
    });
    if (!litigant) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    litigant.password = await bcrypt.hash(newPassword, 10);
    litigant.resetPasswordOTP = undefined;
    litigant.resetPasswordExpiry = undefined;
    await litigant.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
