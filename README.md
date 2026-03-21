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

## Documentation

- [AGENTS.md](AGENTS.md): repo-specific working conventions
- [SPEC.md](SPEC.md): repo-wide durable scope and capabilities
- [DESIGN.md](DESIGN.md): repo-wide architecture
- [src/SPEC.md](src/SPEC.md) and [src/DESIGN.md](src/DESIGN.md): frontend docs
- [src/admin/SPEC.md](src/admin/SPEC.md) and [src/admin/DESIGN.md](src/admin/DESIGN.md): admin docs
- [api/SPEC.md](api/SPEC.md) and [api/DESIGN.md](api/DESIGN.md): backend docs
- `docs/plans/`: change-specific planning/design docs
