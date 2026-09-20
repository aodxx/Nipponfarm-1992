// js/supabase-client.js
// เชื่อมต่อ Supabase project "nipponfarm" จริงแล้ว (RLS ทดสอบผ่านครบ 3 มุมมองแล้ว — ดู CHANGELOG.md)
//
// ข้อควรรู้: เกือบทุกตารางมี RLS policy แบบ auth.role() = 'authenticated'
// ถ้ายังไม่มีการ login (Supabase Auth session) การ query จะได้แถวว่างเปล่าเสมอ ไม่ใช่ error
// ดังนั้นหน้าจอที่จะสลับจาก mock data ไปใช้ query จริง ต้องมีระบบ login ก่อน (ดู ADR-013 ใน DECISIONS.md)
// index.html (หน้า Overview) ยังใช้ mock data อยู่ตอนนี้ด้วยเหตุผลนี้

const SUPABASE_URL = "https://hcwzfsxkfayhnbhuztbk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5R4aMGXBl1Z2OykOrUPUeQ_GJoSD8t2";

// สร้าง client ที่จุดเดียว และไม่ปล่อยให้ CDN/config ที่ผิดทำให้ทั้งหน้าเว็บหยุดทำงาน
const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabaseClient) {
  console.error("[Nipponfarm] ไม่สามารถเริ่มต้น Supabase client ได้");
}
