import { hashPassword } from "./auth.js";
import { audit } from "./db.js";

/* Creates one company and its admin. Password comes from the caller, never hard-coded. */
export function createCompany(db, { name, adminEmail, adminName, password, config = {} }) {
  const c = db.prepare("INSERT INTO companies (name, config) VALUES (?,?)").run(name, JSON.stringify(config));
  const u = db.prepare("INSERT INTO users (company_id, email, name, role, pw_hash) VALUES (?,?,?,?,?)")
    .run(c.lastInsertRowid, adminEmail.toLowerCase(), adminName, "admin", hashPassword(password));
  audit(db, { company_id: Number(c.lastInsertRowid), id: Number(u.lastInsertRowid), name: adminName }, "create", "company", c.lastInsertRowid, { name });
  return { companyId: Number(c.lastInsertRowid), userId: Number(u.lastInsertRowid) };
}
