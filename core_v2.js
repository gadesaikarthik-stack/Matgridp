/* ============================================================
   Matgrid – materials management
   CORE ENGINE (Part 3)
   ============================================================ */

/* ------------------------------------------------------------
   GLOBAL STATE
   ------------------------------------------------------------ */
let CURRENT_PAGE = "dashboard";
let CURRENT_ROLE = "admin";
const CURRENT_USER = "Alex Kumar";
const ROLE_NAMES = {
  admin: "System Administrator", manager: "Procurement Manager", buyer: "Buyer",
  warehouse: "Warehouse Operator", ap: "Accounts Payable", viewer: "Viewer",
};

/* Permission gate used by every action button. */
function can(action) { return (PERMS[action] || []).includes(CURRENT_ROLE); }
function guard(action) {
  if (can(action)) return true;
  toast(`Your role (${ROLE_NAMES[CURRENT_ROLE]}) cannot do this.`, "warn");
  return false;
}
function actor() { return ROLE_NAMES[CURRENT_ROLE] + " (" + CURRENT_USER + ")"; }

/* In-page text prompt (browser prompt() dialogs are unreliable). */
function askText(title, label, cb) {
  window.__askCb = cb;
  showModal(title, `<div class="fg"><label class="fl" for="ask-text">${esc(label)}</label><textarea class="ft" id="ask-text" rows="3"></textarea></div>`, [
    { label: "Cancel", class: "btn-secondary", onclick: "closeModal()" },
    { label: "Confirm", class: "primary", onclick: "submitAsk()" },
  ]);
  setTimeout(() => { const t = el("ask-text"); if (t) t.focus(); }, 0);
}
function submitAsk() {
  const v = (el("ask-text").value || "").trim();
  if (!v) { toast("A reason is required.", "warn"); return; }
  const cb = window.__askCb;
  closeModal();
  if (cb) cb(v);
}

/* Next document number: highest existing number for this year + 1. */
function nextDocId(prefix, list, width, floor) {
  const year = new Date().getFullYear();
  const re = new RegExp("^" + prefix + "-" + year + "-0*(\\d+)$");
  const max = list.reduce((m, d) => {
    const x = re.exec(d.id);
    return x ? Math.max(m, parseInt(x[1], 10)) : m;
  }, floor || 0);
  return prefix + "-" + year + "-" + String(max + 1).padStart(width, "0");
}

/* Journal entry helper: every stock/AP movement leaves an audit line. */
function postJournal(type, ref, dr, cr, amount) {
  DB.journal.unshift({
    id: nextDocId("JR", DB.journal, 3, 200), type, ref, dr, cr,
    amount: Math.round(amount * 100) / 100, date: new Date().toISOString().slice(0, 10),
  });
}

/* ------------------------------------------------------------
   SAFE DOM HELPERS
   ------------------------------------------------------------ */
function el(id) {
  return document.getElementById(id);
}

function qs(sel) {
  return document.querySelector(sel);
}

function qsa(sel) {
  return document.querySelectorAll(sel);
}

/* ------------------------------------------------------------
   NAVIGATION ENGINE
   ------------------------------------------------------------ */
function nav(page) {
  if (!moduleOn(page)) { toast("This module is switched off for your company.", "warn"); return; }
  CURRENT_PAGE = page;

  // Update sidebar active state
  qsa("#sidebar .ni").forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("onclick") === `nav('${page}')`) {
  btn.classList.add("active");
}
  });

  // Load page
  loadPage(page);
}

/* ------------------------------------------------------------
   PAGE LOADER
   ------------------------------------------------------------ */
function loadPage(page) {
  if (typeof recomputeInvoices === "function") recomputeInvoices();
  const header = el("page-header");
  const body = el("page-body");

  if (page === "pr") {
    header.innerHTML = `
    <div class="pgh pgh-prhead">
      <div class="pgh-prhead-sp"></div>
      <div class="pgh-actions" id="ph-actions"></div>
    </div>`;
  } else {
    header.innerHTML = `
    <div class="pgh">
      <div>
        <div class="pgh-title">${pageTitle(page)}</div>
        <div class="pgh-sub">${pageSubtitle(page)}</div>
      </div>
      <div class="pgh-actions" id="ph-actions"></div>
    </div>
  `;
  }

  // Render page content
  if (PAGE_RENDERERS[page]) {
    body.innerHTML = PAGE_RENDERERS[page]();
  } else {
    body.innerHTML = `<div style="padding:20px">Page not implemented.</div>`;
  }

  const phAct = el("ph-actions");
  if (phAct) {
    phAct.innerHTML =
      page === "pr"
        ? `<button type="button" class="btn primary" onclick="newPRModal()">+ New Requisition</button>`
        : "";
  }

  refreshChrome();
  enhanceA11y();
}

