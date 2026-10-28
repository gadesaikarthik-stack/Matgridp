# MatGrid server

Login, one database per company (rows tagged by company, every query filtered), append-only audit log, barcode scan.
Node 22.5+ (uses built-in `node:sqlite`). One dependency: express.

## Run
    npm install
    ADMIN_EMAIL=you@firm.com ADMIN_PASSWORD='long-password' COMPANY_NAME='Your Co' npm start
Open http://localhost:3000. The first start creates the company and its admin; later starts ignore those variables.
Data file: `DB_FILE` (default ./data/matgrid.db). Put it on a persistent volume on Railway.

## Test
    npm test

## API (all under /api, cookie session)
- POST /auth/login, POST /auth/logout, GET /me
- PUT /config (admin), POST /users (admin)
- GET/POST /materials, GET /materials/by-barcode/:code
- POST /stock {material_id, type: GR|GI, qty}
- POST /scan {barcode, mode: receive|issue, qty, register?}  unknown code returns 404 {unknown:true}; send `register` to create it
- GET /audit (admin, manager)

## Not migrated yet
Vendors, requisitions, POs, receipts, invoices still run on the browser demo data. Stock and materials are the first real tables.
