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

const migrateLitigants = async () => {
  try {
    const filePath = path.join(__dirname, '../db_export/litigants.json');
    if (!fs.existsSync(filePath)) {
      console.error('litigants.json not found in db_export');
      return;
    }

    const litigants = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Found ${litigants.length} litigants to migrate.`);

    for (const lit of litigants) {
      console.log(`Migrating: ${lit.full_name} (${lit.contact?.email})...`);

      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: lit.contact?.email,
        password: 'Migrated@123', // Default password
        email_confirm: true,
        user_metadata: { role: 'litigant' }
      });

      let authUserId = authData?.user?.id;
      if (authError) {
        if (authError.message === 'A user with this email address has already been registered') {
          console.log(`  User ${lit.contact?.email} already exists in Auth.`);
          const { data: userData } = await supabase.auth.admin.listUsers();
          const user = userData.users.find(u => u.email === lit.contact?.email);
          authUserId = user?.id;
        } else {
          console.error(`  Auth Error for ${lit.contact?.email}:`, authError.message);
          continue;
        }
      }

      // 2. Insert into litigants table
      const { error: dbError } = await supabase
        .from('litigants')
        .upsert({
          litigant_id: lit.party_id,
          name: lit.full_name,
          email: lit.contact?.email,
          password: lit.password, // Added password
          phone: lit.contact?.mobile,
          address: lit.address,
          status: lit.status || 'active',
          auth_user_id: authUserId,
          created_at: lit.createdAt,
          updated_at: lit.updatedAt
        }, { onConflict: 'email' });

      if (dbError) {
        console.error(`  DB Error for ${lit.contact?.email}:`, dbError.message);
      } else {
        console.log(`  Successfully migrated ${lit.full_name}`);
      }
    }

    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

migrateLitigants();
