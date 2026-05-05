/**
 * Advocate Auth Routes — FIX #3 (Modularization)
 *
 * Extracted from the monolithic app.js. Handles all advocate authentication:
 * enrollment verification, registration, email verification, login, logout,
 * profile, and profile picture management.
 *
 * Mounted at: /api/advocate
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const supabase = require('../supabaseClient');

const { sendEmailOTP } = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, otpLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { validateAdvocateLogin, validateAdvocateRegister } = require('../middleware/validate');
const { logAdvocateVerificationMiddleware } = require('../blockchain/middleware/blockchainMiddleware');
const multer = require('multer');

// ─── Multer: COP Document ───────────────────────────────────
const copStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/cop_documents'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadCOP = multer({
  storage: copStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ─── Multer: Profile Picture ────────────────────────────────
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profile_pictures'),
  filename: (req, file, cb) => cb(null, `temp-${Date.now()}-${file.originalname}`)
});
const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

// Helper: generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── POST /api/advocate/verify-enrollment ──────────────────
router.post('/verify-enrollment', async (req, res, next) => {
  try {
    const { enrollment_no, name, district, date_of_registration } = req.body;
    if (!enrollment_no || !name || !district || !date_of_registration) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const dateParts = date_of_registration.split('/');
    const formattedDate = `${parseInt(dateParts[0])}/${parseInt(dateParts[1])}/${dateParts[2]}`;

    const { data: record, error } = await supabase
      .from('enrollment_records')
      .select('*')
      .eq('enrollment_no', enrollment_no)
      .eq('name_of_advocate', name)
      .eq('district', district)
      .eq('date_of_registration', formattedDate)
      .single();

    if (error || !record) {
      return res.status(400).json({ message: 'Enrollment details do not match our records' });
    }
    res.json({
      message: 'Enrollment verified successfully',
      record: {
        enrollment_no: record.enrollment_no,
        name: record.name_of_advocate,
        fathers_name: record.fathers_name_of_advocate,
        district: record.district,
        date_of_registration: record.date_of_registration
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/advocate/register ───────────────────────────
router.post('/register', registerLimiter, uploadCOP.single('cop_document'), validateAdvocateRegister, async (req, res, next) => {
  try {
    const { enrollment_no, name, email, password, gender, dob, district, iCOP_number, barId } = req.body;
    const practice_details = {
      district_court: req.body['practice_details[district_court]'] === 'true',
      high_court: req.body['practice_details[high_court]'] === 'true',
      state: req.body['practice_details[state]'] || '',
      district: req.body['practice_details[district]'] || '',
      high_court_bench: req.body['practice_details[high_court_bench]'] || ''
    };

    if (!req.file) {
      return res.status(400).json({ message: 'COP document is required' });
    }

    const { data: existingAdvocate } = await supabase
      .from('advocates')
      .select('advocate_id')
      .or(`email.eq.${email},enrollment_no.eq.${enrollment_no},i_cop_number.eq.${iCOP_number},bar_id.eq.${barId}`)
      .single();

    if (existingAdvocate) {
      return res.status(400).json({
        message: 'Advocate already registered with this email, enrollment number, iCOP number, or Bar ID'
      });
    }

    const emailOTP = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);
    const advocateId = 'ADV' + Date.now();

    const { error: insertError } = await supabase
      .from('advocates')
      .insert([{
        advocate_id: advocateId,
        enrollment_no, 
        name, 
        gender, 
        dob,
        contact: { email },
        district, 
        practice_details, 
        email,
        password: hashedPassword,
        email_otp: emailOTP,
        otp_expiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        i_cop_number: iCOP_number, 
        bar_id: barId,
        cop_document: {
          filename: req.file.filename,
          path: req.file.path,
          uploadDate: new Date().toISOString()
        },
        status: 'pending',
        is_verified: false
      }]);

    if (insertError) throw insertError;
    await sendEmailOTP(email, emailOTP);

    res.status(201).json({
      message: 'Registration initiated. Please verify your email. Account will be activated after document verification.',
      advocate_id: advocate.advocate_id
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/advocate/verify-email ───────────────────────
router.post('/verify-email', otpLimiter, async (req, res, next) => {
  try {
    const { data: advocate, error: findError } = await supabase
      .from('advocates')
      .select('*')
      .eq('advocate_id', advocate_id)
      .eq('email_otp', otp)
      .gt('otp_expiry', new Date().toISOString())
      .single();

    if (findError || !advocate) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const { error: updateError } = await supabase
      .from('advocates')
      .update({
        is_email_verified: true,
        email_otp: null,
        status: 'pending'
      })
      .eq('advocate_id', advocate_id);

    if (updateError) throw updateError;

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/advocate/login ──────────────────────────────
router.post('/login', authLimiter, validateAdvocateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data: advocate, error: loginError } = await supabase
      .from('advocates')
      .select('*')
      .eq('email', email)
      .single();

    if (loginError || !advocate || !(await bcrypt.compare(password, advocate.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!advocate.is_email_verified) {
      return res.status(401).json({ message: 'Please complete email verification' });
    }
    if (advocate.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active. Please wait for verification by court admin.' });
    }

    await supabase
      .from('advocates')
      .update({ last_login: new Date().toISOString() })
      .eq('advocate_id', advocate.advocate_id);

    const token = jwt.sign(
      { advocate_id: advocate.advocate_id, email: advocate.email, user_type: 'advocate' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      advocate: { advocate_id: advocate.advocate_id, name: advocate.name, email: advocate.email }
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/advocate/logout ─────────────────────────────
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await supabase.from('blacklisted_tokens').insert([{
      token,
      user_id: req.user.advocate_id,
      user_type: 'advocate'
    }]);
    await supabase.from('advocates').update({ last_logout: new Date().toISOString() }).eq('advocate_id', req.user.advocate_id);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/advocate/profile ─────────────────────────────
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { data: advocate, error } = await supabase
      .from('advocates')
      .select('*')
      .eq('advocate_id', req.user.advocate_id)
      .single();

    if (error || !advocate) return res.status(404).json({ message: 'Advocate not found' });

    res.json({
      advocate: {
        advocate_id: advocate.advocate_id,
        name: advocate.name,
        email: advocate.email,
        enrollment_no: advocate.enrollment_no,
        district: advocate.district,
        status: advocate.status,
        practice_details: advocate.practice_details,
        profilePicture: advocate.profile_picture ? advocate.profile_picture.filename : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/advocate/search ──────────────────────────────
router.get('/search', async (req, res, next) => {
  try {
    const { district } = req.query;
    let query = supabase
      .from('advocates')
      .select('advocate_id, name, district, specialization, enrollment_no, state, is_verified, status');

    if (district) {
      query = query.ilike('district', `%${district.trim()}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
});

// ─── POST /api/advocate/profile-picture ────────────────────
router.post('/profile-picture', authenticateToken, uploadProfilePicture.single('profilePicture'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { data: advocate, error: findError } = await supabase
      .from('advocates')
      .select('*')
      .eq('advocate_id', req.user.advocate_id)
      .single();

    if (findError || !advocate) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Advocate not found' });
    }

    const newFilename = `${req.user.advocate_id}-${Date.now()}-${req.file.originalname}`;
    const newPath = path.join('uploads/profile_pictures', newFilename);
    fs.renameSync(req.file.path, newPath);

    if (advocate.profile_picture?.path) {
      try { fs.unlinkSync(advocate.profile_picture.path); } catch (_) {}
    }

    const profile_picture = { filename: newFilename, path: newPath, uploadDate: new Date().toISOString() };
    
    const { error: updateError } = await supabase
      .from('advocates')
      .update({ profile_picture })
      .eq('advocate_id', req.user.advocate_id);

    if (updateError) throw updateError;

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: { filename: newFilename }
    });
  } catch (error) {
    if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    next(error);
  }
});

// ─── GET /api/advocate/profile-picture/:filename ───────────
router.get('/profile-picture/:filename', async (req, res, next) => {
  try {
    const filepath = path.join(__dirname, '../uploads/profile_pictures', req.params.filename);
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: 'Profile picture not found' });
    }
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/advocate/verify/:advocate_id ────────────────
router.post('/verify/:advocate_id', authenticateToken, logAdvocateVerificationMiddleware, async (req, res, next) => {
  try {
    const { verified, notes } = req.body;
    const { error: updateError } = await supabase
      .from('advocates')
      .update({
        is_verified: verified,
        verification_notes: notes,
        verification_date: new Date().toISOString(),
        status: verified ? 'active' : 'pending'
      })
      .eq('advocate_id', req.params.advocate_id);

    if (updateError) throw updateError;

    res.json({
      message: `Advocate ${verified ? 'verified' : 'verification rejected'} successfully`,
      advocate_id: req.params.advocate_id,
      status: verified ? 'active' : 'pending'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
