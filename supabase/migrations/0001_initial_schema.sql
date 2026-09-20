-- supabase/migrations/0001_initial_schema.sql
-- ตารางทั้งหมดทุกเฟส (ไม่มี RLS ในไฟล์นี้ — ดู 0002_enable_rls.sql)
-- คำอธิบายเหตุผล/ความสัมพันธ์ของแต่ละตาราง → DATABASE.md
-- ห้ามเปิดให้ client (anon/authenticated) เข้าถึงตารางเหล่านี้ก่อนรัน 0002 ให้ครบ

-- ============ เฟส 1: โครงข้อมูลหลัก ============

create table staff (
  id uuid primary key references auth.users(id),
  full_name text not null,
  role text not null check (role in ('admin', 'staff')),
  base_salary numeric,
  created_at timestamptz default now()
);

create table buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table pens (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references buildings(id),
  code text not null unique,
  capacity int,
  pos_x numeric,
  pos_y numeric,
  created_at timestamptz default now()
);

create table pigs (
  id uuid primary key default gen_random_uuid(),
  ear_tag text not null unique,
  breed text,
  birth_date date,
  pen_id uuid references pens(id),
  status text not null check (
    status in ('รอผสม', 'ผสมแล้ว', 'ท้อง', 'เลี้ยงลูก', 'หย่านมแล้ว', 'ขายแล้ว', 'ตาย')
  ),
  breeding_count int default 0,
  expected_farrow_date date,
  created_at timestamptz default now()
);

create table task_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_offset_days int
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  task_type_id uuid references task_types(id),
  pig_id uuid references pigs(id),           -- null ได้ ถ้าเป็นงานทั่วไป (เช่น ซ่อมบำรุง)
                                              -- หา pen ของงานนี้ผ่าน pigs.pen_id (ไม่มีคอลัมน์ pen_id ตรงในตารางนี้ — ดู API.md ข้อ query)
  title text not null,
  due_date date not null,
  assigned_to uuid references staff(id),
  status text not null default 'รอทำ' check (status in ('รอทำ', 'เสร็จแล้ว', 'เลยกำหนด')),
  created_at timestamptz default now()
);

create table pig_events (
  id uuid primary key default gen_random_uuid(),
  pig_id uuid references pigs(id) not null,
  event_type text not null check (
    event_type in ('ผสมพันธุ์', 'ตรวจท้อง', 'คลอด', 'หย่านม', 'รักษา', 'อื่นๆ')
  ),
  event_date date not null,
  notes text,
  recorded_by uuid references staff(id),
  created_at timestamptz default now()
);

-- ============ เฟส 4: การเงิน ============

create table bills (
  id uuid primary key default gen_random_uuid(),
  bill_date date not null,
  vendor text,
  category text,
  total_amount numeric not null,
  image_url text,
  status text not null default 'รอตรวจสอบ' check (status in ('รอตรวจสอบ', 'ยืนยันแล้ว')),
  created_by uuid references staff(id),
  created_at timestamptz default now()
);

create table bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid references bills(id) not null,
  item_name text not null,
  quantity numeric,
  unit_price numeric,
  subtotal numeric
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null,
  pig_count int not null,
  total_weight_kg numeric,
  avg_weight_kg numeric,
  price_per_kg numeric,
  vehicle_plate text,
  gross_amount numeric,
  deductions numeric,
  net_amount numeric,
  payment_status text not null default 'รอชำระ' check (payment_status in ('รอชำระ', 'ชำระแล้ว')),
  proof_image_url text,
  signature_image_url text,
  created_by uuid references staff(id),
  created_at timestamptz default now()
);

-- ============ เฟส 5: พนักงาน/เงินเดือน ============

create table cash_advances (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) not null,
  amount numeric not null,
  requested_date date not null,
  status text not null default 'รออนุมัติ' check (status in ('รออนุมัติ', 'อนุมัติแล้ว', 'ปฏิเสธ')),
  approved_by uuid references staff(id),
  approved_date date,
  notes text,
  created_at timestamptz default now()
);

create table payslips (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) not null,
  period_start date not null,
  period_end date not null,
  base_amount numeric,
  advances_deducted numeric default 0,
  other_deductions numeric default 0,
  net_amount numeric,
  generated_at timestamptz default now()
);
