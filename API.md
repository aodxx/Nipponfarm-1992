# API — Nipponfarm

ระบบไม่มี backend server ของตัวเอง หน้าเว็บคุยกับ Supabase 2 ทาง: (1) ตรงผ่าน `supabase-js` สำหรับ CRUD ทั่วไป (2) ผ่าน Edge Function สำหรับงานที่ต้องปิดบัง API key หรือมี logic ฝั่งเซิร์ฟเวอร์

## 1. การเรียกข้อมูลทั่วไป (ตรงผ่าน supabase-js)

ทุกไฟล์ js ของแต่ละหน้าเรียกผ่าน `supabaseClient` ที่สร้างไว้ใน `js/supabase-client.js` เท่านั้น รูปแบบมาตรฐาน:

```js
const { data, error } = await supabaseClient
  .from('tasks')
  .select('*, pigs(ear_tag, pens(code))')
  .eq('due_date', today)
  .order('due_date');
```

**ข้อควรระวัง:** `tasks` มี foreign key ไปที่ `pigs` เท่านั้น ไม่มี `pen_id` ตรงๆ ถ้าต้องการคอกของงานนั้น ต้อง join ผ่าน `pigs(pens(code))` เสมอ (ไม่ใช่ `pens(code)` ตรงบน `tasks`) — query ทุกตัวในเอกสารนี้ต้องทดสอบกับ schema จริงก่อนใช้ในโค้ด ไม่ใช่คัดลอกไปใช้ตรงๆ โดยไม่ตรวจสอบ

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
- ทำเป็น **Database Trigger** (ไม่ใช่ Edge Function) เพราะเป็น logic ระดับข้อมูลล้วนๆ ไม่ต้องเรียก service ภายนอก — ดูโค้ดจริงใน `supabase/migrations/0003_triggers.sql`

## 3. Storage

Bucket ที่วางแผนไว้ (สร้างตอนเชื่อม Supabase จริง):
| bucket | ใช้เก็บ |
|---|---|
| `bill-images` | รูปบิล/ใบเสร็จ |
| `sale-proofs` | รูปหลักฐานส่งมอบ + ลายเซ็น การขายหมู |

ตั้งเป็น private bucket ทั้งหมด เข้าถึงผ่าน signed URL เท่านั้น

## 4. Auth

- Login ผ่าน Supabase Auth email/password — สร้างแล้วที่ `pages/login.html` + `js/auth.js`
- ทุกหน้าที่ต้อง login include `js/auth-guard.js` แล้วเรียก `requireAuth()` ก่อน render เนื้อหา (redirect ไป login อัตโนมัติถ้ายังไม่ login) — ดูตัวอย่างใน `js/app.js`
- ปุ่ม logout ผูกด้วย `attachLogout("logout-button")` จาก `js/auth-guard.js`
- บัญชีผู้ใช้ (staff/admin) ต้องสร้างโดยแอดมินเท่านั้น — **ไม่มีหน้าสมัครสมาชิกสาธารณะ** เพราะเป็นระบบภายในฟาร์ม สร้างบัญชีผ่าน Supabase Dashboard (Authentication → Add user) แล้ว insert แถวคู่กันในตาราง `staff` พร้อมกำหนด `role`
- role อ่านจากตาราง `staff` เพื่อกำหนดเมนู/สิทธิ์ที่เห็นในหน้าเว็บ (UI-level) — สิทธิ์จริงยังคงบังคับที่ RLS เสมอ ห้ามพึ่ง UI-level อย่างเดียว
