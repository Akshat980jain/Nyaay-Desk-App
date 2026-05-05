-- ============================================================
-- PHASE 1: Supabase Auth Integration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Add user_role column to track role per user in auth metadata
-- This is stored in auth.users -> raw_user_meta_data->>'user_role'

-- Step 2: Add litigant_id, advocate_id, clerk_id, admin_id columns
-- so we can link auth.users to our custom tables

ALTER TABLE litigants ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clerks    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE court_admins ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Unique constraint: one auth user = one profile row
CREATE UNIQUE INDEX IF NOT EXISTS idx_litigants_auth_user_id  ON litigants(auth_user_id)  WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_advocates_auth_user_id  ON advocates(auth_user_id)  WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clerks_auth_user_id     ON clerks(auth_user_id)     WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_court_admins_auth_user_id ON court_admins(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Step 3: Enable RLS on all user tables
ALTER TABLE litigants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE advocates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_checkpoints ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies

-- Litigants: can only read/update their own profile
DROP POLICY IF EXISTS "litigants_self_access" ON litigants;
CREATE POLICY "litigants_self_access" ON litigants
  FOR ALL USING (auth.uid() = auth_user_id);

-- Advocates: can only read/update their own profile
DROP POLICY IF EXISTS "advocates_self_access" ON advocates;
CREATE POLICY "advocates_self_access" ON advocates
  FOR ALL USING (auth.uid() = auth_user_id);

-- Clerks: can only read/update their own profile
DROP POLICY IF EXISTS "clerks_self_access" ON clerks;
CREATE POLICY "clerks_self_access" ON clerks
  FOR ALL USING (auth.uid() = auth_user_id);

-- Court Admins: can only read/update their own profile
DROP POLICY IF EXISTS "court_admins_self_access" ON court_admins;
CREATE POLICY "court_admins_self_access" ON court_admins
  FOR ALL USING (auth.uid() = auth_user_id);

-- Service role can bypass all RLS (for Edge Functions)
DROP POLICY IF EXISTS "service_role_litigants" ON litigants;
CREATE POLICY "service_role_litigants" ON litigants
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_advocates" ON advocates;
CREATE POLICY "service_role_advocates" ON advocates
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_clerks" ON clerks;
CREATE POLICY "service_role_clerks" ON clerks
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_court_admins" ON court_admins;
CREATE POLICY "service_role_court_admins" ON court_admins
  FOR ALL USING (auth.role() = 'service_role');

-- Legal Cases: advocates and litigants can see cases they are part of
DROP POLICY IF EXISTS "legal_cases_read" ON legal_cases;
CREATE POLICY "legal_cases_read" ON legal_cases
  FOR SELECT USING (true); -- All authenticated users can search/view cases

DROP POLICY IF EXISTS "legal_cases_service_role" ON legal_cases;
CREATE POLICY "legal_cases_service_role" ON legal_cases
  FOR ALL USING (auth.role() = 'service_role');

-- Blockchain: read-only for authenticated users, write only via service role
DROP POLICY IF EXISTS "blockchain_read" ON blockchain_blocks;
CREATE POLICY "blockchain_read" ON blockchain_blocks
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "blockchain_write_service" ON blockchain_blocks;
CREATE POLICY "blockchain_write_service" ON blockchain_blocks
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "audit_read" ON audit_checkpoints;
CREATE POLICY "audit_read" ON audit_checkpoints
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "audit_write_service" ON audit_checkpoints;
CREATE POLICY "audit_write_service" ON audit_checkpoints
  FOR ALL USING (auth.role() = 'service_role');

-- Step 5: Function to get the current user's role from JWT metadata
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'user_role',
    auth.jwt() -> 'app_metadata' ->> 'user_role',
    'unknown'
  );
$$ LANGUAGE sql STABLE;
