require('dotenv').config();
const mongoose = require('mongoose');
const Advocate   = require('./models/Advocate');
const Clerk      = require('./models/Clerk');
const CourtAdmin = require('./models/CourtAdmin');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/daily_schedule').then(async () => {

  const adv = await Advocate.findOneAndUpdate(
    { email: 'manojneetijain@gmail.com' },
    { $set: { isVerified: true, isEmailVerified: true, status: 'active' } },
    { new: true }
  ).select('email isVerified isEmailVerified status');

  const clerk = await Clerk.findOneAndUpdate(
    { 'contact.email': 'aarjav.jain.9.b.sdpsmzn@gmail.com' },
    { $set: { isEmailVerified: true, status: 'active' } },
    { new: true }
  ).select('contact isEmailVerified status');

  const admin = await CourtAdmin.findOneAndUpdate(
    { 'contact.email': 'aarjav100jain@gmail.com' },
    { $set: { isEmailVerified: true, status: 'active' } },
    { new: true }
  ).select('contact isEmailVerified status');

  console.log('\n✅ ADVOCATE  →', JSON.stringify(adv));
  console.log('✅ CLERK     →', JSON.stringify({ email: clerk?.contact?.email, isEmailVerified: clerk?.isEmailVerified, status: clerk?.status }));
  console.log('✅ ADMIN     →', JSON.stringify({ email: admin?.contact?.email, isEmailVerified: admin?.isEmailVerified, status: admin?.status }));
  console.log('\nAll accounts are now active + verified!\n');

  await mongoose.disconnect();
  process.exit(0);
});
