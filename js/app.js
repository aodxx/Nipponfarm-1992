// app.js
// ตรรกะแสดงผลหน้า Overview
//
// จุดสำคัญ: ทุกการดึงข้อมูลผ่านฟังก์ชัน getOverviewData() จุดเดียว — ดึงจาก Supabase จริง
// (เชื่อมต่อจริงแล้วตั้งแต่ 2026-09-20 — ดู CHANGELOG.md) ต้อง login ก่อนถึงจะเรียกสำเร็จ (RLS)
// ส่วนโค้ด render ด้านล่างไม่ต้องแก้ ตราบใดที่รูปร่างข้อมูลเหมือนเดิม
//
// ฟังก์ชันร่วม (el, clearChildren, getDueMeta, showLoading/Error/Content ฯลฯ) อยู่ใน js/ui-helpers.js
//
// ความปลอดภัย: ห้ามใช้ innerHTML กับข้อมูลที่มาจากฐานข้อมูล/ผู้ใช้ในไฟล์นี้
// ทุก node สร้างผ่าน document.createElement + textContent เท่านั้น (ดู AGENTS.md)

function taskRowToViewModel(row) {
  const pig = row.pigs;
  const subtitle = pig
    ? `เบอร์หู ${pig.ear_tag}${pig.pens ? " · คอก " + pig.pens.code : ""}`
    : "งานทั่วไป";
  return { id: row.id, title: row.title, subtitle, due_date: row.due_date };
}

function farrowRowToViewModel(row) {
  return {
    id: row.id,
    title: `เบอร์หู ${row.ear_tag}`,
    subtitle: row.pens ? `คอก ${row.pens.code}` : "ยังไม่ระบุคอก",
    due_date: row.expected_farrow_date,
  };
}

async function getOverviewData() {
  const today = isoToday();
  const sevenDaysAhead = isoOffset(7);

  const [
    tasksRes,
    farrowRes,
    totalPigsRes,
    pregnantRes,
    pensRes,
    occupiedPensRes,
    billsRes,
    advancesRes,
  ] = await Promise.all([
    supabaseClient
      .from("tasks")
      .select("id, title, due_date, pigs(ear_tag, pens(code))")
      .lte("due_date", today)
      .order("due_date"),
    supabaseClient
      .from("pigs")
      .select("id, ear_tag, expected_farrow_date, pens(code)")
      .eq("status", "ท้อง")
      .gte("expected_farrow_date", today)
      .lte("expected_farrow_date", sevenDaysAhead)
      .order("expected_farrow_date"),
    supabaseClient.from("pigs").select("id", { count: "exact", head: true }),
    supabaseClient.from("pigs").select("id", { count: "exact", head: true }).eq("status", "ท้อง"),
    supabaseClient.from("pens").select("id", { count: "exact", head: true }),
    supabaseClient.from("pigs").select("pen_id").not("pen_id", "is", null),
    supabaseClient.from("bills").select("id", { count: "exact", head: true }).eq("status", "รอตรวจสอบ"),
    supabaseClient.from("cash_advances").select("id", { count: "exact", head: true }).eq("status", "รออนุมัติ"),
  ]);

  for (const res of [tasksRes, farrowRes, totalPigsRes, pregnantRes, pensRes, occupiedPensRes, billsRes, advancesRes]) {
    if (res.error) throw res.error;
  }

  const occupiedPenCount = new Set((occupiedPensRes.data || []).map(r => r.pen_id)).size;

  const pendingApprovals = [];
  if (billsRes.count > 0) {
    pendingApprovals.push({ id: "bills", label: "บิลค่าใช้จ่ายรออนุมัติ", count: billsRes.count });
  }
  if (advancesRes.count > 0) {
    pendingApprovals.push({ id: "advances", label: "คำขอเบิกเงินล่วงหน้า", count: advancesRes.count });
  }

  return {
    farmStats: {
      totalPigs: totalPigsRes.count || 0,
      pregnant: pregnantRes.count || 0,
      emptyPens: Math.max((pensRes.count || 0) - occupiedPenCount, 0),
    },
    todayTasks: (tasksRes.data || []).map(taskRowToViewModel),
    nearFarrowing: (farrowRes.data || []).map(farrowRowToViewModel),
    pendingApprovals,
  };
}

