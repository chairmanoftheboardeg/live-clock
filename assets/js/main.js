/* Seychelles Time — main JS (Home)
   Pure browser JS, no dependencies.
*/

const TZ = "Indian/Mahe";

const els = {
  burger: document.querySelector("#burger"),
  navlinks: document.querySelector("#navlinks"),
  moreBtn: document.querySelector("#moreBtn"),
  moreMenu: document.querySelector("#moreMenu"),

  clock: document.querySelector("#clock"),
  dateLine: document.querySelector("#dateLine"),
  tzLine: document.querySelector("#tzLine"),
  statusChip: document.querySelector("#statusChip"),
  statusDot: document.querySelector("#statusDot"),
  statusText: document.querySelector("#statusText"),

  formatToggle: document.querySelector("#formatToggle"),
  copyBtn: document.querySelector("#copyTime"),
  shareBtn: document.querySelector("#shareLink"),

  compareCity: document.querySelector("#compareCity"),
  compareOut: document.querySelector("#compareOut"),

  meetDate: document.querySelector("#meetDate"),
  meetTime: document.querySelector("#meetTime"),
  meetCities: document.querySelector("#meetCities"),
  meetOut: document.querySelector("#meetOut"),

  discordDate: document.querySelector("#discordDate"),
  discordTime: document.querySelector("#discordTime"),
  discordOut: document.querySelector("#discordOut"),
  discordCopy: document.querySelector("#discordCopy"),

  toast: document.querySelector("#toast"),
  toastTitle: document.querySelector("#toastTitle"),
  toastMsg: document.querySelector("#toastMsg")
};

const cityOptions = [
  { id: "Europe/London", name: "London" },
  { id: "Europe/Paris", name: "Paris" },
  { id: "Asia/Dubai", name: "Dubai" },
  { id: "Africa/Johannesburg", name: "Johannesburg" },
  { id: "Asia/Kolkata", name: "Mumbai" },
  { id: "Asia/Singapore", name: "Singapore" },
  { id: "America/New_York", name: "New York" },
  { id: "America/Los_Angeles", name: "Los Angeles" },
  { id: "Australia/Sydney", name: "Sydney" },
];

function showToast(title, msg) {
  if (!els.toast) return;
  els.toastTitle.textContent = title;
  els.toastMsg.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove("show"), 3500);
}

function pad2(n){ return String(n).padStart(2, "0"); }

function getPartsInTZ(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year:"numeric", month:"2-digit", day:"2-digit",
    hour:"2-digit", minute:"2-digit", second:"2-digit",
    hour12: false
  });
  const parts = dtf.formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    y: Number(map.year),
    mo: Number(map.month),
    d: Number(map.day),
    hh: Number(map.hour),
    mm: Number(map.minute),
    ss: Number(map.second)
  };
}

// Create a Date object that represents the *wall-clock* time in the given TZ,
// expressed as a UTC Date for safe arithmetic (not a true TZ Date).
function wallClockDateInTZ(date, timeZone) {
  const p = getPartsInTZ(date, timeZone);
  return new Date(Date.UTC(p.y, p.mo - 1, p.d, p.hh, p.mm, p.ss));
}

function formatClock(date, hour12) {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12
  });
  return dtf.format(date);
}

function formatDateLine(date) {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday:"long", year:"numeric", month:"long", day:"2-digit"
  });
  return dtf.format(date);
}

function isSeychellesDay(date) {
  const p = getPartsInTZ(date, TZ);
  return p.hh >= 6 && p.hh < 18;
}

function updateStatus(date) {
  const day = isSeychellesDay(date);
  els.statusDot.classList.toggle("night", !day);
  els.statusText.textContent = day ? "Daytime in Seychelles" : "Night in Seychelles";
}

function updateClock() {
  const now = new Date();
  const hour12 = (els.formatToggle?.getAttribute("aria-pressed") === "true");
  els.clock.textContent = formatClock(now, hour12);
  els.dateLine.textContent = formatDateLine(now);
  els.tzLine.textContent = "Time zone: Seychelles (Indian/Mahe • UTC+4)";
  updateStatus(now);
  updateCompare();
}

