const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.storage
    .from('video-pleadings')
    .upload('test.webm', Buffer.from('fake-video-data'), { 
      upsert: true,
      contentType: 'video/webm'
    });

  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Upload success:', data);
  }
}

test();
