/* ============================================================
   Matgrid – advanced modules
   ADVANCED MODULES (Part 5)
   ============================================================ */

/* ------------------------------------------------------------
   RELEASE STRATEGY ENGINE (limits come from company settings)
   ------------------------------------------------------------ */
function checkReleaseStrategy(pr) {
  if (pr.urg === "Critical") return "Manager + Director";
  if (pr.est > CONFIG.managerApprovalLimit) return "Manager";
  return "Auto-Release";
}

/* ------------------------------------------------------------
   BATCH MANAGEMENT
   ------------------------------------------------------------ */
function getBatchesForMaterial(mid) {
  return DB.batches.filter(b => b.mid === mid);
}

function renderBatchInfo(mid) {
  const batches = getBatchesForMaterial(mid);
  if (!batches.length) return "<em>No batch records</em>";

  return `
    <table>
      <tr><th>Batch</th><th>Mfg</th><th>Exp</th><th>Qty</th></tr>
      ${batches.map(b => `
        <tr>
          <td>${esc(b.batch)}</td>
          <td>${esc(b.mfg)}</td>
          <td>${esc(b.exp)}</td>
          <td>${esc(b.qty)}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

/* ------------------------------------------------------------
   SERIAL NUMBER TRACKING
   ------------------------------------------------------------ */
function getSerials(mid) {
  return DB.serials.filter(s => s.mid === mid);
}

function renderSerials(mid) {
  const list = getSerials(mid);
  if (!list.length) return "<em>No serials</em>";

  return `
    <table>
      <tr><th>Serial</th><th>Status</th><th>Location</th></tr>
      ${list.map(s => `
        <tr>
          <td>${esc(s.serial)}</td>
          <td>${esc(s.status)}</td>
          <td>${esc(s.location)}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

/* ------------------------------------------------------------
   SUBCONTRACTING ENGINE
   ------------------------------------------------------------ */
function renderSubcontracting() {
  return `
    <div class="card">
      <div class="ch"><div class="ct">Subcontracting Orders</div></div>
      <div class="cb">
        <table>
          <tr><th>ID</th><th>Vendor</th><th>FG</th><th>Qty</th><th>Status</th></tr>
          ${DB.subcontracting.map(s => `
            <tr>
              <td>${esc(s.id)}</td>
              <td>${venLabel(s.vid)}</td>
              <td>${esc(s.fg)}</td>
              <td>${esc(s.qty)}</td>
              <td>${statusPill(s.status)}</td>
            </tr>
          `).join("")}
        </table>
      </div>
    </div>
  `;
}

PAGE_RENDERERS.subcontracting = renderSubcontracting;

/* ------------------------------------------------------------
   SERVICE PROCUREMENT
   ------------------------------------------------------------ */
function renderServices() {
  return `
    <div class="card">
      <div class="ch"><div class="ct">Service Procurement</div></div>
      <div class="cb">
        <table>
          <tr><th>ID</th><th>Description</th><th>Vendor</th><th>Price</th><th>Status</th></tr>
          ${DB.services.map(s => `
            <tr>
              <td>${esc(s.id)}</td>
              <td>${esc(s.desc)}</td>
              <td>${venLabel(s.vendor)}</td>
              <td class="mono">$${Number(s.price).toLocaleString()}</td>
              <td>${statusPill(s.status)}</td>
            </tr>
          `).join("")}
        </table>
      </div>
    </div>
  `;
}

PAGE_RENDERERS.services = renderServices;

/* ------------------------------------------------------------
   QUALITY MANAGEMENT (QM) – release or block inspection lots
   ------------------------------------------------------------ */
function qmRows() {
  return DB.qmLots.map(l => {
    const open = l.status === "Inspection" || l.status === "Sampling";
    return `
      <tr>
        <td>${esc(l.id)}</td>
        <td>${esc(l.gr)}</td>
        <td>${esc(l.mid)} — ${matLabel(l.mid)}</td>
        <td class="mono">${Number(l.qty).toLocaleString()}</td>
        <td>${statusPill(l.status)}</td>
        <td>${esc(l.results || "—")}</td>
        <td>
          <div class="tbl-actions">
            ${open || l.status === "Blocked" ? `<button type="button" class="btn success btn-xs" onclick="releaseQM('${l.id}')">Release</button>` : ""}
            ${open ? `<button type="button" class="btn danger btn-xs" onclick="rejectQM('${l.id}')">Block</button>` : ""}
          </div>
        </td>
      </tr>`;
  }).join("");
}

function releaseQM(id) {
  if (!guard("qm")) return;
  const lot = DB.qmLots.find(l => l.id === id);
  if (!lot || lot.status === "Released") return;
  lot.status = "Released";
  lot.results = "Pass";
  const gr = DB.grs.find(g => g.id === lot.gr);
  if (gr) {
    gr.lines.forEach(l => { if (l.mid === lot.mid) l.qcOk = true; });
    if (gr.status === "Hold-QC") gr.status = "Inspection";
  }
  toast(`Lot ${id} released. ${gr && gr.status !== "Posted" ? "The goods receipt can now be posted." : ""}`, "success");
  loadPage("qm");
}

function rejectQM(id) {
  if (!guard("qm")) return;
  const lot = DB.qmLots.find(l => l.id === id);
  if (!lot) return;
  askText("Block lot " + id, "Reason for blocking", (why) => {
    lot.status = "Blocked";
    lot.results = why;
    const gr = DB.grs.find(g => g.id === lot.gr);
    if (gr) gr.lines.forEach(l => { if (l.mid === lot.mid) l.qcOk = false; });
    toast(`Lot ${id} blocked.`, "info");
    loadPage("qm");
  });
}

function renderQM() {
  return `
    <div class="card">
      <div class="ch"><div class="ct">Inspection Lots</div></div>
      <div class="tw">
        <table>
          <tr><th>ID</th><th>GR</th><th>Material</th><th>Qty</th><th>Status</th><th>Result</th><th>Actions</th></tr>
          ${qmRows()}
        </table>
      </div>
      <div class="cf"><span>Goods with a failed lot cannot be posted to stock until the lot is released.</span></div>
    </div>
  `;
}

PAGE_RENDERERS.qm = renderQM;

/* ------------------------------------------------------------
   VENDOR EVALUATION ENGINE
   ------------------------------------------------------------ */
function evaluateVendor(vid) {
  const v = DB.vendorScores.find(x => x.vid === vid);
  if (!v) return "No score";

  const score = Math.round((v.delivery + v.quality + v.price) / 3);
  return score + "/100";
}

function vendorScoreNum(vid) {
  const v = DB.vendorScores.find(x => x.vid === vid);
  return v ? (v.delivery + v.quality + v.price) / 3 : 0;
}

/* ------------------------------------------------------------
   MRP LIVE ENGINE
   Need over the lead time = daily consumption x lead days + safety stock.
   Projected = stock + inbound (open PO balance + approved PRs) - need.
   Negative projected = shortage; the amount is the suggested order qty.
   ------------------------------------------------------------ */
function receivedQty(poId, mid) {
  return DB.grs
    .filter(g => g.pid === poId && g.status === "Posted")
    .reduce((s, g) => s + g.lines.filter(l => l.mid === mid).reduce((a, l) => a + Number(l.qty || 0), 0), 0);
}

function inboundQty(mid) {
  const onOrder = DB.pos
    .filter(p => p.status === "Open")
    .reduce((s, p) => s + p.items
      .filter(i => i.mid === mid)
      .reduce((a, i) => a + Math.max(0, i.qty - receivedQty(p.id, mid)), 0), 0);
  const approved = DB.prs
    .filter(r => r.mid === mid && r.status === "Approved")
    .reduce((s, r) => s + Number(r.qty || 0), 0);
  return onOrder + approved;
}

function runMRP(growth) {
  const g = growth || 1;
  return DB.materials.map(m => {
    const inbound = inboundQty(m.id);
    const need = Math.round(m.consumption * (m.lead || 0) * g + ((m.mrp && m.mrp.safetyStock) || 0));
    const projected = m.stock + inbound - need;
    const shortage = projected < 0;
    return {
      mid: m.id,
      stock: m.stock,
      inbound,
      need,
      projected,
      shortage,
      qty: shortage ? Math.ceil(-projected) : 0,
      action: shortage ? "Create PR" : "No Action"
    };
  });
}

/* ------------------------------------------------------------
   PREDICTIVE REORDER (simple rule: what if demand grows 10%?)
   ------------------------------------------------------------ */
function predictReorder(mid) {
  const p = runMRP(1.1).find(x => x.mid === mid);
  if (!p) return null;
  return p.shortage ? "Reorder Soon" : "Stock OK";
}

/* ------------------------------------------------------------
   SPEND ANALYTICS
   ------------------------------------------------------------ */
function totalSpend() {
  return DB.pos.reduce((s,p)=>s+p.value,0);
}

function vendorSpend(vid) {
  return DB.pos.filter(p=>p.vid===vid).reduce((s,p)=>s+p.value,0);
}

/* ------------------------------------------------------------
   ASK MATGRID (rule-based answers, not machine learning)
   ------------------------------------------------------------ */
function aiRespond(q) {
  q = (q || "").toLowerCase().trim();

  if (!q) return "Ask me about stock, spend, vendors, MRP, or invoices.";

  if (q.includes("low stock")) {
    const low = DB.materials.filter(m => m.stock < m.rop);
    if (!low.length) return "No materials are currently below reorder point.";
    return "Low stock materials: " + low.map(m => `${m.id} (${m.stock})`).join(", ");
  }

  if (q.includes("vendor")) {
    const match = q.match(/vendor\s+([a-z0-9]+)/i);
    const vid = match ? match[1].toUpperCase() : null;
    if (vid && DB.vendors.find(v => v.id === vid)) {
      return (
        "Vendor " + vid + " (" + venLabelRaw(vid) + ") spend: $" +
        vendorSpend(vid).toLocaleString() + " | Score: " + evaluateVendor(vid)
      );
    }
    return "I couldn't find that vendor ID. Try: vendor V001";
  }

  if (q.includes("invoice") || q.includes("overdue") || q.includes("exception")) {
    const ex = DB.invoices.filter(i => i.match !== "Matched");
    if (!ex.length) return "All invoices are matched.";
    return ex.length + " invoice(s) need attention: " + ex.map(i => `${i.id} (${i.match})`).join(", ");
  }

  if (q.includes("spend")) {
    return "Total spend is $" + totalSpend().toLocaleString();
  }

  if (q.includes("mrp") || q.includes("shortage")) {
    const shortages = runMRP().filter(p => p.shortage);
    if (!shortages.length) return "MRP: no shortages detected.";
    return "MRP shortages: " + shortages.map(s => `${s.mid} (order ${s.qty})`).join(", ");
  }

  return "I can answer about stock, spend, vendors (e.g. vendor V001), invoices and MRP shortages.";
}

function venLabelRaw(vid) {
  const v = DB.vendors.find(x => x.id === vid);
  return v ? v.name : vid;
}

PAGE_RENDERERS.ai = function () {
  return `
    <div class="card">
      <div class="ch"><div class="ct">Ask Matgrid</div></div>
      <div class="cb">
        <p class="t-muted" style="margin-bottom:10px">Examples: "low stock", "vendor V001", "invoice exceptions", "mrp shortages", "total spend".</p>
        <input id="ai-q" class="fi" placeholder="Ask about your procurement data..." onkeydown="if(event.key==='Enter')askAI()">
        <button class="btn btn-primary" onclick="askAI()">Ask</button>
        <div id="ai-a" style="margin-top:15px;color:var(--t2)"></div>
      </div>
    </div>
  `;
};

function askAI() {
  const q = el("ai-q").value;
  el("ai-a").textContent = aiRespond(q);
}
