-- supabase/seed.sql
-- ข้อมูลตั้งต้นที่ต้องมีก่อนใช้งานจริง (ไม่ใช่ข้อมูลทดสอบ)
-- รันหลัง migrations ทั้งหมดเสร็จ

insert into task_types (name, default_offset_days) values
  ('ตรวจท้อง', 21),
  ('ย้ายเข้าคอกคลอด', 111),
  ('เฝ้าคลอด', 114),
  ('หย่านม', 149),
  ('ซ่อมบำรุง', null),
  ('ตรวจสุขภาพ', null)
on conflict (name) do nothing;
