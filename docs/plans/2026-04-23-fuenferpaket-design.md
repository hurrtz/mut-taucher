# 2026-04-23 — Fünferpaket Design

Five independent changes. No shared data model, no shared migration, no required ordering.

## Summary

| # | Area | Scope |
|---|---|---|
| 1 | Public booking | Frontend-only blocker for non-first-time clients |
| 2 | Invoice PDF wording | New default `payment_note` with session date |
| 3 | Admin API | Register missing `DELETE /admin/clients/:id` route |
| 4 | Admin therapies / groups | Ad-hoc single session with optional per-session cost override |
| 5 | Patient documents | Document type selector + external invoice-number reservation |

## Item 1 — „Bereits Kunde"-Checkbox im Erstgespräch-Funnel

**Location:** `src/components/Booking.tsx`.

**Behavior**

- Add state `isExistingClient: boolean` (default `false`).
- Checkbox label: **„Ich bin bereits Kunde bei Mut Taucher"** rendered at the very top of the booking form, before the contact-info step, so existing clients bail out before investing time.
- When active:
  - Hide/disable the remainder of the booking form.
  - Show an error box with exact copy: **„Dieser Termin ist nur für Erstkunden. Für alle weiteren Anfragen oder Termine wenden Sie sich bitte direkt an mich."**
  - Disable the „Jetzt buchen" submit button regardless of other state.
- Toggle is purely client-side — no backend change, no analytics event.

## Item 2 — `paymentNote` default for regular invoices

**New default copy:** `Bitte überweisen Sie den Betrag vor dem Termin am {{session_date}}.`

`{{session_date}}` is already formatted as `dd.mm.YYYY` at the call sites (`$dateFormatted`), so callers substitute the literal string before passing it in — no new PDF-template placeholder work needed.

**Code changes**

1. `api/routes/therapies.php` → `sendTherapySessionInvoice` (currently line 613):
   ```php
   $paymentNote = "Bitte überweisen Sie den Betrag vor dem Termin am {$dateFormatted}.";
   ```
2. `api/routes/groups.php` → `sendGroupSessionInvoice` (currently line 1058): analogous, using the session's formatted date.
3. `api/lib/PdfGenerator.php:96` and `:186` fallback literals and `api/templates/pdf/rechnung.php:13` fallback: update to `Bitte überweisen Sie den Betrag vor dem Termin.` (no date in the pure-fallback path).

**Out of scope:** Intro-call payment requests (already use `BookingPaymentRequest.php` with their own copy).

**No migration.** The `document_templates.rechnung` row already contains `{{payment_note}}` which is filled at runtime.

## Item 3 — DELETE /admin/clients/:id

**Problem.** Handler `handleDeleteClient(int $id)` exists at `api/routes/clients.php:257` but is not dispatched in `api/index.php`. Current production response: `{"error":"Route nicht gefunden"}`.

**Fix.** Insert after the PUT block (after line 301) in `api/index.php`:

```php
if ($method === 'DELETE' && preg_match('#^/admin/clients/(\d+)$#', $uri, $m)) {
    handleDeleteClient((int)$m[1]);
    exit;
}
```

The handler already enforces:
- 404 when client is missing.
- 409 when the client has substantive activity (must be archived instead, per root SPEC).
- Cascade-cleanup of `document_sends` before deleting the `clients` row.

Nothing else changes.

## Item 4 — Add a one-off session to a therapy or group

### Migration `048_session_cost_override.sql`

```sql
ALTER TABLE therapy_sessions ADD COLUMN session_cost_cents_override INT UNSIGNED DEFAULT NULL AFTER duration_minutes;
ALTER TABLE group_sessions   ADD COLUMN session_cost_cents_override INT UNSIGNED DEFAULT NULL AFTER duration_minutes;
```

Nullable; default NULL. Existing rows implicitly follow the therapy/group default — no backfill.

### Backend

- `handleCreateTherapySession` (`api/routes/therapies.php:355`) accepts optional `sessionCostCentsOverride: number|null` and writes it alongside the existing fields.
- `handleCreateGroupSession` (`api/routes/groups.php:681`) same.
- `handleUpdateSession` (therapy PATCH at `api/routes/therapies.php:487`) and the group session PATCH equivalent accept `sessionCostCentsOverride` for post-hoc correction. An explicit `null` in the payload clears the override.
- Invoice generators use the override when present:
  - `sendTherapySessionInvoice`:
    `$amountCents = (int)($session['session_cost_cents_override'] ?? $session['session_cost_cents']);`
  - Group equivalent at `api/routes/groups.php:1053`: analogous.
- `GET` endpoints that expose sessions to the admin (`/admin/therapies/:id/sessions`, `/admin/groups/:id/sessions`) include the override field so the UI can render it.

### Frontend

- New component `src/admin/components/AddSessionModal.tsx` (shared by therapy and group flows through a small `mode: 'therapy' | 'group'` prop).
  - Fields: Datum (date), Uhrzeit (time), Dauer in Min., Kosten in €.
  - Dauer and Kosten are pre-filled from the parent therapy/group defaults and editable.
  - On submit, values that match the defaults are sent as `undefined` (no override persisted); values that differ are sent as explicit overrides.
- Integration points:
  - `src/admin/components/TherapyList.tsx` — „+ Einzeltermin hinzufügen" button in the session panel of each therapy.
  - `src/admin/components/GroupManager.tsx` → `GroupSessionPanel` — same button, group-aware.
- Hook additions:
  - `src/lib/useAdminTherapies.ts` → `createSession(therapyId, body)` calling existing `POST /admin/therapies/:id/sessions`.
  - `src/lib/useAdminGroups.ts` → `createSession(groupId, body)` calling existing `POST /admin/groups/:id/sessions`.
