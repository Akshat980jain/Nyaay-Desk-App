const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixApprovedCases() {
  try {
    // 1. Find all approved advocate change requests
    const { data: approvedRequests, error: fetchErr } = await supabase
      .from('advocate_change_requests')
      .select('*')
      .eq('status', 'Approved');

    if (fetchErr) throw fetchErr;

    console.log(`Found ${approvedRequests.length} approved request(s) to process.\n`);

    for (const req of approvedRequests) {
      console.log(`Processing: Case ${req.case_id}, removing advocate ${req.existing_advocate_id}...`);

      // 2. Fetch the legal case
      const { data: legalCase, error: caseErr } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('case_num', req.case_id)
        .maybeSingle();

      if (caseErr || !legalCase) {
        console.log(`  ⚠ Case ${req.case_id} not found, skipping.`);
        continue;
      }

      const updates = {};
      let changed = false;

      // 3. Check plaintiff side
      if (legalCase.plaintiff_details?.advocate_id === req.existing_advocate_id) {
        updates.plaintiff_details = {
          ...legalCase.plaintiff_details,
          advocate_id: '',
          advocate: ''
        };
        console.log(`  → Removing from plaintiff_details (was: ${legalCase.plaintiff_details.advocate})`);
        changed = true;
      }

      // 4. Check respondent side
      if (legalCase.respondent_details?.advocate_id === req.existing_advocate_id) {
        updates.respondent_details = {
          ...legalCase.respondent_details,
          advocate_id: '',
          advocate: ''
        };
        console.log(`  → Removing from respondent_details (was: ${legalCase.respondent_details.advocate})`);
        changed = true;
      }

      if (changed) {
        const { error: updateErr } = await supabase
          .from('legal_cases')
          .update(updates)
          .eq('case_num', req.case_id);

        if (updateErr) {
          console.log(`  ❌ Update failed: ${updateErr.message}`);
        } else {
          console.log(`  ✅ Advocate removed successfully!`);
        }
      } else {
        console.log(`  ℹ Advocate ${req.existing_advocate_id} not found in case details (may already be cleared).`);
      }
    }

    console.log('\nDone! All approved cases have been processed.');
  } catch (error) {
    console.error('Script failed:', error);
  }
}

fixApprovedCases();
