/**
 * fix_user_roles.js
 * 
 * Fixes Supabase Auth user_metadata.user_role for all users.
 * Run this whenever a user's role is wrong in Supabase Auth.
 * 
 * Usage: node scripts/fix_user_roles.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Define the correct role for each email ──────────────────────────────────
// If a user appears in multiple roles, the LAST entry wins.
// Priority: admin > clerk > advocate > litigant
const ROLE_MAP = {
  // Litigants
  'bookease9@gmail.com':              'litigant',
  'bookease9@gmai.com':               'litigant',
  'educonnect112@gmail.com':          'litigant',

  // Advocates
  'akash.2226cs1058@kiet.edu':        'advocate',
  'tyagiaaditiya123@gmail.com':       'advocate',
  'manojneetijain@gmail.com':         'advocate',

  // Clerks
  'aarjav.jain.9.b.sdpsmzn@gmail.com': 'clerk',

  // Admins (override any previous role — admin takes priority)
  'aaditiya.2226cs1189@kiet.edu':     'admin',
  'aaditiyatyagi123@gmail.com':       'admin',   // was clerk before — FIX
  'aarjav100jain@gmail.com':          'admin',
};

async function fixRoles() {
  console.log('🔧 Fixing Supabase Auth user roles...\n');

  // Fetch all auth users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  console.log(`   Found ${users.length} total auth users\n`);

  for (const user of users) {
    const email = user.email;
    const correctRole = ROLE_MAP[email];

    if (!correctRole) {
      console.log(`   ⏩ Skipping ${email} (not in role map)`);
      continue;
    }

    const currentRole = user.user_metadata?.user_role;

    if (currentRole === correctRole) {
      console.log(`   ✅ ${email} — role already correct (${correctRole})`);
      continue;
    }

    // Update the user's metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, user_role: correctRole },
    });

    if (updateError) {
      console.error(`   ❌ Failed to update ${email}:`, updateError.message);
    } else {
      console.log(`   🔄 Fixed ${email}: "${currentRole}" → "${correctRole}"`);
    }
  }

  console.log('\n✅ Role fix complete!');
}

fixRoles().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