// ---------- Render: stat strip ----------

function renderStatStrip(stats, nearFarrowingCount) {
  const container = document.getElementById("stat-strip");
  clearChildren(container);

  const items = [
    { value: stats.totalPigs, label: "แม่พันธุ์ทั้งหมด" },
    { value: stats.pregnant, label: "กำลังท้อง" },
    { value: nearFarrowingCount, label: "ใกล้คลอด" },
    { value: stats.emptyPens, label: "คอกว่าง" },
  ];

  items.forEach(item => {
    const stat = el("div", "stat");
    stat.appendChild(el("span", "value", String(item.value)));
    stat.appendChild(el("span", "label", item.label));
    container.appendChild(stat);
  });
}

// ---------- Render: log list (งานวันนี้ / ใกล้คลอด) ----------

function renderLogList(listId, emptyId, rows) {
  const listEl = document.getElementById(listId);
  const emptyEl = document.getElementById(emptyId);
  clearChildren(listEl);

  if (!rows || rows.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  rows.forEach(row => {
    const { status, label } = getDueMeta(row.due_date);

    const li = el("li", "log-row");
    li.setAttribute(
      "aria-label",
      `${row.title} ${row.subtitle} สถานะ ${STATUS_WORD[status]} ${label}`
    );

    const bar = el("span", `status-bar ${status}`);
    bar.setAttribute("aria-hidden", "true");

    const body = el("div", "log-body");
    body.appendChild(el("p", "log-title", row.title));
    body.appendChild(el("p", "log-sub", row.subtitle));

    const when = el("span", `log-when ${status}`, label);

    li.appendChild(bar);
    li.appendChild(body);
    li.appendChild(when);
    listEl.appendChild(li);
  });
}

// ---------- Render: approvals ----------

function renderApprovals(rows) {
  const listEl = document.getElementById("approval-list");
  const emptyEl = document.getElementById("approval-empty");
  clearChildren(listEl);

  if (!rows || rows.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  rows.forEach(row => {
    const li = el("li", "approval-row");
    li.appendChild(el("span", null, row.label));
    li.appendChild(el("span", "approval-tag", `${row.count} รายการ`));
    listEl.appendChild(li);
  });
}

// ---------- Init ----------

async function loadAndRender() {
  showLoading();
  try {
    document.getElementById("today-date").textContent = formatThaiDate(new Date());
    // สภาพอากาศ: ยังไม่เชื่อม API จริง — แสดงข้อความ placeholder ไว้ก่อน
    document.getElementById("weather").textContent = "ยังไม่เชื่อมข้อมูลอากาศ";

    const data = await getOverviewData();

    renderStatStrip(data.farmStats, data.nearFarrowing.length);

    renderLogList("task-list", "task-empty", data.todayTasks);
    document.getElementById("task-count").textContent = `${data.todayTasks.length} รายการ`;

    renderLogList("farrow-list", "farrow-empty", data.nearFarrowing);

    renderApprovals(data.pendingApprovals);

    showContent();
  } catch (err) {
    // ไม่ log รายละเอียดที่อาจมีข้อมูลลับ (เช่น token) ออกสู่ UI — log เฉพาะ console สำหรับ debug
    console.error("[Nipponfarm] โหลดข้อมูล Overview ล้มเหลว:", err);
    showError("โหลดข้อมูลไม่สำเร็จ ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง");
  }
}

function init() {
  requireAuth().then(session => {
    if (!session) return; // requireAuth already redirected to login
    loadAndRender();
  });
  attachLogout("logout-button");
  document.getElementById("retry-button").addEventListener("click", loadAndRender);
}

document.addEventListener("DOMContentLoaded", init);
