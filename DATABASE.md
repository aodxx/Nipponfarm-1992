# DATABASE — Nipponfarm

โครงสร้างฐานข้อมูลทั้งหมด ออกแบบไว้ล่วงหน้าครบทุกเฟส เพื่อไม่ให้ต้อง migrate โครงสร้างใหญ่ภายหลัง DDL จริง (source of truth) อยู่ที่ `supabase/migrations/` — ไฟล์นี้อธิบายเหตุผลและความสัมพันธ์ของแต่ละตาราง

**สถานะ:** ออกแบบไว้แล้ว (migration files พร้อม RLS) — ยังไม่ได้รันจริงบน Supabase project ใดๆ

**ไฟล์ migration (รันตามลำดับนี้เท่านั้น):**
1. `0001_initial_schema.sql` — สร้างตารางทั้งหมด (ไม่มี RLS)
2. `0002_enable_rls.sql` — เปิด RLS ทุกตาราง + policy จริง + `is_admin()` helper — **ต้องรันให้เสร็จก่อนต่อ client** ห้ามข้ามขั้นตอนนี้
3. `0003_triggers.sql` — trigger auto-gen tasks จาก `pig_events`
4. `../seed.sql` — ข้อมูลตั้งต้น (เช่น `task_types`)

ห้ามแก้ไฟล์ migration ที่ deploy ไปแล้ว — schema เปลี่ยนแปลงต้องเป็นไฟล์ migration ใหม่เสมอ (ดู ADR-008 ใน `DECISIONS.md`)

## ภาพรวมความสัมพันธ์

```
staff ──┬──< tasks (assigned_to)
        ├──< pig_events (recorded_by)
        ├──< cash_advances (staff_id)
        └──< payslips (staff_id)

buildings ──< pens ──< pigs ──┬──< pig_events
                               └──< tasks

task_types ──< tasks

bills ──< bill_items
sales (ไม่มีตารางลูก)
```

## เฟส 1 — โครงข้อมูลหลัก

### `staff`
พนักงาน/แอดมิน ผูกกับ Supabase Auth (`auth.users`)
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | = auth.users.id |
| full_name | text | |
| role | text | `admin` \| `staff` |
| base_salary | numeric | ใช้ในเฟส 5 |

**RLS:** admin อ่าน/เขียนได้ทุกแถว, staff อ่านได้เฉพาะแถวตัวเอง (`id = auth.uid()`)

### `buildings`
โรงเรือน — จัดกลุ่มคอกให้เป็นระดับ (ใช้ในเฟส 3 สำหรับผังคอก แต่กำหนดตารางไว้ตั้งแต่เฟส 1 เพราะ `pens` อ้างถึง)
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| name | text | เช่น "โรงเรือน A", "โรงเรือน C" |

### `pens`
คอก
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| building_id | uuid FK → buildings | |
| code | text unique | เช่น 'A-1' |
| capacity | int | |
| pos_x, pos_y | numeric | ตำแหน่งบนผังคอก (ใช้จริงเฟส 3, เก็บไว้ตั้งแต่ต้น) |

### `pigs`
หมู/แม่พันธุ์
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| ear_tag | text unique | |
| breed | text | |
| birth_date | date | |
| pen_id | uuid FK → pens | |
| status | text | รอผสม / ผสมแล้ว / ท้อง / เลี้ยงลูก / หย่านมแล้ว / ขายแล้ว / ตาย |
| breeding_count | int | |
| expected_farrow_date | date | อัปเดตจาก pig_events อัตโนมัติ |

**RLS:** staff และ admin อ่าน/เขียนได้ทุกแถว (ข้อมูลฟาร์ม ไม่ใช่ข้อมูลส่วนบุคคล)

### `task_types`
ประเภทงาน อ้างอิงสำหรับ auto-generate
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| name | text unique | ตรวจท้อง / ย้ายคอก / คลอด / หย่านม / ซ่อมบำรุง ฯลฯ |
| default_offset_days | int | เช่น ตรวจท้อง = +21 วันจากวันผสม |

### `tasks`
งานที่ต้องทำ (ใช้ทั้งหน้า Overview และปฏิทิน)
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| task_type_id | uuid FK → task_types | |
| pig_id | uuid FK → pigs, null ได้ | null = งานทั่วไป เช่น ซ่อมบำรุง |
| title | text | |
| due_date | date | |
| assigned_to | uuid FK → staff | |
| status | text | รอทำ / เสร็จแล้ว / เลยกำหนด |

