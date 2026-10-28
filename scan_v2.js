/* Server login, barcode scan and audit pages.
   With no server (static preview) the app stays in demo mode and the Scan page says so. */
const API = { on: false, user: null };

async function api(method, url, body) {
  const r = await fetch(url, { method, credentials: "same-origin",
    headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: r.status, data });
  return data;
}

/* ---- titles for the new pages ---- */
const _pt = pageTitle, _ps = pageSubtitle;
pageTitle = (p) => ({ scan: "Scan barcode", audit: "Audit log" })[p] || _pt(p);
pageSubtitle = (p) => ({
  scan: "Scan a product to receive or issue stock. Unknown barcodes register a new material.",
  audit: "Every change, who made it and when. Cannot be edited."
})[p] || _ps(p);

/* ---- login ---- */
function showLogin(msg) {
  let box = el("login-ov");
  if (!box) { box = document.createElement("div"); box.id = "login-ov"; document.body.appendChild(box); }
  box.style.cssText = "position:fixed;inset:0;z-index:500;background:#10202e;display:flex;align-items:center;justify-content:center;padding:16px";
  box.innerHTML = `<form class="card" style="width:min(360px,100%);padding:24px" onsubmit="return doLogin(event)">
    <div class="ct" style="font-size:1.2rem;margin-bottom:4px">Matgrid</div>
    <p style="margin-bottom:16px;color:var(--text-2,#555)">Sign in to your company.</p>
    <div class="fg"><label class="fl" for="lg-email">Email</label><input class="fi" id="lg-email" type="email" autocomplete="username" required/></div>
    <div class="fg"><label class="fl" for="lg-pw">Password</label><input class="fi" id="lg-pw" type="password" autocomplete="current-password" required/></div>
    <p id="lg-err" role="alert" style="color:#b3261e;min-height:1.2em;margin:8px 0">${esc(msg || "")}</p>
    <button class="btn primary" type="submit" style="width:100%">Sign in</button></form>`;
  el("lg-email").focus();
}

async function doLogin(ev) {
  ev.preventDefault();
  try {
    await api("POST", "/api/auth/login", { email: el("lg-email").value, password: el("lg-pw").value });
    await startSession();
  } catch (e) { el("lg-err").textContent = e.message; }
  return false;
}

async function logout() { await api("POST", "/api/auth/logout"); location.reload(); }

async function startSession() {
  const me = await api("GET", "/api/me");
  API.on = true; API.user = me.user;
  Object.assign(CONFIG, me.config, { company: me.company.name });
  CURRENT_ROLE = me.user.role;
  const rs = el("role-sel"); if (rs) rs.closest(".role-sel-wrap").style.display = "none";
  setTextIfPresent("u-role", me.user.name + " · " + (ROLE_NAMES[me.user.role] || me.user.role));
  const ov = el("login-ov"); if (ov) ov.remove();
  addServerNav();
  applyConfig();
  nav(CURRENT_PAGE || "dashboard");
}

function addServerNav() {
  if (el("ni-scan")) return;
  const adm = [...qsa("#sidebar .ng")].find((g) => g.textContent.trim() === "Admin");
  const mk = (id, page, icon, label) => {
    const b = document.createElement("button");
    b.className = "ni"; b.id = id; b.setAttribute("onclick", `nav('${page}')`);
    b.innerHTML = `<i class="ph ${icon}" aria-hidden="true"></i><span class="ni-txt">${label}</span>`;
    return b;
  };
  adm.before(mk("ni-scan", "scan", "ph-barcode", "Scan barcode"));
  if (can("auditRead") || ["admin", "manager"].includes(API.user.role)) adm.after(mk("ni-audit", "audit", "ph-clock-counter-clockwise", "Audit log"));
}

/* ---- scan page ---- */
let SCAN = { mode: "receive", qty: 1, last: null, buf: "", t: 0, stream: null };

PAGE_RENDERERS.scan = () => {
  if (!API.on) return `<div class="card"><div class="cb"><p>Scanning needs the Matgrid server (it stores products for your company). Start the server and sign in to use this page.</p></div></div>`;
  return `<div class="card"><div class="cb">
    <div class="fgrid fg2" style="max-width:640px">
      <div class="fg"><label class="fl" for="sc-mode">Action</label>
        <select class="fi" id="sc-mode" onchange="SCAN.mode=this.value"><option value="receive"${SCAN.mode === "receive" ? " selected" : ""}>Receive into stock</option><option value="issue"${SCAN.mode === "issue" ? " selected" : ""}>Issue from stock</option></select></div>
      <div class="fg"><label class="fl" for="sc-qty">Quantity per scan</label><input class="fi" id="sc-qty" type="number" min="1" step="any" value="${SCAN.qty}" oninput="SCAN.qty=Number(this.value)||1"/></div>
      <div class="fg" style="grid-column:1/-1"><label class="fl" for="sc-code">Barcode (point a scanner at this field, or type and press Enter)</label>
        <input class="fi" id="sc-code" inputmode="numeric" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();scanCode(this.value);this.value=''}"/></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn" type="button" onclick="startCamera()">Use camera</button><button class="btn" type="button" onclick="stopCamera()">Stop camera</button></div>
    <video id="sc-video" playsinline muted style="display:none;width:100%;max-width:420px;margin-top:12px;border-radius:8px"></video>
    <div id="sc-result" role="status" style="margin-top:16px"></div>
  </div></div>`;
};

function scanResult(html) { const r = el("sc-result"); if (r) r.innerHTML = html; }

