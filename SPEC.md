# SPEC.md

## Purpose and Scope

Mut-Taucher is a single-product repository for a German psychotherapy practice. It combines:

- a public website with service pages, knowledge articles, legal pages, contact, and SEO metadata
- a bookable Erstgespräch funnel with payment-aware reservation behavior
- an authenticated admin console for operating schedules, patients, therapies, groups, documents, branding, and workbook materials
- a PHP API that acts as the system of record for operational data and external integrations

## Main Capabilities

- Public presentation of the practice, service offerings, knowledge content, and legal information
- Public booking flow for introductory appointments, including validation, consent capture, and payment branching
- Internal operations tooling for bookings, ongoing therapies, group programs, group-seat reservations, patient records, document workflows, and invoicing
- Practice branding and document-template customization from the admin area
- Email, PDF, payment, and analytics integrations around the core therapy workflow
- Build-time prerendering and operator-run backup automation for SEO output and long-term retention

## Permanent Documentation Map

- [src/SPEC.md](src/SPEC.md) and [src/DESIGN.md](src/DESIGN.md): public and shared frontend behavior
- [src/admin/SPEC.md](src/admin/SPEC.md) and [src/admin/DESIGN.md](src/admin/DESIGN.md): authenticated admin sub-application
- [api/SPEC.md](api/SPEC.md) and [api/DESIGN.md](api/DESIGN.md): backend domains, route families, and integrations
- [scripts/SPEC.md](scripts/SPEC.md) and [scripts/DESIGN.md](scripts/DESIGN.md): build-time and operator-run automation
- `docs/plans/`: active change planning and design docs, not the permanent source of truth

Root `SPEC.md` and `DESIGN.md` own cross-cutting knowledge that applies across both the frontend and backend.

## Important Integration Points

- Browser frontend to `/api` for all operational data
- Repo-local automation in `scripts/` for prerendering and backup artifact generation
- MySQL for schedules, bookings, patients, therapies, groups, templates, branding, and workbook metadata
- `api/assets/` for generated and uploaded files
- Google Cloud Storage for long-term backups split into financial (`10` years) and general (`2` years) retention classes
- Brevo or SMTP for email delivery, TCPDF for PDF generation
- Stripe and PayPal backend integrations for booking payments
- Amplitude for public-site analytics after explicit consent

## Cross-Cutting Decisions

- Product-facing UI copy is German.
- **Decision:** Operational truth lives in the API and database, not in frontend-only state. The SPA may cache or stage view state, but it should not become the source of record for bookings, patients, invoices, or archive classification.
- **Decision:** Public content remains code-authored in the frontend rather than managed by a CMS. Content edits therefore move through the normal code review and deployment path.
- **Decision:** The public booking surface currently presents wire transfer as the visible payment path even though Stripe and PayPal integrations still exist in the backend for payment-aware booking flows.
- **Decision:** Admin behavior must remain authenticated, non-indexed, and excluded from public analytics tracking.
- **Decision:** Money-relevant archival data such as invoices and payment requests must remain restorable for `10` years, while other archived operational data only needs `2` years of retention.
- **Decision:** Long-term asset backups must be content-addressed and incremental so unchanged files do not create new stored blobs on every run.
- Permanent specs should describe durable scope and architecture; change-by-change work belongs in `docs/plans/`.
