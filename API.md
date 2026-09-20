# API — Nipponfarm

ระบบไม่มี backend server ของตัวเอง หน้าเว็บคุยกับ Supabase 2 ทาง: (1) ตรงผ่าน `supabase-js` สำหรับ CRUD ทั่วไป (2) ผ่าน Edge Function สำหรับงานที่ต้องปิดบัง API key หรือมี logic ฝั่งเซิร์ฟเวอร์

## 1. การเรียกข้อมูลทั่วไป (ตรงผ่าน supabase-js)

ทุกไฟล์ js ของแต่ละหน้าเรียกผ่าน `supabaseClient` ที่สร้างไว้ใน `js/supabase-client.js` เท่านั้น รูปแบบมาตรฐาน:

```js
const { data, error } = await supabaseClient
  .from('tasks')
  .select('*, pigs(ear_tag), pens(code)')
  .eq('due_date', today)
  .order('due_date');
```

สิทธิ์การอ่าน/เขียนถูกบังคับด้วย RLS policy ที่ระดับฐานข้อมูล (ดู `DATABASE.md`) — โค้ดฝั่งหน้าเว็บไม่ต้องเช็ค role เอง แค่ query ตามปกติ Supabase จะกรองแถวที่สิทธิ์ไม่ถึงออกให้อัตโนมัติ

### ตารางที่ query บ่อยต่อหน้าจอ

| หน้าจอ | ตารางหลักที่ใช้ |
|---|---|
| Overview (`index.html`) | `tasks`, `pigs`, `pens`, `bills`, `cash_advances` |
| แม่พันธุ์ (`pages/pigs.html`) | `pigs`, `pig_events` |
| ปฏิทิน (`pages/calendar.html`) | `tasks` |
| ผังคอก (`pages/pens.html`) | `buildings`, `pens`, `pigs` |
| การเงิน (`pages/finance.html`) | `bills`, `bill_items`, `sales` |
| พนักงาน (`pages/staff.html`) | `staff`, `cash_advances`, `payslips` |

## 2. Edge Functions

### `read-bill` (เฟส 4)
- **หน้าที่:** รับรูปบิล → เรียก Gemini AI → คืนรายการที่แกะได้ (item, quantity, price, date, total, category) ให้ผู้ใช้ตรวจสอบก่อน insert เข้า `bills`/`bill_items` เอง
- **เหตุผลที่ต้องผ่าน Edge Function:** Gemini API key ต้องไม่อยู่ในโค้ดฝั่งเบราว์เซอร์ (ดู ARCHITECTURE.md ข้อ 5)
- **Input:** รูปภาพ (base64 หรือ Storage path)
- **Output:** JSON object รูปร่างตรงกับ `bill_items` + `bills.total_amount`, `bills.category` (ผู้ใช้แก้ไขได้ก่อนบันทึกจริง)
- **สถานะ:** ยังไม่ได้สร้าง — วางแผนไว้สำหรับเฟส 4

### auto-gen tasks (เฟส 1-2)
- ทำเป็น **Database Trigger** (ไม่ใช่ Edge Function) เพราะเป็น logic ระดับข้อมูลล้วนๆ ไม่ต้องเรียก service ภายนอก — ดูแนวคิดใน `docs/schema.sql`

## 3. Storage

Bucket ที่วางแผนไว้ (สร้างตอนเชื่อม Supabase จริง):
| bucket | ใช้เก็บ |
|---|---|
| `bill-images` | รูปบิล/ใบเสร็จ |
| `sale-proofs` | รูปหลักฐานส่งมอบ + ลายเซ็น การขายหมู |

ตั้งเป็น private bucket ทั้งหมด เข้าถึงผ่าน signed URL เท่านั้น

## 4. Auth

- Login ผ่าน Supabase Auth (email/password หรือ magic link — เลือกตอนเชื่อมจริง)
- หลัง login แล้วอ่าน role จากตาราง `staff` เพื่อกำหนดเมนู/สิทธิ์ที่เห็นในหน้าเว็บ (UI-level) — สิทธิ์จริงยังคงบังคับที่ RLS เสมอ ห้ามพึ่ง UI-level อย่างเดียว
