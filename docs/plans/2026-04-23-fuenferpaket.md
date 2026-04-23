# Fünferpaket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship five independent changes to mut-taucher: booking filter for returning clients, clearer invoice payment note, missing client-delete route, ad-hoc session with cost override, and patient-document type selector with external invoice-number reservation.

**Architecture:** Additive-only — nullable columns, new optional payload fields, and new UI elements that live next to existing ones. No behavior change for existing data.

**Tech Stack:** PHP 8.4 (PHPMailer, TCPDF, PDO/MySQL), PHPUnit 13 with attributes, React 19 + TypeScript 5.9, Ant Design 6, react-hook-form, Vite 7.

**Design reference:** [`docs/plans/2026-04-23-fuenferpaket-design.md`](./2026-04-23-fuenferpaket-design.md).

**Verification baseline (run before starting each item):**
- Backend: `cd api && composer lint && composer test`
- Frontend: `npm run lint && npm run build`

**Work on `main` directly per user instruction.** Each task ends with a commit. Push after the user signs off on the full run.

---

## File Inventory

**Create**

- `api/migrations/048_session_cost_override.sql`
- `api/migrations/049_client_document_type.sql`
- `api/tests/InvoiceNumberTest.php`
- `api/tests/SessionCostTest.php`
- `src/admin/components/AddSessionModal.tsx`
- `src/lib/clientDocumentTypes.ts`

**Modify**

- `api/index.php` (route registration for DELETE clients)
- `api/lib/InvoiceNumber.php` (helpers: parse, reserve)
- `api/lib/PdfGenerator.php` (fallback copy)
- `api/templates/pdf/rechnung.php` (fallback copy)
- `api/routes/therapies.php` (payment note, create session override, invoice amount resolution)
- `api/routes/groups.php` (payment note, create session override, invoice amount resolution)
- `api/routes/client_history.php` (upload handler: type + invoice-number reservation)
- `src/components/Booking.tsx` (existing-client gate)
- `src/admin/components/TherapyList.tsx` (add-session button, override display)
- `src/admin/components/GroupManager.tsx` (add-session button in GroupSessionPanel, override display)
- `src/lib/useAdminTherapies.ts` (`createSession`)
- `src/lib/useAdminGroups.ts` (`createSession`)
- `src/lib/useClientHistory.ts` (upload-doc signature: optional type + invoice number)
- `src/pages/ClientDetail.tsx` (upload card: type select + invoice-number input)

---

## Item 3 — DELETE /admin/clients/:id (smallest, do first)

### Task 3.1: Register the DELETE route

**Files:**
- Modify: `api/index.php` (after the existing PUT block, currently at lines 298–301)

- [ ] **Step 1: Add the route**

Insert the following block in `api/index.php` directly after the `PUT /admin/clients/(\d+)` block (i.e. right before the `GET /admin/clients/(\d+)/timeline` block):

```php
if ($method === 'DELETE' && preg_match('#^/admin/clients/(\d+)$#', $uri, $m)) {
    handleDeleteClient((int)$m[1]);
    exit;
}
```

- [ ] **Step 2: Run backend lint**

Run: `cd api && composer lint`
Expected: no errors.

- [ ] **Step 3: Smoke-test the route**

Start local PHP server if not running: `php -S localhost:8000 -t api/`

In a separate terminal, attempt deletes against the local DB:

```bash
# Returns 401 without auth — proves the route is wired
curl -sS -X DELETE -w "\n%{http_code}\n" http://localhost:8000/admin/clients/999999
# Expected: {"error":"Nicht authentifiziert"} ... 401
```

(For an authenticated confirmation, obtain a dev token via the admin login flow and re-run with `-H "Authorization: Bearer $TOKEN"`; a 404/409/200 from there proves the handler is reached.)

- [ ] **Step 4: Commit**

```bash
git add api/index.php
git commit -m "fix(api): register DELETE /admin/clients/:id route"
```

---

## Item 2 — Invoice payment note copy

### Task 2.1: Update therapy and group invoice generators

**Files:**
- Modify: `api/routes/therapies.php` (around line 613, in `sendTherapySessionInvoice`)
- Modify: `api/routes/groups.php` (around line 1058, in `sendGroupSessionInvoice`)

- [ ] **Step 1: Change therapy payment note**

Locate the line in `api/routes/therapies.php` (currently line 613):
```php
    $paymentNote = 'Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.';
```

Replace with:
```php
    $paymentNote = "Bitte überweisen Sie den Betrag vor dem Termin am {$dateFormatted}.";
```

`$dateFormatted` is already in scope at that point (`date('d.m.Y', strtotime($session['session_date']))`).

- [ ] **Step 2: Change group payment note**

Locate the line in `api/routes/groups.php` (currently line 1058):
```php
    $paymentNote = 'Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.';
```

Check the surrounding code for the formatted date variable name; if it is `$dateFormatted`, replace with:
```php
    $paymentNote = "Bitte überweisen Sie den Betrag vor dem Termin am {$dateFormatted}.";
```

If the variable is named differently (e.g. `$sessionDateFormatted`), use that name. If no formatted-date variable is in scope, add one above the line:
```php
    $dateFormatted = date('d.m.Y', strtotime($session['session_date']));
    $paymentNote = "Bitte überweisen Sie den Betrag vor dem Termin am {$dateFormatted}.";
```

- [ ] **Step 3: Run backend tests**

Run: `cd api && composer test`
Expected: all existing tests pass; no tests touch these string literals.

