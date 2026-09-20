-- supabase/migrations/0004_fix_breeding_task_trigger.sql
-- ให้ trigger สร้างงานตรวจท้องได้ แม้ยังไม่ได้รัน seed.sql
-- task_type_id อนุญาตให้เป็น null อยู่แล้ว จึงไม่ทำให้การบันทึก event ล้มเหลว

create or replace function handle_pig_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offset_days int := 21;
  v_task_type_id uuid;
begin
  if new.event_type = 'ผสมพันธุ์' then
    update pigs
      set status = 'ท้อง',
          expected_farrow_date = new.event_date + interval '114 days'
      where id = new.pig_id;

    select id, coalesce(default_offset_days, 21)
      into v_task_type_id, v_offset_days
      from task_types
      where name = 'ตรวจท้อง'
      limit 1;

    insert into tasks (task_type_id, pig_id, title, due_date, status)
    values (
      v_task_type_id,
      new.pig_id,
      'ตรวจท้อง',
      new.event_date + v_offset_days,
      'รอทำ'
    );

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
