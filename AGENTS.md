# AGENTS.md — mut-taucher

## Project Overview

German-language psychotherapy website with a public booking flow, knowledge content, legal pages, and an authenticated admin area. The frontend is a Vite + React SPA; the backend is a PHP API under `api/` that handles bookings, clients, branding, documents, invoicing, and payment integrations.

## Quick Start

```bash
npm install
composer --working-dir=api install
php -S localhost:8000 -t api/
npm run dev
```

Notes:

- `npm run dev` starts Vite and backgrounds `mailpit`.
- Run `php -S ...` and `npm run dev` in separate terminals.
- In development, Vite proxies `/api` requests to `http://localhost:8000`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server and Mailpit |
| `npm run build` | Type-checks, builds the SPA, then runs `scripts/prerender.mjs` |
| `npm run lint` | Runs ESLint for the frontend codebase |
| `npm run preview` | Serves the production frontend build |
| `cd api && composer test` | Runs backend PHPUnit tests |
| `cd api && composer lint` | Runs `php -l` over backend PHP files |
| `php -S localhost:8000 -t api/` | Local PHP API server used by the frontend proxy |

## Tech Stack

- Frontend: React 19, TypeScript 5.9, Vite 7
- Styling/UI: Tailwind CSS 4, Ant Design 6, Framer Motion, shadcn-style `src/components/ui`
- Routing/content: React Router 7, react-markdown
- Forms/data: react-hook-form, zod, date-fns, dayjs
- Editor/admin: Tiptap 3 for document editing
- Backend: PHP 8-style app structure with Composer
- Backend libraries: PHPMailer, TCPDF, Stripe PHP SDK, PayPal Server SDK

## Project Structure

```text
src/
├── App.tsx                  # Public routes + lazy-loaded admin routes
├── main.tsx                 # Frontend entry point
├── components/              # Public-facing sections and shared UI
├── pages/                   # Public pages, legal pages, booking result pages
├── admin/                   # Admin shell, tabs, components, styles, constants
├── lib/                     # API client, hooks, analytics, validation, shared data
└── assets/                  # Local image assets

api/
├── index.php                # Front controller for all API requests
├── routes/                  # Public, admin, clients, groups, templates, webhooks
├── lib/                     # Mail, PDF, checkout, invoice helpers
├── migrations/              # SQL schema migrations
├── templates/               # Email and PDF templates
├── tests/                   # PHPUnit tests
└── assets/                  # Uploaded logos, workbooks, client docs, generated files
```

## Routing Notes

- Public routes live in `src/App.tsx` and include `/`, `/ueber-mich`, `/leistungen/:slug`, `/wissen/:slug`, legal pages, and booking result pages.
- Admin routes are lazy-loaded under `/admin` with tabs for calendar, bookings, therapies, groups, clients, documents, and workbook management.
- The frontend fetches brand colors from `/api/branding/colors` on startup.

## Conventions

- UI copy is German unless there is a strong product reason otherwise.
- Follow `.editorconfig`: 2 spaces by default, 4 spaces for PHP, LF endings.
- Use the existing `@` alias for frontend imports when it improves clarity.
- Keep admin routes and tabs lazy-loaded unless there is a strong reason to change that split.
- Auth state is frontend-managed via `sessionStorage` key `mut-taucher-token`.
- Treat `api/assets/` as user or generated content. Do not delete or rewrite files there casually.

## Known Caveats

- `README.md` is still the default Vite template and is not authoritative for this project.
- The frontend has lint/build scripts but no dedicated frontend test script at the root.
- Local development assumes a separate PHP server on port `8000`.
