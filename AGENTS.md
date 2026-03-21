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

## Spec Files

This repo should use living documentation: durable specs stay small and current, while change-specific planning stays in `docs/plans/`.

### Permanent vs. Active Docs

- Permanent spec files may live at the repo root or any stable subtree boundary as `SPEC.md` and `DESIGN.md`.
- Use `SPEC.md` for durable purpose, capabilities, integrations, and constraints.
- Use `DESIGN.md` for durable architecture, flows, boundaries, and focused Mermaid diagrams.
- This repo does not currently have permanent `SPEC.md` / `DESIGN.md` files. Add them only when a boundary is stable enough to justify long-lived documentation.
- Active work specs belong in `docs/plans/`, usually as `YYYY-MM-DD-change-name.md` and, when needed, `YYYY-MM-DD-change-name-design.md`.

### Documentation Hierarchy

- Higher-level files cover broader scope; deeper files cover narrower scope.
- A child `SPEC.md` or `DESIGN.md` should refine its parent, not restate it.
- Prefer the nearest stable subtree that owns the behavior instead of pushing everything into a root-level doc.

### Minimal Documentation Rule

- Keep durable capabilities, stable integration points, architectural boundaries, and only the diagrams that clarify them.
- Do not keep completed task lists, version history, future wish lists, large directory dumps, or step-by-step implementation narration in permanent spec files.

### Lifecycle

1. Create or update the narrowest useful change doc in `docs/plans/`.
2. Keep the active plan/design current while implementation is in progress.
3. Promote durable rules and architecture into the nearest permanent `SPEC.md` / `DESIGN.md` if that information should outlive the change.
4. Do not treat old plan files as the source of truth for current behavior; if a plan remains for history, the durable outcome should already exist in the permanent docs or code.

### Working Rules

- Before implementation, read the nearest relevant spec/design doc if one exists.
- During implementation, update only the docs whose scope actually changed.
- Prefer links to README/reference docs over copying operational setup into spec files.
- After implementation, re-read touched docs for overlap, drift, and broken links, and check whether a deeper local spec/design file is the better home for the information.

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
