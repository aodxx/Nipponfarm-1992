# ARCHITECTURE — Nipponfarm

## 1. แนวคิดหลัก

ระบบเป็น **static PWA** (HTML/CSS/JS ล้วน ไม่มี build step) โฮสต์บน GitHub Pages เชื่อมต่อกับ **Supabase** (Postgres + Auth + Storage + Edge Functions) ตรงจากฝั่ง client ผ่าน `supabase-js` — ไม่มี backend server ของตัวเอง

เหตุผลของทิศทางนี้อยู่ใน `DECISIONS.md` (ADR-001, ADR-002)

```
┌─────────────────────────────┐        ┌────────────────────────────┐
│   Browser (มือถือ/แท็บเล็ต)   │        │         Supabase            │
│                              │        │                              │
│  index.html + pages/*.html   │  ───▶  │  Postgres (RLS ต่อ role)      │
│  css/style.css (ธีมรวม)       │  ◀───  │  Auth (staff/admin)          │
│  js/app.js ฯลฯ (ต่อหน้า)      │        │  Storage (รูปบิล/รูปหมู/ลายเซ็น)│
│  js/supabase-client.js       │  ───▶  │  Edge Functions              │
└─────────────────────────────┘        │   - อ่านบิลด้วย Gemini AI     │
                                        │   - auto-gen tasks (trigger)  │
                                        └────────────────────────────┘
```

## 2. โครงสร้างโฟลเดอร์ (เป้าหมายเมื่อครบทุกเฟส)

```
Nipponfarm-1992/
├── index.html                 หน้า Overview (เฟส 1)
├── manifest.json
├── css/
│   └── style.css              ธีม/โทเคนสี/ฟอนต์ร่วมทั้งระบบ — ทุกหน้าใช้ไฟล์เดียวกัน
├── js/
│   ├── supabase-client.js     จุดเดียวที่สร้าง Supabase client
│   ├── app.js                 ตรรกะหน้า Overview
│   ├── mock-data.js           mock data สำหรับ dev/demo
│   ├── pigs.js                ตรรกะหน้าแม่พันธุ์ (เฟส 2)
│   ├── calendar.js            ตรรกะหน้าปฏิทิน (เฟส 2)
│   ├── pens.js                ตรรกะผังคอก (เฟส 3)
│   ├── finance.js             ตรรกะบิล/ขายหมู (เฟส 4)
│   └── staff.js                ตรรกะพนักงาน/เงินเดือน (เฟส 5)
├── pages/
│   ├── pigs.html
│   ├── calendar.html
│   ├── pens.html
│   ├── finance.html
│   └── staff.html
├── docs/
│   └── schema.sql              DDL เต็มทุกเฟส (ดู DATABASE.md)
├── icons/
└── assets/
```

**กติกา:** ทุกหน้าจอใหม่ include `css/style.css` ไฟล์เดียวกัน และสร้าง Supabase client ผ่าน `js/supabase-client.js` เท่านั้น ห้ามสร้าง client ซ้ำในไฟล์อื่น — เพื่อไม่ให้ config หลุดไม่ตรงกันระหว่างหน้า

## 3. รูปแบบการดึงข้อมูล (Data Layer Pattern)

ทุกหน้าจอเขียนตามแพทเทิร์นเดียวกับ `js/app.js`:

1. มีฟังก์ชัน `get<ชื่อหน้า>Data()` ฟังก์ชันเดียวเป็นจุดเข้าออกข้อมูลของหน้านั้น
2. ฟังก์ชัน render แยกจากฟังก์ชันดึงข้อมูลเสมอ — สลับจาก mock data ไป Supabase จริง โดยไม่ต้องแก้โค้ด render
3. ระหว่างเฟสที่ยังไม่เชื่อม Supabase จริง ให้ใช้ mock data ที่มีรูปร่าง (shape) ตรงกับตารางใน `DATABASE.md` ทุกประการ เพื่อสลับได้ทันทีภายหลัง

## 4. สิทธิ์การเข้าถึงข้อมูล (Auth & RLS)

- ใช้ Supabase Auth ผูกกับตาราง `staff` (role = `admin` หรือ `staff`)
- ทุกตารางเปิด Row Level Security และมี policy อย่างน้อย 2 แบบ: admin เห็นทั้งหมด, staff เห็นเฉพาะแถวที่เกี่ยวกับตัวเอง (เช่น `cash_advances.staff_id = auth.uid()`)
- รายละเอียด policy ต่อตาราง → ดู `DATABASE.md`

## 5. AI อ่านบิล

เรียก Gemini AI **ผ่าน Supabase Edge Function** เท่านั้น (ไม่เรียกจาก client ตรงๆ) เพื่อไม่ให้ API key หลุดไปอยู่ในโค้ดฝั่งเบราว์เซอร์ — ดูรายละเอียด endpoint ใน `API.md`

## 6. การเชื่อมทีละเฟส

แต่ละเฟสเพิ่มไฟล์ใหม่ (หน้า + js) โดยไม่แก้โครงของเฟสก่อนหน้า ตารางฐานข้อมูลของทุกเฟสถูกออกแบบไว้ล่วงหน้าทั้งหมดใน `DATABASE.md` ตั้งแต่ต้น เพื่อไม่ให้ต้อง migrate โครงสร้างใหญ่ภายหลัง
