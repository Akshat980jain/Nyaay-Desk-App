require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'legal_cases' }).catch(() => ({ error: 'RPC failed' }));
  if (error) {
    console.log('Cannot check policies directly via RPC.');
  }
}
checkPolicies();
