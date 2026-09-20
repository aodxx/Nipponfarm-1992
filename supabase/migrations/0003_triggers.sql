-- supabase/migrations/0003_triggers.sql
-- Trigger: เมื่อบันทึก pig_events ประเภท "ผสมพันธุ์" ให้:
--   1) อัปเดตสถานะแม่พันธุ์ + วันคลอดคาดการณ์ (ตั้งท้อง ~114 วัน)
--   2) สร้างงาน "ตรวจท้อง" อัตโนมัติ (+21 วันจากวันผสม) — อ้างอิง task_types.default_offset_days ถ้ามี seed ไว้

create or replace function handle_pig_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offset_days int;
begin
  if new.event_type = 'ผสมพันธุ์' then
    update pigs
      set status = 'ท้อง',
          expected_farrow_date = new.event_date + interval '114 days'
      where id = new.pig_id;

    select coalesce(default_offset_days, 21) into v_offset_days
      from task_types where name = 'ตรวจท้อง'
      limit 1;

    insert into tasks (task_type_id, pig_id, title, due_date, status)
    select id, new.pig_id, 'ตรวจท้อง', new.event_date + (coalesce(v_offset_days, 21) || ' days')::interval, 'รอทำ'
      from task_types where name = 'ตรวจท้อง'
      limit 1;

  elsif new.event_type = 'คลอด' then
    update pigs
      set status = 'เลี้ยงลูก'
      where id = new.pig_id;

  elsif new.event_type = 'หย่านม' then
    update pigs
      set status = 'รอผสม',
          breeding_count = breeding_count + 1
      where id = new.pig_id;
  end if;

  return new;
end;
$$;

create trigger on_pig_event_insert
  after insert on pig_events
  for each row
  execute function handle_pig_event();
