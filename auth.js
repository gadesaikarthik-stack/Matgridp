import crypto from "node:crypto";

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPassword(pw, stored) {
  const [alg, saltHex, keyHex] = String(stored).split("$");
  if (alg !== "scrypt") return false;
  const key = crypto.scryptSync(pw, Buffer.from(saltHex, "hex"), 64);
  const want = Buffer.from(keyHex, "hex");
  return want.length === key.length && crypto.timingSafeEqual(key, want);
}

export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
export const newToken = () => crypto.randomBytes(32).toString("base64url");

/* Who may do what. Mirrors the PERMS table in the browser app; the server is the real gate. */
export const PERMS = {
  settings: ["admin"],
  users: ["admin"],
  auditRead: ["admin", "manager"],
  createMaterial: ["admin", "manager", "buyer", "warehouse"],
  moveStock: ["admin", "warehouse"],
};
export const can = (role, action) => (PERMS[action] || []).includes(role);

/* Simple in-memory limiter for login attempts. */
const hits = new Map();
export function tooManyLogins(key, max = 8, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}
