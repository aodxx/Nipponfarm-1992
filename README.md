# Nipponfarm

ระบบจัดการฟาร์มหมูครบวงจร — รวมข้อมูลแม่พันธุ์, งานประจำวัน, การเงิน, และพนักงาน ไว้ในที่เดียว

**เริ่มอ่านที่ [`CONTEXT.md`](./CONTEXT.md)** ก่อนแก้โค้ดหรือเพิ่มฟีเจอร์ใดๆ

## เอกสารประจำโปรเจกต์

| ไฟล์ | เนื้อหา |
|---|---|
| [`CONTEXT.md`](./CONTEXT.md) | สถานะปัจจุบัน + ต้องอ่านอะไรก่อนแก้อะไร (เริ่มที่นี่) |
| [`PRD.md`](./PRD.md) | ขอบเขตฟีเจอร์ทั้ง 5 เฟส |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | โครงสร้างระบบ, โฟลเดอร์, data layer pattern |
| [`DATABASE.md`](./DATABASE.md) | ตารางฐานข้อมูลทุกเฟส (DDL จริงอยู่ที่ `supabase/migrations/`) |
| [`API.md`](./API.md) | วิธีหน้าเว็บคุยกับ Supabase + Edge Functions |
| [`DECISIONS.md`](./DECISIONS.md) | เหตุผลของการตัดสินใจสำคัญ (ADR log) |
| [`AGENTS.md`](./AGENTS.md) | ข้อตกลงการเขียนโค้ดสำหรับคน/AI agent ที่มาต่องาน |
| [`CHANGELOG.md`](./CHANGELOG.md) | ประวัติการเปลี่ยนแปลง |

## สถานะปัจจุบัน

**เฟส 1 (โครงข้อมูล + Overview):** ใช้งานได้จริงแล้ว — เชื่อม Supabase project "nipponfarm" (RLS + login) หน้า Overview ดึงข้อมูลจริง ต้อง login ก่อนถึงจะเข้าได้ (`pages/login.html`)
รายละเอียดล่าสุด → `CHANGELOG.md`, แผนเฟสถัดไป → GitHub Issues ของ repo นี้

## โครงสร้างไฟล์

```
Nipponfarm-1992/
├── index.html              หน้า Overview หลัก
├── manifest.json            PWA manifest (ต้องเพิ่มไฟล์ไอคอนใน icons/ ก่อนใช้งานจริง)
├── css/
│   └── style.css            ธีมและ layout ทั้งหมด — ทุกหน้าใช้ไฟล์นี้ไฟล์เดียว
├── js/
│   ├── mock-data.js          ข้อมูลตัวอย่าง (อ้างอิงรูปแบบเท่านั้น — Overview เลิกใช้แล้วหลังเชื่อม Supabase จริง)
│   ├── app.js                ตรรกะดึงข้อมูลจริงและ render หน้า Overview
│   ├── auth.js                ตรรกะหน้า login (pages/login.html)
│   ├── auth-guard.js          requireAuth()/attachLogout() ใช้กับทุกหน้าที่ต้อง login
│   └── supabase-client.js    จุดเดียวที่เชื่อมต่อ Supabase (เชื่อมจริงแล้ว)
├── pages/                    login.html (สร้างแล้ว) + หน้าจอเฟสถัดไป (แม่พันธุ์, ปฏิทิน, ผังคอก, การเงิน, พนักงาน)
├── supabase/
│   ├── migrations/           DDL จริง แยกไฟล์ตามลำดับ (schema → RLS → triggers)
│   └── seed.sql              ข้อมูลตั้งต้นที่ต้องมีก่อนใช้งานจริง (เช่น task_types)
├── icons/                    ไอคอนสำหรับ PWA (icon-192.png, icon-512.png)
└── assets/                   รูปภาพ/ไฟล์สื่ออื่นๆ (ยังว่าง)
```

**ข้อจำกัดที่ควรรู้:** ตอนนี้มี manifest + ไอคอนสำหรับติดตั้งเป็น PWA ได้ แต่ **ยังไม่มี service worker** จึงยังใช้งานแบบ offline ไม่ได้ — ยังต้องต่ออินเทอร์เน็ตเสมอ (ดู CONTEXT.md/DECISIONS.md ADR-011)

## แนวทางออกแบบ (สรุปสั้น — เต็มดูที่ ADR-003 ใน DECISIONS.md)

หน้าตาออกแบบให้เหมือน "สมุดบันทึกฟาร์ม" มากกว่าแดชบอร์ด SaaS ทั่วไป: เส้นคั่นแทนการ์ดลอย, สถานะสื่อผ่านแถบสีด้านซ้าย, โทนสีเขียวพืชไร่/น้ำตาลทอง/แดงสนิม, ฟอนต์ Taviraj + Sarabun
