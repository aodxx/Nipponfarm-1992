// js/supabase-client.js
// STUB — ยังไม่ได้เชื่อมต่อจริง
//
// เมื่อพร้อมเชื่อม Supabase:
// 1. ใส่ script tag ใน index.html (ก่อน app.js):
//      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
//      <script src="js/supabase-client.js"></script>
// 2. ใส่ค่า URL และ anon key ของโปรเจกต์ Supabase ด้านล่าง
//    (anon key ใช้ฝั่ง client ได้ปลอดภัย ถ้าตั้งค่า Row Level Security ไว้ถูกต้อง)
// 3. แก้ getOverviewData() ใน js/app.js ให้เรียก supabaseClient แทนการอ่าน MOCK_DATA

const SUPABASE_URL = "";       // TODO: ใส่ URL โปรเจกต์
const SUPABASE_ANON_KEY = "";  // TODO: ใส่ anon/public key

const supabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabaseClient) {
  console.warn("[Nipponfarm] ยังไม่ได้ตั้งค่า Supabase — กำลังใช้ mock data อยู่");
}
