// mock-data.js
// ข้อมูลตัวอย่าง — จำลองรูปร่างข้อมูลที่จะมาจาก Supabase ในอนาคต
// เมื่อเชื่อม Supabase แล้ว ให้แทนที่ฟังก์ชันใน js/app.js (getOverviewData) ด้วยการ query จริง
// โดยคงรูปร่าง (shape) ของ object ตามนี้ไว้ เพื่อไม่ต้องแก้โค้ด render
//
// หมายเหตุสำคัญ: วันที่ทุกจุดเป็น ISO date (YYYY-MM-DD) คำนวณเทียบกับ "วันนี้" จริง ไม่ hardcode
// ป้ายกำกับ (เช่น "วันนี้"/"เลยกำหนด 2 วัน") และสีสถานะ คำนวณจาก due_date ใน js/app.js เสมอ
// เพื่อไม่ให้ข้อมูลตัวอย่างดูผิดเมื่อเปิดในวันอื่น

function isoDateOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const MOCK_DATA = {

  // จะมาจาก view/RPC ที่นับสถานะจากตาราง pigs
  // หมายเหตุ: จำนวน "ใกล้คลอด" แสดงผลจาก nearFarrowing.length ด้านล่างเสมอ (ดู js/app.js)
  // ไม่เก็บเป็นตัวเลขแยกในนี้ เพื่อไม่ให้ตัวเลขขัดกับรายการจริงได้อีก
  farmStats: {
    totalPigs: 84,
    pregnant: 21,
    emptyPens: 5,
  },

  // จะมาจากตาราง tasks (join pigs, pens ผ่าน pigs) ที่ due_date <= วันนี้ เรียงจากเก่าไปใหม่
  todayTasks: [
    {
      id: "t1",
      title: "ตรวจท้อง",
      subtitle: "เบอร์หู 0234 · คอก B-4",
      due_date: isoDateOffset(0),
    },
    {
      id: "t2",
      title: "ย้ายเข้าคอกคลอด",
      subtitle: "เบอร์หู 0198 · คอก A-1",
      due_date: isoDateOffset(0),
    },
    {
      id: "t3",
      title: "ซ่อมบำรุงปั๊มน้ำ",
      subtitle: "โรงเรือน C",
      due_date: isoDateOffset(-2),
    },
    {
      id: "t4",
      title: "ตรวจสุขภาพประจำสัปดาห์",
      subtitle: "เบอร์หู 0087 · คอก B-1",
      due_date: isoDateOffset(1),
    },
  ],

  // จะมาจากตาราง pigs ที่ status = 'ท้อง' และ expected_farrow_date อยู่ในช่วง 7 วันข้างหน้า
  nearFarrowing: [
    {
      id: "p198",
      title: "เบอร์หู 0198",
      subtitle: "คอก A-1",
      due_date: isoDateOffset(2),
    },
    {
      id: "p241",
      title: "เบอร์หู 0241",
      subtitle: "คอก A-3",
      due_date: isoDateOffset(5),
    },
  ],

  // จะมาจากตาราง bills + cash_advances ที่ status = 'รอตรวจสอบ' / 'รออนุมัติ'
  pendingApprovals: [
    { id: "a1", label: "บิลค่าใช้จ่ายรออนุมัติ", count: 3 },
    { id: "a2", label: "คำขอเบิกเงินล่วงหน้า", count: 1 },
  ],
};
