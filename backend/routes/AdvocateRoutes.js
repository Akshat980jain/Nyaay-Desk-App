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

const Advocate = require('../models/Advocate');
const BlacklistedToken = require('../models/Blaclisttoken');
const EnrollmentRecord = require('../models/Enrollment');
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

    const record = await EnrollmentRecord.findOne({
      ENROLLMENT_NO: enrollment_no,
      NAME_OF_ADVOCATE: name,
      DISTRICT: district,
      DATE_OF_REGISTRATION: formattedDate
    });

    if (!record) {
      return res.status(400).json({ message: 'Enrollment details do not match our records' });
    }
    res.json({
      message: 'Enrollment verified successfully',
      record: {
        enrollment_no: record.ENROLLMENT_NO,
        name: record.NAME_OF_ADVOCATE,
        fathers_name: record.FATHERS_NAME_OF_ADVOCATE,
        district: record.DISTRICT,
        date_of_registration: record.DATE_OF_REGISTRATION
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

    const existingAdvocate = await Advocate.findOne({
      $or: [{ email }, { enrollment_no }, { iCOP_number }, { barId }]
    });
    if (existingAdvocate) {
      return res.status(400).json({
        message: 'Advocate already registered with this email, enrollment number, iCOP number, or Bar ID'
      });
    }

    const emailOTP = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    const advocate = new Advocate({
      advocate_id: 'ADV' + Date.now(),
      enrollment_no, name, gender, dob,
      contact: { email },
      district, practice_details, email,
      password: hashedPassword,
      emailOTP,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      iCOP_number, barId,
      cop_document: {
        filename: req.file.filename,
        path: req.file.path,
        uploadDate: new Date()
      },
      status: 'pending',
      isVerified: false
    });

    await advocate.save();
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
    const { advocate_id, otp } = req.body;
    const advocate = await Advocate.findOne({
      advocate_id,
      emailOTP: otp,
      otpExpiry: { $gt: new Date() }
    });

    if (!advocate) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    advocate.isEmailVerified = true;
    advocate.emailOTP = undefined;
    advocate.status = 'pending';
    await advocate.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/advocate/login ──────────────────────────────
router.post('/login', authLimiter, validateAdvocateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const advocate = await Advocate.findOne({ email });

    if (!advocate || !(await bcrypt.compare(password, advocate.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!advocate.isEmailVerified) {
      return res.status(401).json({ message: 'Please complete email verification' });
    }
    if (advocate.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active. Please wait for verification by court admin.' });
    }

    advocate.lastLogin = new Date();
    await advocate.save();

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
    await new BlacklistedToken({ token, user_id: req.user.advocate_id, user_type: 'advocate' }).save();
    await Advocate.findOneAndUpdate({ advocate_id: req.user.advocate_id }, { lastLogout: new Date() });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/advocate/profile ─────────────────────────────
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
    if (!advocate) return res.status(404).json({ message: 'Advocate not found' });

    res.json({
      advocate: {
        advocate_id: advocate.advocate_id,
        name: advocate.name,
        email: advocate.email,
        enrollment_no: advocate.enrollment_no,
        district: advocate.district,
        status: advocate.status,
        practice_details: advocate.practice_details,
        profilePicture: advocate.profilePicture ? advocate.profilePicture.filename : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/advocate/profile-picture ────────────────────
router.post('/profile-picture', authenticateToken, uploadProfilePicture.single('profilePicture'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
    if (!advocate) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Advocate not found' });
    }

    const newFilename = `${req.user.advocate_id}-${Date.now()}-${req.file.originalname}`;
    const newPath = path.join('uploads/profile_pictures', newFilename);
    fs.renameSync(req.file.path, newPath);

    if (advocate.profilePicture?.path) {
      try { fs.unlinkSync(advocate.profilePicture.path); } catch (_) {}
    }

    advocate.profilePicture = { filename: newFilename, path: newPath, uploadDate: new Date() };
    await advocate.save();

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: { filename: advocate.profilePicture.filename }
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
    const advocate = await Advocate.findOne({ advocate_id: req.params.advocate_id });
    if (!advocate) return res.status(404).json({ message: 'Advocate not found' });

    advocate.isVerified = verified;
    advocate.verificationNotes = notes;
    advocate.verificationDate = new Date();
    advocate.status = verified ? 'active' : 'pending';
    await advocate.save();

    res.json({
      message: `Advocate ${verified ? 'verified' : 'verification rejected'} successfully`,
      advocate_id: advocate.advocate_id,
      status: advocate.status
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
