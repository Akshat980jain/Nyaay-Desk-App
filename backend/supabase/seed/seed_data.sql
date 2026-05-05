-- Seed Data for Supabase
-- Run this after migration_full.sql if you want to seed initial users

-- 1. Seed Enrollment Records (Example)
INSERT INTO enrollment_records (enrollment_no, name_of_advocate, district, date_of_registration)
VALUES 
('UP/GZB/2020/001', 'Manoj Jain', 'Ghaziabad', '15/5/1990'),
('DL/2021/500', 'Jane Smith', 'Central Delhi', '10/1/2021')
ON CONFLICT (enrollment_no) DO NOTHING;

-- 2. Seed Admin User
-- Password: 'Akshat@123' (hashed: '$2a$10$7qG1J9oY.N4O.G.yX5L2v.W0Q6/fG6p8v.fG6p8v.fG6p8v.fG6p8')
-- Note: Replace with actual bcrypt hash for Akshat@123
INSERT INTO court_admins (admin_id, name, email, password, district, court_name)
VALUES ('ADMIN-GZB-001', 'Akshat Jain', 'aarjav100jain@gmail.com', '$2a$10$vI8A7sz5S3pE9y9x9Xv.u.u.u.u.u.u.u.u.u.u.u.u.u.u', 'Ghaziabad', 'District & Sessions Court, Ghaziabad')
ON CONFLICT (admin_id) DO NOTHING;

-- 3. Seed Clerk User
INSERT INTO clerks (clerk_id, name, email, password, district, court_name)
VALUES ('CLERK-GZB-001', 'Aarjav Jain', 'aarjav.jain.9.b.sdpsmzn@gmail.com', '$2a$10$vI8A7sz5S3pE9y9x9Xv.u.u.u.u.u.u.u.u.u.u.u.u.u.u', 'Ghaziabad', 'District Court, Ghaziabad')
ON CONFLICT (clerk_id) DO NOTHING;