async function scanCode(raw, register) {
  const code = String(raw || "").trim();
  if (!code) return;
  const input = el("sc-code");
  try {
    const r = await api("POST", "/api/scan", { barcode: code, mode: SCAN.mode, qty: SCAN.qty, register });
    scanResult(`<p><strong>${esc(r.sku)}</strong>: ${SCAN.mode === "issue" ? "issued" : "received"} ${esc(String(SCAN.qty))}. Stock now <strong>${esc(String(r.stock))}</strong>${r.registered ? ' <span class="badge badge-ok">new product registered</span>' : ""}.</p>`);
    toast(r.registered ? "Product registered" : "Stock updated", "ok");
    closeModal();
  } catch (e) {
    if (e.data && e.data.unknown && SCAN.mode === "receive") return registerModal(code);
    if (e.data && e.data.unknown) scanResult(`<p class="badge badge-warn">Unknown barcode ${esc(code)}. Switch to Receive to register it.</p>`);
    else toast(e.message, "warn");
  }
  if (input) input.focus();
}

function registerModal(code) {
  showModal("New product", `<p style="margin-bottom:12px">Barcode <strong>${esc(code)}</strong> is not in your system yet. Register it and book ${esc(String(SCAN.qty))} into stock.</p>
    <div class="fgrid fg2">
      <div class="fg"><label class="fl" for="rg-sku">SKU</label><input class="fi" id="rg-sku"/></div>
      <div class="fg"><label class="fl" for="rg-desc">Description</label><input class="fi" id="rg-desc"/></div>
      <div class="fg"><label class="fl" for="rg-unit">Unit</label><input class="fi" id="rg-unit" value="EA"/></div>
      <div class="fg"><label class="fl" for="rg-price">Unit price</label><input class="fi" id="rg-price" type="number" min="0" step="any" value="0"/></div>
    </div>`,
    [{ label: "Cancel", class: "", onclick: "closeModal()" },
     { label: "Register and receive", class: "primary", onclick: `submitRegister(${JSON.stringify(code).replace(/"/g, "&quot;")})` }]);
  el("rg-sku").focus();
}

function submitRegister(code) {
  const sku = el("rg-sku").value.trim(), description = el("rg-desc").value.trim();
  if (!sku || !description) { toast("SKU and description are required", "warn"); return; }
  scanCode(code, { sku, description, unit: el("rg-unit").value || "EA", price: Number(el("rg-price").value) || 0 });
}

/* Keyboard scanners type digits fast then Enter. If focus is elsewhere on the scan page, catch it. */
document.addEventListener("keydown", (e) => {
  if (CURRENT_PAGE !== "scan" || !API.on || e.target.matches("input,select,textarea") || document.querySelector(".ov")) return;
  const now = Date.now();
  if (now - SCAN.t > 80) SCAN.buf = "";
  SCAN.t = now;
  if (e.key === "Enter") { if (SCAN.buf.length >= 3) scanCode(SCAN.buf); SCAN.buf = ""; }
  else if (e.key.length === 1) SCAN.buf += e.key;
});

/* Camera fallback where the browser has BarcodeDetector (Chrome/Android/Edge). */
async function startCamera() {
  if (!("BarcodeDetector" in window)) { toast("This browser cannot read barcodes from the camera. Use a scanner or type the code.", "warn"); return; }
  try {
    const det = new BarcodeDetector();
    SCAN.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const v = el("sc-video"); v.srcObject = SCAN.stream; v.style.display = "block"; await v.play();
    let last = "", lastT = 0;
    const tick = async () => {
      if (!SCAN.stream) return;
      const found = await det.detect(v).catch(() => []);
      if (found[0] && (found[0].rawValue !== last || Date.now() - lastT > 3000) && !document.querySelector(".ov")) {
        last = found[0].rawValue; lastT = Date.now(); await scanCode(last);
      }
      setTimeout(tick, 300);
    };
    tick();
  } catch (e) { toast("Camera unavailable: " + e.message, "warn"); }
}
function stopCamera() {
  if (SCAN.stream) SCAN.stream.getTracks().forEach((t) => t.stop());
  SCAN.stream = null; const v = el("sc-video"); if (v) v.style.display = "none";
}

/* ---- audit page ---- */
PAGE_RENDERERS.audit = () => {
  if (!API.on) return `<div class="card"><div class="cb"><p>The audit log lives on the server. Sign in to see it.</p></div></div>`;
  api("GET", "/api/audit?limit=200").then((rows) => {
    const b = el("audit-body"); if (!b) return;
    b.innerHTML = rows.map((r) => `<tr><td>${esc(r.created_at)} UTC</td><td>${esc(r.user_name || "-")}</td><td>${esc(r.action)}</td><td>${esc(r.entity)} ${esc(r.entity_id)}</td><td>${esc(r.details)}</td></tr>`).join("") || `<tr><td colspan="5">Nothing yet.</td></tr>`;
  }).catch((e) => { const b = el("audit-body"); if (b) b.innerHTML = `<tr><td colspan="5">${esc(e.message)}</td></tr>`; });
  return `<div class="card"><div class="cb" style="overflow-x:auto"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>What</th><th>Details</th></tr></thead><tbody id="audit-body"><tr><td colspan="5">Loading…</td></tr></tbody></table></div></div>`;
};

/* ---- boot: server present and signed in -> real session; 401 -> login; no server -> demo ---- */
(async () => {
  try {
    const r = await fetch("/api/me", { credentials: "same-origin" });
    const isJson = (r.headers.get("content-type") || "").includes("json");
    if (!isJson) return;
    if (r.status === 401) return showLogin();
    await startSession();
  } catch { /* demo mode */ }
})();
