import { openDb } from "./db.js";
import { createApp } from "./app.js";
import { createCompany } from "./seed.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const db = openDb(process.env.DB_FILE || "./data/matgrid.db");

// First boot: create the first company from env vars (set them once in Railway, then remove the password).
if (!db.prepare("SELECT 1 FROM companies LIMIT 1").get()) {
  const email = process.env.ADMIN_EMAIL, pw = process.env.ADMIN_PASSWORD;
  if (!email || !pw || pw.length < 8) {
    console.error("First start: set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars), and optionally COMPANY_NAME.");
    process.exit(1);
  }
  createCompany(db, { name: process.env.COMPANY_NAME || "My Company", adminEmail: email, adminName: "Admin", password: pw });
  console.log(`Created company and admin ${email}`);
}

const app = createApp(db, { secureCookie: process.env.NODE_ENV === "production" });
// Flat layout: serve only the browser files, never the server code or the database.
const here = path.dirname(fileURLToPath(import.meta.url));
app.get(/^\/(index\.html|[a-z_0-9]+_v2\.js)?$/, (req, res) => {
  const f = req.path === "/" ? "index.html" : req.path.slice(1);
  res.sendFile(path.join(here, f));
});
app.listen(process.env.PORT || 3000, () => console.log("MatGrid server on", process.env.PORT || 3000));
