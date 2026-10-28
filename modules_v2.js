/* ============================================================
   Matgrid – UI modules
   MODULES (Part 4)
   ============================================================ */

/* esc() makes text safe to put in HTML. matLabel/venLabel return escaped text. */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function matLabel(mid) {
  const m = DB.materials.find((x) => x.id === mid);
  return esc(m ? m.desc : mid);
}

function venLabel(vid) {
  const v = DB.vendors.find((x) => x.id === vid);
  return esc(v ? v.name : vid);
}

function statusPill(st) {
  const k = String(st || "").toLowerCase();
  if (k.includes("open")) return `<span class="pill pill-open">${esc(st)}</span>`;
  if (k.includes("pending")) return `<span class="pill pill-pending">${esc(st)}</span>`;
  if (k.includes("approve") || k.includes("matched") || k.includes("received") || k.includes("posted"))
    return `<span class="pill pill-approved">${esc(st)}</span>`;
  if (k.includes("close")) return `<span class="pill pill-closed">${esc(st)}</span>`;
  if (k.includes("block") || k.includes("hold") || k.includes("variance") || k.includes("reject"))
    return `<span class="pill pill-blocked">${esc(st)}</span>`;
  return `<span class="pill pill-closed">${esc(st)}</span>`;
}

/* ------------------------------------------------------------
   REGISTER PAGE RENDERERS
   ------------------------------------------------------------ */
PAGE_RENDERERS.dashboard = renderDashboard;
PAGE_RENDERERS.pr = renderPR;
PAGE_RENDERERS.rfq = renderRFQ;
PAGE_RENDERERS.po = renderPO;
PAGE_RENDERERS.contracts = renderContracts;
PAGE_RENDERERS.sa = renderSA;
PAGE_RENDERERS.inventory = renderInventory;
PAGE_RENDERERS.gr = renderGR;
PAGE_RENDERERS.gi = renderGI;
PAGE_RENDERERS.sto = renderSTO;
PAGE_RENDERERS.invoice = renderInvoice;
PAGE_RENDERERS.payment = renderPayment;
PAGE_RENDERERS.journal = renderJournal;
PAGE_RENDERERS.vendor = renderVendorMaster;
PAGE_RENDERERS.material = renderMaterialMaster;
PAGE_RENDERERS.pir = renderPIR;
PAGE_RENDERERS.source = renderSourceList;
PAGE_RENDERERS.quota = renderQuota;
PAGE_RENDERERS.mrp = renderMRP;
PAGE_RENDERERS.analytics = renderAnalytics;
PAGE_RENDERERS.settings = renderSettings;

/* ============================================================
   DASHBOARD
   ============================================================ */
function dashboardHbars(entries, className) {
  const max = Math.max(...entries.map((e) => e[1]), 1);
  return entries
    .map(
      ([name, val]) => `
    <div class="hbar-row">
      <span class="hbar-name" title="${name}">${name}</span>
      <div class="hbar-track"><div class="hbar-fill ${className}" style="width:${(val / max) * 100}%"></div></div>
      <span class="hbar-num">$${Math.round(val).toLocaleString()}</span>
    </div>
  `
    )
    .join("");
}

