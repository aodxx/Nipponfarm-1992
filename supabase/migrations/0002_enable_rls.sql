-- supabase/migrations/0002_enable_rls.sql
-- เปิด Row Level Security ทุกตาราง + เขียน policy จริง
-- ต้องรันไฟล์นี้ให้เสร็จก่อนให้ client (anon/authenticated) เรียกตารางเหล่านี้จริง (ดู DECISIONS.md ADR-008)

-- ---------- Helper: เช็คว่า user ปัจจุบันเป็น admin หรือไม่ ----------
-- security definer เพื่อให้ query ตาราง staff ได้แม้ RLS ของ staff เองจะกันอยู่
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from staff
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =====================================================
-- staff
-- =====================================================
alter table staff enable row level security;

create policy "staff: admin sees all" on staff
  for select using (is_admin());

create policy "staff: self sees own row" on staff
  for select using (id = auth.uid());

create policy "staff: admin manages all" on staff
  for all using (is_admin()) with check (is_admin());

-- =====================================================
-- buildings / pens / pigs / task_types / tasks / pig_events
-- ข้อมูลปฏิบัติการฟาร์ม — staff และ admin (ผู้ authenticated ทุกคน) อ่าน/เพิ่ม/แก้ไขได้
-- ลบได้เฉพาะ admin (ป้องกันพนักงานลบประวัติหมูโดยไม่ตั้งใจ)
-- =====================================================

alter table buildings enable row level security;
create policy "buildings: authenticated read" on buildings for select using (auth.role() = 'authenticated');
create policy "buildings: authenticated write" on buildings for insert with check (auth.role() = 'authenticated');
create policy "buildings: authenticated update" on buildings for update using (auth.role() = 'authenticated');
create policy "buildings: admin delete" on buildings for delete using (is_admin());

alter table pens enable row level security;
create policy "pens: authenticated read" on pens for select using (auth.role() = 'authenticated');
create policy "pens: authenticated write" on pens for insert with check (auth.role() = 'authenticated');
create policy "pens: authenticated update" on pens for update using (auth.role() = 'authenticated');
create policy "pens: admin delete" on pens for delete using (is_admin());

alter table pigs enable row level security;
create policy "pigs: authenticated read" on pigs for select using (auth.role() = 'authenticated');
create policy "pigs: authenticated write" on pigs for insert with check (auth.role() = 'authenticated');
create policy "pigs: authenticated update" on pigs for update using (auth.role() = 'authenticated');
create policy "pigs: admin delete" on pigs for delete using (is_admin());

alter table task_types enable row level security;
create policy "task_types: authenticated read" on task_types for select using (auth.role() = 'authenticated');
create policy "task_types: admin write" on task_types for insert with check (is_admin());
create policy "task_types: admin update" on task_types for update using (is_admin());
create policy "task_types: admin delete" on task_types for delete using (is_admin());

alter table tasks enable row level security;
create policy "tasks: authenticated read" on tasks for select using (auth.role() = 'authenticated');
create policy "tasks: authenticated write" on tasks for insert with check (auth.role() = 'authenticated');
create policy "tasks: authenticated update" on tasks for update using (auth.role() = 'authenticated');
create policy "tasks: admin delete" on tasks for delete using (is_admin());

alter table pig_events enable row level security;
create policy "pig_events: authenticated read" on pig_events for select using (auth.role() = 'authenticated');
create policy "pig_events: authenticated write" on pig_events for insert with check (auth.role() = 'authenticated');
create policy "pig_events: admin update" on pig_events for update using (is_admin());
create policy "pig_events: admin delete" on pig_events for delete using (is_admin());

-- =====================================================
-- bills / bill_items / sales (เฟส 4)
-- staff: เพิ่มรายการใหม่ได้ + อ่านได้ (เห็นสถานะรออนุมัติใน Overview) แต่แก้ไข/ลบไม่ได้
-- admin: ทำได้ทุกอย่าง
-- =====================================================

alter table bills enable row level security;
create policy "bills: authenticated read" on bills for select using (auth.role() = 'authenticated');
create policy "bills: authenticated insert" on bills for insert with check (auth.role() = 'authenticated');
create policy "bills: admin update" on bills for update using (is_admin());
create policy "bills: admin delete" on bills for delete using (is_admin());

alter table bill_items enable row level security;
create policy "bill_items: authenticated read" on bill_items for select using (auth.role() = 'authenticated');
create policy "bill_items: authenticated insert" on bill_items for insert with check (auth.role() = 'authenticated');
create policy "bill_items: admin update" on bill_items for update using (is_admin());
create policy "bill_items: admin delete" on bill_items for delete using (is_admin());

alter table sales enable row level security;
create policy "sales: authenticated read" on sales for select using (auth.role() = 'authenticated');
create policy "sales: authenticated insert" on sales for insert with check (auth.role() = 'authenticated');
create policy "sales: admin update" on sales for update using (is_admin());
create policy "sales: admin delete" on sales for delete using (is_admin());

-- =====================================================
-- cash_advances / payslips (เฟส 5)
-- staff: เห็น/สร้างได้เฉพาะของตัวเอง
-- admin: เห็น/จัดการได้ทั้งหมด
-- =====================================================

alter table cash_advances enable row level security;
create policy "cash_advances: self read" on cash_advances for select using (staff_id = auth.uid() or is_admin());
create policy "cash_advances: self insert" on cash_advances for insert with check (staff_id = auth.uid());
create policy "cash_advances: admin update" on cash_advances for update using (is_admin());
create policy "cash_advances: admin delete" on cash_advances for delete using (is_admin());

alter table payslips enable row level security;
create policy "payslips: self read" on payslips for select using (staff_id = auth.uid() or is_admin());
create policy "payslips: admin insert" on payslips for insert with check (is_admin());
create policy "payslips: admin update" on payslips for update using (is_admin());
create policy "payslips: admin delete" on payslips for delete using (is_admin());