function toggleFormat() {
  const is12 = els.formatToggle.getAttribute("aria-pressed") === "true";
  els.formatToggle.setAttribute("aria-pressed", String(!is12));
  els.formatToggle.textContent = !is12 ? "12-hour format" : "24-hour format";
  showToast("Display updated", !is12 ? "Clock switched to 12-hour format." : "Clock switched to 24-hour format.");
  updateClock();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch {}
    ta.remove();
    return true;
  }
}

function buildTimeStringForCopy(date) {
  const clock = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour:"2-digit", minute:"2-digit", second:"2-digit",
    hour12: false
  }).format(date);
  const dateLine = formatDateLine(date);
  return `${dateLine} • ${clock} • Seychelles (UTC+4)`;
}

async function onCopyTime() {
  const now = new Date();
  const text = buildTimeStringForCopy(now);
  await copyText(text);
  showToast("Copied", "Seychelles time copied to clipboard.");
}

async function onShareLink() {
  const url = location.href.split("#")[0];
  await copyText(url);
  showToast("Link copied", "Page link copied to clipboard.");
}

function populateCompareSelect() {
  if (!els.compareCity) return;
  els.compareCity.innerHTML = cityOptions.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  els.compareCity.value = "Europe/London";
}

function updateCompare() {
  if (!els.compareCity || !els.compareOut) return;
  const now = new Date();
  const targetTz = els.compareCity.value;

  const sey = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour:"2-digit", minute:"2-digit", hour12:false
  }).format(now);

  const other = new Intl.DateTimeFormat("en-GB", {
    timeZone: targetTz,
    hour:"2-digit", minute:"2-digit", hour12:false
  }).format(now);

  // Compute difference using wall-clock UTC Dates.
  const wS = wallClockDateInTZ(now, TZ);
  const wT = wallClockDateInTZ(now, targetTz);
  const diffMin = Math.round((wS - wT) / 60000);
  const sign = diffMin === 0 ? "" : (diffMin > 0 ? "+" : "−");
  const abs = Math.abs(diffMin);
  const hh = Math.floor(abs / 60);
  const mm = abs % 60;
  const diffLabel = diffMin === 0 ? "Same time" : `Seychelles is ${sign}${hh}h ${pad2(mm)}m`;

  els.compareOut.textContent = `Now: Seychelles ${sey} • ${other} • ${diffLabel}`;
}

function defaultInputs() {
  const now = new Date();
  // Meeting planner defaults: today and rounded time
  const p = getPartsInTZ(now, TZ);
  const dateISO = `${p.y}-${pad2(p.mo)}-${pad2(p.d)}`;
  const roundedMin = Math.floor(p.mm / 5) * 5;
  const time = `${pad2(p.hh)}:${pad2(roundedMin)}`;
  if (els.meetDate) els.meetDate.value = dateISO;
  if (els.meetTime) els.meetTime.value = time;
  if (els.discordDate) els.discordDate.value = dateISO;
  if (els.discordTime) els.discordTime.value = time;
}

function getSelectedMeetingCities() {
  const boxes = els.meetCities?.querySelectorAll("input[type='checkbox']");
  const selected = [];
  boxes?.forEach(b => { if (b.checked) selected.push({tz: b.value, name: b.dataset.name}); });
  return selected;
}

function renderMeetingCities() {
  if (!els.meetCities) return;
  // Default selection
  const defaults = new Set(["Europe/London","Europe/Paris","Asia/Dubai"]);
  els.meetCities.innerHTML = cityOptions.map(c => {
    const checked = defaults.has(c.id) ? "checked" : "";
    return `
      <label style="display:flex;gap:10px;align-items:center;cursor:pointer;user-select:none;">
        <input type="checkbox" value="${c.id}" data-name="${c.name}" ${checked} />
        <span style="font-weight:800;color:rgba(255,255,255,0.92)">${c.name}</span>
      </label>`;
  }).join("");
}

