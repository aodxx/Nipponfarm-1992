# CHANGELOG — Nipponfarm

รูปแบบ: วันที่ (พ.ศ. ในวงเล็บ) — สิ่งที่เปลี่ยน

## 2026-09-18

- สร้างโครงหน้า Overview (เฟส 1): `index.html`, `css/style.css`, `js/app.js`, `js/mock-data.js` — ใช้ข้อมูลตัวอย่าง ยังไม่เชื่อม Supabase
- จัดโครงสร้างโปรเจกต์เต็มรูปแบบ: เพิ่มโฟลเดอร์ `pages/`, `docs/`, `icons/`, `assets/`, สร้าง `docs/schema.sql` (โครงตาราง DB เฟส 1) และ `js/supabase-client.js` (stub)
- เพิ่มเอกสารตั้งต้นครบชุด: `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md` (ขยาย schema ครอบคลุมทุกเฟส 1-5), `API.md`, `DECISIONS.md`, `CONTEXT.md`, `AGENTS.md`, และไฟล์นี้ (`CHANGELOG.md`)
- ขยาย `docs/schema.sql` จากเดิม (เฟส 1 อย่างเดียว) ให้ครอบคลุมตารางทุกเฟส: `buildings`, `pens` (เพิ่ม pos_x/pos_y), `bills`, `bill_items`, `sales`, `cash_advances`, `payslips`
- สร้าง GitHub Issues แยกตามเฟส 2-5 พร้อมงานย่อย (ดูใน GitHub Issues ของ repo)

## 2026-09-20

แก้ประเด็นจาก code review (P0 และ P1) ก่อนต่อ Supabase จริง:

- **RLS/สิทธิ์เข้าถึง (P0):** ลบ `docs/schema.sql` ไฟล์เดียว แยกเป็น `supabase/migrations/0001_initial_schema.sql`, `0002_enable_rls.sql` (เปิด RLS + policy จริงทุกตาราง + helper `is_admin()`), `0003_triggers.sql` (auto-gen tasks) พร้อม `supabase/seed.sql` — ดู ADR-008, ADR-009
- **แก้ query ตัวอย่างผิดใน API.md (P0):** `tasks` ไม่มี `pen_id` ตรง แก้เป็น join ผ่าน `pigs(pens(code))` — ดู ADR-012
- **แก้ DOM XSS risk (P1):** เขียน `js/app.js` ใหม่ทั้งหมด เลิกใช้ `innerHTML` กับข้อมูลจริง เปลี่ยนเป็นสร้าง DOM node ด้วย `textContent`
- **เพิ่ม loading/error/retry state (P1):** หน้า Overview มี 3 สถานะชัดเจนแล้ว (`#main-loading`, `#main-error` พร้อมปุ่มลองใหม่, `#main-content`)
- **แก้ mock data ขัดกันเอง (P1):** เปลี่ยนทุกวันที่ใน `js/mock-data.js` เป็น ISO date คำนวณ dynamic จาก "วันนี้" จริง, ป้ายกำกับ/สีสถานะคำนวณใน `js/app.js` (ฟังก์ชัน `getDueMeta`) แทน hardcode string, ตัวเลข "ใกล้คลอด" ในการ์ดสรุปคำนวณจาก `nearFarrowing.length` แทนเลขแยกที่อาจขัดกัน
- **แก้ PWA icon 404 (P1):** สร้างไอคอนจริง `icons/icon-192.png`, `icons/icon-512.png` — ยังไม่ทำ service worker/offline (ระบุ limitation ชัดเจนใน README) — ดู ADR-011
- **แก้ accessibility (P1):** ทุกแถวสถานะมีข้อความไทยบอกระดับความเร่งด่วนเสมอ ("ปกติ · อีก N วัน" ฯลฯ) ไม่พึ่งสีอย่างเดียว พร้อม `aria-label` สรุปสถานะสำหรับ screen reader — ดู ADR-010

## 2026-09-20 (ต่อ) — เชื่อม Supabase จริง

- สร้าง Supabase project "nipponfarm" (region ap-southeast-1, free tier)
- รัน `0001_initial_schema.sql`, `0002_enable_rls.sql`, `0003_triggers.sql`, `seed.sql` สำเร็จทั้งหมด
- ทดสอบ RLS จริงด้วยผู้ใช้ทดสอบชั่วคราว 3 มุมมอง: anonymous อ่านตารางที่ต้อง authenticated ไม่ได้เลย (0 แถว), staff เห็นเฉพาะ cash_advances ของตัวเอง, admin เห็นทั้งหมด, staff แก้ role ตัวเองเป็น admin ไม่ได้ — ลบข้อมูลทดสอบออกหมดแล้ว
- ใส่ URL + publishable key จริงใน `js/supabase-client.js`
- **พบข้อจำกัดใหม่:** ยังไม่มีหน้า login จึงยังสลับ Overview จาก mock data ไปใช้ query จริงไม่ได้ (RLS ต้องการ authenticated role) — บันทึกเป็น ADR-013 และเป็นงานที่ต้องทำก่อนเชื่อมหน้าจอไหนกับข้อมูลจริง

## 2026-09-20 (ต่อ) — สร้างหน้า Login + สลับ Overview เป็นข้อมูลจริง

- สร้าง `pages/login.html` + `js/auth.js` (Supabase Auth email/password, ไม่มีสมัครสมาชิกสาธารณะ) — ดู ADR-014
- สร้าง `js/auth-guard.js` (`requireAuth()`, `attachLogout()`) ใช้ป้องกันทุกหน้าที่ต้อง login
- `index.html` เพิ่มปุ่ม "ออกจากระบบ" ในแถบบน และเรียก `requireAuth()` ก่อน render ทุกครั้ง
- เขียน `getOverviewData()` ใหม่ใน `js/app.js` ให้ query Supabase จริงทั้งหมด (tasks, pigs, pens, bills, cash_advances) แทน mock data — `js/mock-data.js` ยังเก็บไว้เป็นตัวอย่างรูปแบบข้อมูลสำหรับหน้าจอเฟสถัดไป แต่ไม่ได้ใช้ใน `index.html` แล้ว
- ฐานข้อมูลยังไม่มีข้อมูลฟาร์มจริง (หมู/คอก/งาน) จึงเห็นเป็นสถานะว่างเปล่าทุกส่วนเมื่อ login ครั้งแรก — เป็นพฤติกรรมที่ถูกต้องตามข้อมูลจริงในระบบใหม่
- สร้างบัญชีแอดมินคนแรกโดยตรงใน Supabase (email: pantipa3826@gmail.com, staff.role = admin) — รหัสผ่านไม่บันทึกไว้ในเอกสารนี้หรือที่ใดในโค้ด