- [ ] **Step 4: Commit**

```bash
git add api/routes/therapies.php api/routes/groups.php
git commit -m "feat(invoices): switch payment note to \"vor dem Termin am <date>\""
```

### Task 2.2: Update the fallback copy in PdfGenerator and the PDF template

**Files:**
- Modify: `api/lib/PdfGenerator.php` (two occurrences near lines 96 and 186)
- Modify: `api/templates/pdf/rechnung.php` (line 13)

- [ ] **Step 1: Update `PdfGenerator.php` fallbacks**

Replace both occurrences of:
```php
'Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.'
```
with:
```php
'Bitte überweisen Sie den Betrag vor dem Termin.'
```

Context: both are the second operand of `??` inside `htmlspecialchars($extra['paymentNote'] ?? '...')`. The fallback is used only when a caller does not pass `paymentNote`. The new copy is safe even without a date.

- [ ] **Step 2: Update the PDF template fallback**

In `api/templates/pdf/rechnung.php` line 13, replace:
```php
$paymentNote = htmlspecialchars($extra['paymentNote'] ?? 'Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.');
```
with:
```php
$paymentNote = htmlspecialchars($extra['paymentNote'] ?? 'Bitte überweisen Sie den Betrag vor dem Termin.');
```

- [ ] **Step 3: Verify lint + tests**

Run: `cd api && composer lint && composer test`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add api/lib/PdfGenerator.php api/templates/pdf/rechnung.php
git commit -m "feat(invoices): update fallback payment-note copy"
```

---

## Item 1 — Booking: returning-client gate

### Task 1.1: Add checkbox and gate to the booking form

**Files:**
- Modify: `src/components/Booking.tsx`

- [ ] **Step 1: Read the file and find the consent state + submit button**

Open `src/components/Booking.tsx`. Note the existing pattern around line 15 (`const [consent, setConsent] = useState(...)`) and the checkbox rendering around lines 460–495. Confirm how the submit button is gated (look for `allConsented` usage near line 36 and the button `disabled` prop).

- [ ] **Step 2: Add state and derived gate**

Near the top of the component (alongside the `consent` state), add:
```tsx
const [isExistingClient, setIsExistingClient] = useState(false);
```

Next to the existing `allConsented` line (around line 36), add:
```tsx
const canSubmit = allConsented && !isExistingClient;
```

Replace every `disabled={!allConsented ...}` on the submit button (and any equivalent gate) with the new `canSubmit`. Keep other conditions (e.g. loading) intact — e.g. `disabled={!canSubmit || submitting}`.

- [ ] **Step 3: Render the checkbox + error box at the top of the form**

Find the first visible form element (likely the name / email fields, or the step-1 container). Directly above the step-1 content, insert:

```tsx
<div style={{ marginBottom: 16 }}>
  <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
    <input
      type="checkbox"
      checked={isExistingClient}
      onChange={e => setIsExistingClient(e.target.checked)}
      style={{ marginTop: 4 }}
    />
    <span>Ich bin bereits Kunde bei Mut Taucher</span>
  </label>

  {isExistingClient && (
    <div
      role="alert"
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        background: '#fef3f2',
        border: '1px solid #fda29b',
        color: '#912018',
      }}
    >
      Dieser Termin ist nur für Erstkunden. Für alle weiteren Anfragen oder Termine
      wenden Sie sich bitte direkt an mich.
    </div>
  )}
</div>
```

If the component uses a design-system token palette (`theme.useToken()` or similar) for errors, prefer those token values over hard-coded hex; match the style of any existing inline error banner in the file.

- [ ] **Step 4: Hide the rest of the form when the checkbox is active**

Wrap the remaining form content (inputs, consent checkboxes, submit button) with:
```tsx
{!isExistingClient && (
  <>
    {/* existing form content */}
  </>
)}
```

Alternatively, if wrapping the whole JSX tree is awkward, short-circuit inside the step render by returning early when `isExistingClient` is true (but still keeping the checkbox itself visible so the user can uncheck).

- [ ] **Step 5: Run frontend lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 6: Smoke-test the UI**

Run `npm run dev`. In the browser, open the booking flow and verify:
- Checkbox shows at the top of the form.
- Checking it hides the form and shows the error text.
- The submit button never becomes active while the box is checked.
- Unchecking it restores the form and preserves previously entered data (since we're using a state guard, not unmounting).

- [ ] **Step 7: Commit**

```bash
git add src/components/Booking.tsx
git commit -m "feat(booking): block returning clients from intro-call funnel"
```

---

## Item 4 — Ad-hoc session with optional cost override

### Task 4.1: Migration for the override column

**Files:**
- Create: `api/migrations/048_session_cost_override.sql`

- [ ] **Step 1: Write the migration**

Create `api/migrations/048_session_cost_override.sql` with:

```sql
-- Migration 048: per-session cost override for therapies and groups
ALTER TABLE therapy_sessions
  ADD COLUMN session_cost_cents_override INT UNSIGNED DEFAULT NULL AFTER duration_minutes;

ALTER TABLE group_sessions
  ADD COLUMN session_cost_cents_override INT UNSIGNED DEFAULT NULL AFTER duration_minutes;
