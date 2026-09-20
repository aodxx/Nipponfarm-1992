-- docs/schema.sql
-- โครงสร้างฐานข้อมูลเต็มทุกเฟส (ออกแบบไว้ล่วงหน้า — ยังไม่ได้รันจริงบน Supabase)
-- คำอธิบายเหตุผล/ความสัมพันธ์ของแต่ละตาราง ดูที่ DATABASE.md
-- เมื่อพร้อมเชื่อม Supabase ให้รันไฟล์นี้ผ่าน SQL editor หรือ Supabase migration
-- (RLS policies จะเพิ่มเป็นไฟล์ migration แยกตอนเชื่อมจริง ตามที่ระบุใน DATABASE.md/API.md)

-- ============ เฟส 1: โครงข้อมูลหลัก ============

-- พนักงาน/แอดมิน — เชื่อมกับ Supabase Auth
create table staff (
  id uuid primary key references auth.users(id),
  full_name text not null,
  role text not null check (role in ('admin', 'staff')),
  base_salary numeric,
  created_at timestamptz default now()
);

-- โรงเรือน
create table buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,        -- เช่น 'โรงเรือน A', 'โรงเรือน C'
  created_at timestamptz default now()
);

-- คอก
create table pens (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references buildings(id),
  code text not null unique,        -- เช่น 'A-1', 'B-4'
  capacity int,
  pos_x numeric,                    -- ตำแหน่งบนผังคอก (ใช้จริงเฟส 3)
  pos_y numeric,
  created_at timestamptz default now()
);

-- หมู/แม่พันธุ์
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
  expected_farrow_date date,        -- คำนวณ/อัปเดตเมื่อบันทึกเหตุการณ์ "ผสมพันธุ์"
  created_at timestamptz default now()
);

-- ประเภทงาน — อ้างอิงสำหรับ auto-generate tasks
create table task_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,        -- เช่น 'ตรวจท้อง', 'ย้ายคอก', 'คลอด', 'หย่านม', 'ซ่อมบำรุง'
  default_offset_days int           -- เช่น ตรวจท้อง = +21 วันจากวันผสม
);

-- งานที่ต้องทำ
create table tasks (
  id uuid primary key default gen_random_uuid(),
  task_type_id uuid references task_types(id),
  pig_id uuid references pigs(id),           -- null ได้ ถ้าเป็นงานทั่วไป เช่น ซ่อมบำรุง
  title text not null,
  due_date date not null,
  assigned_to uuid references staff(id),
  status text not null default 'รอทำ' check (status in ('รอทำ', 'เสร็จแล้ว', 'เลยกำหนด')),
  created_at timestamptz default now()
);

-- log เหตุการณ์ของหมูแต่ละตัว — เป็นฐานให้ trigger สร้าง tasks อัตโนมัติ
-- และเป็นที่มาของ "ประวัติ" ทั้งหมด (ผสม/ท้อง/คลอด/หย่านม/รักษา) — ดู ADR-006 ใน DECISIONS.md
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

-- ตัวอย่าง trigger แนวคิด (เขียนละเอียดตอนเชื่อม Supabase จริง):
-- เมื่อ insert pig_events ที่ event_type = 'ผสมพันธุ์'
--   -> insert เข้า tasks: title = 'ตรวจท้อง', due_date = event_date + 21
--   -> update pigs.status = 'ท้อง', pigs.expected_farrow_date = event_date + 114

-- ============ เฟส 2: แม่พันธุ์/ปฏิทิน ============
-- ไม่มีตารางใหม่ — ใช้ pigs, pig_events, tasks, task_types จากเฟส 1

-- ============ เฟส 3: ผังคอก ============
-- ไม่มีตารางใหม่ — ใช้ buildings, pens.pos_x/pos_y/capacity จากเฟส 1

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
