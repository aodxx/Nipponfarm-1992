# CHANGELOG — Nipponfarm

รูปแบบ: วันที่ (พ.ศ. ในวงเล็บ) — สิ่งที่เปลี่ยน

## 2026-09-18

- สร้างโครงหน้า Overview (เฟส 1): `index.html`, `css/style.css`, `js/app.js`, `js/mock-data.js` — ใช้ข้อมูลตัวอย่าง ยังไม่เชื่อม Supabase
- จัดโครงสร้างโปรเจกต์เต็มรูปแบบ: เพิ่มโฟลเดอร์ `pages/`, `docs/`, `icons/`, `assets/`, สร้าง `docs/schema.sql` (โครงตาราง DB เฟส 1) และ `js/supabase-client.js` (stub)
- เพิ่มเอกสารตั้งต้นครบชุด: `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md` (ขยาย schema ครอบคลุมทุกเฟส 1-5), `API.md`, `DECISIONS.md`, `CONTEXT.md`, `AGENTS.md`, และไฟล์นี้ (`CHANGELOG.md`)
- ขยาย `docs/schema.sql` จากเดิม (เฟส 1 อย่างเดียว) ให้ครอบคลุมตารางทุกเฟส: `buildings`, `pens` (เพิ่ม pos_x/pos_y), `bills`, `bill_items`, `sales`, `cash_advances`, `payslips`
- สร้าง GitHub Issues แยกตามเฟส 2-5 พร้อมงานย่อย (ดูใน GitHub Issues ของ repo)