function renderDashboard() {
  const openPOs = DB.pos.filter((p) => p.status === "Open");
  const openPOVal = openPOs.reduce((s, p) => s + p.value, 0);
  const pendingPRs = DB.prs.filter((p) => p.status === "Pending Approval");
  const lowStock = DB.materials.filter((m) => m.stock < m.rop);
  const openRfqs = DB.rfqs.filter((r) => r.status === "Open");
  const invList = DB.invoices || [];
  const invExcep = invList.filter((i) => i.match !== "Matched").length;
  let mrpShort = 0;
  try {
    mrpShort = typeof runMRP === "function" ? runMRP().filter((p) => p.shortage).length : 0;
  } catch (e) {
    mrpShort = 0;
  }
  const matchTally = {};
  invList.forEach((i) => {
    const k = i.match || "Other";
    matchTally[k] = (matchTally[k] || 0) + 1;
  });
  const invTotal = invList.length || 1;
  const invEmpty = !invList.length;
  const matchSegClass = (k) => {
    if (k === "Matched") return "matched";
    if (k === "Pending GR") return "pending";
    if (k === "Blocked") return "blocked";
    if (k === "On Hold") return "hold";
    if (k === "Variance") return "variance";
    return "other";
  };
  const invStack = invEmpty
    ? ""
    : Object.keys(matchTally)
        .map((k) => {
          const pct = (matchTally[k] / invTotal) * 100;
          return `<div class="inv-seg ${matchSegClass(k)}" style="width:${pct}%" title="${k}: ${matchTally[k]}"></div>`;
        })
        .join("");

  const vSpend = {};
  DB.pos.forEach((p) => {
    vSpend[p.vid] = (vSpend[p.vid] || 0) + p.value;
  });
  const vendorBars = dashboardHbars(
    Object.entries(vSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([vid, v]) => [venLabel(vid), v]),
    ""
  );

  const catSpend = {};
  DB.pos.forEach((p) => {
    p.items.forEach((i) => {
      const mat = DB.materials.find((x) => x.id === i.mid);
      const cat = mat ? mat.cat : "Other";
      catSpend[cat] = (catSpend[cat] || 0) + i.qty * i.price;
    });
  });
  const catBars = dashboardHbars(
    Object.entries(catSpend)
      .sort((a, b) => b[1] - a[1])
      .map(([c, v]) => [c, v]),
    "hbar-fill-p"
  );

  const recentPOs = [...DB.pos].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const lowWorst = [...lowStock]
    .map((m) => ({ m, ratio: m.rop > 0 ? m.stock / m.rop : 0 }))
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 5);

  const activity = [
    ...DB.pos.map((p) => ({ d: p.date, t: "PO", r: p.id, s: p.status, sub: venLabel(p.vid) })),
    ...DB.prs.map((x) => ({ d: x.date, t: "PR", r: x.id, s: x.status, sub: x.urg })),
    ...DB.grs.map((g) => ({ d: g.date, t: "GR", r: g.id, s: g.status, sub: g.pid })),
    ...invList.map((i) => ({ d: i.date, t: "INV", r: i.id, s: i.match, sub: venLabel(i.vid) })),
  ]
    .sort((a, b) => b.d.localeCompare(a.d))
    .slice(0, 9);

  const grVals = DB.grs.map((g) => g.lines.reduce((s, l) => s + l.qty, 0));
  const gMax = Math.max(...grVals, 1);
  const sparkBars = (grVals.length
    ? grVals
    : [1, 1]
  )
    .slice(0, 8)
    .concat([2, 3, 1, 2])
    .slice(0, 8);
  const spMax = Math.max(...sparkBars, 1);
  const sparkHtml = sparkBars
    .map((h) => `<i style="height:${Math.max(8, (h / spMax) * 100)}%"></i>`)
    .join("");

  const alertBlocks = [
    pendingPRs.length
      ? `<div class="dash-alert da-warn" onclick="nav('pr')" role="button" tabindex="0">
          <i class="ph ph-clipboard-text" aria-hidden="true"></i>
          <div class="da-body"><strong>${pendingPRs.length} purchase requisition(s)</strong> awaiting approval. Open Requisitions to review.</div>
        </div>`
      : "",
    lowStock.length
      ? `<div class="dash-alert da-err" onclick="nav('inventory')" role="button" tabindex="0">
          <i class="ph ph-cube" aria-hidden="true"></i>
          <div class="da-body"><strong>${lowStock.length} material(s)</strong> are below reorder point. Check stock and MRP.</div>
        </div>`
      : "",
    invExcep
      ? `<div class="dash-alert da-info" onclick="nav('invoice')" role="button" tabindex="0">
          <i class="ph ph-receipt" aria-hidden="true"></i>
          <div class="da-body"><strong>${invExcep} invoice line(s)</strong> are not in Matched state. Open Invoice Verify.</div>
        </div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return `
    ${alertBlocks ? `<div class="dash-alerts">${alertBlocks}</div>` : ""}
    <div class="kgrid">
      ${kpi("Open POs", openPOs.length, "kb")}
      ${kpi("Open PO value", "$" + openPOVal.toLocaleString(), "kc")}
      ${kpi("Pending PRs", pendingPRs.length, "ka")}
      ${kpi("Open RFQs", openRfqs.length, "kg")}
      ${kpi("Low stock SKUs", lowStock.length, "kr")}
      ${kpi("MRP short", mrpShort, "kg")}
      ${kpi("Invoices (queue)", invList.length, "kp")}
      ${kpi("AP exceptions", invExcep, invExcep ? "ka" : "kc")}
    </div>

    <div class="dash-cols-3">
      <div class="card" style="margin:0">
        <div class="ch"><div class="ct">PO value by vendor</div></div>
        <div class="cb"><div class="hbar-list">${vendorBars}</div></div>
      </div>
      <div class="card" style="margin:0">
        <div class="ch"><div class="ct">Spend by material category (PO lines)</div></div>
        <div class="cb"><div class="hbar-list">${catBars}</div></div>
      </div>
      <div class="card" style="margin:0">
        <div class="ch"><div class="ct">Invoice 3-way match</div></div>
        <div class="cb">
          <p class="t-muted" style="margin:0 0 6px">Proportion of invoice lines by match status (demo data)</p>
          ${invEmpty ? "<p>—</p>" : `<div class="inv-stack">${invStack}</div>`}
          <div class="inv-legend">
            ${invEmpty
              ? "<span>No invoices in sample</span>"
              : Object.keys(matchTally)
                  .map(
                    (k) => `
              <span><span class="inv-seg ${matchSegClass(k)}" style="display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:middle;margin-right:4px"></span>
              <b>${matchTally[k]}</b> ${k}</span>`
                  )
                  .join("")}
          </div>
        </div>
      </div>
    </div>

    <div class="dash-cols">
      <div class="card" style="margin:0">
        <div class="ch"><div class="ct">Recent purchase orders</div></div>
        <div class="cb" style="padding:0">
          <table class="table-compact">
            <tr><th>PO</th><th>Vendor</th><th>Date</th><th>Value</th><th>Status</th></tr>
            ${recentPOs
              .map(
                (p) => `
              <tr>
                <td><button type="button" class="link-dash" onclick="nav('po')">${p.id}</button></td>
                <td>${venLabel(p.vid)}</td>
                <td>${p.date}</td>
                <td>$${p.value.toLocaleString()}</td>
                <td><span class="badge ${p.status === "Open" ? "badge-warn" : "badge-ok"}">${p.status}</span></td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
      </div>
      <div class="card" style="margin:0">
        <div class="ch"><div class="ct">Lowest stock cover (vs ROP)</div></div>
        <div class="cb" style="padding:0">
          <table class="table-compact">
            <tr><th>SKU</th><th>Description</th><th>On hand</th><th>ROP</th><th>Cover</th></tr>
            ${lowWorst
              .map(
                ({ m }) => `
              <tr>
                <td>${m.id}</td>
                <td>${m.desc.length > 36 ? m.desc.slice(0, 34) + "…" : m.desc}</td>
                <td>${m.stock}</td>
                <td>${m.rop}</td>
                <td><span class="badge ${m.stock < m.rop * 0.5 ? "badge-err" : "badge-warn"}">${(m.rop > 0 ? (m.stock / m.rop) * 100 : 0).toFixed(0)}%</span></td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
      </div>
    </div>

    <div class="dash-cols" style="margin-top:16px">
      <div class="card" style="margin:0">
        <div class="ch"><div class="ct">GR receipt volume (relative)</div></div>
        <div class="cb">
          <p class="t-muted" style="margin:0 0 8px">By posted goods receipt (qty on lines)</p>
          <div class="dash-spark">${sparkHtml}</div>
        </div>
      </div>
      <div class="card" style="margin:0">
        <div class="ch"><div class="ct">Live activity</div></div>
        <div class="cb" style="padding:0">
          <table class="table-compact">
            <tr><th>Date</th><th>Type</th><th>Ref</th><th>Status / detail</th></tr>
            ${activity
              .map(
                (a) => `
              <tr>
                <td style="font-family:IBM Plex Mono,monospace;font-size:11px">${a.d}</td>
                <td>${a.t}</td>
                <td>${a.r}</td>
                <td>${a.s} <span class="t-muted">· ${a.sub}</span></td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
      </div>
    </div>
  `;
}

function kpi(label, value, cls) {
  return `
    <div class="kpi ${cls}">
      <div class="kv">${value}</div>
      <div class="kl">${label}</div>
    </div>
  `;
}

/* ============================================================
   PURCHASE REQUISITIONS
   ============================================================ */
function prUrgencyPill(urg) {
  const c =
    { Critical: "pu-crit", High: "pu-high", Normal: "pu-norm", Low: "pu-low" }[urg] || "pu-norm";
  return `<span class="pr-pill ${c}">${esc(urg)}</span>`;
}

function prStatusPill(st) {
  const c = {
    "Pending Approval": "ps-pend",
    Approved: "ps-ok",
    "Converted to PO": "ps-po",
    Rejected: "ps-rej",
  }[st] || "ps-def";
  return `<span class="pr-pill ${c}">${esc(st)}</span>`;
}

function prDeptPill(dept) {
  return `<span class="dept-pill">${esc(dept)}</span>`;
}

function buildPRTableRows(list) {
  return list
    .map(
      (r) => {
        const mat = DB.materials.find((m) => m.id === r.mid);
        const unit = mat ? mat.unit : "";
        return `
    <tr>
      <td class="mono pr-id-cell" title="View details" onclick="viewPRModal('${r.id}')">${r.id}</td>
      <td>${esc(r.req)}</td>
      <td>${prDeptPill(r.dept)}</td>
      <td class="pr-mat-cell" title="${matLabel(r.mid)}">${matLabel(r.mid)}</td>
      <td class="mono">${Number(r.qty).toLocaleString()} ${unit}</td>
      <td class="mono">$${r.est.toLocaleString()}</td>
      <td>${prUrgencyPill(r.urg)}</td>
      <td class="mono" style="font-size:12px">${r.date}</td>
      <td>${prStatusPill(r.status)}</td>
      <td>
        <div class="pr-actions">
          ${
            r.status === "Pending Approval"
              ? `<button type="button" class="btn success btn-xs" title="Approve" onclick="approvePR('${r.id}')">&#10003;</button>
                 <button type="button" class="btn danger btn-xs" title="Reject" onclick="rejectPR('${r.id}')">&#10007;</button>`
              : ""
          }
          ${
            r.status === "Approved"
              ? `<button type="button" class="btn primary btn-xs" onclick="convertPRtoPO('${r.id}')">&rarr; PO</button>`
              : ""
          }
          <button type="button" class="btn ghost btn-xs" title="View" onclick="viewPRModal('${r.id}')">
            <i class="ph ph-eye" style="font-size:14px" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>`;
      }
    )
    .join("");
}

function prTotalEst() {
  return DB.prs.reduce((a, p) => a + p.est, 0);
}

function prPendingCount() {
  return DB.prs.filter((p) => p.status === "Pending Approval").length;
}

function filterPRs(q) {
  const t = (q || "").toLowerCase().trim();
  const list = t
    ? DB.prs.filter(
        (x) =>
          x.id.toLowerCase().includes(t) ||
          String(x.req).toLowerCase().includes(t) ||
          matLabel(x.mid).toLowerCase().includes(t) ||
          (x.dept && x.dept.toLowerCase().includes(t))
      )
    : DB.prs;
  const el = document.getElementById("pr-tbody");
  if (el) el.innerHTML = buildPRTableRows(list);
}

function filterPRsByStatus(s) {
  const list = s ? DB.prs.filter((x) => x.status === s) : DB.prs;
  const el = document.getElementById("pr-tbody");
  if (el) el.innerHTML = buildPRTableRows(list);
}

function renderPR() {
  return `
    <div class="bc-nav"><a class="bc-a" href="#" onclick="event.preventDefault();nav('dashboard')">Dashboard</a><span class="bc-sep">&#8250;</span><span>Requisitions</span></div>
    <div class="card pr-card">
      <div class="ch pr-card-head">
        <div>
          <div class="ct pr-page-title">
            <i class="ph ph-clipboard-text" aria-hidden="true"></i>
            <span>Purchase Requisitions</span>
          </div>
          <p class="t-muted pr-sub">Internal requests &middot; multi-level approval &middot; convert to PO</p>
        </div>
      </div>
      <div class="ttb">
        <div class="pr-toolbar">
          <div class="pr-search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input type="search" class="pr-search-input" placeholder="Search PRs&hellip;" oninput="filterPRs(this.value)"/>
          </div>
          <select class="pr-fsel" onchange="filterPRsByStatus(this.value)">
            <option value="">All Statuses</option>
            <option>Pending Approval</option>
            <option>Approved</option>
            <option>Converted to PO</option>
            <option>Rejected</option>
          </select>
        </div>
        <div class="pr-summary">${DB.prs.length} requisitions &middot; Est. total: <strong>$${prTotalEst().toLocaleString()}</strong></div>
      </div>
      <div class="tw pr-tw">
        <table>
          <thead>
            <tr>
              <th>PR Number</th><th>Requestor</th><th>Dept</th><th>Material</th>
              <th>Qty</th><th>Est. Value</th><th>Urgency</th><th>Date</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="pr-tbody">${buildPRTableRows(DB.prs)}</tbody>
        </table>
      </div>
      <div class="cf">
        <span>Pending approval: <strong id="pr-pend-foot">${prPendingCount()}</strong></span>
        <span>Total est. value: <strong>$${prTotalEst().toLocaleString()}</strong></span>
      </div>
    </div>
  `;
}

/* ============================================================
   RFQ + BID COMPARISON
   ============================================================ */
function rfqFilteredRows() {
  const q = (el("rfq-q")?.value || "").toLowerCase().trim();
  const st = el("rfq-st")?.value || "";
  return DB.rfqs.filter((r) => {
    const qok =
      !q ||
      r.id.toLowerCase().includes(q) ||
      matLabel(r.mid).toLowerCase().includes(q) ||
      r.mid.toLowerCase().includes(q);
    const sok = !st || r.status === st;
    return qok && sok;
  });
}

function rfqRows(list) {
  return list
    .map((r) => {
      const bids = DB.bids.filter((b) => b.rfq === r.id);
      const low = bids.length ? Math.min(...bids.map((b) => b.price)) : 0;
      return `
      <tr>
        <td class="row-id" onclick="viewRFQDetail('${r.id}')">${r.id}</td>
        <td>${r.mid} — ${matLabel(r.mid)}</td>
        <td class="mono">${Number(r.qty).toLocaleString()}</td>
        <td class="mono">${r.date}</td>
        <td>${statusPill(r.status)}</td>
        <td class="mono">${bids.length}</td>
        <td class="mono">${bids.length ? "$" + low.toLocaleString() : "—"}</td>
        <td>
          <div class="tbl-actions">
            <button type="button" class="btn btn-secondary btn-xs" onclick="viewRFQDetail('${r.id}')">View Bids</button>
            ${
              r.status === "Open"
                ? `<button type="button" class="btn primary btn-xs" onclick="awardRFQ('${r.id}')">Award</button>`
                : ""
            }
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function refreshRFQView() {
  const list = rfqFilteredRows();
  const tbody = el("rfq-tbody");
  if (tbody) tbody.innerHTML = rfqRows(list);
  setTextIfPresent("rfq-count", String(list.length));
}

function viewRFQDetail(id) {
  const rfq = DB.rfqs.find((r) => r.id === id);
  if (!rfq) return;
  const bids = DB.bids
    .filter((b) => b.rfq === id)
    .sort((a, b) => a.price - b.price)
    .map(
      (b) => `<tr>
        <td>${venLabel(b.vid)}</td>
        <td class="mono">$${b.price.toLocaleString()}</td>
        <td class="mono">${b.lead}d</td>
        <td>${esc(b.terms)}</td>
        <td class="mono">${bidScore(b)}</td>
      </tr>`
    )
    .join("");
  const html = `
    <p class="t-muted" style="margin:0 0 10px"><strong>${esc(rfq.id)}</strong> · ${esc(rfq.mid)} — ${matLabel(rfq.mid)}</p>
    <p><strong>Qty:</strong> ${Number(rfq.qty).toLocaleString()} · <strong>Status:</strong> ${statusPill(rfq.status)} · <strong>Date:</strong> ${esc(rfq.date)}</p>
    <h4 style="margin:12px 0 6px">Bid comparison</h4>
    <table class="table-compact"><tr><th>Vendor</th><th>Price</th><th>Lead</th><th>Terms</th><th>Score</th></tr>${bids}</table>
    <p class="t-muted" style="margin-top:8px">Score = 60% price, 20% lead time, 20% vendor rating. Vendors on hold are excluded.</p>`;
  const actions = [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }];
  if (rfq.status === "Open") actions.unshift({ label: "Award best bid", class: "primary", onclick: `closeModal();awardRFQ('${rfq.id}')` });
  showModal("RFQ & bid comparison", html, actions);
}

function bidScore(b) {
  /* 60% price, 20% lead time, 20% vendor score. Higher is better. */
  const rfq = DB.rfqs.find((r) => r.id === b.rfq);
  const all = DB.bids.filter((x) => x.rfq === b.rfq);
  const minP = Math.min(...all.map((x) => x.price));
  const minL = Math.min(...all.map((x) => x.lead));
  return Math.round(60 * (minP / b.price) + 20 * (minL / b.lead) + 20 * (vendorScoreNum(b.vid) / 100));
}

function awardRFQ(id) {
  if (!guard("awardRFQ")) return;
  const rfq = DB.rfqs.find((r) => r.id === id);
  if (!rfq || rfq.status !== "Open") return;
  const bids = DB.bids.filter((b) => {
    if (b.rfq !== id) return false;
    const v = DB.vendors.find((x) => x.id === b.vid);
    return v && v.status === "Active";
  });
  if (!bids.length) {
    toast("No bids from active vendors to award.", "warn");
    return;
  }
  bids.forEach((b) => { b.score = bidScore(b); });
  const best = bids.reduce((a, b) => (b.score > a.score ? b : a), bids[0]);
  rfq.status = "Awarded";
  rfq.winner = best.id;
  const poId = nextDocId("PO", DB.pos, 4, 1000);
  DB.pos.unshift({
    id: poId, vid: best.vid, date: prToday(),
    del: new Date(Date.now() + best.lead * 864e5).toISOString().slice(0, 10),
    value: Math.round(rfq.qty * best.price * 100) / 100,
    items: [{ mid: rfq.mid, qty: rfq.qty, price: best.price }],
    status: "Open", cur: CONFIG.currency, plant: "PL01", terms: best.terms,
  });
  toast(`${id} awarded to ${venLabelRaw(best.vid)} (score ${best.score}). Created ${poId}.`, "success");
  refreshRFQView();
  refreshChrome();
}

function renderRFQ() {
  const open = DB.rfqs.filter((r) => r.status === "Open").length;
  const awarded = DB.rfqs.filter((r) => r.status === "Awarded").length;
  const closed = DB.rfqs.filter((r) => r.status === "Closed").length;
  const bidCount = DB.bids.length;
  return `
    <div class="card">
      <div class="ch"><div class="ct">RFQ & Bidding</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.rfqs.length}</div><div class="stat-l">Total RFQs</div></div>
          <div class="stat-card sc-c"><div class="stat-v">${open}</div><div class="stat-l">Open RFQs</div></div>
          <div class="stat-card sc-g"><div class="stat-v">${awarded}</div><div class="stat-l">Awarded</div></div>
          <div class="stat-card sc-a"><div class="stat-v">${closed}</div><div class="stat-l">Closed</div></div>
          <div class="stat-card sc-p"><div class="stat-v">${bidCount}</div><div class="stat-l">Total Bids</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <div class="pg-search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input id="rfq-q" type="search" class="pg-search-input" placeholder="Search RFQs/materials..." oninput="refreshRFQView()"/>
          </div>
          <select id="rfq-st" class="pg-sel" onchange="refreshRFQView()">
            <option value="">All Statuses</option>
            <option>Open</option>
            <option>Awarded</option>
            <option>Closed</option>
          </select>
        </div>
        <div class="pg-summary"><span id="rfq-count">${DB.rfqs.length}</span> visible RFQs</div>
      </div>
      <div class="tw">
        <table>
          <tr><th>RFQ Number</th><th>Material</th><th>Qty</th><th>Date</th><th>Status</th><th>Bids</th><th>Best Price</th><th>Actions</th></tr>
          <tbody id="rfq-tbody">${rfqRows(DB.rfqs)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Open RFQs: <strong>${open}</strong></span><span>Total bids: <strong>${bidCount}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   PURCHASE ORDERS
   ============================================================ */
function poFilteredRows() {
  const q = (el("po-q")?.value || "").toLowerCase().trim();
  const st = el("po-st")?.value || "";
  const vv = el("po-vv")?.value || "";
  return DB.pos.filter((po) => {
    const qok =
      !q ||
      po.id.toLowerCase().includes(q) ||
      venLabel(po.vid).toLowerCase().includes(q) ||
      po.items.some((i) => matLabel(i.mid).toLowerCase().includes(q));
    const sok = !st || po.status === st;
    const vok = !vv || po.vid === vv;
    return qok && sok && vok;
  });
}

function poRowsHTML(list) {
  return list
    .map((po) => {
      const itemCount = po.items.reduce((s, i) => s + Number(i.qty || 0), 0);
      return `
      <tr>
        <td class="row-id" onclick="viewPODetail('${po.id}')">${po.id}</td>
        <td>${venLabel(po.vid)}</td>
        <td class="mono">${po.date}</td>
        <td class="mono">${po.del || "—"}</td>
        <td class="mono">$${po.value.toLocaleString()}</td>
        <td class="mono">${itemCount}</td>
        <td>${po.plant || "—"}</td>
        <td>${statusPill(po.status)}</td>
        <td>
          <div class="tbl-actions">
            ${
              po.status === "Open"
                ? `<button type="button" class="btn btn-secondary btn-xs" onclick="receivePO('${po.id}')">Receive</button>
                   <button type="button" class="btn ghost btn-xs" onclick="closePO('${po.id}')">Close PO</button>`
                : `<button type="button" class="btn ghost btn-xs" onclick="viewPODetail('${po.id}')">View</button>`
            }
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function refreshPOView() {
  const list = poFilteredRows();
  const tbody = el("po-tbody");
  if (tbody) tbody.innerHTML = poRowsHTML(list);
  const cnt = el("po-count");
  if (cnt) cnt.textContent = String(list.length);
  const val = el("po-val");
  if (val) val.textContent = "$" + list.reduce((s, p) => s + p.value, 0).toLocaleString();
}

function viewPODetail(id) {
  const po = DB.pos.find((x) => x.id === id);
  if (!po) return;
  const items = po.items
    .map(
      (i) => `<tr><td>${esc(i.mid)}</td><td>${matLabel(i.mid)}</td><td>${Number(i.qty).toLocaleString()}</td><td>$${Number(i.price).toLocaleString()}</td></tr>`
    )
    .join("");
  const html = `
    <p class="t-muted" style="margin:0 0 10px"><strong>${po.id}</strong> · ${venLabel(po.vid)}</p>
    <p><strong>Date:</strong> ${esc(po.date)} · <strong>Delivery:</strong> ${esc(po.del || "—")} · <strong>Status:</strong> ${statusPill(po.status)}</p>
    <p><strong>Plant:</strong> ${esc(po.plant || "—")} · <strong>Terms:</strong> ${esc(po.terms || "—")} · <strong>Value:</strong> $${po.value.toLocaleString()}</p>
    <h4 style="margin:12px 0 6px">Items</h4>
    <table class="table-compact">
      <tr><th>Material</th><th>Description</th><th>Qty</th><th>Price</th></tr>
      ${items}
    </table>`;
  const actions = [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }];
  if (po.status === "Open") {
    actions.unshift({ label: "Receive", class: "primary", onclick: `closeModal();receivePO('${po.id}')` });
    actions.unshift({ label: "Close PO", class: "btn-secondary", onclick: `closeModal();closePO('${po.id}')` });
  }
  showModal("Purchase Order", html, actions);
}

function receivePO(id) {
  if (!guard("warehouse")) return;
  const po = DB.pos.find((x) => x.id === id);
  if (!po || po.status !== "Open") return;
  const lines = po.items
    .map((i) => ({ mid: i.mid, qty: Math.max(0, i.qty - receivedQty(po.id, i.mid) - draftGRQty(po.id, i.mid)), qcOk: true }))
    .filter((l) => l.qty > 0);
  if (!lines.length) {
    toast("Nothing left to receive on this PO.", "info");
    return;
  }
  const grId = nextDocId("GR", DB.grs, 4, 500);
  DB.grs.unshift({
    id: grId, pid: po.id, vid: po.vid, date: prToday(), lines,
    status: "Draft", inspector: CURRENT_USER, dn: "—",
  });
  toast(`Created ${grId} for ${id}. Post it to book the stock.`, "success");
  nav("gr");
}

function draftGRQty(poId, mid) {
  return DB.grs
    .filter((g) => g.pid === poId && g.status !== "Posted")
    .reduce((s, g) => s + g.lines.filter((l) => l.mid === mid).reduce((a, l) => a + Number(l.qty || 0), 0), 0);
}

function renderPO() {
  const openCount = DB.pos.filter((p) => p.status === "Open").length;
  const receivedCount = DB.pos.filter((p) => p.status === "Received").length;
  const pendingCount = DB.pos.filter((p) => p.status === "Pending").length;
  const totalVal = DB.pos.reduce((s, p) => s + p.value, 0);
  const vendorCount = new Set(DB.pos.map((p) => p.vid)).size;
  const vOpts = [...new Set(DB.pos.map((p) => p.vid))]
    .map((vid) => `<option value="${vid}">${venLabel(vid)}</option>`)
    .join("");
  return `
    <div class="card">
      <div class="ch"><div class="ct">Purchase Orders</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.pos.length}</div><div class="stat-l">Total Orders</div></div>
          <div class="stat-card sc-c"><div class="stat-v">${openCount}</div><div class="stat-l">Open</div></div>
          <div class="stat-card sc-g"><div class="stat-v">${receivedCount}</div><div class="stat-l">Received</div></div>
          <div class="stat-card sc-a"><div class="stat-v">${pendingCount}</div><div class="stat-l">Pending</div></div>
          <div class="stat-card sc-p"><div class="stat-v">$${totalVal.toLocaleString()}</div><div class="stat-l">Total Value</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <div class="pg-search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input id="po-q" type="search" class="pg-search-input" placeholder="Search POs, vendors, materials..." oninput="refreshPOView()"/>
          </div>
          <select id="po-st" class="pg-sel" onchange="refreshPOView()">
            <option value="">All Statuses</option>
            <option>Open</option>
            <option>Received</option>
            <option>Closed</option>
            <option>Pending</option>
          </select>
          <select id="po-vv" class="pg-sel" onchange="refreshPOView()">
            <option value="">All Vendors</option>
            ${vOpts}
          </select>
        </div>
        <div class="pg-summary"><span id="po-count">${DB.pos.length}</span> orders · <strong id="po-val">$${totalVal.toLocaleString()}</strong> total · ${vendorCount} vendors</div>
      </div>
      <div class="tw">
        <table>
          <tr><th>PO Number</th><th>Vendor</th><th>Date</th><th>Delivery</th><th>Value</th><th>Items</th><th>Plant</th><th>Status</th><th>Actions</th></tr>
          <tbody id="po-tbody">${poRowsHTML(DB.pos)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Open POs: <strong>${openCount}</strong></span><span>Open value: <strong>$${DB.pos.filter((p) => p.status === "Open").reduce((a, p) => a + p.value, 0).toLocaleString()}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   CONTRACTS
   ============================================================ */
function contractState(c) {
  return new Date(c.end) < new Date() ? "Expired" : "Active";
}

function contractsRows(list) {
  return list
    .map(
      (c) => `<tr>
        <td class="row-id" onclick="viewContract('${c.id}')">${c.id}</td>
        <td>${venLabel(c.vid)}</td>
        <td>${c.mid} — ${matLabel(c.mid)}</td>
        <td class="mono">${c.start}</td>
        <td class="mono">${c.end}</td>
        <td class="mono">$${Number(c.price).toLocaleString()}</td>
        <td class="mono">${Number(c.qty).toLocaleString()}</td>
        <td>${contractState(c) === "Active" ? `<span class="pill pill-approved">Active</span>` : `<span class="pill pill-closed">Expired</span>`}</td>
        <td><button type="button" class="btn ghost btn-xs" onclick="viewContract('${c.id}')">View</button></td>
      </tr>`
    )
    .join("");
}

function refreshContractsView() {
  const q = (el("ctr-q")?.value || "").toLowerCase().trim();
  const st = el("ctr-st")?.value || "";
  const list = DB.contracts.filter((c) => {
    const qok = !q || c.id.toLowerCase().includes(q) || venLabel(c.vid).toLowerCase().includes(q) || matLabel(c.mid).toLowerCase().includes(q);
    const sok = !st || contractState(c) === st;
    return qok && sok;
  });
  const tbody = el("ctr-tbody");
  if (tbody) tbody.innerHTML = contractsRows(list);
}

function viewContract(id) {
  const c = DB.contracts.find((x) => x.id === id);
  if (!c) return;
  const html = `
    <p class="t-muted" style="margin:0 0 10px"><strong>${c.id}</strong> · ${venLabel(c.vid)}</p>
    <p><strong>Material:</strong> ${esc(c.mid)} — ${matLabel(c.mid)}</p>
    <p><strong>Validity:</strong> ${esc(c.start)} to ${esc(c.end)} · <strong>Status:</strong> ${contractState(c) === "Active" ? "Active" : "Expired"}</p>
    <p><strong>Price:</strong> $${Number(c.price).toLocaleString()} · <strong>Quantity:</strong> ${Number(c.qty).toLocaleString()}</p>`;
  showModal("Contract detail", html, [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }]);
}

function renderContracts() {
  const active = DB.contracts.filter((c) => contractState(c) === "Active").length;
  const expired = DB.contracts.length - active;
  const totalQty = DB.contracts.reduce((s, c) => s + Number(c.qty || 0), 0);
  return `
    <div class="card">
      <div class="ch"><div class="ct">Contracts</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.contracts.length}</div><div class="stat-l">Total Contracts</div></div>
          <div class="stat-card sc-g"><div class="stat-v">${active}</div><div class="stat-l">Active</div></div>
          <div class="stat-card sc-a"><div class="stat-v">${expired}</div><div class="stat-l">Expired</div></div>
          <div class="stat-card sc-p"><div class="stat-v">${totalQty.toLocaleString()}</div><div class="stat-l">Total Qty</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <div class="pg-search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input id="ctr-q" type="search" class="pg-search-input" placeholder="Search contracts..." oninput="refreshContractsView()"/>
          </div>
          <select id="ctr-st" class="pg-sel" onchange="refreshContractsView()">
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Expired</option>
          </select>
        </div>
      </div>
      <div class="tw">
        <table>
          <tr><th>Contract</th><th>Vendor</th><th>Material</th><th>Start</th><th>End</th><th>Price</th><th>Qty</th><th>Status</th><th>Actions</th></tr>
          <tbody id="ctr-tbody">${contractsRows(DB.contracts)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Active: <strong>${active}</strong></span><span>Expired: <strong>${expired}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   SCHEDULING AGREEMENTS
   ============================================================ */
function renderSA() {
  return `
    <div class="card">
      <div class="ch"><div class="ct">Scheduling Agreements</div></div>
      <div class="cb">
        <table>
          <tr><th>ID</th><th>Vendor</th><th>Material</th><th>Schedule</th></tr>
          ${DB.scheduling.map(sa => `
            <tr>
              <td>${sa.id}</td>
              <td>${venLabel(sa.vid)}</td>
              <td>${sa.mid} — ${matLabel(sa.mid)}</td>
              <td>${sa.schedule.map(s => `${s.date}: ${s.qty}`).join("<br>")}</td>
            </tr>
          `).join("")}
        </table>
      </div>
    </div>
  `;
}

/* ============================================================
   INVENTORY
   ============================================================ */
function invLevel(m) {
  return m.max > 0 ? Math.max(0, Math.min(100, (m.stock / m.max) * 100)) : 0;
}

function inventoryStatus(m) {
  if (m.stock < m.rop) return "Low Stock";
  if (m.stock === m.rop) return "At ROP";
  return "Active";
}

function inventoryRows(list) {
  return list
    .map((m) => {
      const pct = invLevel(m);
      const fillCls = pct < 25 ? "err" : pct < 45 ? "warn" : "";
      const val = m.stock * m.price;
      return `
      <tr>
        <td class="row-id" onclick="showMaterialDetails('${m.id}')">${m.id}</td>
        <td>${esc(m.desc)}</td>
        <td>${esc(m.cat)}</td>
        <td class="mono">${m.stock.toLocaleString()}</td>
        <td>${esc(m.unit)}</td>
        <td class="mono">${m.min}/${m.rop}/${m.max}</td>
        <td>
          <div class="lvl-wrap">
            <div class="lvl-track"><div class="lvl-fill ${fillCls}" style="width:${pct}%"></div></div>
            <div class="lvl-txt">${pct.toFixed(0)}%</div>
          </div>
        </td>
        <td class="mono">$${m.price.toLocaleString()}</td>
        <td class="mono">$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
        <td class="mono">${Math.max(0, Math.floor(m.stock / Math.max(1, m.consumption || 1)))}d</td>
        <td>${m.stock < m.rop ? `<span class="pill pill-low">Low Stock</span>` : `<span class="pill pill-ok">Active</span>`}</td>
        <td>
          <div class="tbl-actions">
            <button type="button" class="btn ghost btn-xs" onclick="showMaterialDetails('${m.id}')">
              <i class="ph ph-eye" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn primary btn-xs" onclick="newPRFromMaterial('${m.id}')">Create PR</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function refreshInventoryView() {
  const q = (el("inv-q")?.value || "").toLowerCase().trim();
  const st = el("inv-st")?.value || "";
  const list = DB.materials.filter((m) => {
    const qok = !q || m.id.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.cat.toLowerCase().includes(q);
    const s = inventoryStatus(m);
    const sok = !st || st === s;
    return qok && sok;
  });
  const tbody = el("inv-tbody");
  if (tbody) tbody.innerHTML = inventoryRows(list);
  const total = list.reduce((s, m) => s + m.stock * m.price, 0);
  setTextIfPresent("inv-total", "$" + total.toLocaleString(undefined, { maximumFractionDigits: 0 }));
}

function newPRFromMaterial(mid, qty) {
  nav("pr");
  setTimeout(() => {
    newPRModal();
    const sel = el("pr-mat");
    if (sel) {
      sel.value = mid;
      if (qty && el("pr-qty")) el("pr-qty").value = qty;
      updatePREst();
    }
  }, 0);
}

function renderInventory() {
  const total = DB.materials.length;
  const below = DB.materials.filter((m) => m.stock < m.rop).length;
  const at = DB.materials.filter((m) => m.stock === m.rop).length;
  const ok = DB.materials.filter((m) => m.stock > m.rop).length;
  const invVal = DB.materials.reduce((s, m) => s + m.stock * m.price, 0);
  return `
    <div class="card">
      <div class="ch"><div class="ct">Stock Overview</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${total}</div><div class="stat-l">Total Materials</div></div>
          <div class="stat-card sc-r"><div class="stat-v">${below}</div><div class="stat-l">Below Reorder Point</div><div class="stat-s" style="color:var(--red)">Needs reorder</div></div>
          <div class="stat-card sc-a"><div class="stat-v">${at}</div><div class="stat-l">At Reorder Point</div></div>
          <div class="stat-card sc-g"><div class="stat-v">${ok}</div><div class="stat-l">Adequate Stock</div></div>
          <div class="stat-card sc-p"><div class="stat-v">$${invVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div><div class="stat-l">Total Inventory Value</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <div class="pg-search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input id="inv-q" type="search" class="pg-search-input" placeholder="Search materials..." oninput="refreshInventoryView()"/>
          </div>
          <select id="inv-st" class="pg-sel" onchange="refreshInventoryView()">
            <option value="">All Statuses</option>
            <option>Low Stock</option>
            <option>At ROP</option>
            <option>Active</option>
          </select>
        </div>
        <div class="pg-summary">Total: <strong id="inv-total">$${invVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
      </div>
      <div class="tw">
        <table>
          <tr><th>ID</th><th>Description</th><th>Category</th><th>Stock</th><th>Unit</th><th>Min/ROP/Max</th><th>Level</th><th>Price</th><th>Value</th><th>Days Left</th><th>Status</th><th>Actions</th></tr>
          <tbody id="inv-tbody">${inventoryRows(DB.materials)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Low stock: <strong>${below}</strong></span><span>Total value: <strong>$${invVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   GOODS RECEIPT
   ============================================================ */
function grRows(list) {
  return list
    .map((g) => {
      const qty = g.lines.reduce((s, l) => s + Number(l.qty || 0), 0);
      return `<tr>
        <td class="row-id" onclick="viewGR('${g.id}')">${g.id}</td>
        <td>${g.pid}</td>
        <td>${venLabel(g.vid)}</td>
        <td class="mono">${g.date}</td>
        <td class="mono">${qty.toLocaleString()}</td>
        <td>${statusPill(g.status)}</td>
        <td>
          <div class="tbl-actions">
            <button type="button" class="btn ghost btn-xs" onclick="viewGR('${g.id}')">View</button>
            ${
              g.status !== "Posted"
                ? `<button type="button" class="btn success btn-xs" onclick="postGR('${g.id}')">Post</button>`
                : ""
            }
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function refreshGRView() {
  const st = el("gr-st")?.value || "";
  const list = DB.grs.filter((g) => !st || g.status === st);
  const tbody = el("gr-tbody");
  if (tbody) tbody.innerHTML = grRows(list);
}

function viewGR(id) {
  const g = DB.grs.find((x) => x.id === id);
  if (!g) return;
  const lines = g.lines
    .map((l) => `<tr><td>${esc(l.mid)}</td><td>${matLabel(l.mid)}</td><td>${Number(l.qty).toLocaleString()}</td><td>${l.qcOk ? "✓" : "✗"}</td></tr>`)
    .join("");
  showModal(
    "Goods receipt detail",
    `<p class="t-muted" style="margin:0 0 10px"><strong>${g.id}</strong> · ${venLabel(g.vid)}</p>
     <p><strong>PO:</strong> ${esc(g.pid)} · <strong>Date:</strong> ${esc(g.date)} · <strong>Status:</strong> ${statusPill(g.status)}</p>
     <p><strong>Inspector:</strong> ${esc(g.inspector || "—")} · <strong>Delivery note:</strong> ${esc(g.dn || "—")}</p>
     <h4 style="margin:12px 0 6px">Lines</h4>
     <table class="table-compact"><tr><th>Material</th><th>Description</th><th>Qty</th><th>QC</th></tr>${lines}</table>`,
    [
      { label: "Close", class: "btn-secondary", onclick: "closeModal()" },
      ...(g.status !== "Posted" ? [{ label: "Post GR", class: "success", onclick: `closeModal();postGR('${g.id}')` }] : []),
    ]
  );
}

function postGR(id) {
  if (!guard("warehouse")) return;
  const g = DB.grs.find((x) => x.id === id);
  if (!g || g.status === "Posted") return;
  if (g.lines.some((l) => !l.qcOk)) {
    toast("QC failed on this receipt. Release the inspection lot in Quality Mgmt first.", "warn");
    return;
  }
  let value = 0;
  g.lines.forEach((l) => {
    const m = DB.materials.find((x) => x.id === l.mid);
    if (m) { m.stock += Number(l.qty || 0); value += Number(l.qty || 0) * m.price; }
  });
  g.status = "Posted";
  postJournal("GR", g.id, "Inventory", "GR/IR", value);
  const po = DB.pos.find((p) => p.id === g.pid);
  if (po && po.status === "Open" && po.items.every((i) => receivedQty(po.id, i.mid) >= i.qty)) {
    po.status = "Received";
  }
  toast(`GR ${id} posted. Stock updated.`, "success");
  refreshGRView();
  refreshChrome();
}

function renderGR() {
  const posted = DB.grs.filter((g) => g.status === "Posted").length;
  const hold = DB.grs.filter((g) => g.status !== "Posted").length;
  const qty = DB.grs.reduce((s, g) => s + g.lines.reduce((a, l) => a + Number(l.qty || 0), 0), 0);
  return `
    <div class="card">
      <div class="ch"><div class="ct">Goods Receipt</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.grs.length}</div><div class="stat-l">GR Documents</div></div>
          <div class="stat-card sc-g"><div class="stat-v">${posted}</div><div class="stat-l">Posted</div></div>
          <div class="stat-card sc-r"><div class="stat-v">${hold}</div><div class="stat-l">Pending / Hold</div></div>
          <div class="stat-card sc-c"><div class="stat-v">${qty.toLocaleString()}</div><div class="stat-l">Total Qty</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <select id="gr-st" class="pg-sel" onchange="refreshGRView()">
            <option value="">All Statuses</option>
            <option>Posted</option>
            <option>Draft</option>
            <option>Hold-QC</option>
            <option>Inspection</option>
          </select>
        </div>
      </div>
      <div class="tw">
        <table>
          <tr><th>GR Number</th><th>PO</th><th>Vendor</th><th>Date</th><th>Qty</th><th>Status</th><th>Actions</th></tr>
          <tbody id="gr-tbody">${grRows(DB.grs)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Posted: <strong>${posted}</strong></span><span>Pending/Hold: <strong>${hold}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   GOODS ISSUE
   ============================================================ */
function giRows(list) {
  return list
    .map(
      (g) => `<tr>
        <td class="row-id" onclick="viewGI('${g.id}')">${g.id}</td>
        <td>${g.mid} — ${matLabel(g.mid)}</td>
        <td class="mono">${Number(g.qty).toLocaleString()}</td>
        <td>${esc(g.plant)}</td>
        <td class="mono">${esc(g.date)}</td>
        <td>${esc(g.reason)}${g.reversed ? ' <span class="pill pill-closed">Reversed</span>' : ""}</td>
        <td>
          <div class="tbl-actions">
            <button type="button" class="btn ghost btn-xs" onclick="viewGI('${g.id}')">View</button>
            ${g.reversed ? "" : `<button type="button" class="btn btn-secondary btn-xs" onclick="reverseGI('${g.id}')">Reverse</button>`}
          </div>
        </td>
      </tr>`
    )
    .join("");
}

function refreshGIView() {
  const q = (el("gi-q")?.value || "").toLowerCase().trim();
  const list = DB.gis.filter((g) => {
    return !q || g.id.toLowerCase().includes(q) || g.mid.toLowerCase().includes(q) || matLabel(g.mid).toLowerCase().includes(q) || g.reason.toLowerCase().includes(q);
  });
  const tbody = el("gi-tbody");
  if (tbody) tbody.innerHTML = giRows(list);
}

function viewGI(id) {
  const g = DB.gis.find((x) => x.id === id);
  if (!g) return;
  showModal(
    "Goods issue detail",
    `<p class="t-muted" style="margin:0 0 10px"><strong>${g.id}</strong></p>
     <p><strong>Material:</strong> ${esc(g.mid)} — ${matLabel(g.mid)}</p>
     <p><strong>Quantity:</strong> ${Number(g.qty).toLocaleString()} ${esc(DB.materials.find((m) => m.id === g.mid)?.unit || "")}</p>
     <p><strong>Plant:</strong> ${esc(g.plant)} · <strong>Date:</strong> ${esc(g.date)}</p>
     <p><strong>Reason:</strong> ${esc(g.reason)}</p>`,
    [
      { label: "Close", class: "btn-secondary", onclick: "closeModal()" },
      ...(g.reversed ? [] : [{ label: "Reverse", class: "btn-secondary", onclick: `closeModal();reverseGI('${g.id}')` }]),
    ]
  );
}

function reverseGI(id) {
  if (!guard("warehouse")) return;
  const g = DB.gis.find((x) => x.id === id);
  if (!g || g.reversed) return;
  const mat = DB.materials.find((m) => m.id === g.mid);
  if (mat) mat.stock += Number(g.qty || 0);
  g.reversed = true;
  postJournal("GI", g.id + "-REV", "Inventory", "COGS", Number(g.qty || 0) * (mat ? mat.price : 0));
  toast(`Reversed GI ${id}. Stock restored.`, "success");
  refreshGIView();
  refreshChrome();
}

function newGIModal() {
  if (!guard("warehouse")) return;
  const opts = DB.materials.map((m) => `<option value="${esc(m.id)}">${esc(m.desc)} [${esc(m.id)}], stock ${m.stock} ${esc(m.unit)}</option>`).join("");
  showModal("New goods issue", `
    <div class="fgrid fg2">
      <div class="fg" style="grid-column:1/-1"><label class="fl">Material *</label><select class="fs" id="gi-mat">${opts}</select></div>
      <div class="fg"><label class="fl">Quantity *</label><input class="fi" type="number" id="gi-qty" min="1"/></div>
      <div class="fg"><label class="fl">Plant</label><select class="fs" id="gi-plant"><option>PL01</option><option>PL02</option></select></div>
      <div class="fg" style="grid-column:1/-1"><label class="fl">Reason *</label><input class="fi" type="text" id="gi-reason" placeholder="e.g. Production consumption"/></div>
    </div>`, [
    { label: "Cancel", class: "btn-secondary", onclick: "closeModal()" },
    { label: "Post issue", class: "primary", onclick: "submitGI()" },
  ]);
}

function submitGI() {
  if (!guard("warehouse")) return;
  const mid = el("gi-mat").value;
  const qty = Math.floor(Number(el("gi-qty").value));
  const reason = (el("gi-reason").value || "").trim();
  const mat = DB.materials.find((m) => m.id === mid);
  if (!mat || qty < 1 || !reason) { toast("Fill all required fields.", "warn"); return; }
  if (qty > mat.stock) { toast(`Only ${mat.stock} ${mat.unit} in stock.`, "warn"); return; }
  mat.stock -= qty;
  const id = nextDocId("GI", DB.gis, 4, 300);
  DB.gis.unshift({ id, mid, qty, plant: el("gi-plant").value, date: prToday(), reason });
  postJournal("GI", id, "COGS", "Inventory", qty * mat.price);
  closeModal();
  toast(`Goods issue ${id} posted.`, "success");
  loadPage("gi");
  refreshChrome();
}

function renderGI() {
  const totalQty = DB.gis.reduce((s, g) => s + Number(g.qty || 0), 0);
  const distinct = new Set(DB.gis.map((g) => g.mid)).size;
  return `
    <div class="card">
      <div class="ch"><div class="ct">Goods Issue</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.gis.length}</div><div class="stat-l">GI Documents</div></div>
          <div class="stat-card sc-c"><div class="stat-v">${totalQty.toLocaleString()}</div><div class="stat-l">Issued Qty</div></div>
          <div class="stat-card sc-p"><div class="stat-v">${distinct}</div><div class="stat-l">Distinct Materials</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <button type="button" class="btn primary" onclick="newGIModal()">+ New Goods Issue</button>
          <div class="pg-search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input id="gi-q" type="search" class="pg-search-input" placeholder="Search GI/material/reason..." oninput="refreshGIView()"/>
          </div>
        </div>
      </div>
      <div class="tw">
        <table>
          <tr><th>GI Number</th><th>Material</th><th>Qty</th><th>Plant</th><th>Date</th><th>Reason</th><th>Actions</th></tr>
          <tbody id="gi-tbody">${giRows(DB.gis)}</tbody>
        </table>
      </div>
      <div class="cf"><span>GI documents: <strong>${DB.gis.length}</strong></span><span>Issued qty: <strong>${totalQty.toLocaleString()}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   STOCK TRANSFER ORDERS
   ============================================================ */
function stoRows(list) {
  return list
    .map(
      (s) => `<tr>
        <td class="row-id" onclick="viewSTO('${s.id}')">${s.id}</td>
        <td>${esc(s.from)}</td>
        <td>${esc(s.to)}</td>
        <td>${esc(s.mid)} — ${matLabel(s.mid)}</td>
        <td class="mono">${Number(s.qty).toLocaleString()}</td>
        <td>${statusPill(s.status)}</td>
        <td>
          <div class="tbl-actions">
            <button type="button" class="btn ghost btn-xs" onclick="viewSTO('${s.id}')">View</button>
            ${
              s.status === "Draft"
                ? `<button type="button" class="btn primary btn-xs" onclick="shipSTO('${s.id}')">Ship</button>`
                : ""
            }
            ${
              s.status === "In Transit" || s.status === "Picking"
                ? `<button type="button" class="btn success btn-xs" onclick="postSTO('${s.id}')">Post</button>`
                : ""
            }
          </div>
        </td>
      </tr>`
    )
    .join("");
}

function refreshSTOView() {
  const st = el("sto-st")?.value || "";
  const list = DB.stos.filter((s) => !st || s.status === st);
  const tbody = el("sto-tbody");
  if (tbody) tbody.innerHTML = stoRows(list);
}

function viewSTO(id) {
  const s = DB.stos.find((x) => x.id === id);
  if (!s) return;
  showModal(
    "Stock transfer detail",
    `<p class="t-muted" style="margin:0 0 10px"><strong>${s.id}</strong></p>
     <p><strong>From:</strong> ${esc(s.from)} → <strong>To:</strong> ${esc(s.to)}</p>
     <p><strong>Material:</strong> ${esc(s.mid)} — ${matLabel(s.mid)}</p>
     <p><strong>Qty:</strong> ${Number(s.qty).toLocaleString()} · <strong>Status:</strong> ${statusPill(s.status)}</p>`,
    [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }]
  );
}

function shipSTO(id) {
  if (!guard("warehouse")) return;
  const s = DB.stos.find((x) => x.id === id);
  if (!s || s.status !== "Draft") return;
  s.status = "In Transit";
  toast(`STO ${id} shipped.`, "success");
  refreshSTOView();
}

function postSTO(id) {
  if (!guard("warehouse")) return;
  const s = DB.stos.find((x) => x.id === id);
  if (!s || (s.status !== "In Transit" && s.status !== "Picking")) return;
  s.status = "Posted";
  toast(`STO ${id} posted.`, "success");
  refreshSTOView();
}

function renderSTO() {
  const transit = DB.stos.filter((s) => s.status === "In Transit").length;
  const posted = DB.stos.filter((s) => s.status === "Posted").length;
  const draft = DB.stos.filter((s) => s.status === "Draft").length;
  const qty = DB.stos.reduce((a, s) => a + Number(s.qty || 0), 0);
  return `
    <div class="card">
      <div class="ch"><div class="ct">Stock Transfer Orders</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.stos.length}</div><div class="stat-l">STO Documents</div></div>
          <div class="stat-card sc-a"><div class="stat-v">${draft}</div><div class="stat-l">Draft</div></div>
          <div class="stat-card sc-c"><div class="stat-v">${transit}</div><div class="stat-l">In Transit</div></div>
          <div class="stat-card sc-g"><div class="stat-v">${posted}</div><div class="stat-l">Posted</div></div>
          <div class="stat-card sc-p"><div class="stat-v">${qty.toLocaleString()}</div><div class="stat-l">Transfer Qty</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <select id="sto-st" class="pg-sel" onchange="refreshSTOView()">
            <option value="">All Statuses</option>
            <option>Draft</option>
            <option>Picking</option>
            <option>In Transit</option>
            <option>Posted</option>
          </select>
        </div>
      </div>
      <div class="tw">
        <table>
          <tr><th>STO Number</th><th>From</th><th>To</th><th>Material</th><th>Qty</th><th>Status</th><th>Actions</th></tr>
          <tbody id="sto-tbody">${stoRows(DB.stos)}</tbody>
        </table>
      </div>
      <div class="cf"><span>In transit: <strong>${transit}</strong></span><span>Posted: <strong>${posted}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   INVOICE
   ============================================================ */
function invoiceFilteredRows() {
  const st = el("invf-st")?.value || "";
  return DB.invoices.filter((i) => !st || i.match === st);
}

/* Real 3-way match: invoice vs purchase order vs posted goods receipt (and QC). */
function threeWayCheck(inv) {
  if (inv.legacy) {
    return { po: true, gr: true, price: true, result: "Matched", note: "Migrated historical invoice. Match not re-run.", grId: inv.gr };
  }
  const po = DB.pos.find((p) => p.id === inv.po);
  if (!po) {
    return { po: false, gr: false, price: false, result: "Blocked", note: "No purchase order referenced, or the PO was not found.", grId: null };
  }
  const line = po.items.find((i) => i.mid === inv.mid);
  if (!line) {
    return { po: true, gr: false, price: false, result: "Blocked", note: "This material is not on the purchase order.", grId: null };
  }
  const unit = inv.amount / inv.qty;
  const gapPct = (Math.abs(unit - line.price) / line.price) * 100;
  const priceOk = gapPct <= CONFIG.priceTolerancePct && inv.qty <= line.qty;
  const recv = receivedQty(po.id, inv.mid);
  const grOk = recv >= inv.qty;
  const grs = DB.grs.filter((g) => g.pid === po.id && g.status === "Posted" && g.lines.some((l) => l.mid === inv.mid));
  const lots = DB.qmLots.filter((l) => l.mid === inv.mid && grs.some((g) => g.id === l.gr));
  const qcOk = lots.every((l) => l.status === "Released");
  const base = { po: true, gr: grOk, price: priceOk, grId: grs[0] ? grs[0].id : null };
  if (!priceOk) {
    return { ...base, result: "Variance", note: `Invoice unit price ${unit.toFixed(2)} vs PO ${line.price} (${gapPct.toFixed(1)}% gap, tolerance ${CONFIG.priceTolerancePct}%), or qty above PO qty.` };
  }
  if (!grOk) {
    return { ...base, result: "Pending GR", note: `Invoiced ${inv.qty}, but only ${recv} received and posted against the PO.` };
  }
  if (!qcOk) {
    return { ...base, result: "On Hold", note: "Goods are received but the quality lot is not released." };
  }
  return { ...base, result: "Matched", note: "PO, goods receipt and price all agree." };
}

function isPaid(inv) {
  return DB.payments.some((p) => p.inv === inv.id);
}

/* Keep statuses honest: derived from the documents unless an admin overrode it. */
function recomputeInvoices() {
  DB.invoices.forEach((inv) => {
    if (inv.override) return;
    const r = threeWayCheck(inv);
    inv.match = r.result;
    if (r.grId) inv.gr = r.grId;
  });
}

function invoiceRows(list) {
  return list
    .map((inv) => {
      const c = inv.override ? { po: true, gr: true, price: true } : threeWayCheck(inv);
      const paid = isPaid(inv);
      const canPay = inv.match === "Matched" && !paid;
      return `
      <tr>
        <td class="row-id" onclick="viewInvoiceDetail('${inv.id}')">${esc(inv.id)}</td>
        <td>${venLabel(inv.vid)}</td>
        <td class="mono">${esc(inv.po)}</td>
        <td class="mono">${esc(inv.date)}</td>
        <td class="mono">${esc(inv.due)}</td>
        <td class="mono">$${inv.amount.toLocaleString()}</td>
        <td>${c.po ? "✓" : "✗"}</td>
        <td>${c.gr ? "✓" : "✗"}</td>
        <td>${c.price ? "✓" : "✗"}</td>
        <td>${statusPill(inv.match)}${paid ? ' <span class="pill pill-closed">Paid</span>' : ""}${inv.override ? ' <span class="pill pill-pending">Override</span>' : ""}</td>
        <td>
          <div class="tbl-actions">
            <button type="button" class="btn btn-secondary btn-xs" onclick="viewInvoiceDetail('${inv.id}')">${inv.match === "Matched" ? "View" : "Review"}</button>
            ${canPay ? `<button type="button" class="btn success btn-xs" onclick="payInvoice('${inv.id}')">Pay</button>` : ""}
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function refreshInvoiceView() {
  recomputeInvoices();
  const list = invoiceFilteredRows();
  const tbody = el("invf-tbody");
  if (tbody) tbody.innerHTML = invoiceRows(list);
}

function viewInvoiceDetail(id) {
  const inv = DB.invoices.find((x) => x.id === id);
  if (!inv) return;
  const c = inv.override ? { po: true, gr: true, price: true, note: "Manually approved: " + inv.override.reason + " (" + inv.override.by + ")" } : threeWayCheck(inv);
  const row = (label, ok, txt) => `<tr><td>${label}</td><td>${ok ? "PASS" : "FAIL"}</td><td>${txt}</td></tr>`;
  const html = `
    <p class="t-muted" style="margin:0 0 10px"><strong>${esc(inv.id)}</strong> · ${venLabel(inv.vid)}</p>
    <p><strong>PO:</strong> ${esc(inv.po)} · <strong>GR:</strong> ${esc(inv.gr || "—")} · <strong>Match:</strong> ${statusPill(inv.match)}</p>
    <p><strong>Material:</strong> ${esc(inv.mid)} — ${matLabel(inv.mid)}</p>
    <p><strong>Qty:</strong> ${Number(inv.qty).toLocaleString()} · <strong>Amount:</strong> $${inv.amount.toLocaleString()} · <strong>Due:</strong> ${esc(inv.due)}</p>
    <h4 style="margin:12px 0 6px">3-way checks</h4>
    <table class="table-compact">
      <tr><th>Check</th><th>Result</th><th>Notes</th></tr>
      ${row("PO reference", c.po, "Invoice linked to a purchase order")}
      ${row("Goods receipt", c.gr, "Received and posted quantity covers the invoice")}
      ${row("Price and quantity", c.price, `Within ${CONFIG.priceTolerancePct}% price tolerance and PO quantity`)}
    </table>
    <p style="margin-top:10px"><strong>Result:</strong> ${esc(c.note)}</p>`;
  const actions = [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }];
  if (inv.match === "Matched" && !isPaid(inv)) {
    actions.unshift({ label: "Pay", class: "success", onclick: `closeModal();payInvoice('${inv.id}')` });
  }
  if ((inv.match === "Variance" || inv.match === "On Hold") && can("overrideInvoice")) {
    actions.unshift({ label: "Approve with reason", class: "primary", onclick: `closeModal();overrideInvoice('${inv.id}')` });
  }
  showModal("Invoice 3-way verification", html, actions);
}

function overrideInvoice(id) {
  if (!guard("overrideInvoice")) return;
  const inv = DB.invoices.find((x) => x.id === id);
  if (!inv || (inv.match !== "Variance" && inv.match !== "On Hold")) return;
  askText("Approve " + id + " despite the mismatch", "Reason (recorded with your name)", (reason) => {
    inv.override = { by: actor(), reason, at: prToday() };
    inv.match = "Matched";
    toast(`Invoice ${id} approved by override.`, "info");
    refreshInvoiceView();
    refreshChrome();
  });
}

function payInvoice(id) {
  if (!guard("ap")) return;
  const inv = DB.invoices.find((x) => x.id === id);
  if (!inv) return;
  if (inv.match !== "Matched") {
    toast("Invoice must be matched before payment.", "warn");
    return;
  }
  const exists = DB.payments.find((p) => p.inv === id);
  if (exists) {
    toast(`Payment already exists: ${exists.id}.`, "info");
    return;
  }
  const next = nextDocId("PAY", DB.payments, 4, 120);
  DB.payments.unshift({
    id: next,
    inv: inv.id,
    vid: inv.vid,
    amount: inv.amount,
    date: prToday(),
    method: "ACH",
    status: "Scheduled",
    ref: "AUTO-" + String(Date.now()).slice(-6),
  });
  postJournal("INV", inv.id, "GR/IR", "AP - " + inv.vid, inv.amount);
  toast(`Created payment ${next}.`, "success");
  refreshInvoiceView();
  refreshChrome();
}

function renderInvoice() {
  const pending = DB.invoices.filter((i) => i.match === "Pending GR" || i.match === "On Hold").length;
  const variance = DB.invoices.filter((i) => i.match === "Variance").length;
  const overdue = DB.invoices.filter((i) => new Date(i.due) < new Date() && !isPaid(i)).length;
  const ready = DB.invoices.filter((i) => i.match === "Matched" && !isPaid(i)).length;
  const tot = DB.invoices.reduce((s, i) => s + i.amount, 0);
  const statuses = [...new Set(DB.invoices.map((i) => i.match))]
    .map((s) => `<option value="${esc(s)}">${esc(s)}</option>`)
    .join("");
  return `
    <div class="card">
      <div class="ch"><div class="ct">Invoice verification (3-way match)</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card sc-a"><div class="stat-v">${pending}</div><div class="stat-l">Pending Match</div></div>
          <div class="stat-card sc-r"><div class="stat-v">${variance}</div><div class="stat-l">Price Variance</div></div>
          <div class="stat-card sc-r"><div class="stat-v">${overdue}</div><div class="stat-l">Overdue</div></div>
          <div class="stat-card sc-g"><div class="stat-v">${ready}</div><div class="stat-l">Ready to Pay</div></div>
          <div class="stat-card sc-p"><div class="stat-v">$${tot.toLocaleString()}</div><div class="stat-l">Total Invoice Value</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <select id="invf-st" class="pg-sel" onchange="refreshInvoiceView()">
            <option value="">All Statuses</option>
            ${statuses}
          </select>
        </div>
        <div class="pg-summary">Status is calculated from PO, goods receipt and price. It cannot be forced.</div>
      </div>
      <div class="tw">
        <table>
          <tr>
            <th>Invoice #</th><th>Vendor</th><th>PO Ref</th><th>Date</th><th>Due</th><th>Amount</th><th>PO ✓</th><th>GR ✓</th><th>Price ✓</th><th>Status</th><th>Actions</th>
          </tr>
          <tbody id="invf-tbody">${invoiceRows(DB.invoices)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Exceptions: <strong>${DB.invoices.filter((i) => i.match !== "Matched").length}</strong></span><span>Ready to pay: <strong>${ready}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   PAYMENTS
   ============================================================ */
function paymentStatusPill(st) {
  const s = String(st || "").toLowerCase();
  if (s.includes("clear")) return `<span class="pill pill-approved">${esc(st)}</span>`;
  if (s.includes("schedule")) return `<span class="pill pill-pending">${esc(st)}</span>`;
  if (s.includes("block")) return `<span class="pill pill-blocked">${esc(st)}</span>`;
  return `<span class="pill pill-closed">${esc(st)}</span>`;
}

function paymentRows(list) {
  return list
    .map(
      (p) => `<tr>
        <td class="row-id" onclick="viewPayment('${p.id}')">${p.id}</td>
        <td>${p.inv}</td>
        <td>${venLabel(p.vid)}</td>
        <td class="mono">$${Number(p.amount).toLocaleString()}</td>
        <td class="mono">${p.date}</td>
        <td>${esc(p.method)}</td>
        <td>${paymentStatusPill(p.status)}</td>
        <td>${esc(p.ref)}</td>
        <td>
          <div class="tbl-actions">
            <button type="button" class="btn ghost btn-xs" onclick="viewPayment('${p.id}')">View</button>
            ${
              p.status === "Scheduled"
                ? `<button type="button" class="btn success btn-xs" onclick="settlePayment('${p.id}')">Settle</button>`
                : ""
            }
          </div>
        </td>
      </tr>`
    )
    .join("");
}

function refreshPaymentView() {
  const st = el("pay-st")?.value || "";
  const q = (el("pay-q")?.value || "").toLowerCase().trim();
  const list = DB.payments.filter((p) => {
    const sok = !st || p.status === st;
    const qok = !q || p.id.toLowerCase().includes(q) || p.inv.toLowerCase().includes(q) || venLabel(p.vid).toLowerCase().includes(q);
    return sok && qok;
  });
  const tbody = el("pay-tbody");
  if (tbody) tbody.innerHTML = paymentRows(list);
}

function viewPayment(id) {
  const p = DB.payments.find((x) => x.id === id);
  if (!p) return;
  const inv = DB.invoices.find((i) => i.id === p.inv);
  const html = `
    <p class="t-muted" style="margin:0 0 10px"><strong>${p.id}</strong> · ${venLabel(p.vid)}</p>
    <p><strong>Invoice:</strong> ${esc(p.inv)} · <strong>Status:</strong> ${paymentStatusPill(p.status)}</p>
    <p><strong>Amount:</strong> $${Number(p.amount).toLocaleString()} · <strong>Method:</strong> ${esc(p.method)} · <strong>Date:</strong> ${esc(p.date)}</p>
    <p><strong>Reference:</strong> ${esc(p.ref || "—")}</p>
    ${
      inv
        ? `<h4 style="margin:12px 0 6px">Linked invoice</h4>
           <p><strong>${esc(inv.id)}</strong> · ${statusPill(inv.match)} · Due ${esc(inv.due)}</p>`
        : ""
    }`;
  const actions = [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }];
  if (p.status === "Scheduled") actions.unshift({ label: "Settle payment", class: "success", onclick: `closeModal();settlePayment('${p.id}')` });
  showModal("Payment detail", html, actions);
}

function settlePayment(id) {
  if (!guard("ap")) return;
  const p = DB.payments.find((x) => x.id === id);
  if (!p || p.status !== "Scheduled") return;
  p.status = "Cleared";
  postJournal("Pay", p.id, "AP - " + p.vid, "Cash", Number(p.amount));
  p.ref = p.ref && p.ref !== "—" ? p.ref : "CLR-" + String(Date.now()).slice(-6);
  toast(`Payment ${id} settled.`, "success");
  refreshPaymentView();
}

function renderPayment() {
  const total = DB.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const sch = DB.payments.filter((p) => p.status === "Scheduled").length;
  const clr = DB.payments.filter((p) => p.status === "Cleared").length;
  const blk = DB.payments.filter((p) => p.status === "Blocked").length;
  return `
    <div class="card">
      <div class="ch"><div class="ct">Payments</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.payments.length}</div><div class="stat-l">Payment Docs</div></div>
          <div class="stat-card sc-a"><div class="stat-v">${sch}</div><div class="stat-l">Scheduled</div></div>
          <div class="stat-card sc-g"><div class="stat-v">${clr}</div><div class="stat-l">Cleared</div></div>
          <div class="stat-card sc-r"><div class="stat-v">${blk}</div><div class="stat-l">Blocked</div></div>
          <div class="stat-card sc-p"><div class="stat-v">$${total.toLocaleString()}</div><div class="stat-l">Total Value</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <div class="pg-search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input id="pay-q" type="search" class="pg-search-input" placeholder="Search payment/invoice/vendor..." oninput="refreshPaymentView()"/>
          </div>
          <select id="pay-st" class="pg-sel" onchange="refreshPaymentView()">
            <option value="">All Statuses</option>
            <option>Scheduled</option>
            <option>Cleared</option>
            <option>Blocked</option>
          </select>
        </div>
      </div>
      <div class="tw">
        <table>
          <tr><th>Payment</th><th>Invoice</th><th>Vendor</th><th>Amount</th><th>Date</th><th>Method</th><th>Status</th><th>Reference</th><th>Actions</th></tr>
          <tbody id="pay-tbody">${paymentRows(DB.payments)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Scheduled: <strong>${sch}</strong></span><span>Cleared: <strong>${clr}</strong> · Blocked: <strong>${blk}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   JOURNAL
   ============================================================ */
function journalRows(list) {
  return list
    .map(
      (j) => `<tr>
        <td class="row-id" onclick="viewJournal('${j.id}')">${j.id}</td>
        <td>${esc(j.type)}</td>
        <td>${esc(j.ref)}</td>
        <td>${esc(j.dr)}</td>
        <td>${esc(j.cr)}</td>
        <td class="mono">$${Number(j.amount).toLocaleString()}</td>
        <td class="mono">${esc(j.date)}</td>
      </tr>`
    )
    .join("");
}

function refreshJournalView() {
  const type = el("jr-type")?.value || "";
  const list = DB.journal.filter((j) => !type || j.type === type);
  const tbody = el("jr-tbody");
  if (tbody) tbody.innerHTML = journalRows(list);
}

function viewJournal(id) {
  const j = DB.journal.find((x) => x.id === id);
  if (!j) return;
  const html = `
    <p class="t-muted" style="margin:0 0 10px"><strong>${j.id}</strong> · ${esc(j.type)}</p>
    <p><strong>Reference:</strong> ${esc(j.ref)}</p>
    <p><strong>DR:</strong> ${esc(j.dr)} · <strong>CR:</strong> ${esc(j.cr)}</p>
    <p><strong>Amount:</strong> $${Number(j.amount).toLocaleString()} · <strong>Date:</strong> ${esc(j.date)}</p>`;
  showModal("Journal entry", html, [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }]);
}

function renderJournal() {
  const types = [...new Set(DB.journal.map((j) => j.type))];
  const total = DB.journal.reduce((s, j) => s + Number(j.amount || 0), 0);
  return `
    <div class="card">
      <div class="ch"><div class="ct">Accounting Journal</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.journal.length}</div><div class="stat-l">Entries</div></div>
          <div class="stat-card sc-c"><div class="stat-v">${types.length}</div><div class="stat-l">Doc Types</div></div>
          <div class="stat-card sc-p"><div class="stat-v">$${total.toLocaleString()}</div><div class="stat-l">Total Posted Amount</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <select id="jr-type" class="pg-sel" onchange="refreshJournalView()">
            <option value="">All Types</option>
            ${types.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="tw">
        <table>
          <tr><th>ID</th><th>Type</th><th>Ref</th><th>DR</th><th>CR</th><th>Amount</th><th>Date</th></tr>
          <tbody id="jr-tbody">${journalRows(DB.journal)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Entries: <strong>${DB.journal.length}</strong></span><span>Total posted: <strong>$${total.toLocaleString()}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   VENDOR MASTER
   ============================================================ */
function vendorRows(list) {
  return list
    .map(
      (v) => `<tr>
        <td class="row-id" onclick="viewVendor('${v.id}')">${v.id}</td>
        <td>${esc(v.name)}</td>
        <td>${esc(v.country)}</td>
        <td>${esc(v.cat)}</td>
        <td class="mono">${Number(v.rating).toFixed(1)}</td>
        <td>${v.status === "Active" ? `<span class="pill pill-approved">Active</span>` : `<span class="pill pill-blocked">${esc(v.status)}</span>`}</td>
        <td class="mono">$${vendorSpend(v.id).toLocaleString()}</td>
        <td>
          <div class="tbl-actions">
            <button type="button" class="btn ghost btn-xs" onclick="viewVendor('${v.id}')">View</button>
            <button type="button" class="btn btn-secondary btn-xs" onclick="toggleVendorStatus('${v.id}')">${v.status === "Active" ? "Hold" : "Activate"}</button>
          </div>
        </td>
      </tr>`
    )
    .join("");
}

function refreshVendorView() {
  const q = (el("ven-q")?.value || "").toLowerCase().trim();
  const st = el("ven-st")?.value || "";
  const list = DB.vendors.filter((v) => {
    const qok = !q || v.id.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || v.country.toLowerCase().includes(q);
    const sok = !st || v.status === st;
    return qok && sok;
  });
  const tbody = el("ven-tbody");
  if (tbody) tbody.innerHTML = vendorRows(list);
}

function viewVendor(id) {
  const v = DB.vendors.find((x) => x.id === id);
  if (!v) return;
  const html = `
    <p class="t-muted" style="margin:0 0 10px"><strong>${v.id}</strong> · ${esc(v.name)}</p>
    <p><strong>Category:</strong> ${esc(v.cat)} · <strong>Country:</strong> ${esc(v.country)} · <strong>Status:</strong> ${esc(v.status)}</p>
    <p><strong>Contact:</strong> ${esc(v.contact || "—")} · <strong>Email:</strong> ${esc(v.email || "—")}</p>
    <p><strong>Terms:</strong> ${esc(v.terms || "—")} · <strong>Lead:</strong> ${esc(v.lead || "—")} days · <strong>Rating:</strong> ${Number(v.rating || 0).toFixed(1)}</p>
    <p><strong>Spend:</strong> $${vendorSpend(v.id).toLocaleString()} · <strong>On-time:</strong> ${esc(v.onTime || "—")}% · <strong>Quality:</strong> ${esc(v.quality || "—")}%</p>`;
  showModal("Vendor profile", html, [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }]);
}

function toggleVendorStatus(id) {
  if (!guard("vendorStatus")) return;
  const v = DB.vendors.find((x) => x.id === id);
  if (!v) return;
  v.status = v.status === "Active" ? "On Hold" : "Active";
  toast(`Vendor ${id} status set to ${v.status}.`, "info");
  refreshVendorView();
}

function renderVendorMaster() {
  const active = DB.vendors.filter((v) => v.status === "Active").length;
  const hold = DB.vendors.filter((v) => v.status !== "Active").length;
  const spend = totalSpend();
  return `
    <div class="card">
      <div class="ch"><div class="ct">Vendor Master</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.vendors.length}</div><div class="stat-l">Vendors</div></div>
          <div class="stat-card sc-g"><div class="stat-v">${active}</div><div class="stat-l">Active</div></div>
          <div class="stat-card sc-r"><div class="stat-v">${hold}</div><div class="stat-l">On Hold</div></div>
          <div class="stat-card sc-p"><div class="stat-v">$${spend.toLocaleString()}</div><div class="stat-l">Total Spend</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <div class="pg-search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input id="ven-q" type="search" class="pg-search-input" placeholder="Search vendors..." oninput="refreshVendorView()"/>
          </div>
          <select id="ven-st" class="pg-sel" onchange="refreshVendorView()">
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>On Hold</option>
          </select>
        </div>
      </div>
      <div class="tw">
        <table>
          <tr><th>ID</th><th>Name</th><th>Country</th><th>Category</th><th>Rating</th><th>Status</th><th>Spend</th><th>Actions</th></tr>
          <tbody id="ven-tbody">${vendorRows(DB.vendors)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Active vendors: <strong>${active}</strong></span><span>On hold: <strong>${hold}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   MATERIAL MASTER
   ============================================================ */
function materialRows(list) {
  return list
    .map(
      (m) => `<tr>
        <td class="row-id" onclick="showMaterialDetails('${m.id}')">${m.id}</td>
        <td>${esc(m.desc)}</td>
        <td>${esc(m.cat)}</td>
        <td>${esc(m.unit)}</td>
        <td class="mono">$${Number(m.price).toLocaleString()}</td>
        <td class="mono">${Number(m.stock).toLocaleString()}</td>
        <td>${m.stock < m.rop ? `<span class="pill pill-low">Low Stock</span>` : `<span class="pill pill-ok">Active</span>`}</td>
        <td>
          <div class="tbl-actions">
            <button type="button" class="btn primary btn-xs" onclick="showMaterialDetails('${m.id}')">Details</button>
            <button type="button" class="btn btn-secondary btn-xs" onclick="newPRFromMaterial('${m.id}')">Create PR</button>
          </div>
        </td>
      </tr>`
    )
    .join("");
}

function refreshMaterialView() {
  const q = (el("mat-q")?.value || "").toLowerCase().trim();
  const cat = el("mat-cat")?.value || "";
  const list = DB.materials.filter((m) => {
    const qok = !q || m.id.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q);
    const cok = !cat || m.cat === cat;
    return qok && cok;
  });
  const tbody = el("mat-tbody");
  if (tbody) tbody.innerHTML = materialRows(list);
}

function renderMaterialMaster() {
  const low = DB.materials.filter((m) => m.stock < m.rop).length;
  const totalVal = DB.materials.reduce((s, m) => s + Number(m.stock || 0) * Number(m.price || 0), 0);
  const cats = [...new Set(DB.materials.map((m) => m.cat))];
  return `
    <div class="card">
      <div class="ch"><div class="ct">Material Master</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${DB.materials.length}</div><div class="stat-l">Materials</div></div>
          <div class="stat-card sc-r"><div class="stat-v">${low}</div><div class="stat-l">Low Stock</div></div>
          <div class="stat-card sc-p"><div class="stat-v">$${totalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div><div class="stat-l">Inventory Value</div></div>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="page-tools">
          <div class="pg-search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
            <input id="mat-q" type="search" class="pg-search-input" placeholder="Search material..." oninput="refreshMaterialView()"/>
          </div>
          <select id="mat-cat" class="pg-sel" onchange="refreshMaterialView()">
            <option value="">All Categories</option>
            ${cats.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="tw">
        <table>
          <tr>
            <th>ID</th><th>Description</th><th>Category</th>
            <th>Unit</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
          </tr>
          <tbody id="mat-tbody">${materialRows(DB.materials)}</tbody>
        </table>
      </div>
      <div class="cf"><span>Low stock materials: <strong>${low}</strong></span><span>Total inventory value: <strong>$${totalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></span></div>
    </div>
  `;
}

/* ============================================================
   MATERIAL DETAIL MODAL
   ============================================================ */
function showMaterialDetails(mid) {
  const m = DB.materials.find(x => x.id === mid);
  if (!m) return;

  const vendor = DB.vendors.find(v => v.id === m.vendor);
  const vendorScore = evaluateVendor(m.vendor);
  const reorderPrediction = predictReorder(mid);
  const batchHTML = renderBatchInfo(mid);
  const serialHTML = renderSerials(mid);
  const mrp = runMRP().find(p => p.mid === mid);

  showModal(
    `Material Details – ${mid}`,
    `
      <h3>${esc(m.desc)}</h3>
      <p><strong>Category:</strong> ${esc(m.cat)}</p>
      <p><strong>Unit:</strong> ${esc(m.unit)}</p>
      <p><strong>Price:</strong> $${m.price}</p>
      <p><strong>Stock:</strong> ${m.stock}</p>
      <p><strong>Vendor:</strong> ${esc(vendor?.name || m.vendor)}</p>
      <p><strong>Vendor Score:</strong> ${vendorScore}</p>
      <p><strong>Predictive Reorder:</strong> ${reorderPrediction}</p>

      <hr>

      <h4>MRP projection</h4>
      <p><strong>Projected after lead time:</strong> ${mrp ? mrp.projected : "—"}</p>
      <p><strong>Shortage:</strong> ${mrp ? (mrp.shortage ? "Yes" : "No") : "—"}</p>
      <p><strong>Action:</strong> ${mrp ? mrp.action : "—"}</p>

      <hr>

      <h4>Batch Information</h4>
      ${batchHTML}

      <hr>

      <h4>Serial Numbers</h4>
      ${serialHTML}
    `,
    [
      { label: "Close", class: "ghost", onclick: "closeModal()" }
    ]
  );
}

/* ============================================================
   PURCHASING INFO RECORDS
   ============================================================ */
function viewPIR(id) {
  const p = DB.infoRecords.find((x) => x.id === id);
  if (!p) return;
  showModal(
    "Purchasing info record",
    `<p class="t-muted" style="margin:0 0 10px"><strong>${p.id}</strong></p>
     <p><strong>Vendor:</strong> ${venLabel(p.vid)} (${esc(p.vid)})</p>
     <p><strong>Material:</strong> ${esc(p.mid)} — ${matLabel(p.mid)}</p>
     <p><strong>Price:</strong> $${Number(p.price).toLocaleString()} · <strong>Lead:</strong> ${esc(p.lead)} days · <strong>Terms:</strong> ${esc(p.terms)}</p>
     <p><strong>Last PO:</strong> ${esc(p.lastPO || "—")}</p>`,
    [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }]
  );
}

function renderPIR() {
  return `
    <div class="card">
      <div class="ch"><div class="ct">Purchasing Info Records</div></div>
      <div class="tw">
        <table>
          <tr><th>ID</th><th>Vendor</th><th>Material</th><th>Price</th><th>Lead</th><th>Terms</th><th>Actions</th></tr>
          ${DB.infoRecords
            .map(
              (p) => `
            <tr>
              <td class="row-id" onclick="viewPIR('${p.id}')">${p.id}</td>
              <td>${venLabel(p.vid)}</td>
              <td>${p.mid} — ${matLabel(p.mid)}</td>
              <td class="mono">$${Number(p.price).toLocaleString()}</td>
              <td class="mono">${p.lead}</td>
              <td>${p.terms}</td>
              <td><button type="button" class="btn ghost btn-xs" onclick="viewPIR('${p.id}')">View</button></td>
            </tr>
          `
            )
            .join("")}
        </table>
      </div>
    </div>
  `;
}

/* ============================================================
   SOURCE LIST
   ============================================================ */
function viewSource(mid, vid, validFrom, validTo, fixed) {
  showModal(
    "Source detail",
    `<p><strong>${esc(mid)}</strong> — ${matLabel(mid)}</p>
     <p><strong>Vendor:</strong> ${venLabel(vid)}</p>
     <p><strong>Validity:</strong> ${esc(validFrom)} to ${esc(validTo)}</p>
     <p><strong>Fixed source:</strong> ${fixed ? "Yes" : "No"}</p>`,
    [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }]
  );
}

function renderSourceList() {
  return `
    <div class="card">
      <div class="ch"><div class="ct">Source List</div></div>
      <div class="tw">
        <table>
          <tr><th>Material</th><th>Vendor</th><th>Valid From</th><th>Valid To</th><th>Fixed</th><th>Actions</th></tr>
          ${DB.sourceList.map(s => `
            <tr>
              <td>${s.mid} — ${matLabel(s.mid)}</td>
              <td>${venLabel(s.vid)}</td>
              <td>${s.validFrom}</td>
              <td>${s.validTo}</td>
              <td>${s.fixed ? "Yes" : "No"}</td>
              <td><button type="button" class="btn ghost btn-xs" onclick="viewSource('${s.mid}','${s.vid}','${s.validFrom}','${s.validTo}',${s.fixed ? "true" : "false"})">View</button></td>
            </tr>
          `).join("")}
        </table>
      </div>
    </div>
  `;
}

/* ============================================================
   QUOTA ARRANGEMENT
   ============================================================ */
function viewQuota(mid, vid, quota) {
  showModal(
    "Quota detail",
    `<p><strong>${esc(mid)}</strong> — ${matLabel(mid)}</p>
     <p><strong>Vendor:</strong> ${venLabel(vid)}</p>
     <p><strong>Quota:</strong> ${Number(quota).toLocaleString()}%</p>`,
    [{ label: "Close", class: "btn-secondary", onclick: "closeModal()" }]
  );
}

function renderQuota() {
  return `
    <div class="card">
      <div class="ch"><div class="ct">Quota Arrangement</div></div>
      <div class="tw">
        <table>
          <tr><th>Material</th><th>Vendor</th><th>Quota %</th><th>Actions</th></tr>
          ${DB.quota.map(q => `
            <tr>
              <td>${q.mid} — ${matLabel(q.mid)}</td>
              <td>${venLabel(q.vid)}</td>
              <td>${q.quota}%</td>
              <td><button type="button" class="btn ghost btn-xs" onclick="viewQuota('${q.mid}','${q.vid}',${q.quota})">View</button></td>
            </tr>
          `).join("")}
        </table>
      </div>
    </div>
  `;
}

/* ============================================================
   MRP LIVE
   ============================================================ */
function renderMRP() {
  const plan = runMRP();
  const short = plan.filter((p) => p.shortage).length;
  return `
    <div class="card">
      <div class="ch"><div class="ct">MRP Live Engine</div></div>
      <div class="cb">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-v">${plan.length}</div><div class="stat-l">Materials planned</div></div>
          <div class="stat-card sc-r"><div class="stat-v">${short}</div><div class="stat-l">Shortages</div></div>
        </div>
        <p class="t-muted" style="margin-bottom:10px">Need = daily consumption × lead time + safety stock. Projected = stock + inbound (open PO balance, approved PRs) − need.</p>
      </div>
      <div class="tw">
        <table>
          <tr><th>Material</th><th>Stock</th><th>Inbound</th><th>Need</th><th>Projected</th><th>Shortage</th><th>Action</th></tr>
          ${plan.map((p) => `
            <tr>
              <td>${esc(p.mid)} — ${matLabel(p.mid)}</td>
              <td class="mono">${p.stock.toLocaleString()}</td>
              <td class="mono">${p.inbound.toLocaleString()}</td>
              <td class="mono">${p.need.toLocaleString()}</td>
              <td class="mono">${p.projected.toLocaleString()}</td>
              <td>${p.shortage ? '<span class="pill pill-low">Yes</span>' : '<span class="pill pill-ok">No</span>'}</td>
              <td>${p.shortage ? `<button type="button" class="btn primary btn-xs" onclick="newPRFromMaterial('${p.mid}', ${p.qty})">Create PR for ${p.qty.toLocaleString()}</button>` : "No action"}</td>
            </tr>`).join("")}
        </table>
      </div>
    </div>
  `;
}

/* ============================================================
   ANALYTICS
   ============================================================ */
function renderAnalytics() {
  const spendByVendor = {};
  DB.pos.forEach((p) => {
    spendByVendor[p.vid] = (spendByVendor[p.vid] || 0) + p.value;
  });
  const vendorRows = Object.keys(spendByVendor)
    .sort((a, b) => spendByVendor[b] - spendByVendor[a])
    .map(
      (vid) => `
    <tr>
      <td>${venLabel(vid)}</td>
      <td>$${spendByVendor[vid].toLocaleString()}</td>
    </tr>`
    )
    .join("");

  const stockValue = DB.materials
    .map((m) => ({ id: m.id, desc: m.desc, val: m.stock * m.price }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5);

  return `
    <div class="card">
      <div class="ch"><div class="ct">Analytics & insights</div></div>
      <div class="cb">
        <p class="t-muted" style="margin-bottom:14px">Demo metrics from in-memory sample data (no external BI).</p>
        <div class="kgrid" style="margin-bottom:20px">
          ${kpi("Active vendors", DB.vendors.filter((v) => v.status === "Active").length, "")}
          ${kpi("Materials", DB.materials.length, "")}
          ${kpi("Open POs", DB.pos.filter((p) => p.status === "Open").length, "")}
          ${kpi("Pending PRs", DB.prs.filter((p) => p.status === "Pending Approval").length, "")}
          ${kpi("Invoices in queue", DB.invoices.length, "")}
          ${kpi("Total PO value", "$" + DB.pos.reduce((s, p) => s + p.value, 0).toLocaleString(), "")}
        </div>
        <h4 class="analytics-h">Spend by vendor (from POs)</h4>
        <table>
          <tr><th>Vendor</th><th>PO value</th></tr>
          ${vendorRows}
        </table>
        <h4 class="analytics-h" style="margin-top:20px">Top materials by inventory value</h4>
        <table>
          <tr><th>Material</th><th>Stock value</th></tr>
          ${stockValue
            .map(
              (r) => `
            <tr>
              <td>${r.id} — ${r.desc}</td>
              <td>$${r.val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>`
            )
            .join("")}
        </table>
      </div>
    </div>
  `;
}


/* ============================================================
   SETTINGS (per-company configuration)
   ============================================================ */
const MODULE_LABELS = {
  rfq: "RFQ & Bidding", contracts: "Contracts", sa: "Scheduling Agreements",
  subcontracting: "Subcontracting", services: "Services", sto: "Stock Transfer",
  qm: "Quality Mgmt", payment: "Payments", journal: "Accounting",
  pir: "Info Records", source: "Source List", quota: "Quota Arrangement",
  mrp: "MRP Live", analytics: "Analytics", ai: "Ask Matgrid",
};

function renderSettings() {
  const locked = !can("settings");
  const dis = locked ? "disabled" : "";
  return `
    <div class="card">
      <div class="ch"><div class="ct">Company settings</div></div>
      <div class="cb">
        ${locked ? '<p class="badge badge-warn" style="margin-bottom:12px">Only an Admin can change settings.</p>' : ""}
        <div class="fgrid fg2" style="max-width:640px">
          <div class="fg"><label class="fl">Company name</label><input class="fi" id="cfg-company" value="${esc(CONFIG.company)}" ${dis}/></div>
          <div class="fg"><label class="fl">Manager approval above (PR value)</label><input class="fi" type="number" id="cfg-limit" min="0" value="${CONFIG.managerApprovalLimit}" ${dis}/></div>
          <div class="fg"><label class="fl">Invoice price tolerance (%)</label><input class="fi" type="number" id="cfg-tol" min="0" step="0.5" value="${CONFIG.priceTolerancePct}" ${dis}/></div>
        </div>
        <h4 class="analytics-h" style="margin:18px 0 8px">Modules</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;max-width:760px">
          ${Object.keys(MODULE_LABELS).map((k) => `
            <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cfg-mod-${k}" ${moduleOn(k) ? "checked" : ""} ${dis}/> ${esc(MODULE_LABELS[k])}</label>`).join("")}
        </div>
        <div style="margin-top:18px;display:flex;gap:8px">
          <button type="button" class="btn primary" onclick="saveSettings()" ${dis}>Save settings</button>
          <button type="button" class="btn btn-secondary" onclick="resetSettings()" ${dis}>Reset to defaults</button>
        </div>
        <p class="t-muted" style="margin-top:12px">Saved in this browser for now. With a backend these become per-company records.</p>
      </div>
    </div>`;
}

function saveSettings() {
  if (!guard("settings")) return;
  CONFIG.company = (el("cfg-company").value || "").trim() || CONFIG_DEFAULTS.company;
  CONFIG.managerApprovalLimit = Math.max(0, Number(el("cfg-limit").value) || 0);
  CONFIG.priceTolerancePct = Math.max(0, Number(el("cfg-tol").value) || 0);
  Object.keys(MODULE_LABELS).forEach((k) => { CONFIG.modules[k] = el("cfg-mod-" + k).checked; });
  saveConfig();
  applyConfig();
  recomputeInvoices();
  refreshChrome();
  toast("Settings saved.", "success");
}

function resetSettings() {
  if (!guard("settings")) return;
  Object.assign(CONFIG, JSON.parse(JSON.stringify(CONFIG_DEFAULTS)));
  saveConfig();
  applyConfig();
  loadPage("settings");
  toast("Settings reset.", "info");
}
