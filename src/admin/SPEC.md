# SPEC.md

## Purpose and Scope

`src/admin/` is the authenticated operating console for the practice. It owns the therapist-facing workflows for scheduling, bookings, patients, therapies, groups, documents, branding, and workbook distribution.

## Main Capabilities

- `/admin/kalender`: recurring availability rules, rule exceptions, one-off events, blocked days, calendar preview, and cancellation handling
- `/admin/erstgespraeche`: booking review, payment/status updates, appointment-info sending, deferred invoice sending, and migration from booking to patient
- `/admin/einzel`: individual therapy CRUD, schedule rules, generated sessions, payment state, and invoice sending
- `/admin/gruppen`: group therapy CRUD, participant management, session generation, attendance, per-participant payment state, and invoices
- `/admin/kunden` and `/admin/client/:id`: patient list, archive/restore lifecycle, timeline, notes, and document archive
- `/admin/dokumente`: HTML template editing, sending-point mappings, preview, branding settings, and logo management
- `/admin/arbeitsmappe`: workbook-material upload, grouping, preview, and sharing to selected patients

## Important Integration Points

- `useAdminBooking`, `useAdminClients`, `useAdminTherapies`, `useAdminGroups`, `useAdminTemplates`, `useAdminBranding`, `useAdminWorkbook`, and `useClientHistory`
- `src/lib/api.ts` for tokenized API access and auth storage
- Binary previews and downloads that rely on the backend token fallback for iframe or image sources
- [api/SPEC.md](../../api/SPEC.md) for the backend contracts that persist admin actions

## Important Constraints

- Admin access is password-protected and JWT-backed.
- All durable mutations round-trip through the API; tab-local state is only a view/cache of server state.
- The admin UI must stay non-indexed and outside the public analytics surface.
- Tabs should own the data they need instead of rebuilding a single global admin god component.
- Styling should continue to flow through Ant Design theming and shared admin style utilities.
- The intro-call booking list is responsible for showing booking numbers and the sent state of payment requests, because those are part of the document/archive lifecycle.
- Admin actions that mark intro calls paid or completed are the durable trigger for invoice generation; the public booking flow is no longer allowed to consume invoice numbers.
