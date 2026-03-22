# SPEC.md

## Purpose and Scope

`api/` is the backend system of record for the practice. It exposes the public booking/contact endpoints, the authenticated admin API, and the supporting services for email, PDF generation, payments, branding, and file-backed document history.

## Main Capabilities

| Area | Files | Durable responsibility |
|---|---|---|
| Public booking and contact | `routes/public.php`, `routes/webhooks.php` | Slot lookup, booking creation, contact delivery, PayPal capture, Stripe webhook handling |
| Admin auth and scheduling | `routes/admin.php`, `slots.php` | Login, recurring rules, one-off events, blocked days, booking lifecycle, cancellation workflows |
| Patients and history | `routes/clients.php`, `routes/client_history.php` | Patient CRUD, archive/restore, timeline aggregation, notes, sent/received document archive |
| Individual therapy | `routes/therapies.php` | Therapy CRUD, schedule rules, session generation, payment state, invoices |
| Group therapy | `routes/groups.php` | Group CRUD, participants, group sessions, attendance, per-participant payment state, invoices |
| Templates and branding | `routes/templates.php`, `routes/branding.php` | DB-backed template management, sending-point mappings, branding settings, logo variants |
| Workbook | `routes/workbook.php` | Material upload, download, deletion, and distribution |
| Shared operational services | `lib/*.php` | Mail transport, PDF generation, invoice numbering, booking notifications, document registry, payment helpers |

## Important Integration Points

- MySQL via `db.php`
- Numbered SQL migrations via `migrations/` and `migrate.php`
- `api/assets/` for logos, workbook files, uploads, and archived client documents
- Brevo HTTP API or SMTP through `Mailer.php`
- TCPDF through `PdfGenerator.php`
- Stripe Checkout and PayPal order/capture helpers
- The frontend SPA, which is the only intended browser consumer

## Important Constraints

- `index.php` is the front controller and explicit route dispatcher.
- Admin endpoints require JWT auth; some binary endpoints also accept the token as a query parameter for iframe or image use cases.
- Slot availability is generated server-side from recurring rules, one-off events, and booking reservation state.
- Intro-call slots stay reserved for public booking while their booking is `pending_payment`, `confirmed`, or `completed`; only `cancelled` releases the slot back into the public pool.
- Generated files and uploads under `api/assets/` are persistent application data, not disposable build output.
- Archived invoices and payment requests are not just user-facing PDFs; they are also backup-classified financial records and must stay distinguishable from general archived files.
- The booking lifecycle, invoice numbering, and document/template behavior should remain deterministic and database-backed.
- Intro-call bookings use a separate `booking_number` and payment-request document before an invoice exists.
- Actual intro-call invoices are generated only after payment has been confirmed, whether that confirmation came from Stripe/PayPal automatically or from a therapist-side manual payment confirmation; the invoice must reference the earlier booking number.
- Intro-call status and intro-call payment are separate concerns: a therapist may start or complete an intro call before payment is confirmed, but that must not consume an invoice number or send an invoice.
- Payment requests and invoices for intro calls are archival records and must be written into the client document history when a linked client exists.
- Backup/export logic must be able to classify archived payment requests and invoices from database metadata so financial-retention storage can be enforced without manually curating file lists.
- Intro-call lifecycle actions that matter operationally or archivally, including the original request, payment reminders, payment confirmation, completion, cancellation, and cancellation-email delivery, must be recoverable in the patient timeline.
- Client deletion is only allowed for records without substantive downstream activity; a sent intro-call payment request alone does not make the client record durable.
