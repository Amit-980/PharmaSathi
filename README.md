# PharmaSathi

PharmaSathi is a local-first pharmacy wholesale inventory, billing, purchase,
supplier, subscription, and accounting application.

## Wholesale capabilities

- Tenant-isolated pharmacy data and subscription access
- Medicine SKU, barcode, HSN, batch, expiry, pack/unit and reorder level
- Purchase, wholesale and MRP pricing with GST
- Supplier GSTIN, drug licence, credit days and opening balance
- Supplier invoice number, discount and payment status
- Customer/firm identity, GSTIN, discount, payment mode and credit status
- Transactional stock updates for purchase and sale create, edit and delete
- Low-stock/expiry insights, GST reports, CSV exports and printable bills
- Owner customer console and JSON backup
- Browser-only demo mode using `?demo=1`

## Run locally

```bash
cd frontend
npm install
npm run build

cd ../backend
./mvnw spring-boot:run
```

Open `http://127.0.0.1:8765`.

The default database is stored at `~/.pharmasathi/data/pharmasathi`.
Configure MySQL with `PHARMASATHI_DB_URL`, `PHARMASATHI_DB_USERNAME`,
`PHARMASATHI_DB_PASSWORD`, and `PHARMASATHI_DB_DRIVER`.

## Production deployment

1. Copy `.env.example` to `.env` and replace every secret.
2. Set `PHARMASATHI_ALLOWED_ORIGINS` to the public HTTPS application URL.
3. Start PostgreSQL and the application:

```bash
docker compose up -d --build
curl http://127.0.0.1:8765/api/health
```

Put the application behind an HTTPS reverse proxy. Do not expose PostgreSQL
publicly. The owner console remains disabled until `PHARMASATHI_OWNER_KEY` is
set. Authentication sessions are stored as SHA-256 token hashes and expire
after `PHARMASATHI_SESSION_HOURS`.

Existing SHA-256 user passwords are upgraded to PBKDF2 automatically after a
successful login. New registrations require at least eight password characters.

Create a database backup with:

```bash
set -a
. ./.env
set +a
./scripts/backup-postgres.sh
```

Copy backups to separate encrypted storage and test a restore before onboarding
paying customers.

## Launch checklist

- Configure a real domain, HTTPS, owner key and restricted CORS origin.
- Use PostgreSQL and automated daily off-site backups.
- Verify GST invoice wording and reports with a practising CA.
- Publish privacy, terms, refund, support and data-deletion policies.
- Start with a small paid pilot and reconcile stock and balances daily.

## Verification

```bash
cd frontend
npm run lint
npm run build

cd ../backend
./mvnw test
```
