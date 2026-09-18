// mock-data.js
// ข้อมูลตัวอย่าง — จำลองรูปร่างข้อมูลที่จะมาจาก Supabase ในอนาคต
// เมื่อเชื่อม Supabase แล้ว ให้แทนที่ฟังก์ชันใน data-layer.js ด้วยการ query จริง
// โดยคงรูปร่าง (shape) ของ object ตามนี้ไว้ เพื่อไม่ต้องแก้ app.js

const MOCK_DATA = {

  // จะมาจาก view/RPC ที่นับสถานะจากตาราง pigs
  farmStats: {
    totalPigs: 84,
    pregnant: 21,
    nearFarrowing: 3,
    emptyPens: 5,
  },

  // จะมาจากตาราง tasks (join pigs, pens) ที่ due_date <= วันนี้ หรือ due_date = วันนี้
  todayTasks: [
    {
      id: "t1",
      title: "ตรวจท้อง",
      subtitle: "เบอร์หู 0234 · คอก B-4",
      dueLabel: "วันนี้",
      status: "due-soon", // ok | due-soon | overdue
    },
    {
      id: "t2",
      title: "ย้ายเข้าคอกคลอด",
      subtitle: "เบอร์หู 0198 · คอก A-1",
      dueLabel: "วันนี้",
      status: "due-soon",
    },
    {
      id: "t3",
      title: "ซ่อมบำรุงปั๊มน้ำ",
      subtitle: "โรงเรือน C",
      dueLabel: "เลยกำหนด 2 วัน",
      status: "overdue",
    },
    {
      id: "t4",
      title: "ตรวจสุขภาพประจำสัปดาห์",
      subtitle: "เบอร์หู 0087 · คอก B-1",
      dueLabel: "วันนี้",
      status: "ok",
    },
  ],

  // จะมาจากตาราง pigs ที่สถานะ = ท้อง และ expected_farrow_date อยู่ในช่วง 7 วัน
  nearFarrowing: [
    {
      id: "p198",
      title: "เบอร์หู 0198",
      subtitle: "คอก A-1",
      dueLabel: "คลอด 18 ก.ย.",
      status: "due-soon",
    },
    {
      id: "p241",
      title: "เบอร์หู 0241",
      subtitle: "คอก A-3",
      dueLabel: "คลอด 21 ก.ย.",
      status: "ok",
    },
  ],

  // จะมาจากตาราง bills + cash_advances ที่ status = 'pending'
  pendingApprovals: [
    { id: "a1", label: "บิลค่าใช้จ่ายรออนุมัติ", count: 3 },
    { id: "a2", label: "คำขอเบิกเงินล่วงหน้า", count: 1 },
  ],
};
