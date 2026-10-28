/* ============================================================
   Matgrid – per-company configuration (first step toward
   customising the product per customer without forking code)
   ============================================================ */
const CONFIG_DEFAULTS = {
  company: "Demo Company",
  currency: "USD",
  priceTolerancePct: 2,        // 3-way match: allowed invoice vs PO price gap
  managerApprovalLimit: 10000, // PRs above this need a Manager; Critical also needs Director
  modules: {                   // switch whole areas on/off per customer
    rfq: true, contracts: true, sa: true, subcontracting: true, services: true,
    sto: true, qm: true, payment: true, journal: true,
    pir: true, source: true, quota: true, mrp: true, analytics: true, ai: true,
  },
};

const CONFIG = (function load() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("matgrid_config") || "{}"); } catch (e) {}
  return {
    ...CONFIG_DEFAULTS,
    ...saved,
    modules: { ...CONFIG_DEFAULTS.modules, ...(saved.modules || {}) },
  };
})();

function saveConfig() {
  try { localStorage.setItem("matgrid_config", JSON.stringify(CONFIG)); } catch (e) {}
}

function moduleOn(page) {
  return CONFIG.modules[page] !== false;
}

/* Who may do what. admin also acts as Director. */
const PERMS = {
  approvePR: ["admin", "manager"],
  createPR: ["admin", "manager", "buyer", "warehouse", "ap"],
  convertPO: ["admin", "manager", "buyer"],
  awardRFQ: ["admin", "manager", "buyer"],
  closePO: ["admin", "manager", "buyer"],
  warehouse: ["admin", "warehouse"],
  qm: ["admin", "warehouse"],
  ap: ["admin", "ap"],
  overrideInvoice: ["admin"],
  vendorStatus: ["admin", "manager"],
  settings: ["admin"],
};
