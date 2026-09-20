// js/calendar.js
// หน้าปฏิทินงาน (เฟส 2) — agenda แบบช่วง 7 วัน, เพิ่มงานใหม่, ทำเครื่องหมายเสร็จ
// รูปแบบเดียวกับ js/app.js: ฟังก์ชันดึงข้อมูลแยกจาก render, ไม่ใช้ innerHTML, ต้อง login ก่อน (requireAuth)

let rangeStart = isoToday(); // จุดเริ่มของช่วง 7 วันที่กำลังดู

function rangeEnd() {
  return isoOffset(dateDiffFromToday(rangeStart) + 6);
}

// หา ISO date ที่ห่างจากวันนี้ N วัน โดย N มาจาก rangeStart เอง (รองรับ prev/next ข้ามหลายสัปดาห์)
function dateDiffFromToday(isoDateStr) {
  const d = new Date(isoDateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function shiftRange(days) {
  rangeStart = isoOffset(dateDiffFromToday(rangeStart) + days);
}

function resetRangeToToday() {
  rangeStart = isoToday();
}

// ---------- Data layer ----------

async function getTasksInRange(startISO, endISO) {
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("id, title, due_date, status, pigs(ear_tag, pens(code))")
    .gte("due_date", startISO)
    .lte("due_date", endISO)
    .order("due_date");
  if (error) throw error;
  return data || [];
}

async function getPigsForSelect() {
  const { data, error } = await supabaseClient
    .from("pigs")
    .select("id, ear_tag")
    .order("ear_tag");
  if (error) throw error;
  return data || [];
}

async function addTask({ title, due_date, pig_id }) {
  const { error } = await supabaseClient.from("tasks").insert({
    title,
    due_date,
    pig_id: pig_id || null,
    status: "รอทำ",
  });
  if (error) throw error;
}

async function completeTask(taskId) {
  const { error } = await supabaseClient
    .from("tasks")
    .update({ status: "เสร็จแล้ว" })
    .eq("id", taskId);
  if (error) throw error;
}

// ---------- Render ----------

function fillPigSelect(pigs) {
  const select = document.getElementById("task-pig");
  while (select.options.length > 1) select.remove(1);
  pigs.forEach(pig => {
    const opt = document.createElement("option");
    opt.value = pig.id;
    opt.textContent = `เบอร์หู ${pig.ear_tag}`;
    select.appendChild(opt);
  });
}

function updateRangeLabel() {
  const label = document.getElementById("range-label");
  label.textContent = `งานวันที่ ${formatThaiDateShort(rangeStart)} — ${formatThaiDateShort(rangeEnd())}`;
}

function taskSubtitle(row) {
  const pig = row.pigs;
  return pig
    ? `เบอร์หู ${pig.ear_tag}${pig.pens ? " · คอก " + pig.pens.code : ""}`
    : "งานทั่วไป";
}

function renderAgenda(tasks) {
  const listEl = document.getElementById("agenda-list");
  const emptyEl = document.getElementById("agenda-empty");
  clearChildren(listEl);

  document.getElementById("range-count").textContent = `${tasks.length} รายการ`;

  if (tasks.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  let lastDate = null;

  tasks.forEach(row => {
    if (row.due_date !== lastDate) {
      listEl.appendChild(el("li", "agenda-date-heading", formatThaiDateShort(row.due_date)));
      lastDate = row.due_date;
    }

    const isDone = row.status === "เสร็จแล้ว";
    const meta = isDone
      ? { status: "ok", label: "เสร็จแล้ว" }
      : getDueMeta(row.due_date);

    const li = el("li", "log-row");
    li.setAttribute(
      "aria-label",
      `${row.title} ${taskSubtitle(row)} สถานะ ${STATUS_WORD[meta.status]} ${meta.label}`
    );

    const bar = el("span", `status-bar ${meta.status}`);
    bar.setAttribute("aria-hidden", "true");

    const body = el("div", "log-body");
    body.appendChild(el("p", "log-title", row.title));
    body.appendChild(el("p", "log-sub", taskSubtitle(row)));

    const when = el("span", `log-when ${meta.status}`, meta.label);

    li.appendChild(bar);
    li.appendChild(body);
    li.appendChild(when);

    if (!isDone) {
      const doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.className = "button-secondary";
      doneBtn.textContent = "ทำเสร็จแล้ว";
      doneBtn.style.marginLeft = "12px";
      doneBtn.addEventListener("click", async () => {
        doneBtn.disabled = true;
        try {
          await completeTask(row.id);
          await loadAndRenderAgenda();
        } catch (err) {
          console.error("[Nipponfarm] ทำเครื่องหมายงานเสร็จล้มเหลว:", err);
          doneBtn.disabled = false;
        }
      });
      li.appendChild(doneBtn);
    }

    listEl.appendChild(li);
  });
}

// ---------- Form handler ----------

function setFormError(errorElId, message) {
  const errEl = document.getElementById(errorElId);
  if (message) {
    errEl.textContent = message;
    errEl.hidden = false;
  } else {
    errEl.hidden = true;
  }
}

async function handleTaskSubmit(event) {
  event.preventDefault();
  setFormError("task-form-error", null);

  const title = document.getElementById("task-title").value.trim();
  const due_date = document.getElementById("task-due-date").value;
  const pig_id = document.getElementById("task-pig").value;

  if (!title || !due_date) {
    setFormError("task-form-error", "กรุณากรอกชื่องานและวันครบกำหนด");
    return;
  }

  const button = document.getElementById("task-submit");
  button.disabled = true;
  try {
    await addTask({ title, due_date, pig_id });
    document.getElementById("task-form").reset();
    await loadAndRenderAgenda();
  } catch (err) {
    console.error("[Nipponfarm] เพิ่มงานล้มเหลว:", err);
    setFormError("task-form-error", "เพิ่มงานไม่สำเร็จ ลองใหม่อีกครั้ง");
  } finally {
    button.disabled = false;
  }
}

// ---------- Init ----------

async function loadAndRenderAgenda() {
  updateRangeLabel();
  const tasks = await getTasksInRange(rangeStart, rangeEnd());
  renderAgenda(tasks);
}

async function loadAndRender() {
  showLoading();
  try {
    const pigs = await getPigsForSelect();
    fillPigSelect(pigs);
    await loadAndRenderAgenda();
    showContent();
  } catch (err) {
    console.error("[Nipponfarm] โหลดข้อมูลปฏิทินล้มเหลว:", err);
    showError("โหลดข้อมูลไม่สำเร็จ ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง");
  }
}

function init() {
  requireAuth().then(session => {
    if (!session) return;
    loadAndRender();
  });
  attachLogout("logout-button");
  document.getElementById("retry-button").addEventListener("click", loadAndRender);
  document.getElementById("task-form").addEventListener("submit", handleTaskSubmit);

  document.getElementById("prev-range").addEventListener("click", () => {
    shiftRange(-7);
    loadAndRenderAgenda();
  });
  document.getElementById("next-range").addEventListener("click", () => {
    shiftRange(7);
    loadAndRenderAgenda();
  });
  document.getElementById("today-range").addEventListener("click", () => {
    resetRangeToToday();
    loadAndRenderAgenda();
  });
}

document.addEventListener("DOMContentLoaded", init);
