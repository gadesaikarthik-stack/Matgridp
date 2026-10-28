/* ============================================================
   Matgrid – demo data
   DATABASE MODULE (Part 2)
   ============================================================ */

const DB = {

  /* ------------------------------------------------------------
     VENDORS
     ------------------------------------------------------------ */
  vendors: [
    {
      id: "V001", name: "Acme Industrial Supplies", country: "USA", currency: "USD",
      contact: "John Smith", email: "john@acme.com", phone: "+1-555-0101",
      terms: "Net30", rating: 4.5, status: "Active", cat: "Raw Materials",
      spend: 485000, onTime: 94, quality: 96, defect: 0.8, lead: 7,
      preferred: true, bank: "First National", iban: "US12345"
    },
    {
      id: "V002", name: "Global Tech Components", country: "China", currency: "USD",
      contact: "Li Wei", email: "li@globaltech.cn", phone: "+86-21-555",
      terms: "Net45", rating: 4.2, status: "Active", cat: "Electronics",
      spend: 920000, onTime: 89, quality: 91, defect: 2.1, lead: 21,
      preferred: false, bank: "Bank of China", iban: "CN98765"
    },
    {
      id: "V003", name: "EuroMetal GmbH", country: "Germany", currency: "EUR",
      contact: "Hans Mueller", email: "h.mueller@eurometal.de", phone: "+49-89-555",
      terms: "Net30", rating: 4.8, status: "Active", cat: "Metals",
      spend: 335000, onTime: 97, quality: 99, defect: 0.2, lead: 14,
      preferred: true, bank: "Deutsche Bank", iban: "DE893704"
    },
    {
      id: "V004", name: "Pacific Logistics Co", country: "Singapore", currency: "USD",
      contact: "Sarah Chen", email: "s.chen@paclog.sg", phone: "+65-6555",
      terms: "Net15", rating: 3.9, status: "Active", cat: "Logistics",
      spend: 215000, onTime: 82, quality: 88, defect: 0, lead: 3,
      preferred: false, bank: "DBS Bank", iban: "SG120003"
    },
    {
      id: "V005", name: "Apex Chemicals Ltd", country: "India", currency: "USD",
      contact: "Raj Patel", email: "r.patel@apex.in", phone: "+91-22-555",
      terms: "Net60", rating: 4.1, status: "On Hold", cat: "Chemicals",
      spend: 128000, onTime: 78, quality: 90, defect: 1.5, lead: 18,
      preferred: false, bank: "HDFC Bank", iban: "IN300020"
    },
    {
      id: "V006", name: "Nordic Precision AB", country: "Sweden", currency: "EUR",
      contact: "Erik Larsson", email: "e.larsson@nordic.se", phone: "+46-8-555",
      terms: "Net30", rating: 4.7, status: "Active", cat: "Precision Parts",
      spend: 198000, onTime: 96, quality: 98, defect: 0.3, lead: 10,
      preferred: true, bank: "Swedbank", iban: "SE355000"
    },
    {
      id: "V007", name: "Midwest Fasteners Co", country: "USA", currency: "USD",
      contact: "Dan Brooks", email: "d.brooks@mwfast.com", phone: "+1-555-0200",
      terms: "Net30", rating: 4.3, status: "Active", cat: "Fasteners",
      spend: 167000, onTime: 91, quality: 93, defect: 0.4, lead: 5,
      preferred: false, bank: "Chase", iban: "US550044"
    },
    {
      id: "V008", name: "Taiwan Semicon Ltd", country: "Taiwan", currency: "USD",
      contact: "Jenny Hsu", email: "j.hsu@twsemi.tw", phone: "+886-2-555",
      terms: "Net45", rating: 4.6, status: "Active", cat: "Electronics",
      spend: 640000, onTime: 90, quality: 95, defect: 1.2, lead: 28,
      preferred: true, bank: "CTBC", iban: "TW120099"
    },
    {
      id: "V009", name: "Monterrey Casting SA", country: "Mexico", currency: "USD",
      contact: "Carlos Rios", email: "c.rios@moncast.mx", phone: "+52-81-555",
      terms: "Net30", rating: 4.0, status: "Active", cat: "Metals",
      spend: 412000, onTime: 85, quality: 89, defect: 1.0, lead: 16,
      preferred: false, bank: "BBVA", iban: "MX400011"
    },
    {
      id: "V010", name: "UK Seals & Gaskets Ltd", country: "UK", currency: "GBP",
      contact: "Emma Price", email: "e.price@ukseals.co.uk", phone: "+44-20-555",
      terms: "Net30", rating: 4.5, status: "Active", cat: "Seals",
      spend: 95000, onTime: 95, quality: 97, defect: 0.1, lead: 9,
      preferred: true, bank: "Barclays", iban: "GB12BUKB"
    }
  ],

  /* ------------------------------------------------------------
     MATERIAL MASTER
     ------------------------------------------------------------ */
  materials: [
    {
      id: "M001", desc: "Steel Rod 20mm Grade A", cat: "Raw Material",
      unit: "KG", price: 2.45, stock: 4200, min: 1000, max: 8000, rop: 1500,
      plant: "PL01", sloc: "WH-A1", status: "Active", lead: 7, vendor: "V001",
      consumption: 320,
      purchasing: { orderUnit: "KG", infoRec: "PIR-001" },
      mrp: { type: "PD", lotSize: "FX", safetyStock: 200 },
      accounting: { valuationClass: "3000", priceControl: "S", stdPrice: 2.45 },
      storage: { temp: "Ambient", hazard: "None" }
    },
    {
      id: "M002", desc: "Hydraulic Pump HY-500", cat: "Spare Part",
      unit: "EA", price: 485, stock: 28, min: 10, max: 100, rop: 15,
      plant: "PL01", sloc: "WH-B3", status: "Active", lead: 21, vendor: "V002",
      consumption: 2,
      purchasing: { orderUnit: "EA", infoRec: "PIR-002" },
      mrp: { type: "PD", lotSize: "EX", safetyStock: 5 },
      accounting: { valuationClass: "4000", priceControl: "S", stdPrice: 485 },
      storage: { temp: "Ambient", hazard: "None" }
    },
    {
      id: "M003", desc: "Industrial Solvent ISO-C", cat: "Chemical",
      unit: "LT", price: 18.9, stock: 820, min: 500, max: 2000, rop: 600,
      plant: "PL02", sloc: "WH-C1", status: "Active", lead: 18, vendor: "V005",
      consumption: 85,
      purchasing: { orderUnit: "LT", infoRec: "PIR-003" },
      mrp: { type: "PD", lotSize: "FX", safetyStock: 200 },
      accounting: { valuationClass: "5000", priceControl: "S", stdPrice: 18.9 },
      storage: { temp: "Cool", hazard: "Flammable" }
    },
    {
      id: "M004", desc: "PCB Assembly Rev D 6-Layer", cat: "Electronics",
      unit: "EA", price: 124.5, stock: 45, min: 80, max: 500, rop: 100,
      plant: "PL01", sloc: "WH-E1", status: "Active", lead: 25, vendor: "V002",
      consumption: 12,
      purchasing: { orderUnit: "EA", infoRec: "PIR-004" },
      mrp: { type: "PD", lotSize: "EX", safetyStock: 30 },
      accounting: { valuationClass: "4000", priceControl: "S", stdPrice: 124.5 },
      storage: { temp: "Dry", hazard: "ESD" }
    },
    {
      id: "M005", desc: "Aluminum Sheet 5mm Rolled", cat: "Raw Material",
      unit: "KG", price: 4.2, stock: 12000, min: 3000, max: 25000, rop: 4000,
      plant: "PL01", sloc: "WH-A2", status: "Active", lead: 12, vendor: "V003",
      consumption: 800,
      purchasing: { orderUnit: "KG", infoRec: "PIR-005" },
      mrp: { type: "PD", lotSize: "FX", safetyStock: 500 },
      accounting: { valuationClass: "3000", priceControl: "S", stdPrice: 4.2 },
      storage: { temp: "Ambient", hazard: "None" }
    },
    {
      id: "M006", desc: "Safety Valve SV-200 Class 300", cat: "Spare Part",
      unit: "EA", price: 245, stock: 3, min: 8, max: 40, rop: 6,
      plant: "PL01", sloc: "WH-B1", status: "Active", lead: 14, vendor: "V006",
      consumption: 1,
      purchasing: { orderUnit: "EA", infoRec: "PIR-006" },
      mrp: { type: "PD", lotSize: "EX", safetyStock: 2 },
      accounting: { valuationClass: "4000", priceControl: "S", stdPrice: 245 },
      storage: { temp: "Ambient", hazard: "None" }
    },
    {
      id: "M007", desc: "Copper Busbars 120mm Tinned", cat: "Raw Material",
      unit: "KG", price: 9.2, stock: 2100, min: 500, max: 5000, rop: 800,
      plant: "PL01", sloc: "WH-A3", status: "Active", lead: 10, vendor: "V001",
      consumption: 45,
      purchasing: { orderUnit: "KG", infoRec: "PIR-007" },
      mrp: { type: "PD", lotSize: "FX", safetyStock: 100 },
      accounting: { valuationClass: "3000", priceControl: "S", stdPrice: 9.2 },
      storage: { temp: "Ambient", hazard: "None" }
    },
    {
      id: "M008", desc: "NBR Gasket 4in ANSI-150", cat: "Spare Part",
      unit: "EA", price: 12.4, stock: 400, min: 100, max: 2000, rop: 150,
      plant: "PL02", sloc: "WH-B2", status: "Active", lead: 6, vendor: "V010",
      consumption: 20,
      purchasing: { orderUnit: "EA", infoRec: "PIR-008" },
      mrp: { type: "PD", lotSize: "EX", safetyStock: 50 },
      accounting: { valuationClass: "4000", priceControl: "S", stdPrice: 12.4 },
      storage: { temp: "Ambient", hazard: "None" }
    },
    {
      id: "M009", desc: "Carbide Insert VNMG 16", cat: "Consumable",
      unit: "EA", price: 8.75, stock: 900, min: 200, max: 5000, rop: 300,
      plant: "PL01", sloc: "WH-D1", status: "Active", lead: 5, vendor: "V006",
      consumption: 150,
      purchasing: { orderUnit: "EA", infoRec: "PIR-009" },
      mrp: { type: "PD", lotSize: "FX", safetyStock: 100 },
      accounting: { valuationClass: "4000", priceControl: "S", stdPrice: 8.75 },
      storage: { temp: "Dry", hazard: "None" }
    },
    {
      id: "M010", desc: "HEPA Filter H13 600x600", cat: "Spare Part",
      unit: "EA", price: 188, stock: 18, min: 24, max: 100, rop: 20,
      plant: "PL02", sloc: "WH-F1", status: "Active", lead: 11, vendor: "V002",
      consumption: 3,
      purchasing: { orderUnit: "EA", infoRec: "PIR-010" },
      mrp: { type: "PD", lotSize: "EX", safetyStock: 4 },
      accounting: { valuationClass: "4000", priceControl: "S", stdPrice: 188 },
      storage: { temp: "Dry", hazard: "None" }
    },
    {
      id: "M011", desc: "Pneumatic Cylinder 100mm Bore", cat: "Spare Part",
      unit: "EA", price: 312, stock: 14, min: 6, max: 30, rop: 8,
      plant: "PL01", sloc: "WH-B4", status: "Active", lead: 15, vendor: "V008",
      consumption: 2,
      purchasing: { orderUnit: "EA", infoRec: "PIR-011" },
      mrp: { type: "PD", lotSize: "EX", safetyStock: 2 },
      accounting: { valuationClass: "4000", priceControl: "S", stdPrice: 312 },
      storage: { temp: "Ambient", hazard: "None" }
    },
    {
      id: "M012", desc: "Synthetic Oil ISO VG-68 20L", cat: "Lubricant",
      unit: "EA", price: 64.5, stock: 55, min: 20, max: 120, rop: 25,
      plant: "PL01", sloc: "WH-C2", status: "Active", lead: 8, vendor: "V001",
      consumption: 4,
      purchasing: { orderUnit: "EA", infoRec: "PIR-012" },
      mrp: { type: "PD", lotSize: "FX", safetyStock: 5 },
      accounting: { valuationClass: "5000", priceControl: "S", stdPrice: 64.5 },
      storage: { temp: "Ambient", hazard: "None" }
    },
    {
      id: "M013", desc: "Wire Harness 24AWG 12-Cond", cat: "Electronics",
      unit: "M", price: 3.1, stock: 2400, min: 500, max: 8000, rop: 1000,
      plant: "PL01", sloc: "WH-E2", status: "Active", lead: 19, vendor: "V008",
      consumption: 200,
      purchasing: { orderUnit: "M", infoRec: "PIR-013" },
      mrp: { type: "PD", lotSize: "FX", safetyStock: 300 },
      accounting: { valuationClass: "4000", priceControl: "S", stdPrice: 3.1 },
      storage: { temp: "Dry", hazard: "None" }
    },
    {
      id: "M014", desc: "Aluminum Ingot 99.7% Purity", cat: "Raw Material",
      unit: "KG", price: 2.9, stock: 18000, min: 5000, max: 30000, rop: 8000,
      plant: "PL02", sloc: "WH-A1", status: "Active", lead: 17, vendor: "V009",
      consumption: 1200,
      purchasing: { orderUnit: "KG", infoRec: "PIR-014" },
      mrp: { type: "PD", lotSize: "FX", safetyStock: 2000 },
      accounting: { valuationClass: "3000", priceControl: "S", stdPrice: 2.9 },
      storage: { temp: "Ambient", hazard: "None" }
    },
    {
      id: "M015", desc: "Forklift Pneumatic Tire 28x9-15", cat: "Spare Part",
      unit: "EA", price: 410, stock: 6, min: 4, max: 16, rop: 4,
      plant: "PL01", sloc: "WH-G1", status: "Active", lead: 22, vendor: "V004",
      consumption: 1,
      purchasing: { orderUnit: "EA", infoRec: "PIR-015" },
      mrp: { type: "PD", lotSize: "EX", safetyStock: 1 },
      accounting: { valuationClass: "4000", priceControl: "S", stdPrice: 410 },
      storage: { temp: "Ambient", hazard: "None" }
    }
  ],

  /* ------------------------------------------------------------
     PURCHASE REQUISITIONS
     ------------------------------------------------------------ */
  prs: [
    {
      id: "PR-2026-0234", req: "Mike Johnson", dept: "Manufacturing",
      date: "2026-04-01", mid: "M004", qty: 100, urg: "High",
      status: "Pending Approval", note: "Production line PCBs urgently needed",
      est: 12450, history: []
    },
    {
      id: "PR-2026-0235", req: "Sarah Lee", dept: "Maintenance",
      date: "2026-04-02", mid: "M006", qty: 20, urg: "Critical",
      status: "Approved", note: "Safety valves failing on line 3",
      est: 4900, history: [{ by: "Mgr", at: "2026-04-02", action: "Approved" }]
    },
    { id: "PR-2026-0240", req: "Tom Nguyen", dept: "Manufacturing", date: "2026-04-03", mid: "M001", qty: 8000, urg: "Normal", status: "Pending Approval", note: "Monthly steel pull", est: 19600, history: [] },
    { id: "PR-2026-0241", req: "Priya Nair", dept: "R&D", date: "2026-04-04", mid: "M010", qty: 24, urg: "High", status: "Rejected", note: "Budget cap Q2", est: 4512, history: [{ by: "Finance", at: "2026-04-05", action: "Rejected" }] },
    { id: "PR-2026-0242", req: "James Otte", dept: "Packaging", date: "2026-04-04", mid: "M012", qty: 40, urg: "Low", status: "Converted to PO", note: "Lube for PM schedule", est: 2580, history: [{ by: "Buyer", at: "2026-04-05", action: "→ PO-2026-1010" }] },
    { id: "PR-2026-0243", req: "Elena Voss", dept: "Maintenance", date: "2026-04-05", mid: "M002", qty: 2, urg: "Normal", status: "Approved", note: "Line 2 backup pump", est: 970, history: [{ by: "Mgr", at: "2026-04-05", action: "Approved" }] },
    { id: "PR-2026-0244", req: "Hiro Sato", dept: "Manufacturing", date: "2026-04-06", mid: "M009", qty: 2000, urg: "Normal", status: "Approved", note: "Tool crib carbide", est: 17500, history: [] },
    { id: "PR-2026-0245", req: "Marcus Green", dept: "Warehouse", date: "2026-04-07", mid: "M005", qty: 5000, urg: "Normal", status: "Approved", note: "Aluminum for extrusion", est: 21000, history: [{ by: "Mgr", at: "2026-04-07", action: "Approved" }] },
    { id: "PR-2026-0246", req: "Asha Kapoor", dept: "Quality", date: "2026-04-08", mid: "M003", qty: 400, urg: "High", status: "Approved", note: "Solvent for cleaning trial", est: 7560, history: [] },
    { id: "PR-2026-0247", req: "Chris Ward", dept: "Engineering", date: "2026-04-09", mid: "M011", qty: 6, urg: "Normal", status: "Approved", note: "Cylinder upgrade", est: 1872, history: [{ by: "Mgr", at: "2026-04-09", action: "Approved" }] },
    { id: "PR-2026-0248", req: "Nina Kovač", dept: "Manufacturing", date: "2026-04-10", mid: "M013", qty: 500, urg: "Low", status: "Approved", note: "Harness for panel build", est: 1550, history: [] },
    { id: "PR-2026-0249", req: "Omar Farid", dept: "Logistics", date: "2026-04-11", mid: "M015", qty: 2, urg: "Critical", status: "Approved", note: "Fork lift tire failure", est: 820, history: [{ by: "Mgr", at: "2026-04-11", action: "Approved" }] }
  ],

  /* ------------------------------------------------------------
     RFQ + BIDS
     ------------------------------------------------------------ */
  rfqs: [
    { id: "RFQ-2026-001", mid: "M004", qty: 500, date: "2026-04-10",
      status: "Open", bids: ["BID-001", "BID-002", "BID-003", "BID-003b"] },
    { id: "RFQ-2026-002", mid: "M002", qty: 4, date: "2026-04-12",
      status: "Awarded", bids: ["BID-004", "BID-005", "BID-006"] },
    { id: "RFQ-2026-003", mid: "M007", qty: 2000, date: "2026-04-15", status: "Open", bids: ["BID-007", "BID-008", "BID-009"] },
    { id: "RFQ-2026-004", mid: "M010", qty: 48, date: "2026-04-16", status: "Closed", bids: ["BID-010", "BID-011"] },
    { id: "RFQ-2026-005", mid: "M014", qty: 10000, date: "2026-04-18", status: "Open", bids: ["BID-012", "BID-013", "BID-014"] }
  ],

  bids: [
    { id: "BID-001", rfq: "RFQ-2026-001", vid: "V001", price: 122, lead: 20, terms: "Net30", score: 0 },
    { id: "BID-002", rfq: "RFQ-2026-001", vid: "V002", price: 124.5, lead: 21, terms: "Net45", score: 0 },
    { id: "BID-003", rfq: "RFQ-2026-001", vid: "V006", price: 119, lead: 14, terms: "Net30", score: 0 },
    { id: "BID-003b", rfq: "RFQ-2026-001", vid: "V008", price: 121, lead: 19, terms: "Net45", score: 0 },
    { id: "BID-004", rfq: "RFQ-2026-002", vid: "V002", price: 480, lead: 18, terms: "Net45", score: 0 },
    { id: "BID-005", rfq: "RFQ-2026-002", vid: "V001", price: 495, lead: 14, terms: "Net30", score: 0 },
    { id: "BID-006", rfq: "RFQ-2026-002", vid: "V006", price: 472, lead: 12, terms: "Net30", score: 0 },
    { id: "BID-007", rfq: "RFQ-2026-003", vid: "V001", price: 9.05, lead: 8, terms: "Net30", score: 0 },
    { id: "BID-008", rfq: "RFQ-2026-003", vid: "V003", price: 9.4, lead: 10, terms: "Net30", score: 0 },
    { id: "BID-009", rfq: "RFQ-2026-003", vid: "V009", price: 8.95, lead: 12, terms: "Net30", score: 0 },
    { id: "BID-010", rfq: "RFQ-2026-004", vid: "V002", price: 186, lead: 11, terms: "Net45", score: 0 },
    { id: "BID-011", rfq: "RFQ-2026-004", vid: "V010", price: 191, lead: 9, terms: "Net30", score: 0 },
    { id: "BID-012", rfq: "RFQ-2026-005", vid: "V003", price: 2.95, lead: 15, terms: "Net30", score: 0 },
    { id: "BID-013", rfq: "RFQ-2026-005", vid: "V009", price: 2.88, lead: 17, terms: "Net30", score: 0 },
    { id: "BID-014", rfq: "RFQ-2026-005", vid: "V001", price: 3.02, lead: 10, terms: "Net30", score: 0 }
  ],

  /* ------------------------------------------------------------
     PURCHASE ORDERS
     ------------------------------------------------------------ */
  pos: [
    {
      id: "PO-2024-0891", vid: "V001", date: "2024-03-01", del: "2024-03-15",
      value: 1225, items: [{ mid: "M001", qty: 500, price: 2.45 }],
      status: "Open", cur: "USD", plant: "PL01", terms: "Net30"
    },
    {
      id: "PO-2026-1002", vid: "V002", date: "2026-04-14", del: "2026-04-28",
      value: 1940, items: [{ mid: "M002", qty: 4, price: 485 }],
      status: "Open", cur: "USD", plant: "PL01", terms: "Net45"
    },
    { id: "PO-2026-1005", vid: "V003", date: "2026-04-01", del: "2026-04-20", value: 126000, items: [{ mid: "M005", qty: 30000, price: 4.2 }], status: "Open", cur: "USD", plant: "PL01", terms: "Net30" },
    { id: "PO-2026-1006", vid: "V006", date: "2026-04-02", del: "2026-04-12", value: 42000, items: [{ mid: "M009", qty: 4800, price: 8.75 }], status: "Open", cur: "USD", plant: "PL01", terms: "Net30" },
    { id: "PO-2026-1007", vid: "V005", date: "2026-04-05", del: "2026-04-19", value: 15120, items: [{ mid: "M003", qty: 800, price: 18.9 }], status: "Open", cur: "USD", plant: "PL02", terms: "Net60" },
    { id: "PO-2026-1008", vid: "V010", date: "2026-04-08", del: "2026-04-18", value: 6200, items: [{ mid: "M008", qty: 500, price: 12.4 }], status: "Open", cur: "USD", plant: "PL02", terms: "Net30" },
    { id: "PO-2025-2011", vid: "V004", date: "2025-11-20", del: "2025-12-10", value: 820, items: [{ mid: "M015", qty: 2, price: 410 }], status: "Closed", cur: "USD", plant: "PL01", terms: "Net15" },
    { id: "PO-2025-2012", vid: "V008", date: "2025-10-12", del: "2025-11-01", value: 93600, items: [{ mid: "M013", qty: 30000, price: 3.12 }], status: "Closed", cur: "USD", plant: "PL01", terms: "Net45" },
    { id: "PO-2026-1009", vid: "V009", date: "2026-04-10", del: "2026-04-30", value: 34800, items: [{ mid: "M014", qty: 12000, price: 2.9 }], status: "Open", cur: "USD", plant: "PL02", terms: "Net30" },
    { id: "PO-2026-1010", vid: "V007", date: "2026-04-12", del: "2026-04-25", value: 18400, items: [{ mid: "M007", qty: 2000, price: 9.2 }], status: "Open", cur: "USD", plant: "PL01", terms: "Net30" }
  ],

  /* ------------------------------------------------------------
     CONTRACTS
     ------------------------------------------------------------ */
  contracts: [
    { id: "CTR-2024-001", vid: "V003", mid: "M005", price: 4.2, start: "2024-01-01", end: "2026-12-31", qty: 50000, callOff: [] },
    { id: "CTR-2025-014", vid: "V001", mid: "M001", price: 2.45, start: "2025-01-01", end: "2027-12-31", qty: 200000, callOff: [] },
    { id: "CTR-2025-015", vid: "V002", mid: "M004", price: 124.0, start: "2025-06-01", end: "2026-12-31", qty: 10000, callOff: [] },
    { id: "CTR-2026-003", vid: "V010", mid: "M008", price: 12.4, start: "2026-01-01", end: "2026-12-31", qty: 15000, callOff: [] },
    { id: "CTR-2026-004", vid: "V006", mid: "M009", price: 8.75, start: "2026-01-15", end: "2027-12-31", qty: 100000, callOff: [] },
    { id: "CTR-2026-005", vid: "V005", mid: "M003", price: 18.9, start: "2026-04-01", end: "2027-03-31", qty: 40000, callOff: [] }
  ],

  /* ------------------------------------------------------------
     SCHEDULING AGREEMENTS
     ------------------------------------------------------------ */
  scheduling: [
    {
      id: "SA-2024-001", vid: "V001", mid: "M001",
      schedule: [
        { date: "2026-04-15", qty: 2000 },
        { date: "2026-05-15", qty: 2200 },
        { date: "2026-06-15", qty: 2400 }
      ]
    },
    { id: "SA-2026-002", vid: "V003", mid: "M005", schedule: [{ date: "2026-04-20", qty: 8000 }, { date: "2026-05-20", qty: 8000 }, { date: "2026-06-20", qty: 9000 }] },
    { id: "SA-2026-003", vid: "V002", mid: "M002", schedule: [{ date: "2026-04-25", qty: 8 }, { date: "2026-05-25", qty: 10 }] },
    { id: "SA-2026-004", vid: "V010", mid: "M008", schedule: [{ date: "2026-05-01", qty: 200 }, { date: "2026-06-01", qty: 200 }] }
  ],

  /* ------------------------------------------------------------
     SOURCE LIST
     ------------------------------------------------------------ */
  sourceList: [
    { mid: "M001", vid: "V001", validFrom: "2024-01-01", validTo: "2027-12-31", fixed: true },
    { mid: "M001", vid: "V003", validFrom: "2024-01-01", validTo: "2026-12-31", fixed: false },
    { mid: "M002", vid: "V002", validFrom: "2025-01-01", validTo: "2027-12-31", fixed: true },
    { mid: "M002", vid: "V006", validFrom: "2025-06-01", validTo: "2026-12-31", fixed: false },
    { mid: "M003", vid: "V005", validFrom: "2024-01-01", validTo: "2027-12-31", fixed: true },
    { mid: "M004", vid: "V002", validFrom: "2025-01-01", validTo: "2027-12-31", fixed: true },
    { mid: "M005", vid: "V003", validFrom: "2024-01-01", validTo: "2027-12-31", fixed: true },
    { mid: "M005", vid: "V009", validFrom: "2025-01-01", validTo: "2026-12-31", fixed: false },
    { mid: "M007", vid: "V001", validFrom: "2026-01-01", validTo: "2027-12-31", fixed: true },
    { mid: "M010", vid: "V002", validFrom: "2026-01-01", validTo: "2027-06-30", fixed: true },
    { mid: "M014", vid: "V003", validFrom: "2026-01-01", validTo: "2027-12-31", fixed: true }
  ],

  /* ------------------------------------------------------------
     QUOTA ARRANGEMENT
     ------------------------------------------------------------ */
  quota: [
    { mid: "M001", vid: "V001", quota: 60 },
    { mid: "M001", vid: "V003", quota: 40 },
    { mid: "M002", vid: "V002", quota: 70 },
    { mid: "M002", vid: "V006", quota: 30 },
    { mid: "M005", vid: "V003", quota: 55 },
    { mid: "M005", vid: "V009", quota: 45 },
    { mid: "M014", vid: "V003", quota: 50 },
    { mid: "M014", vid: "V009", quota: 50 }
  ],

  /* ------------------------------------------------------------
     STOCK TRANSFER ORDERS
     ------------------------------------------------------------ */
  stos: [
    { id: "STO-2024-001", from: "PL01", to: "PL02", mid: "M001", qty: 1500, status: "In Transit" },
    { id: "STO-2026-012", from: "PL02", to: "PL01", mid: "M003", qty: 200, status: "Posted" },
    { id: "STO-2026-013", from: "PL01", to: "PL02", mid: "M007", qty: 500, status: "Picking" },
    { id: "STO-2026-014", from: "PL01", to: "PL02", mid: "M009", qty: 800, status: "In Transit" },
    { id: "STO-2026-015", from: "PL02", to: "PL01", mid: "M012", qty: 24, status: "Draft" }
  ],

  /* ------------------------------------------------------------
     GOODS RECEIPT / GOODS ISSUE
     ------------------------------------------------------------ */
  grs: [
    {
      id: "GR-2024-0456", pid: "PO-2024-0891", vid: "V001",
      date: "2024-03-18",
      lines: [{ mid: "M001", qty: 500, qcOk: true }],
      status: "Posted", inspector: "Mark T.", dn: "DN-1235"
    },
    { id: "GR-2026-0501", pid: "PO-2026-1005", vid: "V003", date: "2026-04-11", lines: [{ mid: "M005", qty: 3000, qcOk: true }], status: "Posted", inspector: "L. Chen", dn: "DN-2026-4401" },
    { id: "GR-2026-0502", pid: "PO-2026-1006", vid: "V006", date: "2026-04-12", lines: [{ mid: "M009", qty: 2400, qcOk: true }], status: "Posted", inspector: "L. Chen", dn: "DN-2026-4402" },
    { id: "GR-2026-0503", pid: "PO-2026-1008", vid: "V010", date: "2026-04-14", lines: [{ mid: "M008", qty: 500, qcOk: false }], status: "Hold-QC", inspector: "R. Patel", dn: "DN-2026-4403" },
    { id: "GR-2026-0504", pid: "PO-2026-1009", vid: "V009", date: "2026-04-15", lines: [{ mid: "M014", qty: 6000, qcOk: true }], status: "Posted", inspector: "Mark T.", dn: "DN-2026-4404" },
    { id: "GR-2026-0505", pid: "PO-2026-1010", vid: "V007", date: "2026-04-16", lines: [{ mid: "M007", qty: 2000, qcOk: true }], status: "Posted", inspector: "K. Ruiz", dn: "DN-2026-4405" }
  ],

  gis: [
    { id: "GI-2024-0101", mid: "M001", qty: 200, plant: "PL01", date: "2024-03-10", reason: "Production Consumption" },
    { id: "GI-2026-0201", mid: "M001", qty: 350, plant: "PL01", date: "2026-04-02", reason: "Production Consumption" },
    { id: "GI-2026-0202", mid: "M003", qty: 120, plant: "PL02", date: "2026-04-03", reason: "Cleaning line" },
    { id: "GI-2026-0203", mid: "M009", qty: 400, plant: "PL01", date: "2026-04-05", reason: "CNC Cell 3" },
    { id: "GI-2026-0204", mid: "M005", qty: 2500, plant: "PL01", date: "2026-04-06", reason: "Extrusion line" },
    { id: "GI-2026-0205", mid: "M002", qty: 1, plant: "PL01", date: "2026-04-08", reason: "Pump replacement" },
    { id: "GI-2026-0206", mid: "M013", qty: 800, plant: "PL01", date: "2026-04-09", reason: "Panel assembly" },
    { id: "GI-2026-0207", mid: "M012", qty: 8, plant: "PL01", date: "2026-04-10", reason: "PM kit issue" }
  ],

  /* ------------------------------------------------------------
     QUALITY MANAGEMENT
     ------------------------------------------------------------ */
  qmLots: [
    { id: "QM-2024-001", gr: "GR-2024-0456", mid: "M001", qty: 500, status: "Released", results: "Pass" },
    { id: "QM-2026-101", gr: "GR-2026-0503", mid: "M008", qty: 500, status: "Inspection", results: null },
    { id: "QM-2026-102", gr: "GR-2026-0501", mid: "M005", qty: 3000, status: "Released", results: "Pass" },
    { id: "QM-2026-103", gr: "GR-2026-0502", mid: "M009", qty: 2400, status: "Blocked", results: "Dim variance" },
    { id: "QM-2026-104", gr: "GR-2026-0504", mid: "M014", qty: 6000, status: "Sampling", results: null }
  ],

  /* ------------------------------------------------------------
     BATCH MANAGEMENT
     ------------------------------------------------------------ */
  batches: [
    { batch: "BATCH-001", mid: "M003", mfg: "2024-02-01", exp: "2025-02-01", qty: 300 },
    { batch: "BATCH-002", mid: "M003", mfg: "2026-01-15", exp: "2027-01-15", qty: 520 },
    { batch: "BAT-M005-88", mid: "M005", mfg: "2026-03-01", exp: "—", qty: 8000 },
    { batch: "BAT-M012-01", mid: "M012", mfg: "2026-02-10", exp: "2028-02-10", qty: 40 },
    { batch: "BAT-M014-AB", mid: "M014", mfg: "2026-04-01", exp: "—", qty: 12000 },
    { batch: "BAT-M001-99", mid: "M001", mfg: "2025-11-20", exp: "—", qty: 2100 }
  ],

  /* ------------------------------------------------------------
     SERIAL NUMBER TRACKING
     ------------------------------------------------------------ */
  serials: [
    { serial: "SN-5001", mid: "M002", status: "Installed", location: "Machine M-14" },
    { serial: "SN-5002", mid: "M002", status: "In Stock", location: "WH-B3" },
    { serial: "SN-6100", mid: "M011", status: "Installed", location: "Press P-3" },
    { serial: "SN-6101", mid: "M011", status: "In Stock", location: "WH-B4" },
    { serial: "SN-7201", mid: "M002", status: "Scrapped", location: "QA hold" },
    { serial: "SN-8300", mid: "M015", status: "Installed", location: "FL-01" },
    { serial: "SN-9100", mid: "M010", status: "In Stock", location: "WH-F1" },
    { serial: "SN-9101", mid: "M010", status: "Reserved", location: "WH-F1" }
  ],

  /* ------------------------------------------------------------
     SUBCONTRACTING
     ------------------------------------------------------------ */
  subcontracting: [
    { id: "SUB-2024-001", vid: "V006", fg: "FG-1001", components: [{ mid: "M001", qty: 200 }], qty: 50, status: "Open" },
    { id: "SUB-2026-002", vid: "V009", fg: "FG-2044", components: [{ mid: "M014", qty: 500 }], qty: 120, status: "In Process" },
    { id: "SUB-2026-003", vid: "V006", fg: "FG-2100", components: [{ mid: "M009", qty: 800 }], qty: 200, status: "Open" },
    { id: "SUB-2026-004", vid: "V002", fg: "FG-1888", components: [{ mid: "M004", qty: 50 }], qty: 80, status: "Closed" }
  ],

  /* ------------------------------------------------------------
     SERVICE PROCUREMENT
     ------------------------------------------------------------ */
  services: [
    { id: "SRV-2024-001", desc: "Machine Calibration", vendor: "V004", uom: "AU", price: 1500, status: "Active" },
    { id: "SRV-2026-010", desc: "Lift Truck Annual Inspection", vendor: "V004", uom: "EA", price: 890, status: "Active" },
    { id: "SRV-2026-011", desc: "HVAC Duct Clean PL02", vendor: "V001", uom: "LS", price: 4200, status: "Ordered" },
    { id: "SRV-2026-012", desc: "Calibration Mass Set", vendor: "V010", uom: "EA", price: 2100, status: "Active" },
    { id: "SRV-2026-013", desc: "Waste Hauling Q2", vendor: "V004", uom: "MO", price: 3800, status: "Active" },
    { id: "SRV-2026-014", desc: "IT Support — MRP Interface", vendor: "V008", uom: "MO", price: 12000, status: "Draft" }
  ],

  /* ------------------------------------------------------------
     PURCHASING INFO RECORDS
     ------------------------------------------------------------ */
  infoRecords: [
    { id: "PIR-001", vid: "V001", mid: "M001", price: 2.45, lastPO: "PO-2024-0891", lead: 7, terms: "Net30" },
    { id: "PIR-002", vid: "V002", mid: "M002", price: 485, lastPO: "PO-2026-1002", lead: 21, terms: "Net45" },
    { id: "PIR-003", vid: "V005", mid: "M003", price: 18.9, lastPO: "PO-2026-1007", lead: 18, terms: "Net60" },
    { id: "PIR-004", vid: "V002", mid: "M004", price: 124.5, lastPO: "—", lead: 25, terms: "Net45" },
    { id: "PIR-005", vid: "V003", mid: "M005", price: 4.2, lastPO: "PO-2026-1005", lead: 12, terms: "Net30" },
    { id: "PIR-006", vid: "V006", mid: "M006", price: 245, lastPO: "—", lead: 14, terms: "Net30" },
    { id: "PIR-007", vid: "V001", mid: "M007", price: 9.2, lastPO: "PO-2026-1010", lead: 10, terms: "Net30" },
    { id: "PIR-008", vid: "V010", mid: "M008", price: 12.4, lastPO: "PO-2026-1008", lead: 6, terms: "Net30" },
    { id: "PIR-009", vid: "V006", mid: "M009", price: 8.75, lastPO: "PO-2026-1006", lead: 5, terms: "Net30" },
    { id: "PIR-010", vid: "V002", mid: "M010", price: 188, lastPO: "—", lead: 11, terms: "Net45" },
    { id: "PIR-011", vid: "V008", mid: "M011", price: 312, lastPO: "—", lead: 15, terms: "Net45" },
    { id: "PIR-012", vid: "V001", mid: "M012", price: 64.5, lastPO: "—", lead: 8, terms: "Net30" },
    { id: "PIR-013", vid: "V008", mid: "M013", price: 3.1, lastPO: "PO-2025-2012", lead: 19, terms: "Net45" },
    { id: "PIR-014", vid: "V009", mid: "M014", price: 2.9, lastPO: "PO-2026-1009", lead: 17, terms: "Net30" },
    { id: "PIR-015", vid: "V004", mid: "M015", price: 410, lastPO: "PO-2025-2011", lead: 22, terms: "Net15" }
  ],

  /* ------------------------------------------------------------
     VENDOR EVALUATION
     ------------------------------------------------------------ */
  vendorScores: [
    { vid: "V001", delivery: 94, quality: 96, price: 88, overall: 92 },
    { vid: "V002", delivery: 89, quality: 91, price: 85, overall: 88 },
    { vid: "V003", delivery: 97, quality: 99, price: 82, overall: 93 },
    { vid: "V004", delivery: 82, quality: 88, price: 90, overall: 86 },
    { vid: "V005", delivery: 78, quality: 90, price: 92, overall: 85 },
    { vid: "V006", delivery: 96, quality: 98, price: 87, overall: 94 },
    { vid: "V007", delivery: 91, quality: 93, price: 89, overall: 91 },
    { vid: "V008", delivery: 90, quality: 95, price: 84, overall: 90 },
    { vid: "V009", delivery: 85, quality: 89, price: 91, overall: 88 },
    { vid: "V010", delivery: 95, quality: 97, price: 86, overall: 93 }
  ],

  /* ------------------------------------------------------------
     ACCOUNTING JOURNAL
     ------------------------------------------------------------ */
  journal: [
    { id: "JR-2024-001", type: "GR", ref: "GR-2024-0456", dr: "Inventory", cr: "GR/IR", amount: 1225, date: "2024-03-18" },
    { id: "JR-2026-201", type: "GR", ref: "GR-2026-0501", dr: "Inventory", cr: "GR/IR", amount: 12600, date: "2026-04-11" },
    { id: "JR-2026-202", type: "GI", ref: "GI-2026-0204", dr: "COGS", cr: "Inventory", amount: 10500, date: "2026-04-06" },
    { id: "JR-2026-203", type: "INV", ref: "INV-2026-0142", dr: "GR/IR", cr: "AP - V001", amount: 1225, date: "2026-04-12" },
    { id: "JR-2026-204", type: "Pay", ref: "PAY-2026-0071", dr: "AP - V003", cr: "Cash", amount: 8800, date: "2026-04-01" },
    { id: "JR-2026-205", type: "STO", ref: "STO-2026-012", dr: "Inv PL01", cr: "Inv PL02", amount: 3780, date: "2026-04-13" },
    { id: "JR-2026-206", type: "Accr", ref: "SVC-030", dr: "Maint Exp", cr: "AP Accrual", amount: 4200, date: "2026-04-10" }
  ],

  /* ------------------------------------------------------------
     INVOICES (3-way match demo)
     ------------------------------------------------------------ */
  invoices: [
    { id: "INV-2026-0142", po: "PO-2024-0891", vid: "V001", mid: "M001", qty: 500, amount: 1225, date: "2026-04-12", match: "Matched", gr: "GR-2024-0456", due: "2026-05-12" },
    { id: "INV-2026-0201", po: "PO-2026-1002", vid: "V002", mid: "M002", qty: 4, amount: 1940, date: "2026-04-16", match: "Pending GR", gr: null, due: "2026-05-16" },
    { id: "INV-2026-0098", po: "—", vid: "V003", mid: "M005", qty: 2000, amount: 8400, date: "2026-04-08", match: "Blocked", gr: "—", due: "2026-05-08" },
    { id: "INV-2025-1200", legacy: true, po: "—", vid: "V003", mid: "M005", qty: 2200, amount: 8800, date: "2025-12-10", match: "Matched", gr: "—", due: "2026-01-10" },
    { id: "INV-2026-0300", po: "PO-2026-1005", vid: "V003", mid: "M005", qty: 3000, amount: 12600, date: "2026-04-14", match: "Matched", gr: "GR-2026-0501", due: "2026-05-14" },
    { id: "INV-2026-0301", po: "PO-2026-1006", vid: "V006", mid: "M009", qty: 2400, amount: 21000, date: "2026-04-15", match: "Variance", gr: "GR-2026-0502", due: "2026-05-15" },
    { id: "INV-2026-0302", po: "PO-2026-1008", vid: "V010", mid: "M008", qty: 500, amount: 6200, date: "2026-04-16", match: "On Hold", gr: "GR-2026-0503", due: "2026-05-16" },
    { id: "INV-2026-0303", po: "PO-2026-1009", vid: "V009", mid: "M014", qty: 6000, amount: 17400, date: "2026-04-17", match: "Matched", gr: "GR-2026-0504", due: "2026-05-17" },
    { id: "INV-2026-0304", po: "PO-2026-1010", vid: "V007", mid: "M007", qty: 2000, amount: 18400, date: "2026-04-18", match: "Matched", gr: "GR-2026-0505", due: "2026-05-18" },
    { id: "INV-2026-0180", legacy: true, po: "PO-2025-2012", vid: "V008", mid: "M013", qty: 30000, amount: 93600, date: "2025-12-20", match: "Matched", gr: "—", due: "2026-01-20" }
  ],

  /* ------------------------------------------------------------
     PAYMENTS
     ------------------------------------------------------------ */
  payments: [
    { id: "PAY-2026-0071", inv: "INV-2025-1200", vid: "V003", amount: 8800, date: "2026-04-01", method: "Wire", status: "Cleared", ref: "TXN-778821" },
    { id: "PAY-2026-0088", inv: "INV-2026-0142", vid: "V001", amount: 1225, date: "2026-04-18", method: "ACH", status: "Scheduled", ref: "ACH-PENDING-01" },
    { id: "PAY-2026-0102", inv: "INV-2026-0201", vid: "V002", amount: 1940, date: "2026-04-22", method: "ACH", status: "Scheduled", ref: "—" },
    { id: "PAY-2026-0110", inv: "INV-2026-0300", vid: "V003", amount: 12600, date: "2026-04-20", method: "Wire", status: "Scheduled", ref: "TXN-889102" },
    { id: "PAY-2026-0111", inv: "INV-2026-0303", vid: "V009", amount: 17400, date: "2026-04-25", method: "ACH", status: "Scheduled", ref: "ACH-99201" },
    { id: "PAY-2026-0112", inv: "INV-2026-0304", vid: "V007", amount: 18400, date: "2026-04-24", method: "ACH", status: "Cleared", ref: "ACH-770012" },
    { id: "PAY-2026-0113", inv: "INV-2026-0180", vid: "V008", amount: 93600, date: "2025-12-22", method: "Wire", status: "Cleared", ref: "TXN-661200" },
    { id: "PAY-2026-0114", inv: "INV-2026-0301", vid: "V006", amount: 21000, date: "2026-04-30", method: "ACH", status: "Blocked", ref: "—" }
  ]
};

/* Page renderers are registered in modules_v2 / advanced_v2; must exist before those scripts run */
const PAGE_RENDERERS = {};

/* Demo only: shift all sample dates so the newest one lands on today.
   Keeps month-to-date spend, overdue flags and contract status realistic. */
(function rebaseDemoDates() {
  const NEWEST = Date.UTC(2026, 3, 18);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - NEWEST) / 864e5);
  if (days <= 0) return;
  const shift = (str) => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d) + days * 864e5).toISOString().slice(0, 10);
  };
  (function walk(o) {
    for (const k in o) {
      const v = o[k];
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) o[k] = shift(v);
      else if (v && typeof v === "object") walk(v);
    }
  })(DB);
})();
