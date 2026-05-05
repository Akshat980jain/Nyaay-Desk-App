const fs = require('fs');
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
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrateAdvocates = async () => {
  try {
    const filePath = path.join(__dirname, '../db_export/advocates.json');
    if (!fs.existsSync(filePath)) {
      console.error('advocates.json not found in db_export');
      return;
    }

    const advocates = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Found ${advocates.length} advocates to migrate.`);

    for (const adv of advocates) {
      console.log(`Migrating: ${adv.name} (${adv.email})...`);

      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adv.email,
        password: 'Migrated@123', // Default password
        email_confirm: true,
        user_metadata: { role: 'advocate' }
      });

      if (authError) {
        if (authError.message === 'A user with this email address has already been registered') {
          console.log(`  User ${adv.email} already exists in Auth.`);
          // Fetch existing user ID
          const { data: userData } = await supabase.auth.admin.listUsers();
          const user = userData.users.find(u => u.email === adv.email);
          authUserId = user?.id;
        } else {
          console.error(`  Auth Error for ${adv.email}:`, authError.message);
          continue;
        }
      }

      // 2. Insert into advocates table
      const district = adv.practice_details?.district || adv.district;
      const state = adv.practice_details?.state;

      const { error: dbError } = await supabase
        .from('advocates')
        .upsert({
          advocate_id: adv.advocate_id,
          name: adv.name,
          email: adv.email,
          password: adv.password,
          phone: adv.contact?.email || adv.email, // using email as phone fallback or just check structure
          enrollment_no: adv.enrollment_no,
          district: district,
          state: state,
          status: adv.status || 'active',
          is_verified: adv.isVerified || false,
          auth_user_id: authUserId,
          created_at: adv.createdAt,
          updated_at: adv.updatedAt
        }, { onConflict: 'email' });

      if (dbError) {
        console.error(`  DB Error for ${adv.email}:`, dbError.message);
      } else {
        console.log(`  Successfully migrated ${adv.name}`);
      }
    }

    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

migrateAdvocates();
