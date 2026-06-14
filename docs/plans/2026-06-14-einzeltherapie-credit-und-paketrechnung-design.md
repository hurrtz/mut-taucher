# Einzeltherapie: Stornierungs-Guthaben & Paketrechnung — Design

Date: 2026-06-14

Two changes to individual-therapy (Einzeltherapie) administration:

- **(A)** A cancelled ("Abgesagt") session must not count as unpaid. If it was already
  paid, the client gains a credit ("Guthaben") — the therapist owes one free session.
  The credit is shown in the UI and is consumed when a later session is marked paid.
- **(B)** Generate a package invoice (Paketrechnung) covering all open, unpaid sessions
  in one go, like the group-therapy bundle invoice.

## Decisions (confirmed with user)

- Credit model: **explicit credit you apply** (not auto net-balance).
- Package invoice: **full amount only** (no half payments), button **inside the
  "Finanzieller Status" card**, **skips sessions already individually invoiced**.
- After sending the package invoice: covered sessions are marked **"Rechnung gesendet"
  only** — they stay "Offen" until payment is manually recorded.

---

## Part A — Cancellation credit (Guthaben)

### Credit model (derived, not a mutable counter)

A mutable counter would drift across status/payment toggles and deletes. Instead the net
credit is **derived** from session state, with a single new per-session flag:

- **Credit source**: `status = 'cancelled'` AND `payment_status = 'paid'` AND
  `paid_from_credit = 0`. Real money was received for a session that won't happen.
- **Credit consumer**: `paid_from_credit = 1` AND `status <> 'cancelled'`. A delivered
  session settled from credit instead of new money.
- **Net Guthaben = max(0, sources − consumers)** — in sessions; × cost for €.

This is robust under reversals:
- Un-cancel a source → no longer a source → credit drops.
- Toggle a consumer back to due → no longer a consumer → credit returns.
- Cancel a consumer → no longer a consumer (and not a source, since `paid_from_credit=1`)
  → credit returns (the session it covered didn't happen).

### Schema

Migration `052_session_paid_from_credit.sql`:

```sql
ALTER TABLE therapy_sessions
  ADD COLUMN paid_from_credit TINYINT(1) NOT NULL DEFAULT 0 AFTER payment_status;
```

### Backend — `PATCH /admin/sessions/:id` (`handleUpdateSession`)

- When `paymentStatus` transitions **due → paid**: compute the therapy's current net
  credit (over the other sessions). If `> 0`, set `paid_from_credit = 1` (consume — no new
  money booked). Otherwise leave `paid_from_credit = 0` (normal payment).
- When `paymentStatus` transitions **paid → due**: set `paid_from_credit = 0`
  (automatically returns credit because the consumer disappears).
- The handler **returns the full updated session row** (camelCased, same shape as the GET
  sessions endpoint) so the frontend learns the backend's `paid_from_credit` decision.

Helper `therapyNetCredit(PDO $db, int $therapyId, ?int $excludeSessionId = null): int`
encapsulates the source/consumer/clamp logic; used by the PATCH handler and unit tests.

Existing auto-invoice-on-completion behavior is unchanged.

### Frontend

- `TherapySession` type gains `paidFromCredit: boolean`.
- `useAdminTherapies.updateSession` merges the **returned session object** from the PATCH
  response into local state (today it merges only the fields it sent — would miss the
  credit flag).
- `SessionPanel` financial summary becomes **Offen / Guthaben / Bezahlt**:
  - `Offen` = due & non-cancelled (unchanged).
  - `Bezahlt` = paid & non-cancelled (excludes cancelled+paid sources).
  - `Guthaben` = `max(0, sources − consumers)`; the column is shown only when `> 0`.
  - Computed in the component from the already-loaded sessions array.
- Per-session card:
  - cancelled + paid (source): small note "→ Guthaben erzeugt".
  - `paidFromCredit`: small note "Mit Guthaben verrechnet".
  - When credit is available and the session is due, the € button tooltip reads
    "Mit Guthaben verrechnen" instead of "Als bezahlt markieren".

---

## Part B — Package invoice (Paketrechnung, full amount only)

### Backend — `POST /admin/therapies/:id/invoice` (`handleSendTherapyPackageInvoice`)

Mirrors `handleSendGroupBundleInvoice` but simpler (single full invoice):

1. Load therapy + client.
2. Select covered sessions: `status <> 'cancelled'` AND `payment_status = 'due'` AND
   `invoice_sent = 0`, ordered by date. If none → `400` "Keine offenen Sitzungen".
3. Amount = Σ per-session cost (`session_cost_cents_override` ?? therapy
   `session_cost_cents`).
4. `generateInvoiceNumber($db)`.
5. Render PDF via new template (below).
6. Send email (existing `templates/email/invoice_cover.php`).
7. Mark every covered session `invoice_sent = 1, invoice_sent_at = NOW()`.
8. `archiveSentDocument(...)` to client documents.
9. Return `{ message, invoiceNumber, sessionCount, totalAmount }`.

Route wired in `api/index.php` next to the existing therapy session routes.

### PDF template

New file `api/templates/pdf/rechnung_einzeltherapie_paket.php` — itemized: one table row
per session (Leistung · Datum [+Zeit] · Dauer · Betrag) followed by a Gesamtbetrag row.
Receives `$extra['sessions']` = array of `['date','time','duration','amount']` plus the
usual invoice/client fields. Isolated from existing templates.

`PdfGenerator::generate` titles map gains
`'rechnung_einzeltherapie_paket' => 'Rechnung — Einzeltherapie (Paket)'`.
Resolved via `resolveTemplateKey('pdf:rechnung_einzeltherapie_paket',
'rechnung_einzeltherapie_paket')`.

### Frontend

- `useAdminTherapies` gains `sendPackageInvoice(therapyId)` → `POST
  /admin/therapies/:id/invoice`, then `fetchSessions(therapyId)` to refresh `invoice_sent`.
- `SessionPanel` "Finanzieller Status" card gets a **"Paketrechnung senden"** button,
  disabled when there are no open un-invoiced sessions. `Modal.confirm` shows count + total
  before sending; success message shows the invoice number.

---

## Testing

PHPUnit (`api/tests/`):
- Credit derivation: source/consumer counting, clamping at 0, consume on due→paid when
  credit exists, no-consume when none, refund on paid→due, refund when source un-cancelled.
- Package invoice: correct session selection (excludes cancelled, paid, already-invoiced),
  amount summation with per-session overrides, empty-selection → 400.

`composer check` (lint + tests) before completion. Frontend: `tsc`/build.

## Files

- New: `api/migrations/052_session_paid_from_credit.sql`,
  `api/templates/pdf/rechnung_einzeltherapie_paket.php`, PHPUnit test(s).
- Edit: `api/routes/therapies.php`, `api/index.php`, `api/lib/PdfGenerator.php`,
  `src/lib/data.ts`, `src/lib/useAdminTherapies.ts`,
  `src/admin/components/TherapyList.tsx`, `src/admin/tabs/TherapiesTab.tsx`.
