# SPEC.md

## Purpose and Scope

`src/admin/` is the authenticated operating console for the practice. It owns the therapist-facing workflows for scheduling, bookings, patients, therapies, groups, documents, branding, and workbook distribution.

## Main Capabilities

- `/admin/kalender`: recurring availability rules, rule exceptions, one-off events, blocked days, calendar preview, and cancellation handling
- `/admin/erstgespraeche`: booking review, payment confirmation, appointment start/completion, payment-reminder and cancellation emails, deferred invoice sending, and migration from booking to patient
- `/admin/einzel`: individual therapy CRUD, schedule rules, generated sessions, payment state, and invoice sending
- `/admin/gruppen`: group therapy CRUD, participant and seat-reservation management, session generation, attendance, per-participant payment state, and invoices
- `/admin/kunden` and `/admin/client/:id`: patient list, archive/restore lifecycle, filterable timeline, notes, and document archive
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
- Admin actions for intro calls must keep payment confirmation distinct from appointment progress: the therapist may start or complete the appointment before payment arrives, but only confirmed payment may trigger invoice generation.
- The intro-call admin surface owns the operational reminder/cancellation emails around wire-transfer bookings, and those sends must stay consistent with what appears in the patient timeline.
- The patient list must distinguish disposable booking-only client records from durable patient records: disposable records can be deleted, while records with substantive activity must be archived instead.
- Group seat reservations consume capacity even before an official patient exists, but they must remain outside patient, billing, and document flows until they are converted into a concrete participant.
- Therapy and group flows support creating ad-hoc single sessions from a shared modal; such sessions may carry a per-session `session_cost_cents_override` that takes precedence over the therapy/group default when the invoice is generated.
- Therapy and group cards surface a three-state document-completeness badge (red `Dokumente fehlen`, orange `Unterschriften fehlen`, none for complete or not-started); group cards aggregate the worst state across active participants, and each participant row carries its own badge and checklist.
