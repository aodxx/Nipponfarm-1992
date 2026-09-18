-- docs/schema.sql
-- โครงสร้างฐานข้อมูล เฟส 1 (ออกแบบไว้ล่วงหน้า — ยังไม่ได้รันจริงบน Supabase)
-- เมื่อพร้อมเชื่อม Supabase ให้รันไฟล์นี้ผ่าน SQL editor หรือ Supabase migration

-- พนักงาน/แอดมิน — เชื่อมกับ Supabase Auth
create table staff (
  id uuid primary key references auth.users(id),
  full_name text not null,
  role text not null check (role in ('admin', 'staff')),
  base_salary numeric,
  created_at timestamptz default now()
);

-- คอก
create table pens (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,        -- เช่น 'A-1', 'B-4'
  zone text,
  capacity int,
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
