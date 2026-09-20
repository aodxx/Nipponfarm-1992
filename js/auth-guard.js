// js/auth-guard.js
// ใช้กับทุกหน้าที่ต้อง login ก่อนถึงจะเห็น (index.html และ pages/*.html ในอนาคต)
// ต้อง include หลัง js/supabase-client.js เสมอ

function loginRedirectPath() {
  // index.html อยู่ที่ root, หน้าอื่นอยู่ใน pages/ — คำนวณ path ที่ถูกต้องจาก location ปัจจุบัน
  return location.pathname.includes("/pages/") ? "login.html" : "pages/login.html";
}

function redirectToLogin(reason) {
  const target = loginRedirectPath();
  const suffix = reason ? `?error=${encodeURIComponent(reason)}` : "";
  window.location.href = `${target}${suffix}`;
}

// เรียกก่อน render เนื้อหาใดๆ ที่ต้อง login — คืน session ถ้ามี, redirect ไป login และคืน null ถ้าไม่มี
async function requireAuth() {
  if (!supabaseClient) {
    redirectToLogin("config");
    return null;
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      redirectToLogin();
      return null;
    }
    return data.session;
  } catch (error) {
    console.error("[Nipponfarm] ตรวจสอบ session ไม่สำเร็จ:", error);
    redirectToLogin("connection");
    return null;
  }
}

// ผูกปุ่ม logout — เรียกหลัง DOM พร้อมแล้ว
function attachLogout(buttonId) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    window.location.href = loginRedirectPath();
  });
}
