require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRPC() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  if (error) {
    console.log('exec_sql RPC does not exist or failed:', error.message);
  } else {
    console.log('exec_sql RPC exists!');
  }
}

checkRPC();