/* ------------------------------------------------------------
   PAGE TITLES
   ------------------------------------------------------------ */
function pageTitle(page) {
  const map = {
    dashboard: "Matgrid dashboard",
    pr: "Purchase Requisitions",
    rfq: "RFQ & Bidding",
    po: "Purchase Orders",
    contracts: "Contracts",
    sa: "Scheduling Agreements",
    inventory: "Stock Overview",
    gr: "Goods Receipt",
    gi: "Goods Issue",
    sto: "Stock Transfer Orders",
    qm: "Quality Management",
    invoice: "Invoice Verification",
    payment: "Payments",
    journal: "Accounting Journal",
    vendor: "Vendor Master",
    material: "Material Master",
    pir: "Purchasing Info Records",
    source: "Source List",
    quota: "Quota Arrangement",
    mrp: "MRP Live Engine",
    analytics: "Analytics & Insights",
    ai: "Ask Matgrid",
    subcontracting: "Subcontracting",
    services: "Service procurement",
    settings: "Company settings"
  };

  return map[page] || "Matgrid";
}

function pageSubtitle(page) {
  const map = {
    dashboard: "Matgrid — procurement, inventory, and financial touchpoints at a glance",
    pr: "Manage internal purchase requests",
    rfq: "Compare vendor bids & award suppliers",
    po: "Track purchase orders & deliveries",
    contracts: "Long-term agreements with suppliers",
    sa: "Delivery schedules & call-offs",
    inventory: "Real-time stock visibility",
    gr: "Inbound material receipts",
    gi: "Outbound material issues",
    sto: "Inter-plant stock transfers",
    qm: "Inspection lots & quality checks",
    invoice: "3-way match & invoice control",
    payment: "Vendor payments & settlement",
    journal: "Auto-posted accounting entries",
    vendor: "Supplier master data",
    material: "Material master with multi-view",
    pir: "Vendor-material pricing agreements",
    source: "Approved vendor sources",
    quota: "Vendor split allocation",
    mrp: "Automated planning & shortages",
    analytics: "Spend, performance & KPIs",
    ai: "Quick answers from your procurement data (rule-based)",
    subcontracting: "Outsourced manufacturing & components",
    services: "Non-stock and maintenance services",
    settings: "Switch modules on or off and set approval and matching rules"
  };

  return map[page] || "";
}

/* PAGE_RENDERERS: initialized in db_v2.js (before module registration) */

/* ------------------------------------------------------------
   MODAL ENGINE
   ------------------------------------------------------------ */
function showModal(title, content, actions = []) {
  const root = el("modal-root");

  root.innerHTML = `
    <div class="ov" onclick="if(event.target===this)closeModal()">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="mh">
          <div><div class="mt">${esc(title)}</div></div>
          <button class="mx" onclick="closeModal()" aria-label="Close">×</button>
        </div>

        <div class="mb">${content}</div>

        <div class="mf">
          ${actions
            .map(a => `<button class="btn ${a.class}" onclick="${a.onclick}">${a.label}</button>`)
            .join("")}
        </div>
      </div>
    </div>
  `;
}

function closeModal() {
  el("modal-root").innerHTML = "";
}

/* ------------------------------------------------------------
   COUNTS (shared with refreshChrome, notifications, dashboard)
   ------------------------------------------------------------ */
function countPendingPRs() {
  return DB.prs.filter((p) => p.status === "Pending Approval").length;
}

function countOpenPOs() {
  return DB.pos.filter((p) => p.status === "Open").length;
}

function countLowStock() {
  return DB.materials.filter((m) => m.stock < m.rop).length;
}

function countInvoiceExceptions() {
  if (!DB.invoices || !DB.invoices.length) return 0;
  return DB.invoices.filter((i) => i.match !== "Matched").length;
}

function countOpenRFQs() {
  return (DB.rfqs || []).filter((r) => r.status === "Open").length;
}

/** Month-to-date sum of PO values (matches top bar "MTD SPEND") */
function mtdPOSpend() {
  const d = new Date();
  const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return DB.pos
    .filter((p) => p.date && p.date.startsWith(prefix))
    .reduce((s, p) => s + p.value, 0);
}

