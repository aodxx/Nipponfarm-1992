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
