-- Comprehensive Migration for Supabase
-- This script creates all necessary tables for the Case Manager platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Litigants Table
CREATE TABLE IF NOT EXISTS litigants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    address JSONB, -- district, state, pin, details
    party_type TEXT DEFAULT 'plaintiff', -- plaintiff or respondent
    status TEXT DEFAULT 'active', -- active, suspended, pending
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Advocates Table
CREATE TABLE IF NOT EXISTS advocates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id TEXT UNIQUE NOT NULL, -- enrollment number
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    enrollment_number TEXT UNIQUE NOT NULL,
    enrollment_date DATE,
    specialization TEXT[],
    district TEXT,
    state TEXT,
    status TEXT DEFAULT 'pending', -- pending, active, suspended
    is_verified BOOLEAN DEFAULT FALSE,
    profile_pic TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clerks Table
CREATE TABLE IF NOT EXISTS clerks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    court_name TEXT,
    district TEXT,
    state TEXT,
    role TEXT DEFAULT 'clerk',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Court Admins Table
CREATE TABLE IF NOT EXISTS court_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    court_name TEXT,
    district TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Legal Cases Table
CREATE TABLE IF NOT EXISTS legal_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_num TEXT UNIQUE NOT NULL, -- CNR
    case_no TEXT,
    court TEXT NOT NULL,
    case_type TEXT NOT NULL,
    district TEXT NOT NULL,
    plaintiff_details JSONB, -- name, party_id, advocate_id, subject, etc.
    respondent_details JSONB, -- name, party_id, advocate_id, subject, etc.
    police_station_details JSONB,
    lower_court_details JSONB,
    main_matter_details JSONB,
    hearings JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Filed',
    status_history JSONB DEFAULT '[]'::jsonb,
    case_approved BOOLEAN DEFAULT FALSE,
    documents JSONB DEFAULT '[]'::jsonb,
    case_embedding vector(1536), -- if pgvector is enabled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enrollment Records (for verification)
CREATE TABLE IF NOT EXISTS enrollment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_no TEXT UNIQUE NOT NULL,
    name_of_advocate TEXT NOT NULL,
    fathers_name_of_advocate TEXT,
    district TEXT,
    date_of_registration TEXT, -- Expected format: DD/MM/YYYY
    verification_date DATE DEFAULT CURRENT_DATE,
    bar_council TEXT
);

-- 7. Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT, -- advocate, litigant, clerk, or all
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Blacklisted Tokens Table
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Advocate Change Requests Table
CREATE TABLE IF NOT EXISTS advocate_change_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id TEXT NOT NULL, -- CNR
    litigant_id TEXT NOT NULL,
    existing_advocate_id TEXT NOT NULL,
    has_noc BOOLEAN DEFAULT FALSE,
    noc_details JSONB,
    reason_for_no_noc TEXT,
    noc_request_status TEXT DEFAULT 'None', -- Requested, Signed, Declined
    noc_decline_reason TEXT,
    noc_digital_signature JSONB,
    noc_document_url TEXT,
    status TEXT DEFAULT 'Draft', -- NOC Submitted, NOC Signed, Under Court Review, Approved, Rejected
    review_remarks TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Blockchain Blocks Table
CREATE TABLE IF NOT EXISTS blockchain_blocks (
    block_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "index" INTEGER UNIQUE NOT NULL,
    "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL,
    previous_hash TEXT NOT NULL,
    hash TEXT UNIQUE NOT NULL,
    nonce INTEGER DEFAULT 0,
    network_id TEXT NOT NULL,
    data_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_type TEXT NOT NULL,
    ipfs JSONB,
    signature JSONB,
    merkle_root TEXT,
    verification_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. OTPs Table
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Audit Checkpoints Table
CREATE TABLE IF NOT EXISTS audit_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_index INTEGER NOT NULL,
    block_hash TEXT NOT NULL,
    data_fingerprint TEXT NOT NULL,
    timestamp_proof JSONB,
    commitments JSONB,
    checksums JSONB,
    entity_id TEXT NOT NULL,
    data_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create some indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_cases_case_num ON legal_cases(case_num);
CREATE INDEX IF NOT EXISTS idx_legal_cases_district ON legal_cases(district);
CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_entity_id ON blockchain_blocks(entity_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_hash ON blockchain_blocks(hash);
CREATE INDEX IF NOT EXISTS idx_audit_checkpoints_block_index ON audit_checkpoints(block_index);
CREATE INDEX IF NOT EXISTS idx_audit_checkpoints_entity_id ON audit_checkpoints(entity_id);

-- 13. Storage Buckets (Optional: Run if you want to initialize buckets via SQL)
-- Note: Requires storage schema access. If this fails, create buckets manually in Supabase Dashboard.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cop_documents', 'cop_documents', false) ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile_pictures', 'profile_pictures', true) ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('case_documents', 'case_documents', false) ON CONFLICT (id) DO NOTHING;