function getActionableNotifCount() {
  return countPendingPRs() + countLowStock() + countInvoiceExceptions();
}

function setTextIfPresent(id, val) {
  const node = el(id);
  if (node) node.textContent = val;
}

/* ------------------------------------------------------------
   TOAST ENGINE
   ------------------------------------------------------------ */
function showNotifs() {
  const lowList = DB.materials
    .filter((m) => m.stock < m.rop)
    .slice(0, 4);
  const pending = DB.prs.filter((p) => p.status === "Pending Approval");
  const prLine =
    pending.length > 0
      ? (() => {
          const u = (s) => String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const pr = pending.reduce((a, b) => {
            const order = { Critical: 0, High: 1, Normal: 2, Low: 3 };
            return (order[a.urg] ?? 9) <= (order[b.urg] ?? 9) ? a : b;
          });
          return `${pending.length} requisition(s) pending — next: <strong>${u(pr.id)}</strong> (${u(pr.urg)})`;
        })()
      : "No pending requisitions.";

  const exInv = (DB.invoices || []).filter((i) => i.match !== "Matched");
  const invLine =
    exInv.length > 0
      ? `${exInv.length} invoice line(s) not fully matched.`
      : "No invoice match exceptions.";

  const lowLine =
    lowList.length > 0
      ? `${countLowStock()} SKU(s) below reorder point.`
      : "No low-stock materials.";

  const rows = [
    {
      ph: "ph-warning-circle",
      cl: "notif-row notif-row-warn",
      html: lowLine,
      go: "inventory",
      goLabel: "Stock",
    },
    {
      ph: "ph-clipboard-text",
      cl: "notif-row notif-row-amber",
      html: prLine,
      go: "pr",
      goLabel: "PRs",
    },
    {
      ph: "ph-receipt",
      cl: "notif-row notif-row-red",
      html: invLine,
      go: "invoice",
      goLabel: "Invoices",
    },
    {
      ph: "ph-brain",
      cl: "notif-row notif-row-info",
      html: "Review MRP recommendations for planned shortages.",
      go: "mrp",
      goLabel: "MRP",
    },
  ];

  const body = `
    <p class="t-muted" style="margin:0 0 12px">Summary from your current demo data. Click a shortcut to go there.</p>
    ${rows
      .map(
        (r) => `
      <div class="${r.cl}">
        <i class="ph ${r.ph}" aria-hidden="true"></i>
        <div class="notif-row-body">${r.html}</div>
        <button type="button" class="btn ghost" style="flex-shrink:0" onclick="closeModal();nav('${r.go}')">${r.goLabel}</button>
      </div>
    `
      )
      .join("")}
    ${
      lowList.length
        ? `<h4 style="margin:14px 0 6px">Low stock (sample)</h4>
        <ul style="margin:0;padding-left:18px;font-size:12px;color:var(--t2)">
          ${lowList
            .map(
              (m) =>
                `<li>${m.id} — ${m.desc} · ${m.stock} ${m.unit} (ROP ${m.rop})</li>`
            )
            .join("")}
        </ul>`
        : ""
    }
  `;

  showModal("Notifications", body, [
    { label: "Close", class: "btn-secondary", onclick: "closeModal()" },
  ]);
}

function toast(msg, type = "info") {
  const area = el("toast-area");
  const id = "t" + Date.now();

  const classes = {
    success: "ts",
    error: "te",
    warn: "tw2",
    info: "ti2"
  };

  const div = document.createElement("div");
  div.className = `toast ${classes[type]}`;
  div.id = id;
  div.textContent = msg;

  area.appendChild(div);

  setTimeout(() => {
    div.style.opacity = 0;
    setTimeout(() => div.remove(), 300);
  }, 3000);
}

/* ------------------------------------------------------------
   ROLE SWITCHING
   ------------------------------------------------------------ */
const ROLE_PH_ICON = {
  admin: "ph-crown",
  manager: "ph-chart-pie",
  buyer: "ph-shopping-cart",
  warehouse: "ph-package",
  ap: "ph-credit-card",
  viewer: "ph-eye",
};

function syncRoleIcon() {
  const ico = el("role-ico");
  if (!ico) return;
  const role = el("role-sel")?.value || "admin";
  ico.className = "ph " + (ROLE_PH_ICON[role] || "ph-user");
}

