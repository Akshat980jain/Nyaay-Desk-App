-- ── video-pleadings bucket RLS policies ──
DO $$
BEGIN
    -- 1. Insert policy for authenticated users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload video pleadings'
    ) THEN
        CREATE POLICY "Authenticated users can upload video pleadings"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'video-pleadings');
    END IF;

    -- 2. Select policy for public
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access for video pleadings'
    ) THEN
        CREATE POLICY "Public read access for video pleadings"
        ON storage.objects FOR SELECT TO public
        USING (bucket_id = 'video-pleadings');
    END IF;

    -- 3. Delete policy for authenticated users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete their video pleadings'
    ) THEN
        CREATE POLICY "Authenticated users can delete their video pleadings"
        ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = 'video-pleadings');
    END IF;
END $$;

-- ── legal_cases table RLS policies (allow update by litigant) ──
-- First, ensure RLS is enabled
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;

-- Policy to allow litigants to select their own cases
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'legal_cases' AND policyname = 'Litigants can view their own cases'
    ) THEN
        CREATE POLICY "Litigants can view their own cases"
        ON legal_cases FOR SELECT TO authenticated
        USING (
            (plaintiff_details->>'party_id') = (auth.jwt()->'user_metadata'->>'party_id') OR
            (respondent_details->>'party_id') = (auth.jwt()->'user_metadata'->>'party_id')
        );
    END IF;
END $$;

-- Policy to allow litigants to update (add documents) to their own cases
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'legal_cases' AND policyname = 'Litigants can update their own cases'
    ) THEN
        CREATE POLICY "Litigants can update their own cases"
        ON legal_cases FOR UPDATE TO authenticated
        USING (
            (plaintiff_details->>'party_id') = (auth.jwt()->'user_metadata'->>'party_id') OR
            (respondent_details->>'party_id') = (auth.jwt()->'user_metadata'->>'party_id')
        )
        WITH CHECK (
            (plaintiff_details->>'party_id') = (auth.jwt()->'user_metadata'->>'party_id') OR
            (respondent_details->>'party_id') = (auth.jwt()->'user_metadata'->>'party_id')
        );
    END IF;
END $$;
