-- Sales Targets & Commission Schema
-- รัน SQL นี้ใน Supabase SQL Editor

-- 1. เพิ่ม total_amount ใน projects (ถ้ายังไม่มี)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_amount numeric(15,2);

-- 2. สร้าง table sales_targets
CREATE TABLE IF NOT EXISTS sales_targets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  target_amount numeric(15,2) NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 3.00, -- % ของยอดขาย
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sales_id, year, month)
);

-- 3. RLS
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- admin/executive เห็นและแก้ได้ทั้งหมด
CREATE POLICY "admin_full_access_sales_targets" ON sales_targets
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Trigger updated_at
CREATE TRIGGER update_sales_targets_updated_at
  BEFORE UPDATE ON sales_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Index
CREATE INDEX IF NOT EXISTS idx_sales_targets_sales_id ON sales_targets(sales_id);
CREATE INDEX IF NOT EXISTS idx_sales_targets_year_month ON sales_targets(year, month);
