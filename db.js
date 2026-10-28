// SQLite storage. Every business table carries company_id; every query is filtered by it.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export function openDb(file) {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      config TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','manager','buyer','warehouse','ap','viewer')),
      pw_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      sku TEXT NOT NULL,
      barcode TEXT,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      unit TEXT NOT NULL DEFAULT 'EA',
      price REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 0,
      reorder_point REAL NOT NULL DEFAULT 0,
      max_stock REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (company_id, sku),
      UNIQUE (company_id, barcode)
    );
    -- Stock is never edited in place: it is the sum of signed movements.
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      material_id INTEGER NOT NULL REFERENCES materials(id),
      type TEXT NOT NULL CHECK (type IN ('GR','GI','ADJ')),
      qty REAL NOT NULL CHECK (qty <> 0),
      ref TEXT,
      note TEXT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_mov_mat ON stock_movements(company_id, material_id);
    -- Append-only: nothing may edit or remove an audit row.
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_log
      BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_log
      BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS mov_no_update BEFORE UPDATE ON stock_movements
      BEGIN SELECT RAISE(ABORT, 'stock_movements is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS mov_no_delete BEFORE DELETE ON stock_movements
      BEGIN SELECT RAISE(ABORT, 'stock_movements is append-only'); END;
  `);
  return db;
}

export function tx(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function audit(db, who, action, entity, entityId, details = {}) {
  db.prepare(
    "INSERT INTO audit_log (company_id, user_id, user_name, action, entity, entity_id, details) VALUES (?,?,?,?,?,?,?)"
  ).run(who.company_id, who.id ?? null, who.name ?? null, action, entity, String(entityId ?? ""), JSON.stringify(details));
}

export const STOCK_SQL = `(SELECT COALESCE(SUM(qty),0) FROM stock_movements m WHERE m.material_id = materials.id AND m.company_id = materials.company_id)`;
