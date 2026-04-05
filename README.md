# Mut-Taucher

German-language psychotherapy website with:

- a Vite + React frontend in `src/`
- a PHP + MySQL backend in `api/`
- an authenticated admin area under `/admin`
- email, PDF, branding, booking, and patient-management workflows

## Prerequisites

- Node.js and npm
- PHP
- Composer
- MySQL
- Mailpit for local email testing (optional, but recommended)

## First-Time Setup

Install frontend and backend dependencies:

```bash
npm install
composer --working-dir=api install
```

Create the backend config:

```bash
cp api/config.example.php api/config.php
```

Then edit `api/config.php` and set at least:

- `db_host`, `db_name`, `db_user`, `db_pass`
- `jwt_secret`
- `admin_hash`
- `site_url`

Generate the admin password hash with:

```bash
php api/setup.php <your-password>
```

For local development, use:

- `site_url => 'http://localhost:5173'`

If you want local email delivery via Mailpit, use:

- `smtp_host => '127.0.0.1'`
- `smtp_port => 1025`
- leave `smtp_user` / `smtp_pass` empty

## Database Setup

Create a MySQL database that matches `api/config.php`, then run:

```bash
php api/migrate.php
```

Optional status check:

```bash
php api/migrate.php --status
```

## Start Frontend and Backend

Run the backend and frontend in separate terminals.

Terminal 1, backend:

```bash
php -S localhost:8000 -t api/
```

Terminal 2, frontend:

```bash
npm run dev
```

URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

Vite proxies `/api` requests to `http://localhost:8000`, so the frontend talks to the backend automatically in local dev.

## Mailpit

`npm run dev` tries to start `mailpit` in the background before launching Vite.

Mailpit defaults used here:

- Web UI: `http://localhost:8025`
- SMTP: `localhost:1025`

If `mailpit` is not installed, the frontend can still run, but local email testing will not work.

## Useful Commands

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Backend:

```bash
cd api && composer test
cd api && composer lint
php api/migrate.php
```

## Production Backups

This app has two persistent data stores in production:

- MySQL
- `api/assets/`

Use the backup script in [scripts/backup-production.sh](/Users/tobias.winkler/Projects/mut-taucher/scripts/backup-production.sh). It reads database credentials from `api/config.php`, writes the backup outside the web root by default, and creates:

- `db.sql.gz`
- `api-assets.tar.gz`
- incremental asset manifests split into `financial` and `general`
- a `db-financial.json.gz` export for long-term money-relevant retention

Example:

```bash
chmod +x scripts/backup-production.sh
./scripts/backup-production.sh
```

Default output path:

```bash
$HOME/backups/mut-taucher/YYYY-MM-DD-HHMMSS/
```

The local backup directory also contains `backup-artifacts/` with the GCS manifests and the financial database archive metadata.

### GCS Retention Layout

Use two private single-region buckets in Europe:

- one `financial` bucket for anything money-related with `10` years retention
- one `general` bucket for all other archived files and operational snapshots with `2` years retention

Why two buckets:

- GCS retention is bucket-scoped in the simple setup.
- payment requests, invoices, and financial archive data must outlive general patient-operational backups.
- the backup script intentionally keeps financial and general artifacts separate so retention is enforceable by storage layout, not by convention.

Recommended policy:

- do not enable Object Versioning
- keep the financial bucket immutable for `10` years
- keep the general bucket at `2` years with lifecycle deletion or retention

### GCS Upload Behavior

When GCS buckets are configured, the script uploads:

- `api/assets/` as content-addressed blobs, so unchanged files are not uploaded again
- one timestamped asset manifest per run for `financial` files and one for `general` files
- a financial database archive export on its own schedule, default `daily`
- a full operational database snapshot on its own schedule, default `monthly`

Financial asset classification is derived from the document archive in MySQL:

- `Rechnung ...`
- `Zahlungsaufforderung ...`

That means archived invoices and payment requests land in the `financial` bucket, while other files such as workbook material, logos, uploads, and non-financial client documents land in the `general` bucket.

Required environment for upload:

```bash
export GCS_GENERAL_BUCKET_URL="gs://YOUR_GENERAL_BUCKET/mut-taucher/general"
export GCS_FINANCIAL_BUCKET_URL="gs://YOUR_FINANCIAL_BUCKET/mut-taucher/financial"
export GCS_KEY_FILE="/home/USERNAME/keys/gcs-backup.json"
export GCS_SERVICE_ACCOUNT="backup-writer@PROJECT_ID.iam.gserviceaccount.com"
export GCS_PROJECT="PROJECT_ID"
export GCS_GENERAL_STORAGE_CLASS="ARCHIVE"
export GCS_FINANCIAL_STORAGE_CLASS="ARCHIVE"
```

Then run:

```bash
./scripts/backup-production.sh
```

Keep the service-account key outside `public_html` and restrict it to the smallest useful bucket-write scope.

Optional schedule overrides:

```bash
export GCS_GENERAL_DB_UPLOAD_SCHEDULE="monthly"
export GCS_FINANCIAL_DB_UPLOAD_SCHEDULE="daily"
```

Allowed values:

- `never`
- `daily`
- `weekly`
- `monthly`

Default behavior:

- full local backup on every run
- financial DB export upload every day
- general full DB upload on the first day of the month

Example cron job for a nightly backup at `02:15`:

```cron
15 2 * * * /home/USERNAME/public_html/mut-taucher.de/scripts/backup-production.sh >> /home/USERNAME/backups/mut-taucher/backup.log 2>&1
```

Replace `USERNAME` with the actual hosting account name. Keep backups outside `public_html`.

With GCS upload enabled via environment variables:

```cron
15 2 * * * GCS_GENERAL_BUCKET_URL=gs://YOUR_GENERAL_BUCKET/mut-taucher/general GCS_FINANCIAL_BUCKET_URL=gs://YOUR_FINANCIAL_BUCKET/mut-taucher/financial GCS_KEY_FILE=/home/USERNAME/keys/gcs-backup.json GCS_SERVICE_ACCOUNT=backup-writer@PROJECT_ID.iam.gserviceaccount.com GCS_PROJECT=PROJECT_ID GCS_GENERAL_STORAGE_CLASS=ARCHIVE GCS_FINANCIAL_STORAGE_CLASS=ARCHIVE /home/USERNAME/public_html/mut-taucher.de/scripts/backup-production.sh >> /home/USERNAME/backups/mut-taucher/backup.log 2>&1
```

This layout avoids the old failure mode where one changed file forced a fresh upload of the entire `api-assets.tar.gz` archive to long-term storage.

## Documentation

- [AGENTS.md](AGENTS.md): repo-specific working conventions
- [SPEC.md](SPEC.md): repo-wide durable scope and capabilities
- [DESIGN.md](DESIGN.md): repo-wide architecture
- [src/SPEC.md](src/SPEC.md) and [src/DESIGN.md](src/DESIGN.md): frontend docs
- [src/admin/SPEC.md](src/admin/SPEC.md) and [src/admin/DESIGN.md](src/admin/DESIGN.md): admin docs
- [api/SPEC.md](api/SPEC.md) and [api/DESIGN.md](api/DESIGN.md): backend docs
- [scripts/SPEC.md](scripts/SPEC.md) and [scripts/DESIGN.md](scripts/DESIGN.md): build/backup automation docs
- `docs/plans/`: change-specific planning/design docs