- Session rendering: when `sessionCostCentsOverride` is set, show „60 Min., 150,00 € (abweichend)" or similar, so the override is visible at a glance.

## Item 5 — Patient-document upload: document type + external invoice-number reservation

### Migration `049_client_document_type.sql`

```sql
ALTER TABLE client_documents
  ADD COLUMN document_type VARCHAR(50) DEFAULT NULL AFTER label,
  ADD COLUMN invoice_number VARCHAR(10) DEFAULT NULL AFTER document_type,
  ADD INDEX idx_client_documents_invoice_number (invoice_number);
```

Both columns nullable; existing rows are unaffected. `document_type` is a free `VARCHAR` rather than a DB-level `ENUM` so the whitelist can evolve without schema churn; PHP validates.

### Type whitelist (single source of truth)

Keys deliberately match `document_templates.template_key` so future features can link a received document to the version the therapist sent:

| Key | Label (DE) |
|---|---|
| `behandlungsvertrag` | Behandlungsvertrag |
| `onlinetherapie` | Online-Therapie-Vereinbarung |
| `schweigepflichtentbindung` | Schweigepflichtentbindung |
| `video_einverstaendnis` | Einverständnis Video-Therapie |
| `datenschutz_digital` | Datenschutzrisiken digitale Kommunikation |
| `email_einwilligung` | E-Mail-Einwilligung |
| `datenschutzinfo` | Datenschutzinformation |
| `rechnung` | Rechnung |
| `zahlungsaufforderung` | Zahlungsaufforderung |
| `sonstiges` | Sonstiges |

Frontend holds the array as a TS const; backend mirrors it in `api/routes/client_history.php` for validation.

### Backend changes in `handleUploadClientDocument`

- Read optional `document_type` and `invoice_number` from `$_POST`.
- If `document_type` is provided, reject values outside the whitelist (400).
- If `document_type === 'rechnung'`:
  - `invoice_number` is required.
  - Format validation: `^\d{2}-\d{4}$` (matches `generateInvoiceNumber` output).
  - Call a new helper `reserveInvoiceNumber(PDO $db, string $number): void` in `api/lib/InvoiceNumber.php`:
    - Parse `YY` and `NNNN`.
    - `INSERT INTO invoice_numbers (year_prefix, sequence_number, invoice_number) VALUES (?, ?, ?)`.
    - On `SQLSTATE[23000]` unique violation → throw a typed exception (`InvoiceNumberTaken`).
  - Handler catches `InvoiceNumberTaken` → 409 with copy „Diese Rechnungsnummer ist bereits vergeben.".

**Upload order (important to prevent orphans):**

1. Validate inputs (format, whitelist, required fields).
2. If `document_type === 'rechnung'` → call `reserveInvoiceNumber` **before** touching the filesystem. On conflict, return 409 without having moved any file.
3. Move the uploaded file into `assets/client_docs/$clientId/`.
4. Insert the `client_documents` row.
5. If step 4 fails, delete the moved file before re-throwing. The reserved invoice number stays reserved — that's the safer leak direction (worst case: one number is blocked but no invoice claims it yet, the user can reserve a different one).

**Decision:** No gap-filling. Reserving sequence `26-0042` when the current max is `26-0010` simply inserts `42`; `26-0011`..`26-0041` stay unused. German invoice law does not require an uninterrupted sequence as long as each issued number is unique and traceable — and the existing table enforces both. If a stricter policy is later needed, gap-filling can be added without schema change.

### Frontend changes in `src/pages/ClientDetail.tsx`

Upload card around line 336:

- Add a `<Select>` „Dokumententyp (optional)" before the label field, populated from the shared whitelist.
- If selected type is `rechnung`, render an additional `<Input>` „Rechnungsnummer (Format: JJ-NNNN)" with inline regex validation and a hint that the number will be reserved in the system.
- On submit, add the new fields to the `FormData`.
- Wire through `src/lib/useClientHistory.ts` → `uploadDocument(clientId, file, label, opts?: { documentType?: string; invoiceNumber?: string })`.

### Timeline rendering

When a `client_documents` row has `document_type` set, the timeline label falls back to the localized type label if the user-entered `label` is empty, and appends `[Rechnung 26-0042]` when both type and invoice number are present. Minor UX choice; finalize in implementation.

## Architecture, tests, risks

- **Conventions respected:** All new handlers live in existing route files; all routes are registered through `api/index.php`; frontend gains one modal and one select in already-established admin surfaces.
- **Testing:** Existing PHPUnit suite (`api/tests/`) must stay green. Recommended new tests:
  - `reserveInvoiceNumber` — success, duplicate-rejection, malformed input.
  - Therapy + group invoice generation with and without `session_cost_cents_override`.
- **Risk:** Item 5 — if a user uploads a `rechnung`-typed document with an invoice number that already exists in `invoice_numbers` (either auto-generated or previously reserved), they must retry with a different number; the error surface is explicit and actionable.
- **Risk:** Item 4 — the override field is read from a PATCH body; explicitly setting `null` must clear it (not leave it untouched). Handler contract must document this.
- **No schema rollback scripts** (migrations are forward-only in this repo; additive columns are safe if ever reverted at runtime).

## Out of scope

- Per-session cost override UI for already-generated sessions before this change: treated the same as post-hoc edits once the PATCH accepts the field.
- Linking received `behandlungsvertrag`-type documents back to the sent template instance (future work, unblocked by the matching keys).
- Automated matching of externally-issued invoice numbers to payment records — no such flow exists today and this change does not introduce one.
