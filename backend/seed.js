/**
 * NyaayDesk — Database Seed Script
 * Seeds one Admin, one Clerk, and one Advocate with hashed passwords.
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const CourtAdmin = require('./models/CourtAdmin');
const Clerk      = require('./models/Clerk');
const Advocate   = require('./models/Advocate');

// ──────────────────────────────────────────────
//  SEED DATA — change these before running
// ──────────────────────────────────────────────
const ADMIN_DATA = {
  admin_id  : 'ADMIN-GZB-001',
  name      : 'Akshat Jain',
  district  : 'Ghaziabad',
  court_name: 'District & Sessions Court, Ghaziabad',
  specialities: ['Civil', 'Criminal', 'Family'],
  contact: {
    email : 'aarjav100jain@gmail.com',
    mobile: '',
  },
  password  : 'Akshat@123',
  status    : 'active',
  isEmailVerified: true,
};

const CLERK_DATA = {
  clerk_id  : 'CLERK-GZB-001',
  name      : 'Aarjav Jain',
  gender    : 'male',           // schema enum requires lowercase
  district  : 'Ghaziabad',
  court_name: 'District Court, Ghaziabad',
  court_no  : 'Court No. 3',
  contact: {
    email : 'aarjav.jain.9.b.sdpsmzn@gmail.com',
    mobile: '9456609840',
  },
  password  : 'Akshat@123',
  status    : 'active',
  isEmailVerified: true,
};

const ADVOCATE_DATA = {
  advocate_id       : 'ADV-GZB-001',
  enrollment_no     : 'UP/GZB/2020/001',
  name              : 'Manoj Jain',
  gender            : 'male',   // schema requires lowercase
  dob               : new Date('1990-05-15'),
  district          : 'Ghaziabad',
  contact: { email : 'manojneetijain@gmail.com' },
  email             : 'manojneetijain@gmail.com',
  password          : 'Akshat@123',
  iCOP_number       : 'ICOP-UP-2020-001',
  barId             : 'BAR-GZB-2020-001',
  practice_details: {
    district_court: true,
    high_court    : false,
    state         : 'Uttar Pradesh',
    district      : 'Ghaziabad',
  },
  isVerified      : true,
  isEmailVerified : true,
  status          : 'active',
};

// ──────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/daily_schedule',
      { serverSelectionTimeoutMS: 15000 }
    );
    console.log('\n✅  MongoDB connected\n');

    // ── Admin ──
    const existingAdmin = await CourtAdmin.findOne({ admin_id: ADMIN_DATA.admin_id });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists — skipping');
    } else {
      const admin = new CourtAdmin(ADMIN_DATA);
      await admin.save();   // password hashed by pre-save hook
      console.log('✅  Admin created');
      console.log('    Email   :', ADMIN_DATA.contact.email);
      console.log('    Password:', ADMIN_DATA.password, '(stored as hash)\n');
    }

    // ── Clerk ──
    const existingClerk = await Clerk.findOne({ clerk_id: CLERK_DATA.clerk_id });
    if (existingClerk) {
      console.log('⚠️  Clerk already exists — skipping');
    } else {
      const clerkData = { ...CLERK_DATA };
      clerkData.password = await bcrypt.hash(CLERK_DATA.password, 10);
      await Clerk.create(clerkData);
      console.log('✅  Clerk created');
      console.log('    Email   :', CLERK_DATA.contact.email);
      console.log('    Password:', CLERK_DATA.password, '(stored as hash)\n');
    }

    // ── Advocate ──
    const existingAdv = await Advocate.findOne({ advocate_id: ADVOCATE_DATA.advocate_id });
    if (existingAdv) {
      console.log('⚠️  Advocate already exists — skipping');
    } else {
      const advData = { ...ADVOCATE_DATA };
      advData.password = await bcrypt.hash(ADVOCATE_DATA.password, 10);
      await Advocate.create(advData);
      console.log('✅  Advocate created');
      console.log('    Email   :', ADVOCATE_DATA.email);
      console.log('    Password:', ADVOCATE_DATA.password, '(stored as hash)\n');
    }

    console.log('─────────────────────────────────────────');
    console.log('🌱  Seeding complete! Login credentials:\n');
    console.log('  ADMIN    → admin@nyaaydesk.in    / Admin@1234');
    console.log('  CLERK    → clerk@nyaaydesk.in    / Clerk@1234');
    console.log('  ADVOCATE → advocate@nyaaydesk.in / Advocate@1234');
    console.log('─────────────────────────────────────────\n');

  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌  Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
