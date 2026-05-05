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
const supabase = require('../supabaseClient');

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

    const { data: existingLitigant } = await supabase
      .from('litigants')
      .select('litigant_id')
      .eq('email', email)
      .single();

    if (existingLitigant) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const emailOTP = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);
    const partyId = 'LIT' + Date.now();

    const { error: insertError } = await supabase
      .from('litigants')
      .insert([{
        litigant_id: partyId,
        party_type, 
        name: full_name, 
        parentage, 
        gender,
        address: { street, city, district, state, pincode },
        email, 
        phone: mobile,
        password: hashedPassword,
        email_otp: emailOTP,
        otp_expiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        status: 'pending',
        is_verified: false
      }]);

    if (insertError) throw insertError;
    await sendEmailOTP(email, emailOTP);

    res.status(201).json({
      message: 'Registration initiated. Please verify your email.',
      party_id: partyId
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/litigant/verify-email ───────────────────────
router.post('/verify-email', otpLimiter, async (req, res, next) => {
  try {
    const { party_id, otp } = req.body;
    const { data: litigant, error: findError } = await supabase
      .from('litigants')
      .select('*')
      .eq('litigant_id', party_id)
      .eq('email_otp', otp)
      .gt('otp_expiry', new Date().toISOString())
      .single();

    if (findError || !litigant) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const { error: updateError } = await supabase
      .from('litigants')
      .update({
        is_verified: true,
        email_otp: null,
        status: 'active'
      })
      .eq('litigant_id', party_id);

    if (updateError) throw updateError;

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/litigant/login ──────────────────────────────
router.post('/login', authLimiter, validateLitigantLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data: litigant, error: loginError } = await supabase
      .from('litigants')
      .select('*')
      .eq('email', email)
      .single();

    if (loginError || !litigant || !(await bcrypt.compare(password, litigant.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!litigant.is_verified) {
      return res.status(401).json({ message: 'Please complete email verification' });
    }
    if (litigant.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    await supabase
      .from('litigants')
      .update({ last_login: new Date().toISOString() })
      .eq('litigant_id', litigant.litigant_id);

    const token = jwt.sign(
      { party_id: litigant.litigant_id, email: litigant.email, user_type: 'litigant', party_type: litigant.party_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      litigant: {
        party_id: litigant.litigant_id,
        full_name: litigant.name,
        email: litigant.email,
        party_type: litigant.party_type,
        gender: litigant.gender,
        address: litigant.address,
        mobile: litigant.phone,
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
    const { data: litigant, error } = await supabase
      .from('litigants')
      .select('litigant_id, name, email, party_type, gender, address, phone, status')
      .eq('litigant_id', req.user.party_id)
      .single();

    if (error || !litigant) return res.status(404).json({ message: 'Litigant not found' });
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
    await supabase.from('blacklisted_tokens').insert([{
      token,
      user_id: req.user.party_id,
      user_type: 'litigant'
    }]);
    await supabase.from('litigants').update({ last_logout: new Date().toISOString() }).eq('litigant_id', req.user.party_id);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/litigant/forgot-password ────────────────────
router.post('/forgot-password', otpLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    const { data: litigant, error } = await supabase
      .from('litigants')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !litigant) {
      return res.json({ message: 'If this email is registered, a reset code will be sent.' });
    }

    const resetOTP = generateOTP();
    await supabase.from('litigants').update({
      reset_password_otp: resetOTP,
      reset_password_expiry: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    }).eq('litigant_id', litigant.litigant_id);

    await sendResetPasswordOTP(litigant.email, resetOTP);

    res.json({
      message: 'Password reset OTP sent to your email',
      party_id: litigant.litigant_id
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/litigant/reset-password ────────────────────
router.post('/reset-password', validatePasswordReset, async (req, res, next) => {
  try {
    const { party_id, otp, newPassword } = req.body;

    const { data: litigant, error: findError } = await supabase
      .from('litigants')
      .select('*')
      .eq('litigant_id', party_id)
      .eq('reset_password_otp', otp)
      .gt('reset_password_expiry', new Date().toISOString())
      .single();

    if (findError || !litigant) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase.from('litigants').update({
      password: hashedPassword,
      reset_password_otp: null,
      reset_password_expiry: null
    }).eq('litigant_id', party_id);

    if (updateError) throw updateError;

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
