const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './casemanager/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase
    .from('advocate_change_requests')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching advocate_change_requests:', error);
  } else {
    console.log('Sample row from advocate_change_requests:', JSON.stringify(data[0], null, 2));
  }
}

checkTable();
