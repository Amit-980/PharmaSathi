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
publicly. The platform admin console at `?admin=1` remains disabled until
`PHARMASATHI_ADMIN_USERNAME` and `PHARMASATHI_ADMIN_PASSWORD` are set.
Pharmacy users cannot access customer creation, subscription, backup, or admin
APIs. Authentication sessions are stored as SHA-256 token hashes and expire
after `PHARMASATHI_SESSION_HOURS`.

### Railway

Create a Railway project from this GitHub repository and add a PostgreSQL
service. Configure the application service with:

```text
PHARMASATHI_DB_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
PHARMASATHI_DB_USERNAME=${{Postgres.PGUSER}}
PHARMASATHI_DB_PASSWORD=${{Postgres.PGPASSWORD}}
PHARMASATHI_DB_DRIVER=org.postgresql.Driver
PHARMASATHI_BIND_ADDRESS=0.0.0.0
PHARMASATHI_ADMIN_USERNAME=platform-admin
PHARMASATHI_ADMIN_PASSWORD=<strong-random-password>
PHARMASATHI_ALLOWED_ORIGINS=https://${{RAILWAY_PUBLIC_DOMAIN}}
PHARMASATHI_SECURE_COOKIES=true
PHARMASATHI_PUBLIC_REGISTRATION=false
```

Generate a public domain for the application service. Railway supplies `PORT`
automatically and checks `/api/health` using `railway.json`.

### Render free preview

The repository includes `render.yaml` for a free Render web service and free
PostgreSQL database. Create a Blueprint from the repository and provide the
platform admin password when prompted. Free web services sleep after inactivity,
and free Render PostgreSQL databases expire after 30 days, so this setup is for
testing and customer demonstrations only.

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

- Configure a real domain, HTTPS, platform admin credentials and restricted CORS origin.
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
