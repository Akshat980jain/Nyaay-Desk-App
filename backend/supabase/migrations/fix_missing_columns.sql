-- ============================================================
-- fix_missing_columns.sql
-- Run this in Supabase SQL Editor BEFORE running the migration script
-- Adds missing columns to existing tables without breaking anything
-- ============================================================

-- ─── LITIGANTS ────────────────────────────────────────────────────────────────
ALTER TABLE litigants ADD COLUMN IF NOT EXISTS litigant_id TEXT UNIQUE; -- actual name (not party_id)
ALTER TABLE litigants ADD COLUMN IF NOT EXISTS phone       TEXT;
ALTER TABLE litigants ADD COLUMN IF NOT EXISTS address     JSONB;
ALTER TABLE litigants ADD COLUMN IF NOT EXISTS party_type  TEXT DEFAULT 'plaintiff';
ALTER TABLE litigants ADD COLUMN IF NOT EXISTS status      TEXT DEFAULT 'active';
ALTER TABLE litigants ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE litigants ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE litigants ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- ─── ADVOCATES ────────────────────────────────────────────────────────────────
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS advocate_id  TEXT UNIQUE;
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS enrollment_no TEXT;  -- actual name (not enrollment_number)
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS enrollment_date DATE;
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS specialization TEXT[];
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS state          TEXT;
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS is_verified    BOOLEAN DEFAULT FALSE;
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS profile_pic    TEXT;
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS status         TEXT DEFAULT 'pending';
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS auth_user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE advocates ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();

-- ─── CLERKS ───────────────────────────────────────────────────────────────────
ALTER TABLE clerks ADD COLUMN IF NOT EXISTS clerk_id     TEXT UNIQUE;
ALTER TABLE clerks ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE clerks ADD COLUMN IF NOT EXISTS state        TEXT;
ALTER TABLE clerks ADD COLUMN IF NOT EXISTS role         TEXT DEFAULT 'clerk';
ALTER TABLE clerks ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'active';
ALTER TABLE clerks ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clerks ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE clerks ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

-- ─── COURT ADMINS ─────────────────────────────────────────────────────────────
ALTER TABLE court_admins ADD COLUMN IF NOT EXISTS admin_id    TEXT UNIQUE;
ALTER TABLE court_admins ADD COLUMN IF NOT EXISTS state       TEXT;
ALTER TABLE court_admins ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE court_admins ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE court_admins ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- ─── LEGAL CASES ──────────────────────────────────────────────────────────────
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS case_num               TEXT UNIQUE;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS case_no                TEXT;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS court                  TEXT;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS case_type              TEXT;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS district               TEXT;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS plaintiff_details      JSONB;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS respondent_details     JSONB;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS police_station_details JSONB;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS lower_court_details    JSONB;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS main_matter_details    JSONB;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS hearings               JSONB DEFAULT '[]'::jsonb;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS status                 TEXT DEFAULT 'Filed';
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS status_history         JSONB DEFAULT '[]'::jsonb;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS case_approved          BOOLEAN DEFAULT FALSE;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS documents              JSONB DEFAULT '[]'::jsonb;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS created_at             TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ DEFAULT NOW();

-- ─── UNIQUE INDEXES (for ON CONFLICT upsert to work) ──────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_litigants_email     ON litigants(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_advocates_email     ON advocates(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clerks_email        ON clerks(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_court_admins_email  ON court_admins(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_cases_case_num ON legal_cases(case_num);

CREATE UNIQUE INDEX IF NOT EXISTS idx_litigants_auth_user_id   ON litigants(auth_user_id)   WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_advocates_auth_user_id   ON advocates(auth_user_id)   WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clerks_auth_user_id      ON clerks(auth_user_id)      WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_court_admins_auth_user_id ON court_admins(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ─── RLS: Service role can bypass everything ───────────────────────────────────
ALTER TABLE litigants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE advocates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_litigants"   ON litigants;
DROP POLICY IF EXISTS "service_role_all_advocates"   ON advocates;
DROP POLICY IF EXISTS "service_role_all_clerks"      ON clerks;
DROP POLICY IF EXISTS "service_role_all_court_admins" ON court_admins;
DROP POLICY IF EXISTS "service_role_all_legal_cases" ON legal_cases;

CREATE POLICY "service_role_all_litigants"    ON litigants    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_advocates"    ON advocates    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_clerks"       ON clerks       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_court_admins" ON court_admins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_legal_cases"  ON legal_cases  FOR ALL USING (auth.role() = 'service_role');

-- Done!
SELECT 'All missing columns added successfully ✅' AS result;
