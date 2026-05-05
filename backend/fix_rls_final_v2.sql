-- Robust RLS Fix for Litigants
-- This script ensures that litigants can both view and update their cases
-- by checking BOTH party_id and litigant_id in the litigants table.

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Litigants can view their own cases" ON legal_cases;
DROP POLICY IF EXISTS "Litigants can update their own cases" ON legal_cases;
DROP POLICY IF EXISTS "legal_cases_read" ON legal_cases; -- Removing overly permissive policy

-- 2. Create robust VIEW policy
CREATE POLICY "Litigants can view their own cases"
ON legal_cases FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM litigants
        WHERE litigants.auth_user_id = auth.uid()
          AND (
            (COALESCE(litigants.party_id, litigants.litigant_id) = (legal_cases.plaintiff_details->>'party_id')) OR
            (COALESCE(litigants.party_id, litigants.litigant_id) = (legal_cases.respondent_details->>'party_id'))
          )
    )
);

-- 3. Create robust UPDATE policy
CREATE POLICY "Litigants can update their own cases"
ON legal_cases FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM litigants
        WHERE litigants.auth_user_id = auth.uid()
          AND (
            (COALESCE(litigants.party_id, litigants.litigant_id) = (legal_cases.plaintiff_details->>'party_id')) OR
            (COALESCE(litigants.party_id, litigants.litigant_id) = (legal_cases.respondent_details->>'party_id'))
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM litigants
        WHERE litigants.auth_user_id = auth.uid()
          AND (
            (COALESCE(litigants.party_id, litigants.litigant_id) = (legal_cases.plaintiff_details->>'party_id')) OR
            (COALESCE(litigants.party_id, litigants.litigant_id) = (legal_cases.respondent_details->>'party_id'))
          )
    )
);

-- 4. Allow clerks and admins to see all cases (needed for court staff)
DROP POLICY IF EXISTS "Staff can view all cases" ON legal_cases;
CREATE POLICY "Staff can view all cases"
ON legal_cases FOR SELECT TO authenticated
USING (
    (auth.jwt()->'user_metadata'->>'user_role' IN ('clerk', 'admin'))
);

-- 5. Ensure storage schema usage is still there
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.buckets TO authenticated;
