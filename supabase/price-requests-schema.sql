-- ==========================================
-- Price Request System Schema
-- ==========================================

-- Enum: product type
CREATE TYPE product_type_enum AS ENUM (
  'door', 'frame', 'window', 'floor', 'ceiling', 'wall', 'fence', 'deck', 'other'
);

-- Enum: request status
CREATE TYPE price_request_status AS ENUM (
  'pending', 'reviewing', 'quoted', 'rejected'
);

-- ตาราง price_requests
CREATE TABLE price_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  product_type product_type_enum NOT NULL DEFAULT 'other',
  product_name TEXT NOT NULL,
  spec TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'ชิ้น',
  deadline_date DATE,
  status price_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ตาราง price_request_responses (โรงงานตอบราคา)
CREATE TABLE price_request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES price_requests(id) ON DELETE CASCADE,
  responded_by UUID NOT NULL REFERENCES profiles(id),
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  production_days INTEGER,
  notes TEXT,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: updated_at auto-update
CREATE OR REPLACE FUNCTION update_price_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_price_requests_updated_at
  BEFORE UPDATE ON price_requests
  FOR EACH ROW EXECUTE FUNCTION update_price_requests_updated_at();

-- RLS
ALTER TABLE price_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_request_responses ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users อ่านได้ทั้งหมด
CREATE POLICY "price_requests_select" ON price_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "price_request_responses_select" ON price_request_responses
  FOR SELECT TO authenticated USING (true);

-- Policy: เซลสร้าง request ได้
CREATE POLICY "price_requests_insert" ON price_requests
  FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());

-- Policy: admin/factory_head แก้ไข status ได้ / เซลแก้ของตัวเองได้
CREATE POLICY "price_requests_update" ON price_requests
  FOR UPDATE TO authenticated USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'factory_head', 'manager')
    )
  );

-- Policy: factory_head/admin ตอบราคาได้
CREATE POLICY "price_request_responses_insert" ON price_request_responses
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'factory_head', 'manager')
    )
  );

CREATE POLICY "price_request_responses_update" ON price_request_responses
  FOR UPDATE TO authenticated USING (responded_by = auth.uid());

-- Index
CREATE INDEX idx_price_requests_status ON price_requests(status);
CREATE INDEX idx_price_requests_requested_by ON price_requests(requested_by);
CREATE INDEX idx_price_requests_quotation_id ON price_requests(quotation_id);
CREATE INDEX idx_price_request_responses_request_id ON price_request_responses(request_id);
