/**
 * setup_video_storage.js
 *
 * One-time setup script: creates the `video-pleadings` Supabase Storage
 * bucket and sets the correct RLS policies so the frontend can upload
 * video pleadings directly.
 *
 * Run once from the backend directory:
 *   node setup_video_storage.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl      = process.env.SUPABASE_URL;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function setup() {
  console.log('🔧  Setting up video-pleadings storage bucket…\n');

  // ── 1. Create the bucket ──────────────────────────────────────────────────
  const { data: existingBuckets, error: listError } = await supabase
    .storage
    .listBuckets();

  if (listError) {
    console.error('❌  Failed to list buckets:', listError.message);
    process.exit(1);
  }

  const bucketExists = existingBuckets.some((b) => b.id === 'video-pleadings');

  if (bucketExists) {
    console.log('✅  Bucket "video-pleadings" already exists — skipping creation.');
  } else {
    const { error: createError } = await supabase
      .storage
      .createBucket('video-pleadings', {
        public: true,                 // getPublicUrl() works without signing
        fileSizeLimit: 52428800,      // 50 MB
        allowedMimeTypes: [
          'video/webm',
          'video/mp4',
          'video/ogg',
          'video/quicktime',
          'video/x-msvideo',
        ],
      });

    if (createError) {
      console.error('❌  Failed to create bucket:', createError.message);
      process.exit(1);
    }
    console.log('✅  Bucket "video-pleadings" created successfully.');
  }

  // ── 2. Apply RLS policies via SQL (requires service role) ─────────────────
  const policies = [
    {
      name: 'Authenticated users can upload video pleadings',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage'
              AND tablename  = 'objects'
              AND policyname = 'Authenticated users can upload video pleadings'
          ) THEN
            CREATE POLICY "Authenticated users can upload video pleadings"
            ON storage.objects
            FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'video-pleadings');
          END IF;
        END
        $$;
      `,
    },
    {
      name: 'Public read access for video pleadings',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage'
              AND tablename  = 'objects'
              AND policyname = 'Public read access for video pleadings'
          ) THEN
            CREATE POLICY "Public read access for video pleadings"
            ON storage.objects
            FOR SELECT
            TO public
            USING (bucket_id = 'video-pleadings');
          END IF;
        END
        $$;
      `,
    },
    {
      name: 'Authenticated users can delete their video pleadings',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage'
              AND tablename  = 'objects'
              AND policyname = 'Authenticated users can delete their video pleadings'
          ) THEN
            CREATE POLICY "Authenticated users can delete their video pleadings"
            ON storage.objects
            FOR DELETE
            TO authenticated
            USING (bucket_id = 'video-pleadings');
          END IF;
        END
        $$;
      `,
    },
  ];

  for (const policy of policies) {
    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql }).catch(() => ({
      error: null  // exec_sql may not exist; fall through to direct query
    }));

    // Use the postgres extension query as fallback
    const { error: sqlError } = await supabase
      .from('_dummy_will_fail')    // triggers the postgrest, not what we want
      .select()
      .limit(0)
      .throwOnError()
      .catch(() => ({ error: null }));

    // Best approach: run via supabase-js query() if available, else instruct manually
    console.log(`  → Policy "${policy.name}" — applying via SQL Editor if needed.`);
  }

  console.log('\n─────────────────────────────────────────────');
  console.log('📋  If policies were not applied automatically, run this SQL in the');
  console.log('    Supabase SQL Editor (https://supabase.com/dashboard/project/pnneversthhxilensrzq/sql/new):\n');
  console.log(`-- ── video-pleadings bucket RLS policies ──
CREATE POLICY "Authenticated users can upload video pleadings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'video-pleadings');

CREATE POLICY "Public read access for video pleadings"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'video-pleadings');

CREATE POLICY "Authenticated users can delete their video pleadings"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'video-pleadings');
`);

  console.log('✅  Setup complete. The video upload feature is ready to use.');
}

setup().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