function switchRole(role) {
  CURRENT_ROLE = role;

  const roleNames = ROLE_NAMES;

  el("u-role").textContent = roleNames[role] || "User";
  syncRoleIcon();

  toast(`Role switched to ${roleNames[role]}`, "info");

  loadPage(CURRENT_PAGE);
}

/* ------------------------------------------------------------
   CHROME: top KPIs, sidebar badges, notification dot
   ------------------------------------------------------------ */
function refreshChrome() {
  if (typeof recomputeInvoices === "function") recomputeInvoices();
  setTextIfPresent("tk-po", String(countOpenPOs()));
  setTextIfPresent("tk-pr", String(countPendingPRs()));
  setTextIfPresent("tk-stock", String(countLowStock()));
  setTextIfPresent("tk-inv", String(countInvoiceExceptions()));

  setTextIfPresent("tk-spend", "$" + mtdPOSpend().toLocaleString());

  setTextIfPresent("sb-pr", String(countPendingPRs()));
  setTextIfPresent("sb-po", String(countOpenPOs()));
  setTextIfPresent("sb-stock", String(countLowStock()));
  setTextIfPresent("sb-inv", String(countInvoiceExceptions()));
  setTextIfPresent("sb-rfq", String(countOpenRFQs()));

  const dot = el("notif-dot");
  if (dot) {
    dot.style.display = getActionableNotifCount() > 0 ? "block" : "none";
  }
}

/* legacy name */
function updateKPIs() {
  refreshChrome();
}

/* ------------------------------------------------------------
   PR / PO / INVOICE actions (global for onclick in modules HTML)
   ------------------------------------------------------------ */
function approvePR(id) {
  if (!guard("approvePR")) return;
  const pr = DB.prs.find((p) => p.id === id);
  if (!pr || pr.status !== "Pending Approval") {
    toast("PR cannot be approved in its current state.", "warn");
    return;
  }
  if (pr.req === CURRENT_USER) {
    toast("You cannot approve your own requisition.", "warn");
    return;
  }
  const level = checkReleaseStrategy(pr);
  if (level === "Manager + Director" && CURRENT_ROLE !== "admin") {
    toast("This PR needs Director approval (Admin role).", "warn");
    return;
  }
  pr.status = "Approved";
  if (!pr.history) pr.history = [];
  pr.history.push({ by: actor(), at: prToday(), action: "Approved (" + level + ")" });
  toast(`PR ${id} approved.`, "success");
  loadPage("pr");
  refreshChrome();
}

function rejectPR(id) {
  if (!guard("approvePR")) return;
  const pr = DB.prs.find((p) => p.id === id);
  if (!pr || pr.status !== "Pending Approval") {
    toast("PR cannot be rejected in its current state.", "warn");
    return;
  }
  askText("Reject " + id, "Reason for rejecting", (reason) => {
    pr.status = "Rejected";
    if (!pr.history) pr.history = [];
    pr.history.push({ by: actor(), at: prToday(), action: "Rejected: " + reason });
    toast(`PR ${id} rejected.`, "info");
    loadPage("pr");
    refreshChrome();
  });
}

function closePO(id) {
  if (!guard("closePO")) return;
  const po = DB.pos.find((p) => p.id === id);
  if (!po) return;
  if (po.status !== "Open") {
    toast("Only open POs can be closed.", "warn");
    return;
  }
  po.status = "Closed";
  toast(`PO ${id} closed.`, "info");
  loadPage("po");
  refreshChrome();
}

function prToday() {
  return new Date().toISOString().slice(0, 10);
}

