-- ==========================================
-- Update Roles & Departments
-- ==========================================

-- 1. เพิ่ม role ใหม่ใน enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'factory_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'team_lead';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'worker';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accounting';

-- 2. ล้าง departments เดิม แล้ว seed ใหม่
TRUNCATE TABLE departments RESTART IDENTITY CASCADE;

INSERT INTO departments (name, description) VALUES
-- สำนักงาน
('ผู้บริหาร', 'ทีมผู้บริหารนราทองพลัส'),
('ฝ่ายขาย', 'พนักงานขายและ CRM'),
('ฝ่ายบัญชี', 'ทีมบัญชีและการเงิน'),

-- โรงงานนราทองพลัส
('ทีมเตรียมไม้ (พลัส)', 'ทีมเตรียมวัตถุดิบโรงงานนราทองพลัส'),
('ทีมช่างไม้ (พลัส)', 'ทีมช่างไม้โรงงานนราทองพลัส'),
('ทีมช่างพ่นสี (พลัส)', 'ทีมช่างพ่นสีโรงงานนราทองพลัส'),
('ทีมประกอบ (พลัส)', 'ทีมประกอบชิ้นงานโรงงานนราทองพลัส'),
('ทีมแพคกิ้ง (พลัส)', 'ทีมแพคกิ้งโรงงานนราทองพลัส'),

-- โรงงานนราทองซอว์มิลล์
('ทีมเตรียมไม้ (ซอว์มิลล์)', 'ทีมเตรียมวัตถุดิบโรงงานซอว์มิลล์'),
('ทีมช่างไม้ (ซอว์มิลล์)', 'ทีมช่างไม้โรงงานซอว์มิลล์'),
('ทีมแปรรูป (ซอว์มิลล์)', 'ทีมแปรรูปไม้โรงงานซอว์มิลล์'),
('ทีมแพคกิ้ง (ซอว์มิลล์)', 'ทีมแพคกิ้งโรงงานซอว์มิลล์');
