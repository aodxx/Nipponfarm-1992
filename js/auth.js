// js/auth.js
// ตรรกะหน้า login เท่านั้น (pages/login.html) — ใช้ supabaseClient จาก js/supabase-client.js

function showLoginError(message) {
  const el = document.getElementById("login-error");
  el.textContent = message;
  el.hidden = false;
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
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = "../index.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-form").addEventListener("submit", handleLoginSubmit);
  redirectIfAlreadyLoggedIn();
});