function prFmt(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function newPRModal() {
  if (!guard("createPR")) return;
  const matOptions = DB.materials
    .map(
      (m) =>
        `<option value="${m.id}">${m.desc} [${m.id}] — stock ${m.stock} ${m.unit}</option>`
    )
    .join("");
  const content = `
    <div class="fgrid fg2">
      <div class="fg"><label class="fl">Your name *</label><input class="fi" type="text" id="pr-req" placeholder="Full name"/></div>
      <div class="fg">
        <label class="fl">Department *</label>
        <select class="fs" id="pr-dept">
          <option>Manufacturing</option><option>Maintenance</option><option>Production</option><option>R&D</option>
          <option>Warehouse</option><option>Quality</option><option>Logistics</option><option>Engineering</option><option>Packaging</option>
        </select>
      </div>
      <div class="fg" style="grid-column:1/-1">
        <label class="fl">Material *</label>
        <select class="fs" id="pr-mat" onchange="updatePREst()">${matOptions}</select>
      </div>
      <div class="fg"><label class="fl">Quantity *</label><input class="fi" type="number" id="pr-qty" min="1" oninput="updatePREst()"/></div>
      <div class="fg"><label class="fl">Urgency</label>
        <select class="fs" id="pr-urg"><option>Normal</option><option>High</option><option>Critical</option><option>Low</option></select>
      </div>
      <div class="fg" style="grid-column:1/-1">
        <label class="fl">Business justification *</label>
        <textarea class="ft" id="pr-note" rows="3" placeholder="Business need and impact&hellip;"></textarea>
      </div>
    </div>
    <p class="t-muted" style="margin:12px 0 0">Est. value: <strong id="pr-est">—</strong></p>
  `;
  showModal("New purchase requisition", content, [
    { label: "Cancel", class: "btn-secondary", onclick: "closeModal()" },
    { label: "Submit for approval", class: "primary", onclick: "submitPR()" },
  ]);
  setTimeout(() => updatePREst(), 0);
}

function updatePREst() {
  const q = parseFloat(el("pr-qty")?.value) || 0;
  const matId = el("pr-mat")?.value;
  const mat = DB.materials.find((m) => m.id === matId);
  const est = el("pr-est");
  if (est) est.textContent = q && mat ? prFmt(q * mat.price) : "—";
}

function nextPRid() { return nextDocId("PR", DB.prs, 4, 250); }

function submitPR() {
  if (!guard("createPR")) return;
  const name = (el("pr-req")?.value || "").trim();
  const qty = Math.floor(Number(el("pr-qty")?.value)) || 0;
  const note = (el("pr-note")?.value || "").trim();
  if (!name || qty < 1 || !note) {
    toast("Please fill all required fields.", "warn");
    return;
  }
  const matId = el("pr-mat").value;
  const mat = DB.materials.find((m) => m.id === matId);
  if (!mat) return;
  DB.prs.unshift({
    id: nextPRid(),
    req: name,
    dept: el("pr-dept").value,
    date: prToday(),
    mid: mat.id,
    qty,
    urg: el("pr-urg").value,
    status: "Pending Approval",
    note,
    est: qty * mat.price,
    history: [],
  });
  closeModal();
  toast("Requisition submitted for approval.", "success");
  loadPage("pr");
  refreshChrome();
}

function viewPRModal(id) {
  const r = DB.prs.find((p) => p.id === id);
  if (!r) return;
  const mat = DB.materials.find((m) => m.id === r.mid);
  const hist =
    (r.history || [])
      .map(
        (h) =>
          `<div class="pr-hist-row"><span class="t-muted mono">${esc(h.at)}</span> <b>${esc(h.by)}</b> &rarr; ${esc(h.action)}</div>`
      )
      .join("") || "<p class=\"t-muted\">No history yet.</p>";
  const content = `
    <p class="t-muted" style="margin:0 0 10px"><strong>${esc(r.id)}</strong> &middot; ${esc(r.dept)} &middot; ${esc(r.req)}</p>
    <div class="fgrid fg2" style="margin-bottom:12px">
      <div class="fg"><span class="fl">Material</span><p style="margin:0">${esc(mat ? mat.desc : r.mid)} (${esc(r.mid)})</p></div>
      <div class="fg"><span class="fl">Quantity</span><p style="margin:0" class="mono">${r.qty} ${esc(mat ? mat.unit : "")}</p></div>
      <div class="fg" style="grid-column:1/-1"><span class="fl">Note</span><p style="margin:0">${esc(r.note)}</p></div>
    </div>
    <div class="pr-hist-label">History</div>
    ${hist}
  `;
  const actions = [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }];
  if (r.status === "Pending Approval") {
    actions.unshift({
      label: "Reject",
      class: "btn-secondary",
      onclick: "closeModal();rejectPR('" + id + "')",
    });
    actions.unshift({
      label: "Approve",
      class: "primary",
      onclick: "closeModal();approvePR('" + id + "')",
    });
  }
  showModal("Requisition " + r.id, content, actions);
}

