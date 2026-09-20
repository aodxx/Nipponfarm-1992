// js/ui-helpers.js
// ฟังก์ชันช่วยที่ใช้ร่วมกันทุกหน้า (index.html, pages/*.html)
// ต้อง include ไฟล์นี้ก่อนไฟล์ตรรกะเฉพาะหน้า (เช่น app.js, pigs.js, calendar.js)
//
// รวมถึงกติกา "ห้าม innerHTML กับข้อมูลจริง" (ดู AGENTS.md) — ใช้ el()/clearChildren() แทนเสมอ

// ---------- วันที่ ----------

function isoToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function isoOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatThaiDate(date) {
  const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                   "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const buddhistYear = date.getFullYear() + 543;
  return `วัน${days[date.getDay()]}ที่ ${date.getDate()} ${months[date.getMonth()]} ${buddhistYear}`;
}

function formatThaiDateShort(isoDateStr) {
  const d = new Date(isoDateStr + "T00:00:00");
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                   "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

// ---------- สถานะ/ป้ายกำกับจากวันที่จริง (ไม่ hardcode) ----------

const STATUS_WORD = {
  ok: "ปกติ",
  "due-soon": "ใกล้ครบกำหนด",
  overdue: "เลยกำหนด",
};

function diffDaysFromToday(isoDateStr) {
  const due = new Date(isoDateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

// คืนค่า { status, label } — label เป็นข้อความไทยที่อธิบายสถานะได้ในตัว
// ไม่พึ่งสีเป็นช่องทางเดียวในการสื่อความหมาย (ดู CSS .status-bar / .log-when)
function getDueMeta(isoDateStr, { soonWithinDays = 1 } = {}) {
  const diff = diffDaysFromToday(isoDateStr);

  if (diff < 0) {
    return { status: "overdue", label: `เลยกำหนด ${Math.abs(diff)} วัน` };
  }
  if (diff === 0) {
    return { status: "due-soon", label: `${STATUS_WORD["due-soon"]} · วันนี้` };
  }
  if (diff === 1) {
    return { status: "due-soon", label: `${STATUS_WORD["due-soon"]} · พรุ่งนี้` };
  }
  if (diff <= soonWithinDays) {
    return { status: "due-soon", label: `${STATUS_WORD["due-soon"]} · อีก ${diff} วัน` };
  }
  return { status: "ok", label: `${STATUS_WORD.ok} · อีก ${diff} วัน` };
}

// ---------- DOM helpers (ไม่ใช้ innerHTML กับข้อมูลจริงเลย) ----------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// ---------- Loading / error / content state (ทุกหน้าใช้ id ชุดเดียวกัน) ----------

function showLoading() {
  document.getElementById("main-loading").hidden = false;
  document.getElementById("main-error").hidden = true;
  document.getElementById("main-content").hidden = true;
}

function showError(message) {
  document.getElementById("main-loading").hidden = true;
  document.getElementById("main-content").hidden = true;
  const errEl = document.getElementById("main-error");
  errEl.hidden = false;
  document.getElementById("main-error-message").textContent = message;
}

function showContent() {
  document.getElementById("main-loading").hidden = true;
  document.getElementById("main-error").hidden = true;
  document.getElementById("main-content").hidden = false;
}
