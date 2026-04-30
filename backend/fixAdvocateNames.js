const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const LegalCase = require('./models/LegalCase');
const Advocate = require('./models/Advocate');

async function fixCases() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Case_Management_System';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    const cases = await LegalCase.find({});
    let fixedCount = 0;

    for (const c of cases) {
      let modified = false;

      // Fix plaintiff advocate: has advocate_id but name is missing/undefined
      if (c.plaintiff_details.advocate_id && (!c.plaintiff_details.advocate || c.plaintiff_details.advocate === 'undefined' || c.plaintiff_details.advocate.trim() === '')) {
        console.log(`Case ${c.case_num}: plaintiff has advocate_id="${c.plaintiff_details.advocate_id}" but name="${c.plaintiff_details.advocate}"`);
        
        // First try to find the name from the approved request in advocate_requests
        const approvedReq = c.advocate_requests.find(
          r => r.advocate_id === c.plaintiff_details.advocate_id && r.party_type === 'plaintiff' && r.status === 'approved'
        );
        
        if (approvedReq && approvedReq.advocate_name && approvedReq.advocate_name !== 'undefined') {
          c.plaintiff_details.advocate = approvedReq.advocate_name;
          console.log(`  -> Restored name from request: "${approvedReq.advocate_name}"`);
          modified = true;
        } else {
          // Try to find from Advocate collection
          const advocate = await Advocate.findOne({ advocate_id: c.plaintiff_details.advocate_id });
          if (advocate) {
            c.plaintiff_details.advocate = advocate.name;
            console.log(`  -> Restored name from Advocate DB: "${advocate.name}"`);
            modified = true;
          } else {
            console.log(`  -> Could not find advocate with id "${c.plaintiff_details.advocate_id}"`);
          }
        }
      }

      // Fix respondent advocate: has advocate_id but name is missing/undefined
      if (c.respondent_details.advocate_id && (!c.respondent_details.advocate || c.respondent_details.advocate === 'undefined' || c.respondent_details.advocate.trim() === '')) {
        console.log(`Case ${c.case_num}: respondent has advocate_id="${c.respondent_details.advocate_id}" but name="${c.respondent_details.advocate}"`);
        
        const approvedReq = c.advocate_requests.find(
          r => r.advocate_id === c.respondent_details.advocate_id && r.party_type === 'respondent' && r.status === 'approved'
        );

        if (approvedReq && approvedReq.advocate_name && approvedReq.advocate_name !== 'undefined') {
          c.respondent_details.advocate = approvedReq.advocate_name;
          console.log(`  -> Restored name from request: "${approvedReq.advocate_name}"`);
          modified = true;
        } else {
          const advocate = await Advocate.findOne({ advocate_id: c.respondent_details.advocate_id });
          if (advocate) {
            c.respondent_details.advocate = advocate.name;
            console.log(`  -> Restored name from Advocate DB: "${advocate.name}"`);
            modified = true;
          } else {
            console.log(`  -> Could not find advocate with id "${c.respondent_details.advocate_id}"`);
          }
        }
      }

      if (modified) {
        await c.save();
        fixedCount++;
        console.log(`  -> Case ${c.case_num} saved.\n`);
      }
    }

    console.log(`\nDone! Fixed ${fixedCount} case(s).`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

fixCases();
