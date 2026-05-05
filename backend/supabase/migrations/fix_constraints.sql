-- Run this script in Supabase SQL Editor to fix missing UNIQUE constraints
-- This ensures that ON CONFLICT works correctly for seeding data

-- 1. Fix enrollment_records
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollment_records_enrollment_no_key') THEN
        ALTER TABLE enrollment_records ADD CONSTRAINT enrollment_records_enrollment_no_key UNIQUE (enrollment_no);
    END IF;
END $$;

-- 2. Fix court_admins
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'court_admins_admin_id_key') THEN
        ALTER TABLE court_admins ADD CONSTRAINT court_admins_admin_id_key UNIQUE (admin_id);
    END IF;
END $$;

-- 3. Fix clerks
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clerks_clerk_id_key') THEN
        ALTER TABLE clerks ADD CONSTRAINT clerks_clerk_id_key UNIQUE (clerk_id);
    END IF;
END $$;

-- 4. Fix advocates (if needed)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advocates_advocate_id_key') THEN
        ALTER TABLE advocates ADD CONSTRAINT advocates_advocate_id_key UNIQUE (advocate_id);
    END IF;
END $$;
