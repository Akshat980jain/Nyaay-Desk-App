const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.use(cors({
    origin: ['http://localhost:3000', 'http://192.168.1.39:3000'],
    credentials: true
}));

// Authentication middleware directly in routes
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
  });
};

// Verify clerk middleware
const verifyClerk = async (req, res, next) => {
  try {
    const { data: clerk, error } = await supabase
      .from('clerks')
      .select('*')
      .eq('clerk_id', req.user.clerk_id)
      .single();
    
    if (error || !clerk) {
      return res.status(403).json({ message: 'Access denied: Not a clerk' });
    }
    
    req.clerk = clerk;
    next();
  } catch (error) {
    console.error('Clerk verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to send status change emails
const sendStatusChangeEmail = async (recipient, name, newStatus, reason = null) => {
  try {
    const subject = newStatus === 'suspended' 
      ? 'Your Account Has Been Suspended' 
      : 'Your Account Has Been Reinstated';
    
    let htmlContent;
    
    if (newStatus === 'suspended') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .email-container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #f8d7da; color: #721c24; padding: 10px; text-align: center; border-radius: 5px; }
            .content { padding: 20px 0; }
            .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h2>Account Suspension Notice</h2>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>We regret to inform you that your account has been suspended by the court clerk.</p>
              <p><strong>Reason for suspension:</strong> ${reason || 'No specific reason provided'}</p>
              <p>If you believe this is in error or have questions about this decision, please contact the district court office.</p>
              <p>You will not be able to access your account until it is reinstated by a court clerk.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Court Management System</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .email-container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #d4edda; color: #155724; padding: 10px; text-align: center; border-radius: 5px; }
            .content { padding: 20px 0; }
            .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h2>Account Reinstated</h2>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>We are pleased to inform you that your account has been reinstated by the court clerk.</p>
              <p>You now have full access to your account and all its features.</p>
              <p>Thank you for your patience during this process.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Court Management System</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    
    const msg = {
      to: recipient,
      from: process.env.FROM_EMAIL,
      subject: subject,
      html: htmlContent,
    };
    
    await sgMail.send(msg);
    console.log(`Status change email sent successfully to ${recipient}`);
    return true;
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error response body:', error.response.body);
    }
    throw error;
  }
};

// Get all litigants in clerk's district
router.get('/litigants', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { data: litigants, error } = await supabase
      .from('litigants')
      .select('litigant_id, name, email, party_type, gender, address, phone, status')
      .filter('address->>district', 'eq', req.clerk.district);
    
    if (error) throw error;
    res.json(litigants);
  } catch (error) {
    console.error('Error fetching litigants:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all advocates in clerk's district
router.get('/advocates', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { data: advocates, error } = await supabase
      .from('advocates')
      .select('*')
      .eq('district', req.clerk.district);
    
    if (error) throw error;
    res.json(advocates);
  } catch (error) {
    console.error('Error fetching advocates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Suspend a litigant account
router.put('/litigants/:id/suspend', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Suspension reason is required' });
    }
    
    const { data: litigant, error: findError } = await supabase
      .from('litigants')
      .select('*')
      .eq('litigant_id', req.params.id)
      .single();
    
    if (findError || !litigant) {
      return res.status(404).json({ message: 'Litigant not found' });
    }
    
    if (litigant.address?.district !== req.clerk.district) {
      return res.status(403).json({ message: 'Access denied: Litigant is not in your district jurisdiction' });
    }
    
    const { error: updateError } = await supabase
      .from('litigants')
      .update({
        status: 'suspended',
        suspension_reason: reason,
        suspension_date: new Date().toISOString()
      })
      .eq('litigant_id', req.params.id);
    
    if (updateError) throw updateError;
    
    try {
      await sendStatusChangeEmail(litigant.email, litigant.name, 'suspended', reason);
    } catch (emailError) {
      console.error('Failed to send suspension email:', emailError);
    }
    
    res.json({ 
      message: 'Litigant account suspended successfully',
      litigant: { party_id: litigant.litigant_id, full_name: litigant.name, status: 'suspended' } 
    });
  } catch (error) {
    console.error('Error suspending litigant account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reinstate a litigant account
router.put('/litigants/:id/reinstate', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { data: litigant, error: findError } = await supabase
      .from('litigants')
      .select('*')
      .eq('litigant_id', req.params.id)
      .single();
    
    if (findError || !litigant) {
      return res.status(404).json({ message: 'Litigant not found' });
    }
    
    if (litigant.address?.district !== req.clerk.district) {
      return res.status(403).json({ message: 'Access denied: Litigant is not in your district jurisdiction' });
    }
    
    const { error: updateError } = await supabase
      .from('litigants')
      .update({
        status: 'active',
        suspension_reason: null,
        suspension_date: null
      })
      .eq('litigant_id', req.params.id);
    
    if (updateError) throw updateError;
    
    try {
      await sendStatusChangeEmail(litigant.email, litigant.name, 'active');
    } catch (emailError) {
      console.error('Failed to send reinstatement email:', emailError);
    }
    
    res.json({ 
      message: 'Litigant account reinstated successfully',
      litigant: { party_id: litigant.litigant_id, full_name: litigant.name, status: 'active' } 
    });
  } catch (error) {
    console.error('Error reinstating litigant account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Suspend an advocate account
router.put('/advocates/:id/suspend', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Suspension reason is required' });
    }
    
    const { data: advocate, error: findError } = await supabase
      .from('advocates')
      .select('*')
      .eq('advocate_id', req.params.id)
      .single();
    
    if (findError || !advocate) {
      return res.status(404).json({ message: 'Advocate not found' });
    }
    
    if (advocate.district !== req.clerk.district) {
      return res.status(403).json({ message: 'Access denied: Advocate is not in your district jurisdiction' });
    }
    
    const { error: updateError } = await supabase
      .from('advocates')
      .update({
        status: 'suspended',
        suspension_reason: reason,
        suspension_date: new Date().toISOString()
      })
      .eq('advocate_id', req.params.id);
    
    if (updateError) throw updateError;
    
    try {
      await sendStatusChangeEmail(advocate.email, advocate.name, 'suspended', reason);
    } catch (emailError) {
      console.error('Failed to send suspension email:', emailError);
    }
    
    res.json({ 
      message: 'Advocate account suspended successfully',
      advocate: { advocate_id: advocate.advocate_id, name: advocate.name, status: 'suspended' } 
    });
  } catch (error) {
    console.error('Error suspending advocate account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reinstate an advocate account
router.put('/advocates/:id/reinstate', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { data: advocate, error: findError } = await supabase
      .from('advocates')
      .select('*')
      .eq('advocate_id', req.params.id)
      .single();
    
    if (findError || !advocate) {
      return res.status(404).json({ message: 'Advocate not found' });
    }
    
    if (advocate.district !== req.clerk.district) {
      return res.status(403).json({ message: 'Access denied: Advocate is not in your district jurisdiction' });
    }
    
    const { error: updateError } = await supabase
      .from('advocates')
      .update({
        status: 'active',
        suspension_reason: null,
        suspension_date: null
      })
      .eq('advocate_id', req.params.id);
    
    if (updateError) throw updateError;
    
    try {
      await sendStatusChangeEmail(advocate.email, advocate.name, 'active');
    } catch (emailError) {
      console.error('Failed to send reinstatement email:', emailError);
    }
    
    res.json({ 
      message: 'Advocate account reinstated successfully',
      advocate: { advocate_id: advocate.advocate_id, name: advocate.name, status: 'active' } 
    });
  } catch (error) {
    console.error('Error reinstating advocate account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific litigant's details
router.get('/litigants/:id', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { data: litigant, error } = await supabase
      .from('litigants')
      .select('litigant_id, name, email, party_type, gender, address, phone, status')
      .eq('litigant_id', req.params.id)
      .single();
    
    if (error || !litigant) {
      return res.status(404).json({ message: 'Litigant not found' });
    }
    
    if (litigant.address?.district !== req.clerk.district) {
      return res.status(403).json({ message: 'Access denied: Litigant is not in your district jurisdiction' });
    }
    
    res.json(litigant);
  } catch (error) {
    console.error('Error fetching litigant details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific advocate's details
router.get('/advocates/:id', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { data: advocate, error } = await supabase
      .from('advocates')
      .select('*')
      .eq('advocate_id', req.params.id)
      .single();
    
    if (error || !advocate) {
      return res.status(404).json({ message: 'Advocate not found' });
    }
    
    if (advocate.district !== req.clerk.district) {
      return res.status(403).json({ message: 'Access denied: Advocate is not in your district jurisdiction' });
    }
    
    res.json(advocate);
  } catch (error) {
    console.error('Error fetching advocate details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register clerk
router.post('/register', async (req, res) => {
    try {
        const { name, gender, district, court_name, court_no, email, mobile, password } = req.body;

        if (!name || !gender || !district || !court_name || !court_no || !email || !mobile || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const { data: existingClerk } = await supabase.from('clerks').select('clerk_id').eq('email', email).single();
        if (existingClerk) return res.status(400).json({ message: 'Email already registered' });

        const emailOTP = Math.floor(100000 + Math.random() * 900000).toString(); // generateOTP helper
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        const clerkId = 'CLK' + Date.now();

        const { error: insertError } = await supabase.from('clerks').insert([{
            clerk_id: clerkId, name, gender, district, court_name, court_no, email, phone: mobile,
            password: hashedPassword, email_otp: emailOTP, otp_expiry: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        }]);

        if (insertError) throw insertError;
        // await sendEmailOTP(email, emailOTP); // Assumes sendEmailOTP is available or defined

        res.status(201).json({ message: 'Registration initiated. Please verify your email.', clerk_id: clerkId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify Email OTP
router.post('/verify-email', async (req, res) => {
    try {
        const { clerk_id, otp } = req.body;
        const { data: clerk, error: findError } = await supabase
            .from('clerks')
            .select('*')
            .eq('clerk_id', clerk_id)
            .eq('email_otp', otp)
            .gt('otp_expiry', new Date().toISOString())
            .single();

        if (findError || !clerk) return res.status(400).json({ message: 'Invalid or expired OTP' });

        const { error: updateError } = await supabase
            .from('clerks')
            .update({ is_email_verified: true, email_otp: null, status: 'active' })
            .eq('clerk_id', clerk_id);

        if (updateError) throw updateError;
        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: clerk, error: loginError } = await supabase.from('clerks').select('*').eq('email', email).single();

        const bcrypt = require('bcryptjs');
        if (loginError || !clerk || !(await bcrypt.compare(password, clerk.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!clerk.is_email_verified) return res.status(401).json({ message: 'Please complete email verification' });
        if (clerk.status !== 'active') return res.status(401).json({ message: 'Account is not active' });

        await supabase.from('clerks').update({ last_login: new Date().toISOString() }).eq('clerk_id', clerk.clerk_id);

        const token = jwt.sign({ clerk_id: clerk.clerk_id, email: clerk.email, user_type: 'clerk' }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            clerk: { clerk_id: clerk.clerk_id, name: clerk.name, email: clerk.email, district: clerk.district, court_name: clerk.court_name, court_no: clerk.court_no }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'clerk') return res.status(403).json({ message: 'Access denied' });

        const { data: clerk, error } = await supabase
            .from('clerks')
            .select('clerk_id, name, email, district, court_name, court_no, status')
            .eq('clerk_id', req.user.clerk_id)
            .single();
        
        if (error || !clerk) return res.status(404).json({ message: 'Clerk not found' });
        res.json({ clerk });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Stats
router.get('/dashboard/stats', verifyToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'clerk') return res.status(403).json({ message: 'Access denied' });

        const { data: clerk, error: clerkError } = await supabase.from('clerks').select('district').eq('clerk_id', req.user.clerk_id).single();
        if (clerkError || !clerk) return res.status(404).json({ message: 'Clerk not found' });

        const district = clerk.district;
        
        const { count: activeCasesCount } = await supabase
            .from('legal_cases')
            .select('*', { count: 'exact', head: true })
            .eq('district', district)
            .neq('status', 'Disposed');

        const { data: casesWithHearings } = await supabase
            .from('legal_cases')
            .select('hearings, documents')
            .eq('district', district)
            .neq('status', 'Disposed');

        let upcomingHearingsCount = 0;
        let pendingDocumentsCount = 0;

        if (casesWithHearings) {
            upcomingHearingsCount = casesWithHearings.filter(c => 
                Array.isArray(c.hearings) && c.hearings.some(h => new Date(h.hearing_date) >= new Date())
            ).length;

            casesWithHearings.forEach(c => {
                if (Array.isArray(c.documents)) {
                    pendingDocumentsCount += c.documents.filter(doc => doc.verification_status === 'uploaded_pending_review').length;
                }
            });
        }

        res.json({
            activeCases: activeCasesCount || 0,
            upcomingHearings: upcomingHearingsCount,
            pendingDocuments: pendingDocumentsCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;