function makeUTCDateFromSeychellesInput(dateStr, timeStr) {
  // Interpret the input as Seychelles wall-clock, then produce a UTC Date that matches those components.
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(y, m-1, d, hh, mm, 0));
}

function updateMeetingPlanner() {
  if (!els.meetOut) return;
  const dateStr = els.meetDate.value;
  const timeStr = els.meetTime.value;
  const utcDate = makeUTCDateFromSeychellesInput(dateStr, timeStr);

  // Display Seychelles time (as entered)
  const sey = `${timeStr} (Seychelles)`;

  const selected = getSelectedMeetingCities();
  const lines = selected.map(c => {
    const t = new Intl.DateTimeFormat("en-GB", {
      timeZone: c.tz,
      weekday: "short",
      hour: "2-digit", minute: "2-digit",
      hour12: false
    }).format(utcDate);
    return `${c.name}: ${t}`;
  });

  els.meetOut.textContent = `${dateStr} • ${sey} → ${lines.join(" • ")}`;
}

function toUnixSeconds(date) {
  return Math.floor(date.getTime() / 1000);
}

function updateDiscordTimestamps() {
  if (!els.discordOut) return;
  const dateStr = els.discordDate.value;
  const timeStr = els.discordTime.value;
  const utcDate = makeUTCDateFromSeychellesInput(dateStr, timeStr);
  const unix = toUnixSeconds(utcDate);
  // Discord formats
  const formats = [
    {code:"t", label:"Short time"},
    {code:"T", label:"Long time"},
    {code:"d", label:"Short date"},
    {code:"D", label:"Long date"},
    {code:"f", label:"Short date/time"},
    {code:"F", label:"Long date/time"},
    {code:"R", label:"Relative"},
  ];
  const out = formats.map(f => `<t:${unix}:${f.code}>  (${f.label})`).join("\n");
  els.discordOut.value = out;
}

async function copyDiscordOut() {
  await copyText(els.discordOut.value);
  showToast("Copied", "Discord timestamps copied to clipboard.");
}

/* Navigation + menus */
function initMenus() {
  els.burger?.addEventListener("click", () => {
    els.navlinks.classList.toggle("show");
  });

  function closeMoreMenu(e){
    if (!els.moreMenu || !els.moreBtn) return;
    const inWrap = e?.target && (els.moreMenu.contains(e.target) || els.moreBtn.contains(e.target));
    if (!inWrap) els.moreMenu.classList.remove("show");
  }
  els.moreBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    els.moreMenu.classList.toggle("show");
  });
  document.addEventListener("click", closeMoreMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") els.moreMenu?.classList.remove("show");
  });
}

/* Reveal animations */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver((entries) => {
    for (const ent of entries) {
      if (ent.isIntersecting) ent.target.classList.add("in");
    }
  }, { threshold: 0.12 });
  items.forEach(i => io.observe(i));
}

/* Init */
function init() {
  initMenus();
  initReveal();
  populateCompareSelect();
  renderMeetingCities();
  defaultInputs();

  els.formatToggle?.addEventListener("click", toggleFormat);
  els.copyBtn?.addEventListener("click", onCopyTime);
  els.shareBtn?.addEventListener("click", onShareLink);

  els.compareCity?.addEventListener("change", updateCompare);

  els.meetDate?.addEventListener("change", () => { updateMeetingPlanner(); updateDiscordTimestamps(); });
  els.meetTime?.addEventListener("change", () => { updateMeetingPlanner(); updateDiscordTimestamps(); });
  els.meetCities?.addEventListener("change", updateMeetingPlanner);

  els.discordDate?.addEventListener("change", updateDiscordTimestamps);
  els.discordTime?.addEventListener("change", updateDiscordTimestamps);
  els.discordCopy?.addEventListener("click", copyDiscordOut);

  updateClock();
  updateMeetingPlanner();
  updateDiscordTimestamps();
  setInterval(updateClock, 1000);
}

init();
