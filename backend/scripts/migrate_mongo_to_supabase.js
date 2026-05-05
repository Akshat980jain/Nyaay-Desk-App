/**
 * migrate_mongo_to_supabase.js
 * 
 * Reads MongoDB exported JSON files from db_export/ and seeds them
 * into Supabase — creating Auth users + profile rows for every person.
 * 
 * Run from the backend folder:
 *   node scripts/migrate_mongo_to_supabase.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Supabase Admin Client (service role bypasses RLS) ─────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const EXPORT_DIR = path.join(__dirname, '../db_export');

// ── Utility: load a JSON export file ─────────────────────────────────────────
function loadJson(filename) {
  const filePath = path.join(EXPORT_DIR, filename);
  if (!fs.existsSync(filePath)) { console.warn(`⚠️  ${filename} not found, skipping.`); return []; }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

// ── Utility: create a Supabase Auth user with a temp password ─────────────────
// Since bcrypt hashes from MongoDB can't be imported into Supabase Auth,
// we set a known temp password and the user can reset it via Forgot Password.
const TEMP_PASSWORD = 'TempPass@2026!'; // All migrated users get this initially

async function createAuthUser(email, role, existingPassword = null) {
  // Try creating the user in Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: TEMP_PASSWORD,
    email_confirm: true, // Mark email as already confirmed
    user_metadata: { user_role: role },
  });

  if (error) {
    // If user already exists, fetch their ID
    if (error.message?.includes('already been registered') || error.status === 422) {
      console.log(`   ↩  Auth user already exists for ${email}, fetching...`);
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find(u => u.email === email);
      return existing?.id || null;
    }
    console.error(`   ❌ Auth error for ${email}:`, error.message);
    return null;
  }

  return data.user?.id || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Migrate LITIGANTS
// ─────────────────────────────────────────────────────────────────────────────
async function migrateLitigants() {
  console.log('\n📦 Migrating Litigants...');
  const records = loadJson('litigants.json');
  console.log(`   Found ${records.length} records`);

  for (const r of records) {
    const email = r.contact?.email || r.email;
    if (!email) { console.warn(`   ⚠️  Skipping litigant with no email`); continue; }

    // 1. Create Supabase Auth user
    const authUserId = await createAuthUser(email, 'litigant');
    if (!authUserId) continue;

    // 2. Upsert profile row
    const row = {
      litigant_id: r.party_id,              // actual column name in Supabase is litigant_id
      name:        r.full_name || r.name || 'Unknown',
      email:       email,
      password:    r.password || '',
      phone:       r.contact?.mobile || null,
      address:     r.address || null,
      party_type:  r.party_type || 'plaintiff',
      status:      r.status || 'active',
      auth_user_id: authUserId,
      created_at:  r.createdAt || new Date().toISOString(),
      updated_at:  r.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('litigants').upsert(row, { onConflict: 'email' });
    if (error) console.error(`   ❌ Litigant insert error (${email}):`, error.message);
    else console.log(`   ✅ Litigant: ${email}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Migrate ADVOCATES
// ─────────────────────────────────────────────────────────────────────────────
async function migrateAdvocates() {
  console.log('\n⚖️  Migrating Advocates...');
  const records = loadJson('advocates.json');
  console.log(`   Found ${records.length} records`);

  for (const r of records) {
    const email = r.contact?.email || r.email;
    if (!email) { console.warn(`   ⚠️  Skipping advocate with no email`); continue; }

    const authUserId = await createAuthUser(email, 'advocate');
    if (!authUserId) continue;

    const row = {
      advocate_id:  r.advocate_id,
      name:         r.name || 'Unknown',
      email:        email,
      password:     r.password || '',
      phone:        r.contact?.mobile || null,
      enrollment_no: r.enrollment_no || r.barId || r.advocate_id,  // actual column name
      district:     r.district || r.practice_details?.district || null,
      state:        r.practice_details?.state || null,
      status:       r.status || 'active',
      is_verified:  r.isVerified || r.is_verified || false,
      auth_user_id: authUserId,
      created_at:   r.createdAt || new Date().toISOString(),
      updated_at:   r.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('advocates').upsert(row, { onConflict: 'email' });
    if (error) console.error(`   ❌ Advocate insert error (${email}):`, error.message);
    else console.log(`   ✅ Advocate: ${email}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Migrate CLERKS
// ─────────────────────────────────────────────────────────────────────────────
async function migrateClerks() {
  console.log('\n🏛️  Migrating Clerks...');
  const records = loadJson('clerks.json');
  console.log(`   Found ${records.length} records`);

  for (const r of records) {
    const email = r.contact?.email || r.email;
    if (!email) { console.warn(`   ⚠️  Skipping clerk with no email`); continue; }

    const authUserId = await createAuthUser(email, 'clerk');
    if (!authUserId) continue;

    const row = {
      clerk_id:    r.clerk_id,
      name:        r.name || 'Unknown',
      email:       email,
      password:    r.password || '',
      phone:       r.contact?.mobile || null,
      court_name:  r.court_name || null,
      district:    r.district || null,
      status:      r.status || 'active',
      auth_user_id: authUserId,
      created_at:  r.createdAt || new Date().toISOString(),
      updated_at:  r.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('clerks').upsert(row, { onConflict: 'email' });
    if (error) console.error(`   ❌ Clerk insert error (${email}):`, error.message);
    else console.log(`   ✅ Clerk: ${email}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Migrate COURT ADMINS
// ─────────────────────────────────────────────────────────────────────────────
async function migrateAdmins() {
  console.log('\n👑 Migrating Court Admins...');
  const records = loadJson('courtadmins.json');
  console.log(`   Found ${records.length} records`);

  for (const r of records) {
    const email = r.contact?.email || r.email;
    if (!email) { console.warn(`   ⚠️  Skipping admin with no email`); continue; }

    const authUserId = await createAuthUser(email, 'admin');
    if (!authUserId) continue;

    const row = {
      admin_id:    r.admin_id || r._id,
      name:        r.name || 'Unknown',
      email:       email,
      password:    r.password || '',
      court_name:  r.court_name || null,
      district:    r.district || null,
      state:       r.state || null,
      auth_user_id: authUserId,
      created_at:  r.createdAt || new Date().toISOString(),
      updated_at:  r.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('court_admins').upsert(row, { onConflict: 'email' });
    if (error) console.error(`   ❌ Admin insert error (${email}):`, error.message);
    else console.log(`   ✅ Admin: ${email}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: Migrate LEGAL CASES
// ─────────────────────────────────────────────────────────────────────────────
async function migrateLegalCases() {
  console.log('\n📁 Migrating Legal Cases...');
  const records = loadJson('legalcases.json');
  console.log(`   Found ${records.length} records`);

  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE).map(r => ({
      case_num:               r.case_num || r.cnr || r._id,
      case_no:                r.case_no || null,
      court:                  r.court || 'Unknown',
      case_type:              r.case_type || r.caseType || 'Civil',
      district:               r.district || 'Unknown',
      plaintiff_details:      r.plaintiff_details || r.petitioner || null,
      respondent_details:     r.respondent_details || r.respondent || null,
      police_station_details: r.police_station_details || null,
      lower_court_details:    r.lower_court_details || null,
      main_matter_details:    r.main_matter_details || null,
      hearings:               r.hearings || [],
      status:                 r.status || 'Filed',
      status_history:         r.status_history || [],
      case_approved:          r.case_approved || false,
      documents:              r.documents || [],
      created_at:             r.createdAt || new Date().toISOString(),
      updated_at:             r.updatedAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('legal_cases').upsert(batch, { onConflict: 'case_num' });
    if (error) console.error(`   ❌ Cases batch ${i}-${i+BATCH_SIZE} error:`, error.message);
    else console.log(`   ✅ Cases batch ${i + 1}–${Math.min(i + BATCH_SIZE, records.length)} inserted`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: Migrate NOTICES
// ─────────────────────────────────────────────────────────────────────────────
async function migrateNotices() {
  console.log('\n📢 Migrating Notices...');
  const records = loadJson('notices.json');
  console.log(`   Found ${records.length} records`);

  const rows = records.map(r => ({
    title:       r.title || 'Untitled',
    content:     r.content || r.body || '',
    target_role: r.target_role || r.targetRole || 'all',
    created_by:  r.created_by || r.createdBy || null,
    created_at:  r.createdAt || new Date().toISOString(),
  }));

  if (rows.length === 0) return;
  const { error } = await supabase.from('notices').insert(rows);
  if (error) console.error(`   ❌ Notices error:`, error.message);
  else console.log(`   ✅ ${rows.length} notices inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: Migrate ADVOCATE CHANGE REQUESTS
// ─────────────────────────────────────────────────────────────────────────────
async function migrateAdvocateChangeRequests() {
  console.log('\n🔄 Migrating Advocate Change Requests...');
  const records = loadJson('advocatechangerequests.json');
  console.log(`   Found ${records.length} records`);

  const rows = records.map(r => ({
    case_id:               r.case_id || r.case_num || '',
    litigant_id:           r.litigant_id || '',
    existing_advocate_id:  r.existing_advocate_id || r.existingAdvocateId || '',
    has_noc:               r.has_noc || false,
    noc_request_status:    r.noc_request_status || 'None',
    status:                r.status || 'Draft',
    created_at:            r.createdAt || new Date().toISOString(),
    updated_at:            r.updatedAt || new Date().toISOString(),
  }));

  if (rows.length === 0) return;
  const { error } = await supabase.from('advocate_change_requests').upsert(rows);
  if (error) console.error(`   ❌ Advocate change requests error:`, error.message);
  else console.log(`   ✅ ${rows.length} change requests inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting MongoDB → Supabase Migration');
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`   Temp password for all migrated users: ${TEMP_PASSWORD}`);
  console.log('─'.repeat(60));

  await migrateLitigants();
  await migrateAdvocates();
  await migrateClerks();
  await migrateAdmins();
  await migrateLegalCases();
  await migrateNotices();
  await migrateAdvocateChangeRequests();

  console.log('\n' + '─'.repeat(60));
  console.log('✅ Migration Complete!');
  console.log(`\n⚠️  IMPORTANT: All users have been given temp password: ${TEMP_PASSWORD}`);
  console.log('   Users must reset their password via "Forgot Password" to regain access.');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
