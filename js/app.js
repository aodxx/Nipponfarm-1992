// app.js
// ตรรกะแสดงผลหน้า Overview
//
// จุดสำคัญ: ทุกการดึงข้อมูลผ่านฟังก์ชัน getOverviewData() จุดเดียว
// ตอนนี้ฟังก์ชันนี้ return ค่าจาก MOCK_DATA
// เมื่อเชื่อม Supabase แล้ว ให้แก้เฉพาะฟังก์ชันนี้ให้ query จริงแทน
// ส่วนโค้ด render ด้านล่างไม่ต้องแก้ ตราบใดที่รูปร่างข้อมูลเหมือนเดิม

async function getOverviewData() {
  // TODO: แทนที่ด้วย Supabase queries เช่น
  //   const { data: farmStats } = await supabase.rpc('get_farm_stats');
  //   const { data: todayTasks } = await supabase.from('tasks').select(...).eq('due_date', today);
  return MOCK_DATA;
}

function formatThaiDate(date) {
  const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                   "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const buddhistYear = date.getFullYear() + 543;
  return `วัน${days[date.getDay()]}ที่ ${date.getDate()} ${months[date.getMonth()]} ${buddhistYear}`;
}

function renderStatStrip(stats) {
  const el = document.getElementById("stat-strip");
  const items = [
    { value: stats.totalPigs, label: "แม่พันธุ์ทั้งหมด" },
    { value: stats.pregnant, label: "กำลังท้อง" },
    { value: stats.nearFarrowing, label: "ใกล้คลอด" },
    { value: stats.emptyPens, label: "คอกว่าง" },
  ];
  el.innerHTML = items.map(i => `
    <div class="stat">
      <span class="value">${i.value}</span>
      <span class="label">${i.label}</span>
    </div>
  `).join("");
}

function renderLogList(listId, emptyId, rows) {
  const listEl = document.getElementById(listId);
  const emptyEl = document.getElementById(emptyId);

  if (!rows || rows.length === 0) {
    listEl.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  listEl.innerHTML = rows.map(row => `
    <li class="log-row">
      <span class="status-bar ${row.status}"></span>
      <div class="log-body">
        <p class="log-title">${row.title}</p>
        <p class="log-sub">${row.subtitle}</p>
      </div>
      <span class="log-when ${row.status}">${row.dueLabel}</span>
    </li>
  `).join("");
}

function renderApprovals(rows) {
  const listEl = document.getElementById("approval-list");
  const emptyEl = document.getElementById("approval-empty");

  if (!rows || rows.length === 0) {
    listEl.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  listEl.innerHTML = rows.map(row => `
    <li class="approval-row">
      <span>${row.label}</span>
      <span class="approval-tag">${row.count} รายการ</span>
    </li>
  `).join("");
}

async function init() {
  document.getElementById("today-date").textContent = formatThaiDate(new Date());

  // สภาพอากาศ: ยังไม่เชื่อม API จริง — แสดงข้อความ placeholder ไว้ก่อน
  document.getElementById("weather").textContent = "ยังไม่เชื่อมข้อมูลอากาศ";

  const data = await getOverviewData();

  renderStatStrip(data.farmStats);

  renderLogList("task-list", "task-empty", data.todayTasks);
  document.getElementById("task-count").textContent = `${data.todayTasks.length} รายการ`;

  renderLogList("farrow-list", "farrow-empty", data.nearFarrowing);

  renderApprovals(data.pendingApprovals);
}

document.addEventListener("DOMContentLoaded", init);
