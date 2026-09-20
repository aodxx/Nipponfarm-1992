// js/pigs.js
// หน้าจัดการแม่พันธุ์/หมู (เฟส 2) — คอก, รายชื่อหมู, ประวัติ (pig_events)
// รูปแบบเดียวกับ js/app.js: ฟังก์ชันดึงข้อมูลแยกจาก render, ไม่ใช้ innerHTML, ต้อง login ก่อน (requireAuth)

let selectedPigId = null;
let selectedPigEarTag = null;

// ---------- Data layer ----------

async function getPens() {
  const { data, error } = await supabaseClient
    .from("pens")
    .select("id, code, capacity, buildings(name)")
    .order("code");
  if (error) throw error;
  return data || [];
}

async function addPen({ code, buildingName, capacity }) {
  let buildingId = null;

  if (buildingName) {
    const { data: existing, error: selErr } = await supabaseClient
      .from("buildings")
      .select("id")
      .eq("name", buildingName)
      .maybeSingle();
    if (selErr) throw selErr;

    if (existing) {
      buildingId = existing.id;
    } else {
      const { data: inserted, error: insErr } = await supabaseClient
        .from("buildings")
        .insert({ name: buildingName })
        .select("id")
        .single();
      if (insErr) throw insErr;
      buildingId = inserted.id;
    }
  }

  const { error } = await supabaseClient
    .from("pens")
    .insert({ code, building_id: buildingId, capacity: capacity || null });
  if (error) throw error;
}

async function getPigs() {
  const { data, error } = await supabaseClient
    .from("pigs")
    .select("id, ear_tag, breed, status, pens(code)")
    .order("ear_tag");
  if (error) throw error;
  return data || [];
}

async function addPig({ ear_tag, breed, birth_date, pen_id, status }) {
  const { error } = await supabaseClient.from("pigs").insert({
    ear_tag,
    breed: breed || null,
    birth_date: birth_date || null,
    pen_id: pen_id || null,
    status,
  });
  if (error) throw error;
}

