-- Allow all authenticated users to view advocates
DROP POLICY IF EXISTS "Allow authenticated select advocates" ON advocates;
CREATE POLICY "Allow authenticated select advocates" ON advocates
FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to view litigants
DROP POLICY IF EXISTS "Allow authenticated select litigants" ON litigants;
CREATE POLICY "Allow authenticated select litigants" ON litigants
FOR SELECT TO authenticated USING (true);

-- Ensure RLS is enabled
ALTER TABLE advocates ENABLE ROW LEVEL SECURITY;
ALTER TABLE litigants ENABLE ROW LEVEL SECURITY;
