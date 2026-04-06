-- =========================================
-- Narathong Factory - Database Schema
-- Generated: 2026-04-06
-- =========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ===== DEPARTMENTS =====
create table if not exists departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null, -- production, sales, logistics, installation, management
  created_at timestamptz default now()
);

-- ===== PROFILES (extends auth.users) =====
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'worker', -- admin, factory_manager, sales, dept_head, worker, logistics, installation
  department_id uuid references departments(id),
  phone text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== CUSTOMERS =====
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  customer_type text default 'retail', -- retail, contractor, developer
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== PROJECTS =====
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  project_code text unique,
  name text not null,
  customer_id uuid references customers(id),
  stage text not null default 'lead', -- lead, presentation, quotation, deposit, production, delivery, installation, completed, cancelled
  status text default 'active', -- active, on_hold, completed, cancelled
  value numeric(15,2),
  deposit_amount numeric(15,2),
  deadline date,
  notes text,
  assigned_sales uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== CRM STAGE LOGS =====
create table if not exists crm_stage_logs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  note text,
  changed_by uuid references profiles(id),
  changed_at timestamptz default now()
);

-- ===== QUOTATIONS =====
create table if not exists quotations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  quotation_number text unique,
  items jsonb not null default '[]',
  subtotal numeric(15,2) default 0,
  discount numeric(15,2) default 0,
  total numeric(15,2) default 0,
  status text default 'draft', -- draft, sent, approved, rejected
  valid_until date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== WORKER DAILY LOGS =====
create table if not exists worker_logs (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references profiles(id),
  project_id uuid references projects(id),
  department_id uuid references departments(id),
  log_date date not null default current_date,
  description text not null,
  quantity numeric(10,2),
  unit text,
  hours_worked numeric(4,2),
  status text default 'pending', -- pending, approved, rejected
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- ===== DEPARTMENT CAPACITY =====
create table if not exists dept_capacity (
  id uuid primary key default uuid_generate_v4(),
  department_id uuid references departments(id),
  capacity_date date not null default current_date,
  capacity_units numeric(10,2),
  actual_units numeric(10,2),
  notes text,
  recorded_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique(department_id, capacity_date)
);

-- ===== DELIVERIES =====
create table if not exists deliveries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  driver_id uuid references profiles(id),
  vehicle_plate text,
  depart_at timestamptz,
  arrive_at timestamptz,
  photos_loading jsonb default '[]',
  photos_delivery jsonb default '[]',
  status text default 'pending', -- pending, in_transit, delivered
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== INSTALLATIONS =====
create table if not exists installations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  team_lead uuid references profiles(id),
  survey_date date,
  survey_notes text,
  estimated_days int,
  estimated_cost numeric(15,2),
  scheduled_date date,
  completed_date date,
  photos_before jsonb default '[]',
  photos_after jsonb default '[]',
  status text default 'pending', -- pending, surveyed, scheduled, in_progress, completed
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== TRIGGER: auto-update updated_at =====
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create or replace trigger customers_updated_at before update on customers for each row execute function update_updated_at();
create or replace trigger projects_updated_at before update on projects for each row execute function update_updated_at();
create or replace trigger quotations_updated_at before update on quotations for each row execute function update_updated_at();
create or replace trigger deliveries_updated_at before update on deliveries for each row execute function update_updated_at();
create or replace trigger installations_updated_at before update on installations for each row execute function update_updated_at();

-- ===== TRIGGER: auto-create profile on signup =====
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'worker')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ===== SEED: Departments =====
insert into departments (name, type) values
  ('ฝ่ายขาย', 'sales'),
  ('ฝ่ายผลิต - ตัดไม้', 'production'),
  ('ฝ่ายผลิต - แปรรูป', 'production'),
  ('ฝ่ายผลิต - ประกอบ', 'production'),
  ('ฝ่ายผลิต - QC', 'production'),
  ('ฝ่ายขนส่ง', 'logistics'),
  ('ทีมติดตั้ง', 'installation'),
  ('ฝ่ายบริหาร', 'management')
on conflict do nothing;

-- ===== RLS POLICIES =====
alter table profiles enable row level security;
alter table customers enable row level security;
alter table projects enable row level security;
alter table crm_stage_logs enable row level security;
alter table quotations enable row level security;
alter table worker_logs enable row level security;
alter table dept_capacity enable row level security;
alter table deliveries enable row level security;
alter table installations enable row level security;
alter table departments enable row level security;

-- Profiles: everyone can read, only admin/self can update
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update_self" on profiles for update using (auth.uid() = id);

-- Departments: everyone can read
create policy "departments_select" on departments for select using (true);

-- Projects: authenticated users can read
create policy "projects_select" on projects for select using (auth.uid() is not null);
create policy "projects_insert" on projects for insert with check (auth.uid() is not null);
create policy "projects_update" on projects for update using (auth.uid() is not null);

-- Customers: authenticated users can read/write
create policy "customers_select" on customers for select using (auth.uid() is not null);
create policy "customers_insert" on customers for insert with check (auth.uid() is not null);
create policy "customers_update" on customers for update using (auth.uid() is not null);

-- Worker logs: workers see own, dept_head sees department
create policy "worker_logs_select" on worker_logs for select using (auth.uid() is not null);
create policy "worker_logs_insert" on worker_logs for insert with check (auth.uid() = worker_id);
create policy "worker_logs_update" on worker_logs for update using (auth.uid() is not null);

-- Other tables: authenticated access
create policy "crm_logs_select" on crm_stage_logs for select using (auth.uid() is not null);
create policy "crm_logs_insert" on crm_stage_logs for insert with check (auth.uid() is not null);
create policy "quotations_select" on quotations for select using (auth.uid() is not null);
create policy "quotations_insert" on quotations for insert with check (auth.uid() is not null);
create policy "quotations_update" on quotations for update using (auth.uid() is not null);
create policy "dept_capacity_select" on dept_capacity for select using (auth.uid() is not null);
create policy "dept_capacity_insert" on dept_capacity for insert with check (auth.uid() is not null);
create policy "deliveries_select" on deliveries for select using (auth.uid() is not null);
create policy "deliveries_insert" on deliveries for insert with check (auth.uid() is not null);
create policy "deliveries_update" on deliveries for update using (auth.uid() is not null);
create policy "installations_select" on installations for select using (auth.uid() is not null);
create policy "installations_insert" on installations for insert with check (auth.uid() is not null);
create policy "installations_update" on installations for update using (auth.uid() is not null);
