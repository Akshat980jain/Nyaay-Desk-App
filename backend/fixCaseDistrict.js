require('dotenv').config();
const mongoose = require('mongoose');
const LegalCase = require('./models/LegalCase');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/daily_schedule').then(async () => {
  // Fix case CL2026Y470 - update district to Ghaziabad
  const result = await LegalCase.findOneAndUpdate(
    { case_num: 'CL2026Y470' },
    { $set: { district: 'Ghaziabad' } },
    { new: true }
  ).select('case_num district status');

  if (result) {
    console.log('✅ Fixed case:', result.case_num, '→ district:', result.district, '| status:', result.status);
  } else {
    console.log('❌ Case not found');
    // Show latest cases to help debug
    const latest = await LegalCase.find({}).sort({ created_at: -1 }).limit(5).select('case_num district status');
    latest.forEach(c => console.log(' Latest:', c.case_num, c.district, c.status));
  }

  await mongoose.disconnect();
  process.exit(0);
});
