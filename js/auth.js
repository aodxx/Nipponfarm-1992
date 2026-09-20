// js/auth.js
// ตรรกะหน้า login เท่านั้น (pages/login.html) — ใช้ supabaseClient จาก js/supabase-client.js

function showLoginError(message) {
  const el = document.getElementById("login-error");
  el.textContent = message;
  el.hidden = false;
}

function showLoginErrorFromQuery() {
  const reason = new URLSearchParams(window.location.search).get("error");
  if (reason === "config") {
    showLoginError("ระบบยังเชื่อมต่อไม่สมบูรณ์ กรุณารีเฟรชหรือติดต่อผู้ดูแลระบบ");
  } else if (reason === "connection") {
    showLoginError("ตรวจสอบการเชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const button = document.getElementById("login-button");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  document.getElementById("login-error").hidden = true;
  button.disabled = true;
  button.textContent = "กำลังเข้าสู่ระบบ…";

  try {
    if (!supabaseClient) {
      showLoginError("ระบบยังเชื่อมต่อไม่สมบูรณ์ กรุณารีเฟรชหรือติดต่อผู้ดูแลระบบ");
      return;
    }
    if (!email || !password) {
      showLoginError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      showLoginError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    window.location.href = "../index.html";
  } catch (err) {
    console.error("[Nipponfarm] login error:", err);
    showLoginError("เข้าสู่ระบบไม่สำเร็จ ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่");
  } finally {
    button.disabled = false;
    button.textContent = "เข้าสู่ระบบ";
  }
}

async function redirectIfAlreadyLoggedIn() {
  if (!supabaseClient) {
    showLoginError("ระบบยังเชื่อมต่อไม่สมบูรณ์ กรุณารีเฟรชหรือติดต่อผู้ดูแลระบบ");
    return;
  }
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (data.session) window.location.href = "../index.html";
  } catch (err) {
    console.error("[Nipponfarm] ตรวจสอบ session หน้า login ไม่สำเร็จ:", err);
    showLoginError("ตรวจสอบการเชื่อมต่อไม่สำเร็จ กรุณารีเฟรชแล้วลองใหม่");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-form").addEventListener("submit", handleLoginSubmit);
  showLoginErrorFromQuery();
  redirectIfAlreadyLoggedIn();
});