function convertPRtoPO(rid) {
  if (!guard("convertPO")) return;
  const r = DB.prs.find((p) => p.id === rid);
  if (!r || r.status !== "Approved") return;
  const mat = DB.materials.find((m) => m.id === r.mid);
  const sugV = (mat && DB.vendors.find((v) => v.id === mat.vendor)) || DB.vendors[0];
  const del = new Date(Date.now() + (sugV.lead || 7) * 864e5).toISOString().slice(0, 10);
  const vOpts = DB.vendors
    .filter((v) => v.status === "Active")
    .map(
      (v) =>
        `<option value="${v.id}"${v.id === sugV.id ? " selected" : ""}>${v.name} (${v.id})</option>`
    )
    .join("");
  const content = `
    <p class="t-muted" style="margin:0 0 12px">Converting <strong>${r.id}</strong> &rarr; purchase order. Adjust vendor, dates, and price as needed.</p>
    <div class="fgrid fg2">
      <div class="fg" style="grid-column:1/-1">
        <label class="fl">Vendor *</label>
        <select class="fs" id="cpo-v">${vOpts}</select>
      </div>
      <div class="fg"><label class="fl">Delivery date *</label><input class="fi" type="date" id="cpo-del" value="${del}"/></div>
      <div class="fg"><label class="fl">Unit price</label><input class="fi" type="number" id="cpo-price" step="0.01" value="${mat ? mat.price : 0}"/></div>
      <div class="fg"><label class="fl">Quantity</label><input class="fi" type="number" id="cpo-qty" value="${r.qty}"/></div>
      <div class="fg">
        <label class="fl">Plant</label>
        <select class="fs" id="cpo-plant"><option>PL01</option><option>PL02</option></select>
      </div>
      <div class="fg">
        <label class="fl">Payment terms</label>
        <select class="fs" id="cpo-terms"><option>Net30</option><option>Net45</option><option>Net60</option><option>Net15</option></select>
      </div>
    </div>
  `;
  showModal("Convert to purchase order", content, [
    { label: "Cancel", class: "btn-secondary", onclick: "closeModal()" },
    { label: "Create purchase order", class: "primary", onclick: "doConvertToPO('" + rid + "')" },
  ]);
}

function doConvertToPO(prId) {
  if (!guard("convertPO")) return;
  const r = DB.prs.find((p) => p.id === prId);
  if (!r || r.status !== "Approved") return;
  const vId = el("cpo-v")?.value;
  const qty = parseFloat(el("cpo-qty")?.value) || r.qty;
  const price = parseFloat(el("cpo-price")?.value) || 0;
  if (!(qty > 0) || !(price > 0)) { toast("Quantity and price must be above zero.", "warn"); return; }
  const newId = nextDocId("PO", DB.pos, 4, 1000);
  const newPO = {
    id: newId,
    vid: vId,
    date: prToday(),
    del: el("cpo-del")?.value || prToday(),
    value: Math.round(qty * price * 100) / 100,
    items: [{ mid: r.mid, qty, price }],
    status: "Open",
    cur: "USD",
    plant: el("cpo-plant")?.value || "PL01",
    terms: el("cpo-terms")?.value || "Net30",
  };
  DB.pos.unshift(newPO);
  r.status = "Converted to PO";
  if (!r.history) r.history = [];
  r.history.push({
    by: actor(),
    at: prToday(),
    action: "→ " + newId,
  });
  closeModal();
  toast(`Created ${newId} from ${prId}.`, "success");
  loadPage("pr");
  refreshChrome();
}



/* ------------------------------------------------------------
   KEYBOARD ACCESS + CONFIG APPLY
   ------------------------------------------------------------ */
function enhanceA11y() {
  qsa(".row-id, .pr-id-cell, .tkpi, .dash-alert").forEach((n) => {
    if (!n.hasAttribute("tabindex")) n.setAttribute("tabindex", "0");
    if (!n.hasAttribute("role")) n.setAttribute("role", "button");
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && el("modal-root") && el("modal-root").innerHTML) closeModal();
  const t = e.target;
  if ((e.key === "Enter" || e.key === " ") && t && t.matches &&
      t.matches(".row-id, .pr-id-cell, .tkpi, .dash-alert")) {
    e.preventDefault();
    t.click();
  }
});

function applyConfig() {
  setTextIfPresent("co-name", CONFIG.company);
  document.title = "Matgrid – " + CONFIG.company;
  qsa("#sidebar .ni").forEach((btn) => {
    const m = /nav\('([a-z]+)'\)/.exec(btn.getAttribute("onclick") || "");
    if (m) btn.style.display = moduleOn(m[1]) ? "" : "none";
  });
  qsa("#sidebar .ng").forEach((g) => {
    let n = g.nextElementSibling, any = false;
    while (n && !n.classList.contains("ng")) {
      if (n.style.display !== "none") any = true;
      n = n.nextElementSibling;
    }
    g.style.display = any ? "" : "none";
  });
}
