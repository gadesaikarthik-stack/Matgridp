import express from "express";
import { tx, audit, STOCK_SQL } from "./db.js";
import { hashPassword, verifyPassword, sha256, newToken, can, tooManyLogins } from "./auth.js";

const SESSION_MS = 12 * 3600 * 1000;
const COOKIE = "mg_session";
const num = (v) => (typeof v === "number" ? v : Number(v));

export function createApp(db, { secureCookie = false } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  const cookieOf = (req) => {
    const m = (req.headers.cookie || "").match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
    return m ? m[1] : null;
  };

  // Attach req.user from the session cookie.
  app.use((req, _res, next) => {
    const t = cookieOf(req);
    if (t) {
      req.user = db.prepare(
        `SELECT u.id, u.company_id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`
      ).get(sha256(t), Date.now());
    }
    next();
  });

  const needUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: "Login required" }));
  const need = (action) => (req, res, next) =>
    can(req.user.role, action) ? next() : res.status(403).json({ error: `Role '${req.user.role}' may not do this` });
  const wrap = (fn) => (req, res) => {
    try { fn(req, res); }
    catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message, ...(e.extra || {}) });
      if (String(e.message).includes("UNIQUE")) return res.status(409).json({ error: "Duplicate SKU or barcode" });
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  };
  const fail = (status, message, extra) => Object.assign(new Error(message), { status, extra });

  // ---------- auth ----------
  app.post("/api/auth/login", wrap((req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") throw fail(400, "Email and password required");
    if (tooManyLogins(`${req.ip}|${email.toLowerCase()}`)) throw fail(429, "Too many attempts, try later");
    const u = db.prepare("SELECT * FROM users WHERE email = ? AND active = 1").get(email.toLowerCase());
    if (!u || !verifyPassword(password, u.pw_hash)) {
      if (u) audit(db, u, "login_failed", "user", u.id);
      throw fail(401, "Wrong email or password");
    }
    const token = newToken();
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)").run(sha256(token), u.id, Date.now() + SESSION_MS);
    audit(db, u, "login", "user", u.id);
    res.setHeader("Set-Cookie", `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS / 1000}${secureCookie ? "; Secure" : ""}`);
    res.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
  }));

  app.post("/api/auth/logout", needUser, wrap((req, res) => {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(cookieOf(req)));
    audit(db, req.user, "logout", "user", req.user.id);
    res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
    res.json({ ok: true });
  }));

  app.get("/api/me", needUser, wrap((req, res) => {
    const c = db.prepare("SELECT id, name, config FROM companies WHERE id = ?").get(req.user.company_id);
    res.json({ user: req.user, company: { id: c.id, name: c.name }, config: JSON.parse(c.config) });
  }));

  // ---------- per-company config ----------
  app.put("/api/config", needUser, need("settings"), wrap((req, res) => {
    const cfg = req.body?.config;
    if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) throw fail(400, "config object required");
    db.prepare("UPDATE companies SET config = ? WHERE id = ?").run(JSON.stringify(cfg), req.user.company_id);
    audit(db, req.user, "update", "config", req.user.company_id, cfg);
    res.json({ ok: true });
  }));

  // ---------- users (admin) ----------
  app.post("/api/users", needUser, need("users"), wrap((req, res) => {
    const { email, name, role, password } = req.body || {};
    if (!email || !name || !password || String(password).length < 8) throw fail(400, "email, name and a password of 8+ characters required");
    const r = db.prepare("INSERT INTO users (company_id, email, name, role, pw_hash) VALUES (?,?,?,?,?)")
      .run(req.user.company_id, String(email).toLowerCase(), name, role, hashPassword(password));
    audit(db, req.user, "create", "user", r.lastInsertRowid, { email, role });
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  }));

  // ---------- materials ----------
  const matSelect = `SELECT id, sku, barcode, description, category, unit, price, min_stock, reorder_point, max_stock, ${STOCK_SQL} AS stock FROM materials`;

  app.get("/api/materials", needUser, wrap((req, res) => {
    res.json(db.prepare(`${matSelect} WHERE company_id = ? ORDER BY sku`).all(req.user.company_id));
  }));

  app.get("/api/materials/by-barcode/:code", needUser, wrap((req, res) => {
    const m = db.prepare(`${matSelect} WHERE company_id = ? AND barcode = ?`).get(req.user.company_id, req.params.code);
    if (!m) throw fail(404, "Unknown barcode", { unknown: true, barcode: req.params.code });
    res.json(m);
  }));

  function createMaterial(user, b) {
    if (!b.sku || !b.description) throw fail(400, "sku and description required");
    const r = db.prepare(
      "INSERT INTO materials (company_id, sku, barcode, description, category, unit, price, min_stock, reorder_point, max_stock) VALUES (?,?,?,?,?,?,?,?,?,?)"
    ).run(user.company_id, String(b.sku), b.barcode ? String(b.barcode) : null, String(b.description),
      b.category || "General", b.unit || "EA", num(b.price) || 0, num(b.min_stock) || 0, num(b.reorder_point) || 0, num(b.max_stock) || 0);
    audit(db, user, "create", "material", r.lastInsertRowid, { sku: b.sku, barcode: b.barcode || null });
    return Number(r.lastInsertRowid);
  }

  app.post("/api/materials", needUser, need("createMaterial"), wrap((req, res) => {
    const id = tx(db, () => createMaterial(req.user, req.body || {}));
    res.status(201).json({ id });
  }));

  // ---------- stock ----------
  function move(user, materialId, type, qty, ref, note) {
    const q = num(qty);
    if (!Number.isFinite(q) || q <= 0) throw fail(400, "qty must be a positive number");
    const m = db.prepare(`${matSelect} WHERE id = ? AND company_id = ?`).get(materialId, user.company_id);
    if (!m) throw fail(404, "Material not found");
    const signed = type === "GI" ? -q : q;
    if (m.stock + signed < 0) throw fail(409, `Only ${m.stock} ${m.unit} in stock`, { stock: m.stock });
    const r = db.prepare("INSERT INTO stock_movements (company_id, material_id, type, qty, ref, note, user_id) VALUES (?,?,?,?,?,?,?)")
      .run(user.company_id, m.id, type, signed, ref || null, note || null, user.id);
    audit(db, user, type, "stock", r.lastInsertRowid, { sku: m.sku, qty: signed, ref: ref || null });
    return { movement_id: Number(r.lastInsertRowid), sku: m.sku, stock: m.stock + signed };
  }

  app.post("/api/stock", needUser, need("moveStock"), wrap((req, res) => {
    const { material_id, type, qty, ref, note } = req.body || {};
    if (!["GR", "GI"].includes(type)) throw fail(400, "type must be GR (receipt) or GI (issue)");
    res.status(201).json(tx(db, () => move(req.user, material_id, type, qty, ref, note)));
  }));

  // ---------- barcode scan ----------
  // Known code -> stock movement. Unknown code -> 404 {unknown:true} until the client sends `register`,
  // which creates the material (barcode attached) and books the opening receipt.
  app.post("/api/scan", needUser, need("moveStock"), wrap((req, res) => {
    const { barcode, mode = "receive", qty = 1, register, ref } = req.body || {};
    const code = String(barcode ?? "").trim();
    if (!/^[\x21-\x7e]{3,64}$/.test(code)) throw fail(400, "Barcode must be 3-64 printable characters");
    if (!["receive", "issue"].includes(mode)) throw fail(400, "mode must be receive or issue");
    const out = tx(db, () => {
      let m = db.prepare("SELECT id FROM materials WHERE company_id = ? AND barcode = ?").get(req.user.company_id, code);
      let registered = false;
      if (!m) {
        if (!register) throw fail(404, "Unknown barcode", { unknown: true, barcode: code });
        if (mode === "issue") throw fail(409, "Cannot issue a product that is not registered yet");
        if (!can(req.user.role, "createMaterial")) throw fail(403, "Your role may not register products");
        m = { id: createMaterial(req.user, { ...register, barcode: code }) };
        registered = true;
      }
      const r = move(req.user, m.id, mode === "issue" ? "GI" : "GR", qty, ref || "SCAN", "barcode scan");
      return { ...r, registered };
    });
    res.status(201).json(out);
  }));

  // ---------- audit ----------
  app.get("/api/audit", needUser, need("auditRead"), wrap((req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    res.json(db.prepare("SELECT * FROM audit_log WHERE company_id = ? ORDER BY id DESC LIMIT ?").all(req.user.company_id, limit));
  }));

  return app;
}
