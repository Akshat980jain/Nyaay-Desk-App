-- 1. Clerks Table
CREATE TABLE IF NOT EXISTS clerks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    district TEXT NOT NULL,
    court_name TEXT,
    court_no TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_otp TEXT,
    otp_expiry TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending',
    last_login TIMESTAMP WITH TIME ZONE,
    last_logout TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Court Admins Table
CREATE TABLE IF NOT EXISTS court_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    district TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Blacklisted Tokens Table
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    user_id TEXT,
    user_type TEXT,
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    target_audience TEXT, -- 'all', 'advocate', 'litigant'
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Court Calendar Table
CREATE TABLE IF NOT EXISTS court_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    court_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
