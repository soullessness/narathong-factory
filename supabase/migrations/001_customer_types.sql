-- Create customer_types table
CREATE TABLE IF NOT EXISTS customer_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_types ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Allow all for customer_types" ON customer_types
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default data
INSERT INTO customer_types (name, description, color, sort_order) VALUES
  ('retail', 'ลูกค้าทั่วไป', '#3b82f6', 1),
  ('contractor', 'ผู้รับเหมา', '#f59e0b', 2),
  ('developer', 'นักพัฒนา/Developer', '#10b981', 3);
