-- Drop old policies first
DROP POLICY IF EXISTS "Litigants can view their own cases" ON legal_cases;
DROP POLICY IF EXISTS "Litigants can update their own cases" ON legal_cases;

-- Create robust policies using the litigants table join
CREATE POLICY "Litigants can view their own cases"
ON legal_cases FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM litigants
        WHERE litigants.auth_user_id = auth.uid()
          AND (
            litigants.party_id = (legal_cases.plaintiff_details->>'party_id') OR
            litigants.party_id = (legal_cases.respondent_details->>'party_id')
          )
    )
);

CREATE POLICY "Litigants can update their own cases"
ON legal_cases FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM litigants
        WHERE litigants.auth_user_id = auth.uid()
          AND (
            litigants.party_id = (legal_cases.plaintiff_details->>'party_id') OR
            litigants.party_id = (legal_cases.respondent_details->>'party_id')
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM litigants
        WHERE litigants.auth_user_id = auth.uid()
          AND (
            litigants.party_id = (legal_cases.plaintiff_details->>'party_id') OR
            litigants.party_id = (legal_cases.respondent_details->>'party_id')
          )
    )
);

-- Also ensure storage.objects has proper policies for authenticated users
DROP POLICY IF EXISTS "Authenticated users can upload video pleadings" ON storage.objects;
CREATE POLICY "Authenticated users can upload video pleadings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'video-pleadings');

DROP POLICY IF EXISTS "Public read access for video pleadings" ON storage.objects;
CREATE POLICY "Public read access for video pleadings"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'video-pleadings');
