const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const checkData = async () => {
  const { data, error } = await supabase
    .from('advocates')
    .select('name, district, enrollment_no, is_verified');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Advocates in DB:', JSON.stringify(data, null, 2));
  }
};

checkData();