async function getPigEvents(pigId) {
  const { data, error } = await supabaseClient
    .from("pig_events")
    .select("id, event_type, event_date, notes")
    .eq("pig_id", pigId)
    .order("event_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function addPigEvent({ pig_id, event_type, event_date, notes }) {
  const { error } = await supabaseClient
    .from("pig_events")
    .insert({ pig_id, event_type, event_date, notes: notes || null });
  if (error) throw error;
}

// ---------- Render: คอก ----------

function renderPenList(pens) {
  const listEl = document.getElementById("pen-list");
  const emptyEl = document.getElementById("pen-empty");
  clearChildren(listEl);

  if (pens.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  pens.forEach(pen => {
    const parts = [];
    if (pen.buildings) parts.push(pen.buildings.name);
    if (pen.capacity != null) parts.push(`ความจุ ${pen.capacity} ตัว`);

    const li = el("li", "log-row");
    const body = el("div", "log-body");
    body.appendChild(el("p", "log-title", pen.code));
    if (parts.length > 0) body.appendChild(el("p", "log-sub", parts.join(" · ")));
    li.appendChild(body);
    listEl.appendChild(li);
  });
}

function fillPenSelect(pens) {
  const select = document.getElementById("pig-pen");
  while (select.options.length > 1) select.remove(1);
  pens.forEach(pen => {
    const opt = document.createElement("option");
    opt.value = pen.id;
    opt.textContent = pen.code;
    select.appendChild(opt);
  });
}

// ---------- Render: รายชื่อหมู ----------

function renderPigTable(pigs) {
  const tbody = document.getElementById("pig-table-body");
  const emptyEl = document.getElementById("pig-empty");
  clearChildren(tbody);

  document.getElementById("pig-count").textContent = `${pigs.length} ตัว`;

  if (pigs.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  pigs.forEach(pig => {
    const tr = document.createElement("tr");
    tr.dataset.pigId = pig.id;
    if (pig.id === selectedPigId) tr.className = "selected";

    const tdTag = document.createElement("td");
    tdTag.textContent = pig.ear_tag;

    const tdBreed = document.createElement("td");
    tdBreed.textContent = pig.breed || "—";

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(el("span", "badge", pig.status));

    const tdPen = document.createElement("td");
    tdPen.textContent = pig.pens ? pig.pens.code : "—";

    tr.appendChild(tdTag);
    tr.appendChild(tdBreed);
    tr.appendChild(tdStatus);
    tr.appendChild(tdPen);

    tr.addEventListener("click", () => selectPig(pig.id, pig.ear_tag));

    tbody.appendChild(tr);
  });
}

// ---------- Render: ประวัติของตัวที่เลือก ----------

function renderPigEvents(events) {
  const listEl = document.getElementById("pig-events-list");
  const emptyEl = document.getElementById("pig-events-empty");
  clearChildren(listEl);

  if (events.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  events.forEach(ev => {
    const li = el("li", "timeline-row");
    li.appendChild(el("span", "timeline-date", formatThaiDateShort(ev.event_date)));

    const body = el("div", "timeline-body");
    body.appendChild(el("p", "timeline-type", ev.event_type));
    if (ev.notes) body.appendChild(el("p", "timeline-notes", ev.notes));
    li.appendChild(body);

    listEl.appendChild(li);
  });
}

async function selectPig(pigId, earTag) {
  selectedPigId = pigId;
  selectedPigEarTag = earTag;

  document.getElementById("pig-detail-section").hidden = false;
  document.getElementById("pig-detail-title").textContent = `ประวัติ — เบอร์หู ${earTag}`;

  // รีเฟรชตารางเพื่ออัปเดตแถวที่ถูกเลือก (ไฮไลต์)
  renderPigTable(await getPigs());

  try {
    const events = await getPigEvents(pigId);
    renderPigEvents(events);
  } catch (err) {
    console.error("[Nipponfarm] โหลดประวัติหมูล้มเหลว:", err);
  }
}

// ---------- Form handlers ----------

function setFormError(errorElId, message) {
  const errEl = document.getElementById(errorElId);
  if (message) {
    errEl.textContent = message;
    errEl.hidden = false;
  } else {
    errEl.hidden = true;
  }
}

async function handlePenSubmit(event) {
  event.preventDefault();
  setFormError("pen-form-error", null);

  const code = document.getElementById("pen-code").value.trim();
  const buildingName = document.getElementById("pen-building").value.trim();
  const capacity = document.getElementById("pen-capacity").value;

  if (!code) {
    setFormError("pen-form-error", "กรุณากรอกรหัสคอก");
    return;
  }

  const button = document.getElementById("pen-submit");
  button.disabled = true;
  try {
    await addPen({ code, buildingName, capacity: capacity ? Number(capacity) : null });
    document.getElementById("pen-form").reset();
    const pens = await getPens();
    renderPenList(pens);
    fillPenSelect(pens);
  } catch (err) {
    console.error("[Nipponfarm] เพิ่มคอกล้มเหลว:", err);
    setFormError("pen-form-error", "เพิ่มคอกไม่สำเร็จ (รหัสคอกอาจซ้ำ) ลองใหม่อีกครั้ง");
  } finally {
    button.disabled = false;
  }
}

async function handlePigSubmit(event) {
  event.preventDefault();
  setFormError("pig-form-error", null);

  const ear_tag = document.getElementById("pig-ear-tag").value.trim();
  const breed = document.getElementById("pig-breed").value.trim();
  const birth_date = document.getElementById("pig-birth-date").value;
  const pen_id = document.getElementById("pig-pen").value;
  const status = document.getElementById("pig-status").value;

  if (!ear_tag) {
    setFormError("pig-form-error", "กรุณากรอกเบอร์หู");
    return;
  }

  const button = document.getElementById("pig-submit");
  button.disabled = true;
  try {
    await addPig({ ear_tag, breed, birth_date, pen_id, status });
    document.getElementById("pig-form").reset();
    renderPigTable(await getPigs());
  } catch (err) {
    console.error("[Nipponfarm] เพิ่มแม่พันธุ์ล้มเหลว:", err);
    setFormError("pig-form-error", "เพิ่มแม่พันธุ์ไม่สำเร็จ (เบอร์หูอาจซ้ำ) ลองใหม่อีกครั้ง");
  } finally {
    button.disabled = false;
  }
}

async function handleEventSubmit(event) {
  event.preventDefault();
  setFormError("event-form-error", null);

  if (!selectedPigId) return;

  const event_type = document.getElementById("event-type").value;
  const event_date = document.getElementById("event-date").value;
  const notes = document.getElementById("event-notes").value.trim();

  if (!event_date) {
    setFormError("event-form-error", "กรุณาเลือกวันที่");
    return;
  }

  const button = document.getElementById("event-submit");
  button.disabled = true;
  try {
    await addPigEvent({ pig_id: selectedPigId, event_type, event_date, notes });
    document.getElementById("event-form").reset();
    renderPigEvents(await getPigEvents(selectedPigId));
    // เหตุการณ์บางประเภท (เช่น ผสมพันธุ์) ทำให้สถานะ/งานอัตโนมัติเปลี่ยนผ่าน trigger ฝั่ง DB
    // รีเฟรชตารางหมูเพื่อให้เห็นสถานะล่าสุด
    renderPigTable(await getPigs());
  } catch (err) {
    console.error("[Nipponfarm] บันทึกเหตุการณ์ล้มเหลว:", err);
    setFormError("event-form-error", "บันทึกเหตุการณ์ไม่สำเร็จ ลองใหม่อีกครั้ง");
  } finally {
    button.disabled = false;
  }
}

// ---------- Init ----------

async function loadAndRender() {
  showLoading();
  try {
    const [pens, pigs] = await Promise.all([getPens(), getPigs()]);
    renderPenList(pens);
    fillPenSelect(pens);
    renderPigTable(pigs);
    showContent();
  } catch (err) {
    console.error("[Nipponfarm] โหลดข้อมูลแม่พันธุ์ล้มเหลว:", err);
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
  document.getElementById("pen-form").addEventListener("submit", handlePenSubmit);
  document.getElementById("pig-form").addEventListener("submit", handlePigSubmit);
  document.getElementById("event-form").addEventListener("submit", handleEventSubmit);
}

document.addEventListener("DOMContentLoaded", init);
