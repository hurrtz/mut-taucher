# AGENTS.md — mut-taucher

## Project Overview

German-language psychotherapy website with a public booking flow, knowledge content, legal pages, and an authenticated admin area. The frontend is a Vite + React SPA; the backend is a PHP API under `api/` that handles bookings, clients, branding, documents, invoicing, and payment integrations.

## Completion Checklist

Before calling work done or opening a PR:

1. Update every affected `SPEC.md` and `DESIGN.md` in the spec chain for the area you changed.
2. Update `AGENTS.md` or `README.md` if workflow, tooling, or collaboration guidance changed.
3. Run the narrowest useful validation for the touched scope, such as `npm run lint`, `npm run build`, `cd api && composer test`, or `cd api && composer lint`.

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

scripts/
├── prerender.mjs            # Post-build prerender for stable public routes
├── backup-production.sh     # Full backup + optional GCS upload orchestration
└── build-backup-artifacts.php # DB-aware backup classification and manifest builder
```

## Routing Notes

- Public routes live in `src/App.tsx` and include `/`, `/ueber-mich`, `/leistungen/:slug`, `/wissen/:slug`, legal pages, and booking result pages.
- Admin routes are lazy-loaded under `/admin` with tabs for calendar, bookings, therapies, groups, clients, documents, and workbook management.
- The frontend fetches brand colors from `/api/branding/colors` on startup.

## Read Order

Use `AGENTS.md` for workflow and collaboration rules. Use `SPEC.md` and `DESIGN.md` files as the source of truth for durable product, domain, and architectural knowledge.

Before modifying code, read the full spec chain for the area you are touching:

1. Root `SPEC.md`
2. Root `DESIGN.md`
3. Each deeper `SPEC.md` / `DESIGN.md` from the relevant stable subtree down to your working area

Example: editing `src/admin/pages/ClientDetail.tsx` means reading:

1. `SPEC.md`
2. `DESIGN.md`
3. `src/SPEC.md`
4. `src/DESIGN.md`
5. `src/admin/SPEC.md`
6. `src/admin/DESIGN.md`

## Spec Files

This repo should use living documentation: durable specs stay small and current, while change-specific planning stays in `docs/plans/`.

### Permanent vs. Active Docs

- Permanent spec files may live at the repo root or any stable subtree boundary as `SPEC.md` and `DESIGN.md`.
- Use `SPEC.md` for durable purpose, capabilities, integrations, and constraints.
- Use `DESIGN.md` for durable architecture, flows, boundaries, and focused Mermaid diagrams.
- `AGENTS.md` should stay focused on workflow and collaboration guidance; durable product and architecture knowledge belongs in living specs.
- Permanent docs currently exist at the repo root, `src/`, `src/admin/`, `api/`, and `scripts/`. Add deeper ones only when a subtree has a stable boundary that justifies long-lived documentation.
- Active work specs belong in `docs/plans/`, usually as `YYYY-MM-DD-change-name.md` and, when needed, `YYYY-MM-DD-change-name-design.md`.

### Documentation Hierarchy

- Higher-level files cover broader scope; deeper files cover narrower scope.
- A child `SPEC.md` or `DESIGN.md` should refine its parent, not restate it.
- Prefer the nearest stable subtree that owns the behavior instead of pushing everything into a root-level doc.

### Minimal Documentation Rule

- Keep durable capabilities, stable integration points, architectural boundaries, and only the diagrams that clarify them.
- Do not keep completed task lists, version history, future wish lists, large directory dumps, or step-by-step implementation narration in permanent spec files.

### Documentation Status Markers

Use these markers where the confidence level matters:

| Marker | Meaning |
|---|---|
| *(no marker)* | Settled fact or established pattern |
| **Decision:** | Explicit choice with rationale or tradeoff |
| **Assumption:** | Believed true but not yet validated |
| **Open question:** | Unresolved item that still needs a decision |
| **Dependency:** | External team, system, or decision this area relies on |

Not every sentence needs a marker. Use them when misunderstanding the confidence level would cause a bad implementation decision.

### Lifecycle

1. Create or update the narrowest useful change doc in `docs/plans/`.
2. Keep the active plan/design current while implementation is in progress.
3. Promote durable rules and architecture into the nearest permanent `SPEC.md` / `DESIGN.md` if that information should outlive the change.
4. Do not treat old plan files as the source of truth for current behavior; if a plan remains for history, the durable outcome should already exist in the permanent docs or code.

### Working Rules

- Before implementation, read the full spec chain for the subtree you are touching.
- During implementation, update only the docs whose scope actually changed.
- Prefer links to README/reference docs over copying operational setup into spec files.
- After implementation, re-read touched docs for overlap, drift, and broken links, and check whether a deeper local spec/design file is the better home for the information.

### Authority and Conflict Resolution

- Parent specs set constraints; child specs refine them and should not contradict them.
- If a child spec needs to deviate from a parent rule, update the parent first with the rationale.
- When code contradicts a spec, investigate before changing either side; the docs may be stale, or the code may be wrong.
- Agents may freely update docs to reflect observed reality such as renamed files or settled behavior. Changes to intent, constraints, or architectural boundaries should be made deliberately and called out clearly.

### When To Add `DESIGN.md`

- Add `DESIGN.md` only when the implementation shape, flows, or boundaries would otherwise crowd `SPEC.md`.
- Most stable boundaries can stay with only `SPEC.md`; use both files when separating "what" from "how" makes the docs easier to maintain.
- All diagrams in `DESIGN.md` should use Mermaid unless there is a strong reason to use another format.

### Cross-Cutting Knowledge

- System-wide rules such as auth boundaries, analytics constraints, archival retention, and booking lifecycle invariants belong in the root `SPEC.md` / `DESIGN.md`.
- Subtree docs should link upward or refine those rules instead of duplicating them.

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
