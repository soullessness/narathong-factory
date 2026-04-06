-- Product Categories
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  has_area_pricing boolean default false, -- true สำหรับ พื้น/ผนัง/ฝ้า
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Seed default categories
insert into public.product_categories (name, slug, has_area_pricing, sort_order) values
  ('ไม้พื้น', 'floor', true, 1),
  ('ไม้ผนัง', 'wall', true, 2),
  ('ไม้ฝ้า', 'ceiling', true, 3),
  ('ไม้ระแนง', 'fence', false, 4),
  ('ประตู', 'door', false, 5),
  ('อื่นๆ', 'other', false, 6)
on conflict (slug) do nothing;

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  description text,
  sku text,
  image_url text,
  unit text default 'แผ่น', -- หน่วยขาย เช่น แผ่น, เมตร, ชิ้น
  price_per_unit numeric(12,2) default 0, -- ราคาต่อหน่วย (ต่อแผ่น)
  -- สำหรับสินค้าประเภทพื้น/ผนัง/ฝ้า (has_area_pricing = true)
  width_mm numeric(8,2), -- ความกว้าง หน้า (มม.) เช่น 6 นิ้ว = 152.4 มม.
  length_m numeric(8,3), -- ความยาว (เมตร) เช่น 1.8
  pieces_per_pack int, -- จำนวนแผ่น/แพ็ค
  price_per_pack numeric(12,2), -- ราคาต่อแพ็ค (optional)
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.product_categories enable row level security;
alter table public.products enable row level security;

create policy "Allow authenticated read categories" on public.product_categories
  for select to authenticated using (true);
create policy "Allow admin manage categories" on public.product_categories
  for all to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Allow authenticated read products" on public.products
  for select to authenticated using (true);
create policy "Allow admin manage products" on public.products
  for all to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