```

- [ ] **Step 2: Apply the migration locally**

Run: `cd api && php migrate.php`
Expected: prints that migration 048 was applied.

Verify:
```bash
cd api && php -r 'require "db.php"; $db = getDB(); foreach ($db->query("SHOW COLUMNS FROM therapy_sessions LIKE \"session_cost_cents_override\"") as $r) print_r($r);'
```
Expected: one row showing the new column, `Null=YES`.

- [ ] **Step 3: Commit**

```bash
git add api/migrations/048_session_cost_override.sql
git commit -m "feat(db): add session_cost_cents_override to therapy/group sessions"
```

### Task 4.2: TDD — pure helper for resolving session cost

**Files:**
- Create: `api/tests/SessionCostTest.php`
- Modify: `api/lib/InvoiceNumber.php` (we'll append a new helper here to keep invoice-related money logic in one place)

- [ ] **Step 1: Write the failing test**

Create `api/tests/SessionCostTest.php`:

```php
<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/InvoiceNumber.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class SessionCostTest extends TestCase
{
    #[Test]
    public function it_returns_default_when_override_is_null(): void
    {
        $this->assertSame(12000, resolveSessionCost(null, 12000));
    }

    #[Test]
    public function it_returns_override_when_set(): void
    {
        $this->assertSame(15000, resolveSessionCost(15000, 12000));
    }

    #[Test]
    public function it_treats_zero_override_as_valid_free_session(): void
    {
        $this->assertSame(0, resolveSessionCost(0, 12000));
    }
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd api && vendor/bin/phpunit --filter SessionCostTest`
Expected: FAIL with "Call to undefined function resolveSessionCost()".

- [ ] **Step 3: Implement the helper**

Append to `api/lib/InvoiceNumber.php`:

```php
/**
 * Resolve the effective cost (in cents) for a session.
 * Returns the override when set (including the legitimate value 0),
 * otherwise falls back to the therapy/group default.
 */
function resolveSessionCost(?int $override, int $default): int {
    return $override ?? $default;
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd api && vendor/bin/phpunit --filter SessionCostTest`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add api/lib/InvoiceNumber.php api/tests/SessionCostTest.php
git commit -m "feat(api): add resolveSessionCost helper"
```

### Task 4.3: Backend — accept override on create/update and use it in invoices

**Files:**
- Modify: `api/routes/therapies.php` (`handleCreateTherapySession`, `handleUpdateSession`, `sendTherapySessionInvoice` and the GET sessions endpoint around line 317)
- Modify: `api/routes/groups.php` (`handleCreateGroupSession`, session PATCH, `sendGroupSessionInvoice`, and the GET sessions endpoint)

- [ ] **Step 1: Therapy `handleCreateTherapySession` accepts override**

In `api/routes/therapies.php`, locate `handleCreateTherapySession` (around line 355). Replace the INSERT block:

```php
    $stmt = $db->prepare(
        'INSERT INTO therapy_sessions (therapy_id, session_date, session_time, duration_minutes)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $therapyId,
        $date,
        $time,
        $input['durationMinutes'] ?? $defaultDuration,
    ]);
```

with:

```php
    $override = isset($input['sessionCostCentsOverride']) && $input['sessionCostCentsOverride'] !== ''
        ? (int)$input['sessionCostCentsOverride']
        : null;

    $stmt = $db->prepare(
        'INSERT INTO therapy_sessions (therapy_id, session_date, session_time, duration_minutes, session_cost_cents_override)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $therapyId,
        $date,
        $time,
        $input['durationMinutes'] ?? $defaultDuration,
        $override,
    ]);
```

- [ ] **Step 2: Therapy `handleUpdateSession` accepts override**

Locate `handleUpdateSession` (around line 487, PATCH /admin/sessions/:id). Inside the block that builds the dynamic UPDATE SET fields, add an entry for the override. The existing code builds `$fields[]` and `$params[]`; follow that pattern. Example (adjust to the actual code shape):

```php
    if (array_key_exists('sessionCostCentsOverride', $input)) {
        $val = $input['sessionCostCentsOverride'];
        $fields[] = 'session_cost_cents_override = ?';
        $params[] = ($val === null || $val === '') ? null : (int)$val;
    }
```

The explicit-`null` semantics matter: passing `null` clears the override; omitting the key leaves it untouched.

- [ ] **Step 3: Therapy invoice uses resolved cost**

In `sendTherapySessionInvoice` (around line 582), update the SELECT to include the override, then use `resolveSessionCost`:

Change the SELECT (around line 587) — add `s.session_cost_cents_override` to the selected columns. The line currently reads:
```php
    $stmt = $db->prepare(
        'SELECT s.*, t.client_id, t.session_cost_cents, t.label as therapy_label,
```
`s.*` already includes the new column, so no SELECT change is strictly required — verify by printing `$session` if unsure.

Replace the amount computation (around line 608):
```php
    $amountCents = (int)$session['session_cost_cents'];
```
with:
```php
    $amountCents = resolveSessionCost(
        $session['session_cost_cents_override'] !== null ? (int)$session['session_cost_cents_override'] : null,
        (int)$session['session_cost_cents']
    );
```

- [ ] **Step 4: Therapy GET sessions endpoint exposes the override**

In `handleGetTherapySessions` (around line 308–346), the response currently maps DB rows into API DTO fields. Locate the mapping and add:
```php
        'sessionCostCentsOverride' => $s['session_cost_cents_override'] !== null ? (int)$s['session_cost_cents_override'] : null,
```
If the endpoint returns `$sessions` unchanged (raw DB rows), wrap it in the same mapping style used elsewhere in the file.

- [ ] **Step 5: Group — analogous changes**

Repeat steps 1–4 in `api/routes/groups.php`:
- `handleCreateGroupSession` (around line 681): accept `sessionCostCentsOverride`, extend the INSERT.
- Group session PATCH (search for the existing session-update handler): accept `sessionCostCentsOverride` with the same explicit-`null` semantics.
- `sendGroupSessionInvoice` (around line 1053): resolve amount via `resolveSessionCost`, using `$payment['session_cost_cents_override'] ?? null` from an extended SELECT.
- GET group-sessions endpoint: expose `sessionCostCentsOverride` on each session DTO.

For the group invoice SELECT, confirm that `group_sessions.session_cost_cents_override` is joined in; if the current query joins `group_session_payments` and `group_sessions`, include the new column explicitly:
```sql
    SELECT p.*, s.session_cost_cents_override, g.session_cost_cents, ...
```

- [ ] **Step 6: Run backend lint + tests**

Run: `cd api && composer lint && composer test`
Expected: all green; pre-existing tests unchanged.

- [ ] **Step 7: Commit**

```bash
git add api/routes/therapies.php api/routes/groups.php
git commit -m "feat(sessions): accept per-session cost override on create/update and in invoices"
```

### Task 4.4: Frontend — `AddSessionModal` component

**Files:**
- Create: `src/admin/components/AddSessionModal.tsx`

- [ ] **Step 1: Draft the component**

Create `src/admin/components/AddSessionModal.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Modal, DatePicker, TimePicker, InputNumber, Form, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

const { Text } = Typography;

export interface AddSessionSubmit {
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm
  durationMinutes?: number;
  sessionCostCentsOverride?: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddSessionSubmit) => Promise<void>;
  defaultDurationMinutes: number;
  defaultCostCents: number;
  title?: string;
}

export function AddSessionModal({
  open,
  onClose,
  onSubmit,
  defaultDurationMinutes,
  defaultCostCents,
  title = 'Einzeltermin hinzufügen',
}: Props) {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [duration, setDuration] = useState<number>(defaultDurationMinutes);
  const [costEuro, setCostEuro] = useState<number>(defaultCostCents / 100);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(null);
      setTime(null);
      setDuration(defaultDurationMinutes);
      setCostEuro(defaultCostCents / 100);
    }
  }, [open, defaultDurationMinutes, defaultCostCents]);

  const canSubmit = !!date && !!time && !submitting;

  const handleOk = async () => {
    if (!date || !time) return;
    setSubmitting(true);
    try {
      const costCents = Math.round(costEuro * 100);
      const override = costCents === defaultCostCents ? undefined : costCents;
      const dur = duration === defaultDurationMinutes ? undefined : duration;
      await onSubmit({
        date: date.format('YYYY-MM-DD'),
        time: time.format('HH:mm'),
        durationMinutes: dur,
        sessionCostCentsOverride: override,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Hinzufügen"
      cancelText="Abbrechen"
      okButtonProps={{ disabled: !canSubmit, loading: submitting }}
    >
      <Form layout="vertical">
        <Form.Item label="Datum" required>
          <DatePicker value={date} onChange={setDate} format="DD.MM.YYYY" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Uhrzeit" required>
          <TimePicker value={time} onChange={setTime} format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Dauer (Min.)">
          <InputNumber value={duration} onChange={v => setDuration(Number(v))} min={15} step={5} style={{ width: '100%' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>Standard: {defaultDurationMinutes} Min.</Text>
        </Form.Item>
        <Form.Item label="Kosten (€)">
          <InputNumber
            value={costEuro}
            onChange={v => setCostEuro(Number(v))}
            min={0}
            step={5}
            precision={2}
            decimalSeparator=","
            style={{ width: '100%' }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Standard: {(defaultCostCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </Text>
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

Note: `dayjs` is already a dependency. If the existing admin uses `date-fns` exclusively, align with that convention.

- [ ] **Step 2: Verify it type-checks**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/admin/components/AddSessionModal.tsx
git commit -m "feat(admin): add AddSessionModal shared by therapy and group flows"
```

### Task 4.5: Wire modal into therapy + group flows

**Files:**
- Modify: `src/lib/useAdminTherapies.ts`
- Modify: `src/lib/useAdminGroups.ts`
- Modify: `src/admin/components/TherapyList.tsx`
- Modify: `src/admin/components/GroupManager.tsx` (inside `GroupSessionPanel`)

- [ ] **Step 1: Add `createSession` to `useAdminTherapies.ts`**

Follow the existing pattern — `generate-sessions` is already in this file. Add alongside it:

```ts
async function createSession(
  therapyId: number,
  body: { date: string; time: string; durationMinutes?: number; sessionCostCentsOverride?: number | null },
): Promise<void> {
  await apiFetch(`/admin/therapies/${therapyId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  await refreshSessions(therapyId); // use whatever helper the file uses to reload sessions
}
```

Export it on the hook return object.

- [ ] **Step 2: Add `createSession` to `useAdminGroups.ts`**

Mirror the therapy version, pointing at `/admin/groups/${groupId}/sessions`. Also trigger the sessions refresh for that group.

- [ ] **Step 3: Expose `sessionCostCentsOverride` in the Session types**

Locate the TypeScript type for therapy session (likely in `src/lib/useAdminTherapies.ts` or `src/admin/constants.ts`). Add:
```ts
sessionCostCentsOverride: number | null;
```
Same for the group session type in `useAdminGroups.ts`.

- [ ] **Step 4: Mount the modal in `TherapyList.tsx`**

Inside each therapy's session panel, add a state hook and a button:

```tsx
const [addOpen, setAddOpen] = useState(false);
// ...
<Button onClick={() => setAddOpen(true)}>+ Einzeltermin hinzufügen</Button>
<AddSessionModal
  open={addOpen}
  onClose={() => setAddOpen(false)}
  onSubmit={body => createSession(therapy.id, body)}
  defaultDurationMinutes={therapy.sessionDurationMinutes}
  defaultCostCents={therapy.sessionCostCents}
/>
```

When rendering the session list row, if `session.sessionCostCentsOverride !== null`, render an extra label like:
```tsx
<Text type="secondary" style={{ fontSize: 12 }}>
  {(session.sessionCostCentsOverride! / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} € (abweichend)
</Text>
```

- [ ] **Step 5: Mount the modal in `GroupManager.tsx` → `GroupSessionPanel`**

Same pattern — add state, button, modal. Use `group.sessionDurationMinutes` and `group.sessionCostCents` as defaults, call the group `createSession`. Show override label on sessions where `sessionCostCentsOverride !== null`.

- [ ] **Step 6: Run frontend lint + build**

Run: `npm run lint && npm run build`
Expected: green.

- [ ] **Step 7: Smoke-test**

`npm run dev` → log into admin → pick an active therapy → click „+ Einzeltermin hinzufügen" → add a session with a cost that differs from the default → confirm it appears in the list with the „(abweichend)" label. Repeat for a group. Confirm that `POST /admin/therapies/:id/sessions` is called with `sessionCostCentsOverride` only when you actually changed the cost.

- [ ] **Step 8: Commit**

```bash
git add src/lib/useAdminTherapies.ts src/lib/useAdminGroups.ts src/admin/components/TherapyList.tsx src/admin/components/GroupManager.tsx
git commit -m "feat(admin): ad-hoc session creation with optional cost override"
```

---

## Item 5 — Patient documents: type selector + external invoice-number reservation

### Task 5.1: Migration

**Files:**
- Create: `api/migrations/049_client_document_type.sql`

- [ ] **Step 1: Write the migration**

Create `api/migrations/049_client_document_type.sql`:

```sql
-- Migration 049: document type + optional invoice number on uploaded client documents
ALTER TABLE client_documents
  ADD COLUMN document_type VARCHAR(50) DEFAULT NULL AFTER label,
  ADD COLUMN invoice_number VARCHAR(10) DEFAULT NULL AFTER document_type,
  ADD INDEX idx_client_documents_invoice_number (invoice_number);
```

- [ ] **Step 2: Apply the migration**

Run: `cd api && php migrate.php`
Expected: migration 049 applied.

Verify:
```bash
cd api && php -r 'require "db.php"; $db = getDB(); foreach ($db->query("SHOW COLUMNS FROM client_documents") as $r) echo $r["Field"]."\n";'
```
Expected output contains `document_type` and `invoice_number`.

- [ ] **Step 3: Commit**

```bash
git add api/migrations/049_client_document_type.sql
git commit -m "feat(db): add document_type and invoice_number to client_documents"
```

### Task 5.2: TDD — parseInvoiceNumber

**Files:**
- Create: `api/tests/InvoiceNumberTest.php`
- Modify: `api/lib/InvoiceNumber.php`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/InvoiceNumberTest.php`:

```php
<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/InvoiceNumber.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class InvoiceNumberTest extends TestCase
{
    #[Test]
    public function it_parses_a_well_formed_number(): void
    {
        $this->assertSame(
            ['year_prefix' => '26', 'sequence_number' => 42],
            parseInvoiceNumber('26-0042')
        );
    }

    #[Test]
    public function it_strips_leading_zeros_from_sequence(): void
    {
        $this->assertSame(
            ['year_prefix' => '26', 'sequence_number' => 1],
            parseInvoiceNumber('26-0001')
        );
    }

    #[Test]
    public function it_rejects_missing_separator(): void
    {
        $this->assertNull(parseInvoiceNumber('260042'));
    }

    #[Test]
    public function it_rejects_wrong_year_width(): void
    {
        $this->assertNull(parseInvoiceNumber('2026-0042'));
    }

    #[Test]
    public function it_rejects_wrong_sequence_width(): void
    {
        $this->assertNull(parseInvoiceNumber('26-42'));
        $this->assertNull(parseInvoiceNumber('26-00042'));
    }

    #[Test]
    public function it_rejects_non_digits(): void
    {
        $this->assertNull(parseInvoiceNumber('2A-0042'));
        $this->assertNull(parseInvoiceNumber('26-00X2'));
    }
}
```

- [ ] **Step 2: Run and verify failure**

Run: `cd api && vendor/bin/phpunit --filter InvoiceNumberTest`
Expected: FAIL ("Call to undefined function parseInvoiceNumber()").

- [ ] **Step 3: Implement `parseInvoiceNumber`**

Append to `api/lib/InvoiceNumber.php`:

```php
/**
 * Parse an invoice number in format YY-NNNN into its components.
 * Returns null on malformed input.
 */
function parseInvoiceNumber(string $number): ?array {
    if (!preg_match('/^(\d{2})-(\d{4})$/', $number, $m)) {
        return null;
    }
    return [
        'year_prefix'     => $m[1],
        'sequence_number' => (int)$m[2],
    ];
}
```

- [ ] **Step 4: Run and verify pass**

Run: `cd api && vendor/bin/phpunit --filter InvoiceNumberTest`
Expected: PASS (7 assertions).

- [ ] **Step 5: Commit**

```bash
git add api/lib/InvoiceNumber.php api/tests/InvoiceNumberTest.php
git commit -m "feat(api): add parseInvoiceNumber helper with tests"
```

### Task 5.3: `reserveInvoiceNumber` helper + typed exception

**Files:**
- Modify: `api/lib/InvoiceNumber.php`

- [ ] **Step 1: Add the exception and helper**

Append to `api/lib/InvoiceNumber.php`:

```php
/**
 * Thrown when a caller tries to reserve an invoice number that is already taken.
 */
class InvoiceNumberTaken extends RuntimeException {}

/**
 * Reserve a specific externally-issued invoice number so it won't be auto-generated later.
 * Throws InvoiceNumberTaken if the number is already in use.
 * Throws RuntimeException on malformed input.
 */
function reserveInvoiceNumber(PDO $db, string $number): void {
    $parts = parseInvoiceNumber($number);
    if ($parts === null) {
        throw new RuntimeException("Malformed invoice number: {$number}");
    }

    try {
        $stmt = $db->prepare(
            'INSERT INTO invoice_numbers (year_prefix, sequence_number, invoice_number) VALUES (?, ?, ?)'
        );
        $stmt->execute([$parts['year_prefix'], $parts['sequence_number'], $number]);
    } catch (PDOException $e) {
        // MySQL duplicate-key
        if ($e->getCode() === '23000') {
            throw new InvoiceNumberTaken("Invoice number already reserved: {$number}", 0, $e);
        }
        throw $e;
    }
}
```

- [ ] **Step 2: Verify syntax**

Run: `cd api && composer lint`
Expected: no parse errors.

- [ ] **Step 3: Commit**

```bash
git add api/lib/InvoiceNumber.php
git commit -m "feat(api): add reserveInvoiceNumber helper with typed conflict exception"
```

### Task 5.4: Upload handler — accept type + reserve invoice number

**Files:**
- Modify: `api/routes/client_history.php` (in `handleUploadClientDocument`, around lines 292–350)

- [ ] **Step 1: Add the type whitelist constant**

At the top of `api/routes/client_history.php` (after existing `require_once`s), add:

```php
const CLIENT_DOCUMENT_TYPES = [
    'behandlungsvertrag',
    'onlinetherapie',
    'schweigepflichtentbindung',
    'video_einverstaendnis',
    'datenschutz_digital',
    'email_einwilligung',
    'datenschutzinfo',
    'rechnung',
    'zahlungsaufforderung',
    'sonstiges',
];
```

- [ ] **Step 2: Validate inputs and (if rechnung) reserve the number BEFORE moving the file**

Inside `handleUploadClientDocument`, after the existing label/file validations and before `$dir = __DIR__ . '/../assets/client_docs/' . $clientId;`, insert:

```php
    $documentType = isset($_POST['document_type']) && $_POST['document_type'] !== ''
        ? (string)$_POST['document_type']
        : null;
    $invoiceNumber = isset($_POST['invoice_number']) && $_POST['invoice_number'] !== ''
        ? (string)$_POST['invoice_number']
        : null;

    if ($documentType !== null && !in_array($documentType, CLIENT_DOCUMENT_TYPES, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiger Dokumententyp']);
        return;
    }

    if ($documentType === 'rechnung') {
        if ($invoiceNumber === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Rechnungsnummer ist erforderlich']);
            return;
        }
        require_once __DIR__ . '/../lib/InvoiceNumber.php';
        if (parseInvoiceNumber($invoiceNumber) === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Ungültiges Rechnungsnummer-Format (erwartet: JJ-NNNN)']);
            return;
        }
        try {
            reserveInvoiceNumber($db, $invoiceNumber);
        } catch (InvoiceNumberTaken $e) {
            http_response_code(409);
            echo json_encode(['error' => 'Diese Rechnungsnummer ist bereits vergeben.']);
            return;
        }
    } elseif ($invoiceNumber !== null) {
        // Invoice number only makes sense for rechnung type.
        http_response_code(400);
        echo json_encode(['error' => 'Rechnungsnummer ist nur für Typ „Rechnung" erlaubt']);
        return;
    }
```

- [ ] **Step 3: Extend the INSERT to include the new fields**

Locate the existing INSERT block (around line 343):

```php
    $stmt = $db->prepare(
        'INSERT INTO client_documents (client_id, direction, label, filename, mime_type, file_size, file_path, notes)
         VALUES (?, "received", ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $clientId,
        $label,
        $file['name'],
        $file['type'] ?: 'application/octet-stream',
        $file['size'],
        $relativePath,
        $notes,
    ]);
```

Replace with:

```php
    try {
        $stmt = $db->prepare(
            'INSERT INTO client_documents (client_id, direction, label, document_type, invoice_number, filename, mime_type, file_size, file_path, notes)
             VALUES (?, "received", ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $clientId,
            $label,
            $documentType,
            $invoiceNumber,
            $file['name'],
            $file['type'] ?: 'application/octet-stream',
            $file['size'],
            $relativePath,
            $notes,
        ]);
    } catch (Throwable $e) {
        // Best-effort cleanup: the file is already on disk, but the DB row did not land.
        @unlink($destPath);
        throw $e;
    }
```

The ordering is: (1) reserve the invoice number → 409 aborts before any FS work; (2) move the uploaded file; (3) INSERT. If the INSERT fails, the file is removed. The invoice-number reservation stays in place — the safer leak direction (one blocked number, no partial state).

- [ ] **Step 4: Update the returned document DTO**

If the handler echoes a JSON response with the inserted row, include `document_type` and `invoice_number` in the output. If it returns the full row via a subsequent `fetch`, no change needed.

- [ ] **Step 5: Extend the timeline/list SELECTs**

Search `api/routes/client_history.php` for SELECTs on `client_documents` (e.g. the timeline aggregator around line 113 and the GET handlers around lines 357–414). Ensure they either use `SELECT *` (already include the new columns) or explicitly add `document_type, invoice_number`. Add to the returned DTO shape (camelCase) where applicable.

- [ ] **Step 6: Run backend lint + tests**

Run: `cd api && composer lint && composer test`
Expected: green; `InvoiceNumberTest` and `SessionCostTest` pass; existing tests unaffected.

- [ ] **Step 7: Commit**

```bash
git add api/routes/client_history.php
git commit -m "feat(api): client document type + invoice-number reservation on upload"
```

### Task 5.5: Frontend — shared type list + upload-hook signature

**Files:**
- Create: `src/lib/clientDocumentTypes.ts`
- Modify: `src/lib/useClientHistory.ts`

- [ ] **Step 1: Create the shared type-list module**

Create `src/lib/clientDocumentTypes.ts`:

```ts
export interface ClientDocumentTypeDef {
  key: string;
  label: string;
}

export const CLIENT_DOCUMENT_TYPES: ClientDocumentTypeDef[] = [
  { key: 'behandlungsvertrag',     label: 'Behandlungsvertrag' },
  { key: 'onlinetherapie',         label: 'Online-Therapie-Vereinbarung' },
  { key: 'schweigepflichtentbindung', label: 'Schweigepflichtentbindung' },
  { key: 'video_einverstaendnis',  label: 'Einverständnis Video-Therapie' },
  { key: 'datenschutz_digital',    label: 'Datenschutzrisiken digitale Kommunikation' },
  { key: 'email_einwilligung',     label: 'E-Mail-Einwilligung' },
  { key: 'datenschutzinfo',        label: 'Datenschutzinformation' },
  { key: 'rechnung',               label: 'Rechnung' },
  { key: 'zahlungsaufforderung',   label: 'Zahlungsaufforderung' },
  { key: 'sonstiges',              label: 'Sonstiges' },
];

export const INVOICE_NUMBER_PATTERN = /^\d{2}-\d{4}$/;

export function labelForDocumentType(key: string | null | undefined): string | null {
  if (!key) return null;
  return CLIENT_DOCUMENT_TYPES.find(t => t.key === key)?.label ?? null;
}
```

- [ ] **Step 2: Extend the `ClientDocument` type and upload signature**

In `src/lib/useClientHistory.ts`, find the `ClientDocument` interface (around line 30, next to the `direction` field). Add:

```ts
documentType: string | null;
invoiceNumber: string | null;
```

Then locate the upload function (name is likely `uploadDocument` or similar). Change its signature from something like:
```ts
async uploadDocument(clientId: number, file: File, label: string): Promise<void>
```
to:
```ts
async uploadDocument(
  clientId: number,
  file: File,
  label: string,
  opts?: { documentType?: string | null; invoiceNumber?: string | null },
): Promise<void>
```

Inside, when building the `FormData`, append `document_type` and `invoice_number` only when present:
```ts
const form = new FormData();
form.append('file', file);
form.append('label', label);
if (opts?.documentType) form.append('document_type', opts.documentType);
if (opts?.invoiceNumber) form.append('invoice_number', opts.invoiceNumber);
```

Call-site error handling: surface a 409 from the backend as a distinct message to the UI (via the hook's error state or a thrown error with the server message).

- [ ] **Step 3: Build to confirm types**

Run: `npm run build`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/lib/clientDocumentTypes.ts src/lib/useClientHistory.ts
git commit -m "feat(client-history): upload accepts document type + invoice number"
```

### Task 5.6: Frontend — upload UI in ClientDetail

**Files:**
- Modify: `src/pages/ClientDetail.tsx` (upload card around line 320–365)

- [ ] **Step 1: Extend the upload form**

Open `src/pages/ClientDetail.tsx`. At the top of the file, add import:

```tsx
import { CLIENT_DOCUMENT_TYPES, INVOICE_NUMBER_PATTERN } from '@/lib/clientDocumentTypes';
import { Select } from 'antd';
```

Within the upload form component (the function that renders the „Dokument hochladen" card), add new state hooks next to the existing `label` / `file` state:

```tsx
const [documentType, setDocumentType] = useState<string | null>(null);
const [invoiceNumber, setInvoiceNumber] = useState('');
const invoiceNumberRequired = documentType === 'rechnung';
const invoiceNumberValid = !invoiceNumberRequired || INVOICE_NUMBER_PATTERN.test(invoiceNumber);
```

Update `handleSubmit`:
```tsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!file || !label.trim() || submitting) return;
  if (invoiceNumberRequired && !invoiceNumberValid) return;
  setSubmitting(true);
  try {
    await onUpload(file, label.trim(), {
      documentType: documentType ?? undefined,
      invoiceNumber: invoiceNumberRequired ? invoiceNumber : undefined,
    });
    setLabel('');
    setFile(null);
    setDocumentType(null);
    setInvoiceNumber('');
    if (fileRef.current) fileRef.current.value = '';
  } finally {
    setSubmitting(false);
  }
};
```

Also update the `onUpload` prop type at the caller side (search for the upload-card rendering) to match the new signature.

- [ ] **Step 2: Add the Select and conditional Input**

In the form JSX, between the file input and the label input, insert:

```tsx
<Select
  placeholder="Dokumententyp (optional)"
  allowClear
  value={documentType ?? undefined}
  onChange={v => {
    setDocumentType(v ?? null);
    if (v !== 'rechnung') setInvoiceNumber('');
  }}
  style={{ width: 260 }}
  options={CLIENT_DOCUMENT_TYPES.map(t => ({ value: t.key, label: t.label }))}
/>

{invoiceNumberRequired && (
  <Input
    value={invoiceNumber}
    onChange={e => setInvoiceNumber(e.target.value)}
    placeholder="Rechnungsnummer (JJ-NNNN)"
    status={invoiceNumber && !invoiceNumberValid ? 'error' : undefined}
    style={{ width: 200 }}
  />
)}
```

Update the submit button's `disabled` to:
```tsx
disabled={!file || !label.trim() || (invoiceNumberRequired && !invoiceNumberValid)}
```

- [ ] **Step 3: Timeline label fallback**

In the timeline rendering (search for the function that produces the document event label — around line 380+ — or the place where `client_documents` rows are converted to timeline items), use:

```tsx
import { labelForDocumentType } from '@/lib/clientDocumentTypes';

// existing:
// const displayLabel = doc.label;

const typeLabel = labelForDocumentType(doc.documentType);
const invoiceSuffix = doc.invoiceNumber ? ` [${doc.invoiceNumber}]` : '';
const displayLabel = (doc.label || typeLabel || 'Dokument') + invoiceSuffix;
```

Adjust to the actual shape of the timeline item. The goal: user-entered label wins; type label is a fallback; invoice number is always shown as suffix when present.

- [ ] **Step 4: Error handling for 409 duplicates**

In the place where `onUpload` is called or where errors from `useClientHistory.uploadDocument` surface, display the server-provided message (e.g. via `message.error(err.message)` from Ant Design). Verify that a duplicate invoice number → message reads „Diese Rechnungsnummer ist bereits vergeben.".

- [ ] **Step 5: Lint + build**

Run: `npm run lint && npm run build`
Expected: green.

- [ ] **Step 6: Smoke-test the full flow**

Start `npm run dev` and the PHP server.

1. Log into admin, open any client.
2. Upload a file with no type → row appears in timeline with just the label.
3. Upload another file with type „Behandlungsvertrag" → timeline shows the file with the type.
4. Upload a file with type „Rechnung" and number `26-0042` → success.
5. Try to generate a new therapy-session invoice in a scenario where the auto counter would hit `26-0042` (or reserve `26-0042` a second time through the upload form) → error: „Diese Rechnungsnummer ist bereits vergeben.".
6. Verify the row in `invoice_numbers`:
   ```sql
   SELECT * FROM invoice_numbers ORDER BY id DESC LIMIT 5;
   ```

- [ ] **Step 7: Commit**

```bash
git add src/pages/ClientDetail.tsx
git commit -m "feat(client-detail): upload document type + invoice-number reservation UI"
```

---

## Final verification

### Task F.1: Full repo verification

- [ ] **Step 1: Backend**

Run: `cd api && composer lint && composer test`
Expected: green; new tests from Tasks 4.2 and 5.2 present and passing.

- [ ] **Step 2: Frontend**

Run: `npm run lint && npm run build`
Expected: green.

- [ ] **Step 3: Spec updates**

Per `AGENTS.md` completion checklist, review whether any permanent spec needs updating:
- `api/SPEC.md` — add a note under "Important Constraints" that externally-issued invoice numbers can be reserved through the client-document upload flow to prevent auto-generation collisions.
- `src/admin/SPEC.md` — add a note that ad-hoc sessions can carry a per-session cost override.
- Root `SPEC.md` — nothing new.

Keep updates minimal; link to code, not to this plan.

- [ ] **Step 4: Commit spec updates if any**

```bash
git add api/SPEC.md src/admin/SPEC.md
git commit -m "docs(specs): reflect ad-hoc sessions and invoice-number reservation"
```

- [ ] **Step 5: Git log sanity check**

Run: `git log --oneline -n 20`
Expected: a clean sequence of commits, each scoped to one item.

---

## Self-Review Notes

- **Spec coverage:** Each design section has a matching task — Item 1 (Task 1.1), Item 2 (Tasks 2.1–2.2), Item 3 (Task 3.1), Item 4 (Tasks 4.1–4.5), Item 5 (Tasks 5.1–5.6). Final verification covers spec-file updates.
- **Placeholder check:** No "TBD"/"TODO"/"similar to"/"add validation" phrases. Each code-changing step carries its own code block with the complete change.
- **Type consistency:** `sessionCostCentsOverride` is used as the payload field name across backend (snake_case → camelCase mapping via DB columns) and frontend (TS type + hook + modal). `documentType` / `invoiceNumber` are consistent across frontend TS and the form-data keys `document_type` / `invoice_number` used in the backend handler.
- **No unused imports / unreferenced functions:** `parseInvoiceNumber`, `reserveInvoiceNumber`, `InvoiceNumberTaken`, `resolveSessionCost`, `labelForDocumentType`, `INVOICE_NUMBER_PATTERN`, `CLIENT_DOCUMENT_TYPES` are all consumed by later tasks.