### `pig_events`
Log เหตุการณ์ของหมูแต่ละตัว — เป็นฐานให้ trigger สร้าง tasks อัตโนมัติ และเป็นที่มาของ "ประวัติ" ทั้งหมด (ผสม/ท้อง/คลอด/หย่านม/รักษา) แทนการแยกตารางย่อยหลายตาราง (เหตุผล → ADR-006 ใน DECISIONS.md)
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| pig_id | uuid FK → pigs | |
| event_type | text | ผสมพันธุ์ / ตรวจท้อง / คลอด / หย่านม / รักษา / อื่นๆ |
| event_date | date | |
| notes | text | |
| recorded_by | uuid FK → staff | |

**Trigger แนวคิด:** insert `pig_events` ที่ `event_type = 'ผสมพันธุ์'` → insert เข้า `tasks` (title = 'ตรวจท้อง', due_date = event_date + 21) และอัปเดต `pigs.status` / `expected_farrow_date`

## เฟส 2 — แม่พันธุ์/ปฏิทิน

ไม่มีตารางใหม่ — ใช้ `pigs`, `pig_events`, `tasks`, `task_types` จากเฟส 1 ทั้งหมด หน้าปฏิทินคือการ query `tasks` ตามช่วงวันที่ หน้าประวัติหมูคือการ query `pig_events` ตาม `pig_id`

## เฟส 3 — ผังคอก

ใช้ `buildings.name` และ `pens.pos_x/pos_y/capacity` ที่กำหนดไว้แล้วในเฟส 1 — ไม่ต้อง migrate เพิ่ม

## เฟส 4 — การเงิน

### `bills`
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| bill_date | date | |
| vendor | text | |
| category | text | |
| total_amount | numeric | |
| image_url | text | ไฟล์ใน Supabase Storage |
| status | text | รอตรวจสอบ / ยืนยันแล้ว |
| created_by | uuid FK → staff | |

### `bill_items`
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| bill_id | uuid FK → bills | |
| item_name | text | |
| quantity | numeric | |
| unit_price | numeric | |
| subtotal | numeric | |

ที่มา: ผลลัพธ์จาก AI อ่านบิล (Edge Function) ก่อน insert ผู้ใช้ตรวจสอบ/แก้ไขได้ก่อนบันทึกจริง

### `sales`
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| sale_date | date | |
| pig_count | int | |
| total_weight_kg | numeric | |
| avg_weight_kg | numeric | คำนวณจาก total_weight_kg / pig_count |
| price_per_kg | numeric | |
| vehicle_plate | text | |
| gross_amount | numeric | |
| deductions | numeric | |
| net_amount | numeric | |
| payment_status | text | รอชำระ / ชำระแล้ว |
| proof_image_url | text | |
| signature_image_url | text | |
| created_by | uuid FK → staff | |

**RLS (bills, bill_items, sales):** admin อ่าน/เขียนได้ทั้งหมด, staff เพิ่มรายการใหม่ได้แต่แก้ไข/อนุมัติไม่ได้ (แยก policy insert vs update)

## เฟส 5 — พนักงาน/เงินเดือน

### `cash_advances`
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| staff_id | uuid FK → staff | |
| amount | numeric | |
| requested_date | date | |
| status | text | รออนุมัติ / อนุมัติแล้ว / ปฏิเสธ |
| approved_by | uuid FK → staff, null ได้ | |
| approved_date | date | |
| notes | text | |

**RLS:** staff เห็น/สร้างได้เฉพาะของตัวเอง (`staff_id = auth.uid()`), admin เห็น/อนุมัติได้ทั้งหมด

### `payslips`
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| staff_id | uuid FK → staff | |
| period_start | date | |
| period_end | date | |
| base_amount | numeric | |
| advances_deducted | numeric | รวมจาก cash_advances ที่อนุมัติในช่วงนั้น |
| other_deductions | numeric | |
| net_amount | numeric | |
| generated_at | timestamptz | |

**RLS:** เหมือน `cash_advances` — staff เห็นเฉพาะของตัวเอง, admin เห็นทั้งหมด

## หลักการตั้งชื่อ

- ชื่อตาราง/คอลัมน์เป็นภาษาอังกฤษ snake_case เสมอ (ค่าที่เก็บ เช่น status, event_type เป็นภาษาไทยได้ตามที่ระบุในตาราง — เพื่อให้ตรงกับ UI โดยไม่ต้อง map ค่า)
- ทุกตารางมี `id uuid primary key default gen_random_uuid()` ยกเว้น `staff` ที่ผูกกับ `auth.users.id` ตรงๆ
- Foreign key ตั้งชื่อ `<ตารางเอกพจน์>_id` เสมอ เช่น `pig_id`, `staff_id`, `bill_id`
