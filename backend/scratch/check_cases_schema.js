require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  try {
    const { data: row, error: rowError } = await supabase.from('legal_cases').select('*').limit(1).single();
    if (rowError) {
      console.error('Error fetching row:', rowError);
      return;
    }
    console.log('Columns in legal_cases:', Object.keys(row));
    console.log('Sample row documents:', JSON.stringify(row.documents, null, 2));
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkSchema();
