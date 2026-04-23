# Document Completeness Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a per-subject three-state badge (red `Dokumente fehlen` / orange `Unterschriften fehlen` / nothing) on every started, non-archived therapy card, group card, and individual group participant so the therapist can spot missing paperwork at a glance.

**Architecture:** A pure PHP helper computes the 3-state enum from `document_sends` rows against a mirror of the existing TS `DOCUMENT_DEFINITIONS`. Therapy and group list endpoints enrich their DTOs with the status. The group send/status endpoints now scope by `client_id`, so each participant has independent completeness. A new shared `DocumentStatusBadge` renders the result wherever needed.

**Tech Stack:** PHP 8.4, PHPUnit 13 (attribute-style), PDO/MySQL; React 19, TypeScript 5.9, Ant Design 6.

**Design reference:** [`docs/plans/2026-04-23-document-completeness-indicator-design.md`](./2026-04-23-document-completeness-indicator-design.md).

**Verification baseline:**
- Backend: `cd api && composer lint && composer test`
- Frontend: `npm run lint && npm run build`

Work on `main` directly per existing project convention. One commit per task.

---

## File Inventory

**Create**

- `api/migrations/051_document_sends_per_client_index.sql`
- `api/lib/DocumentCompleteness.php`
- `api/tests/DocumentCompletenessTest.php`
- `src/admin/components/DocumentStatusBadge.tsx`

**Modify**

- `api/routes/admin.php` — `handleDocumentSend` (group branch), `handleDocumentStatus` (optional `clientId` filter)
- `api/routes/therapies.php` — enrich therapy DTOs with `documentStatus`
- `api/routes/groups.php` — enrich participant DTOs with `documentStatus`, group DTO with `participantsDocumentStatus`
- `src/lib/data.ts` — add `DocumentStatus` union, extend `Therapy`, `GroupParticipant`, `TherapyGroup`
- `src/lib/useDocumentSends.ts` — optional `clientId` on `fetchStatus` and `sendDocument`
- `src/admin/components/DocumentChecklist.tsx` — optional `clientId` prop on `DocumentChecklist` and `DocumentCollapse`
- `src/admin/components/TherapyList.tsx` — render badge on therapy card
- `src/admin/components/GroupManager.tsx` — remove group-level `DocumentCollapse`, render badge on group card, per-participant badge and per-participant `DocumentChecklist` inside `ParticipantPanel`

---

## Task 1 — Migration 051

**Files:**
- Create: `api/migrations/051_document_sends_per_client_index.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration 051: covering index for per-subject document-sends lookups
ALTER TABLE document_sends
  ADD INDEX idx_document_sends_context_client
  (context_type, context_id, client_id, document_key);
```

- [ ] **Step 2: Apply and verify**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && php migrate.php
```
Expected: `Running 051_document_sends_per_client_index.sql ... OK`.

Then:
```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && php -r 'require "db.php"; $db = getDB(); foreach ($db->query("SHOW INDEX FROM document_sends WHERE Key_name = \"idx_document_sends_context_client\"") as $r) echo $r["Key_name"]." ".$r["Seq_in_index"]." ".$r["Column_name"]."\n";'
```
Expected output: four lines showing the four columns in the order `context_type, context_id, client_id, document_key`.

- [ ] **Step 3: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add api/migrations/051_document_sends_per_client_index.sql && git commit -m "feat(db): covering index for per-client document_sends lookups"
```

---

## Task 2 — TDD DocumentCompleteness helper

**Files:**
- Create: `api/lib/DocumentCompleteness.php`
- Create: `api/tests/DocumentCompletenessTest.php`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/DocumentCompletenessTest.php` with exactly:

```php
<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/DocumentCompleteness.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class DocumentCompletenessTest extends TestCase
{
    private function keys(array $sends): array
    {
        return array_map(fn($s) => ['document_key' => $s], $sends);
    }

    #[Test]
    public function it_returns_sends_pending_when_no_sends_for_therapy(): void
    {
        $this->assertSame('sends-pending', computeDocumentStatus([], 'therapy'));
    }

    #[Test]
    public function it_returns_sends_pending_when_any_muss_vorhanden_missing_for_therapy(): void
    {
        $sends = $this->keys([
            'vertrag_einzeltherapie',
            'onlinetherapie',
            'video_einverstaendnis',
            // missing: email_einwilligung, datenschutzinfo
        ]);
        $this->assertSame('sends-pending', computeDocumentStatus($sends, 'therapy'));
    }

    #[Test]
    public function it_returns_signed_pending_when_all_sent_but_signed_counterpart_missing(): void
    {
        $sends = $this->keys([
            'vertrag_einzeltherapie',
            'onlinetherapie',
            'video_einverstaendnis',
            'email_einwilligung',
            'datenschutzinfo',
            // signed counterparts for the first four are missing
        ]);
        $this->assertSame('signed-pending', computeDocumentStatus($sends, 'therapy'));
    }

    #[Test]
    public function it_returns_complete_when_all_muss_docs_and_all_signed_counterparts_present(): void
    {
        $sends = $this->keys([
            'vertrag_einzeltherapie',      'vertrag_einzeltherapie_sig',
            'onlinetherapie',              'onlinetherapie_sig',
            'video_einverstaendnis',       'video_einverstaendnis_sig',
            'email_einwilligung',          'email_einwilligung_sig',
            'datenschutzinfo',
        ]);
        $this->assertSame('complete', computeDocumentStatus($sends, 'therapy'));
    }

    #[Test]
    public function it_ignores_unknown_send_keys(): void
    {
        $sends = $this->keys([
            'vertrag_einzeltherapie',      'vertrag_einzeltherapie_sig',
            'onlinetherapie',              'onlinetherapie_sig',
            'video_einverstaendnis',       'video_einverstaendnis_sig',
            'email_einwilligung',          'email_einwilligung_sig',
            'datenschutzinfo',
            'something_unknown_1',
            'sollte_unterschrieben_only',
        ]);
        $this->assertSame('complete', computeDocumentStatus($sends, 'therapy'));
    }

    #[Test]
    public function it_computes_status_for_group_context(): void
    {
        $this->assertSame('sends-pending', computeDocumentStatus([], 'group'));

        $sends = $this->keys([
            'vertrag_gruppentherapie',
            'onlinetherapie',
            'video_einverstaendnis',
            'email_einwilligung',
            'datenschutzinfo',
        ]);
        $this->assertSame('signed-pending', computeDocumentStatus($sends, 'group'));

        $sends = $this->keys([
            'vertrag_gruppentherapie',   'vertrag_gruppentherapie_sig',
            'onlinetherapie',            'onlinetherapie_sig',
            'video_einverstaendnis',     'video_einverstaendnis_sig',
            'email_einwilligung',        'email_einwilligung_sig',
            'datenschutzinfo',
        ]);
        $this->assertSame('complete', computeDocumentStatus($sends, 'group'));
    }

    #[Test]
    public function it_returns_sends_pending_when_signed_key_present_without_main_key(): void
    {
        // Defensive: a lone signed counterpart is meaningless — main key is still the gate.
        $sends = $this->keys([
            'vertrag_einzeltherapie_sig',
            'onlinetherapie',
            'video_einverstaendnis',
            'email_einwilligung',
            'datenschutzinfo',
        ]);
        $this->assertSame('sends-pending', computeDocumentStatus($sends, 'therapy'));
    }
}
```

- [ ] **Step 2: Run tests — verify FAIL**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && vendor/bin/phpunit --filter DocumentCompletenessTest
```
Expected: `Error: Call to undefined function computeDocumentStatus()`.

- [ ] **Step 3: Implement the helper**

Create `api/lib/DocumentCompleteness.php`:

```php
<?php

/**
 * Document completeness helper.
 *
 * Mirrors the TypeScript DOCUMENT_DEFINITIONS in src/lib/useDocumentSends.ts.
 * Keep the two lists in sync — a mismatch silently breaks the badge status.
 */

const DOCUMENT_DEFINITIONS = [
    'therapy' => [
        ['key' => 'vertrag_einzeltherapie',    'category' => 'muss_vorhanden',        'signedCounterpart' => 'vertrag_einzeltherapie_sig'],
        ['key' => 'onlinetherapie',            'category' => 'muss_vorhanden',        'signedCounterpart' => 'onlinetherapie_sig'],
        ['key' => 'video_einverstaendnis',     'category' => 'muss_vorhanden',        'signedCounterpart' => 'video_einverstaendnis_sig'],
        ['key' => 'email_einwilligung',        'category' => 'muss_vorhanden',        'signedCounterpart' => 'email_einwilligung_sig'],
        ['key' => 'datenschutzinfo',           'category' => 'muss_vorhanden',        'signedCounterpart' => null],
        ['key' => 'schweigepflichtentbindung', 'category' => 'sollte_unterschrieben', 'signedCounterpart' => 'schweigepflichtentbindung_sig'],
    ],
    'group' => [
        ['key' => 'vertrag_gruppentherapie',   'category' => 'muss_vorhanden',        'signedCounterpart' => 'vertrag_gruppentherapie_sig'],
        ['key' => 'onlinetherapie',            'category' => 'muss_vorhanden',        'signedCounterpart' => 'onlinetherapie_sig'],
        ['key' => 'video_einverstaendnis',     'category' => 'muss_vorhanden',        'signedCounterpart' => 'video_einverstaendnis_sig'],
        ['key' => 'email_einwilligung',        'category' => 'muss_vorhanden',        'signedCounterpart' => 'email_einwilligung_sig'],
        ['key' => 'datenschutzinfo',           'category' => 'muss_vorhanden',        'signedCounterpart' => null],
        ['key' => 'schweigepflichtentbindung', 'category' => 'sollte_unterschrieben', 'signedCounterpart' => 'schweigepflichtentbindung_sig'],
    ],
];

/**
 * Compute a three-state completeness status for a therapy or group subject.
 *
 * $sends is a flat array of rows each containing at least a 'document_key' key
 * (matches the shape returned by SELECT document_key FROM document_sends).
 * $contextType is 'therapy' or 'group'.
 *
 * Returns one of: 'sends-pending', 'signed-pending', 'complete'.
 * The caller is responsible for deciding whether the subject is "started" —
 * this function always returns one of the three strings and never null.
 */
function computeDocumentStatus(array $sends, string $contextType): string
{
    $definitions = DOCUMENT_DEFINITIONS[$contextType] ?? [];
    $sentKeys = [];
    foreach ($sends as $s) {
        if (isset($s['document_key'])) {
            $sentKeys[$s['document_key']] = true;
        }
    }

    $allMussSent = true;
    $allSignedPresent = true;

    foreach ($definitions as $def) {
        if ($def['category'] !== 'muss_vorhanden') {
            continue;
        }
        if (empty($sentKeys[$def['key']])) {
            $allMussSent = false;
        }
        if (!empty($def['signedCounterpart']) && empty($sentKeys[$def['signedCounterpart']])) {
            $allSignedPresent = false;
        }
    }

    if (!$allMussSent) {
        return 'sends-pending';
    }
    if (!$allSignedPresent) {
        return 'signed-pending';
    }
    return 'complete';
}
```

- [ ] **Step 4: Run tests — verify PASS**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && vendor/bin/phpunit --filter DocumentCompletenessTest
```
Expected: 7 passing tests.

- [ ] **Step 5: Full suite + lint**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && composer lint && composer test
```
Expected: all prior tests still green, total `43 tests` (36 prior + 7 new).

- [ ] **Step 6: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add api/lib/DocumentCompleteness.php api/tests/DocumentCompletenessTest.php && git commit -m "feat(api): add DocumentCompleteness helper with tests"
```

---

## Task 3 — Extend `handleDocumentSend` for per-participant group sends

**Files:**
- Modify: `api/routes/admin.php` (`handleDocumentSend`, around lines 656–799)

The current group branch (lines 738–742) sets empty `clientName`/`clientEmail` and suppresses the email. Replace that with a real participant lookup.

- [ ] **Step 1: Read the full handler**

Open `api/routes/admin.php` and locate `handleDocumentSend`. Read the full function (it resolves `$clientName`, `$clientEmail`, `$resolvedClientId`, and optionally sends the PDF email, then inserts into `document_sends`).

- [ ] **Step 2: Replace the group branch**

Find this block (around line 738):

```php
    } elseif ($contextType === 'group') {
        // Groups don't have a single client — document sends are recorded but not emailed
        $clientName = '';
        $clientEmail = '';
    }
```

Replace with:

```php
    } elseif ($contextType === 'group') {
        $clientId = isset($input['clientId']) ? (int)$input['clientId'] : 0;
        if ($clientId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'clientId ist für Gruppen-Dokumente erforderlich']);
            return;
        }
        $stmt = $db->prepare(
            'SELECT c.title, c.first_name, c.last_name, c.suffix, c.email, c.street, c.zip, c.city, c.country
             FROM group_participants gp
             JOIN clients c ON gp.client_id = c.id
             WHERE gp.group_id = ? AND gp.client_id = ? AND gp.status = \'active\''
        );
        $stmt->execute([$contextId, $clientId]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Aktive Gruppenteilnehmer:in nicht gefunden']);
            return;
        }
        $resolvedClientId = $clientId;
        $clientName = composeClientName($row['title'], $row['first_name'], $row['last_name'], $row['suffix']);
        $clientEmail = $row['email'];
        $clientStreet = $row['street'] ?? '';
        $clientZip = $row['zip'] ?? '';
        $clientCity = $row['city'] ?? '';
        $clientCountry = $row['country'] ?? '';
    }
```

The insert into `document_sends` downstream already uses `$resolvedClientId`, so the `client_id` column is now correctly populated for group sends.

- [ ] **Step 3: Lint + tests**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && composer lint && composer test
```
Expected: green (43 tests, no route-level test changes).

- [ ] **Step 4: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add api/routes/admin.php && git commit -m "feat(api): per-participant document sends for group context"
```

---

## Task 4 — Extend `handleDocumentStatus` with `clientId` filter

**Files:**
- Modify: `api/routes/admin.php` (`handleDocumentStatus`, around lines 801–833)

- [ ] **Step 1: Add the optional filter**

Locate `handleDocumentStatus`. Current shape:

```php
    $stmt = $db->prepare(
        'SELECT document_key, sent_at FROM document_sends
         WHERE context_type = ? AND context_id = ?
         ORDER BY sent_at DESC'
    );
    $stmt->execute([$contextType, $contextId]);
```

Replace with:

```php
    $clientId = isset($_GET['clientId']) ? (int)$_GET['clientId'] : 0;

    if ($clientId > 0) {
        $stmt = $db->prepare(
            'SELECT document_key, sent_at FROM document_sends
             WHERE context_type = ? AND context_id = ? AND client_id = ?
             ORDER BY sent_at DESC'
        );
        $stmt->execute([$contextType, $contextId, $clientId]);
    } else {
        $stmt = $db->prepare(
            'SELECT document_key, sent_at FROM document_sends
             WHERE context_type = ? AND context_id = ?
             ORDER BY sent_at DESC'
        );
        $stmt->execute([$contextType, $contextId]);
    }
```

- [ ] **Step 2: Lint + tests**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && composer lint && composer test
```
Expected: green.

- [ ] **Step 3: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add api/routes/admin.php && git commit -m "feat(api): optional clientId filter on document-status endpoint"
```

---

## Task 5 — Therapy list DTO: `documentStatus`

**Files:**
- Modify: `api/routes/therapies.php`

Every therapy DTO returned by the list endpoint (and the single-therapy GET, for consistency) now carries `documentStatus`. For archived therapies or therapies whose `start_date` is in the future, the value is `null`; otherwise it's one of the three enum strings from `computeDocumentStatus`.

- [ ] **Step 1: Require the helper at the top of the file**

In `api/routes/therapies.php`, near the other `require_once` lines at the top (currently adding through line 6), ensure:

```php
require_once __DIR__ . '/../lib/DocumentCompleteness.php';
```

is present. Add the line if missing.

- [ ] **Step 2: Locate the therapy DTO formatter**

Open `api/routes/therapies.php` and find the function that maps a DB therapy row to a DTO (it's used in both the list and single-get handlers, around lines 30–110 — look for the block returning the camelCase object, e.g. `return [ 'id' => ..., 'clientId' => ..., ... ]`). It takes the raw row and returns the API-shaped array.

- [ ] **Step 3: Add the `documentStatus` field**

At the point where the DTO array is built, compute and add the field. Example shape (adapt variable names to whatever the actual function uses — `$t` is the raw row, the DTO is the returned array):

```php
    $documentStatus = null;
    if ($t['status'] === 'active' && !empty($t['start_date']) && strtotime($t['start_date']) <= strtotime(date('Y-m-d'))) {
        $sendsStmt = $db->prepare(
            'SELECT document_key FROM document_sends WHERE context_type = \'therapy\' AND context_id = ?'
        );
        $sendsStmt->execute([(int)$t['id']]);
        $documentStatus = computeDocumentStatus($sendsStmt->fetchAll(), 'therapy');
    }
```

Then add to the returned DTO array:

```php
        'documentStatus' => $documentStatus,
```

If the file has two formatter sites (list and single), add it in both. If the list handler formats rows inline rather than via a shared function, add an equivalent block inside that loop.

- [ ] **Step 4: Lint + tests**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && composer lint && composer test
```
Expected: 43 tests, green.

- [ ] **Step 5: Quick DB-level sanity check**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && php -r '
require "db.php";
require "lib/DocumentCompleteness.php";
$db = getDB();
$rows = $db->query("SELECT id, start_date, status FROM therapies LIMIT 3")->fetchAll();
foreach ($rows as $t) {
    if ($t["status"] !== "active" || strtotime($t["start_date"]) > time()) { echo "Therapy #{$t["id"]}: null\n"; continue; }
    $sendsStmt = $db->prepare("SELECT document_key FROM document_sends WHERE context_type = \"therapy\" AND context_id = ?");
    $sendsStmt->execute([(int)$t["id"]]);
    echo "Therapy #{$t["id"]}: ".computeDocumentStatus($sendsStmt->fetchAll(), "therapy")."\n";
}'
```
Expected: per-therapy status lines. No errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add api/routes/therapies.php && git commit -m "feat(api): expose documentStatus on therapy DTOs"
```

---

## Task 6 — Group list DTO: per-participant `documentStatus` + aggregate

**Files:**
- Modify: `api/routes/groups.php` (`formatGroupRow` at ~line 86, which enumerates participants)

Every participant gains `documentStatus`; the group itself gains `participantsDocumentStatus` = worst state across active participants, or `null` when not started / archived / no active participants.

- [ ] **Step 1: Require the helper at the top of the file**

Near the other `require_once` lines at the top of `api/routes/groups.php`, ensure:

```php
require_once __DIR__ . '/../lib/DocumentCompleteness.php';
```

is present. Add the line if missing.

- [ ] **Step 2: Read `formatGroupRow` fully**

Open `api/routes/groups.php` and read the function (around lines 86–160). Note how it:
- Fetches participants (`$participants = $partStmt->fetchAll()`).
- Builds the `participants` array inside the returned DTO.

- [ ] **Step 3: Determine "started" for the group**

Before the participants loop, add:

```php
    $groupStarted = (
        ($g['status'] ?? 'active') === 'active'
        && !empty($g['start_date'])
        && strtotime($g['start_date']) <= strtotime(date('Y-m-d'))
    );
```

- [ ] **Step 4: Compute per-participant status and extend the participant DTO**

Inside the participants loop, for each active participant compute their status:

```php
    $participantDtos = [];
    $statusPriority = ['sends-pending' => 3, 'signed-pending' => 2, 'complete' => 1];
    $worst = null;

    foreach ($participants as $p) {
        $participantDocStatus = null;
        if ($groupStarted && $p['status'] === 'active') {
            $sendsStmt = $db->prepare(
                'SELECT document_key FROM document_sends
                 WHERE context_type = \'group\' AND context_id = ? AND client_id = ?'
            );
            $sendsStmt->execute([(int)$g['id'], (int)$p['client_id']]);
            $participantDocStatus = computeDocumentStatus($sendsStmt->fetchAll(), 'group');

            if ($worst === null || $statusPriority[$participantDocStatus] > $statusPriority[$worst]) {
                $worst = $participantDocStatus;
            }
        }

        $participantDtos[] = [
            'clientId'        => (int)$p['client_id'],
            'clientName'      => composeClientName($p['client_title'], $p['client_first_name'], $p['client_last_name'], $p['client_suffix']),
            'clientEmail'     => $p['client_email'],
            'joinedAt'        => $p['joined_at'],
            'status'          => $p['status'],
            'invoiceStatus'   => $p['invoice_status'],
            'documentStatus'  => $participantDocStatus,
        ];
    }
```

Replace the existing participant-DTO construction with this block. Adapt the composeClientName args to match the actual column aliases in the existing SELECT — they are `client_title`, `client_first_name`, `client_last_name`, `client_suffix` per the current SELECT at line 96.

- [ ] **Step 5: Add `participantsDocumentStatus` to the returned group DTO**

At the end of `formatGroupRow`, in the returned array, add:

```php
        'participantsDocumentStatus' => $groupStarted ? $worst : null,
        'participants'               => $participantDtos,
```

(Replace the previous `'participants' => ...` key with the new assignment; make sure only one `'participants'` key exists in the final returned array.)

- [ ] **Step 6: Lint + tests**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && composer lint && composer test
```
Expected: green.

- [ ] **Step 7: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add api/routes/groups.php && git commit -m "feat(api): per-participant documentStatus + group aggregate"
```

---

## Task 7 — Frontend types

**Files:**
- Modify: `src/lib/data.ts`

- [ ] **Step 1: Add the `DocumentStatus` union**

In `src/lib/data.ts`, near the `DocumentSend` / `DocumentDefinition` interfaces (around line 189), add:

```ts
export type DocumentStatus = 'complete' | 'signed-pending' | 'sends-pending' | null;
```

- [ ] **Step 2: Extend `Therapy`**

In the `Therapy` interface (line 154), add the field just before `createdAt`:

```ts
  documentStatus: DocumentStatus;
```

- [ ] **Step 3: Extend `GroupParticipant`**

In the `GroupParticipant` interface (line 86), add as the last field:

```ts
  documentStatus: DocumentStatus;
```

- [ ] **Step 4: Extend `TherapyGroup`**

In the `TherapyGroup` interface (line 64), add the field just before `schedule`:

```ts
  participantsDocumentStatus: DocumentStatus;
```

- [ ] **Step 5: Build to confirm**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && npm run build
```
Expected: green.

*Note:* Depending on whether every consumer fully destructures these types, there may be zero new type errors — the new fields are additive.

- [ ] **Step 6: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add src/lib/data.ts && git commit -m "feat(types): DocumentStatus on Therapy, GroupParticipant, TherapyGroup"
```

---

## Task 8 — `useDocumentSends` accepts `clientId`

**Files:**
- Modify: `src/lib/useDocumentSends.ts`

- [ ] **Step 1: Update `fetchStatus`**

Find the current signature (line 37):
```ts
const fetchStatus = useCallback(async (contextType: string, contextId: number) => {
```

Change the function body to:

```ts
  const fetchStatus = useCallback(async (contextType: string, contextId: number, clientId?: number) => {
    setError(null);
    try {
      const url = clientId
        ? `/admin/documents/status?contextType=${contextType}&contextId=${contextId}&clientId=${clientId}`
        : `/admin/documents/status?contextType=${contextType}&contextId=${contextId}`;
      const data = await apiFetch<DocumentSend[]>(url);
      setSends(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden des Dokumentstatus');
    }
  }, []);
```

- [ ] **Step 2: Update `sendDocument`**

Find the current signature (line 49):
```ts
const sendDocument = useCallback(async (contextType: string, contextId: number, documentKey: string) => {
```

Change the function to:

```ts
  const sendDocument = useCallback(async (
    contextType: string,
    contextId: number,
    documentKey: string,
    clientId?: number,
  ) => {
    setError(null);
    setSending(documentKey);
    try {
      const body: Record<string, unknown> = { contextType, contextId, documentKey };
      if (clientId) body.clientId = clientId;
      await apiFetch('/admin/documents/send', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await fetchStatus(contextType, contextId, clientId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Senden');
    } finally {
      setSending(null);
    }
  }, [fetchStatus]);
```

- [ ] **Step 3: Build to confirm**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && npm run build
```
Expected: green.

- [ ] **Step 4: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add src/lib/useDocumentSends.ts && git commit -m "feat(useDocumentSends): optional clientId on fetchStatus and sendDocument"
```

---

## Task 9 — `DocumentChecklist` and `DocumentCollapse` thread `clientId`

**Files:**
- Modify: `src/admin/components/DocumentChecklist.tsx`

- [ ] **Step 1: Extend `DocumentChecklist` props**

At line 17, change the component signature to:

```tsx
export default function DocumentChecklist({ contextType, contextId, clientId, onCompletionChange }: {
  contextType: 'therapy' | 'group';
  contextId: number;
  clientId?: number;
  onCompletionChange?: (allDone: boolean) => void;
}) {
```

- [ ] **Step 2: Thread `clientId` into the fetch**

At line 24–26, change:
```tsx
  useEffect(() => {
    if (contextId) fetchStatus(contextType, contextId);
  }, [contextType, contextId, fetchStatus]);
```
to:
```tsx
  useEffect(() => {
    if (contextId) fetchStatus(contextType, contextId, clientId);
  }, [contextType, contextId, clientId, fetchStatus]);
```

- [ ] **Step 3: Thread `clientId` into every `sendDocument` call**

At every call site inside the component (around lines 96, 111, 127), change e.g.
```tsx
onClick={() => sendDocument(contextType, contextId, doc.key)}
```
to:
```tsx
onClick={() => sendDocument(contextType, contextId, doc.key, clientId)}
```

And for the signed-counterpart call:
```tsx
onClick={() => sendDocument(contextType, contextId, doc.signedCounterpart!, clientId)}
```

- [ ] **Step 4: Extend `DocumentCollapse` props and forwarding**

At line 201 (`export function DocumentCollapse(...)`), change the signature and body to:

```tsx
export function DocumentCollapse({ contextType, contextId, clientId }: {
  contextType: 'therapy' | 'group';
  contextId: number;
  clientId?: number;
}) {
```

Then find the `<DocumentChecklist ... />` inside (around line 215) and add the `clientId` prop:

```tsx
<DocumentChecklist
  contextType={contextType}
  contextId={contextId}
  clientId={clientId}
/>
```

(Keep any other props that may already be there, e.g. `onCompletionChange`, untouched.)

- [ ] **Step 5: Build**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && npm run build
```
Expected: green.

- [ ] **Step 6: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add src/admin/components/DocumentChecklist.tsx && git commit -m "feat(admin): DocumentChecklist/Collapse accept optional clientId"
```

---

## Task 10 — `DocumentStatusBadge` + wire into `TherapyList`

**Files:**
- Create: `src/admin/components/DocumentStatusBadge.tsx`
- Modify: `src/admin/components/TherapyList.tsx`

- [ ] **Step 1: Create the badge component**

Create `src/admin/components/DocumentStatusBadge.tsx` with:

```tsx
import { Tag } from 'antd';
import type { DocumentStatus } from '../../lib/data';

export default function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  if (status === null || status === 'complete') return null;
  if (status === 'sends-pending') {
    return <Tag color="red">Dokumente fehlen</Tag>;
  }
  if (status === 'signed-pending') {
    return <Tag color="orange">Unterschriften fehlen</Tag>;
  }
  return null;
}
```

- [ ] **Step 2: Import into `TherapyList.tsx`**

At the top of `src/admin/components/TherapyList.tsx`, add:

```tsx
import DocumentStatusBadge from './DocumentStatusBadge';
```

- [ ] **Step 3: Render near the start-date tag**

Find the line that renders the therapy start-date in the card header (around line 351):

```tsx
Ab {format(parseISO(therapy.startDate), 'd. MMM yyyy', { locale: de })}
```

Immediately next to it (in the same parent flex row — match the surrounding JSX style), add:

```tsx
<DocumentStatusBadge status={therapy.documentStatus} />
```

Pick a placement that reads cleanly with the existing row of metadata (`startDate`, `sessionCostCents`, etc.). If the existing row is a `<Space>` or flex container, the badge slots in as a sibling.

- [ ] **Step 4: Build + visual sanity**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && npm run lint && npm run build
```
Expected: green.

- [ ] **Step 5: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add src/admin/components/DocumentStatusBadge.tsx src/admin/components/TherapyList.tsx && git commit -m "feat(admin): DocumentStatusBadge + therapy-card badge"
```

---

## Task 11 — Group card badge + per-participant checklist

**Files:**
- Modify: `src/admin/components/GroupManager.tsx`

- [ ] **Step 1: Import the badge**

Near the existing `DocumentCollapse` import at the top of the file (line 5), add:

```tsx
import DocumentStatusBadge from './DocumentStatusBadge';
```

- [ ] **Step 2: Render the group-level badge**

In `GroupCard`, find the startDate render (around line 712):

```tsx
{group.startDate && (
  // ... Ab {format(parseISO(group.startDate), ...)} ...
)}
```

Add alongside:

```tsx
<DocumentStatusBadge status={group.participantsDocumentStatus} />
```

- [ ] **Step 3: Remove the group-level `DocumentCollapse`**

Find and delete the block at around line 781:

```tsx
<DocumentCollapse contextType="group" contextId={group.id} />
```

If there are surrounding layout wrappers that only existed to host this Collapse, remove them as well. The group-level checklist is no longer meaningful.

- [ ] **Step 4: Add a per-participant badge and checklist inside `ParticipantPanel`**

In the `ParticipantPanel` function (starts at line 26), find the section that renders each active participant row. For each row, add:

1. A `<DocumentStatusBadge status={participant.documentStatus} />` adjacent to the participant's name / existing chips.
2. An expand/collapse mechanism revealing a per-participant `DocumentChecklist`:

```tsx
<DocumentChecklist
  contextType="group"
  contextId={group.id}
  clientId={participant.clientId}
/>
```

Simplest viable structure: use an Ant Design `<Collapse>` (similar to the `DocumentCollapse` pattern) with the participant's name as the header and the checklist inside, placed below the participant row's metadata. If the existing row layout would become cluttered, place each participant inside a `<Collapse.Panel>` whose label is `{participant.clientName}` and whose extra slot carries the badge.

Add the import if not present:

```tsx
import DocumentChecklist from './DocumentChecklist';
```

- [ ] **Step 5: Build + smoke**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && npm run lint && npm run build
```
Expected: green; no new TypeScript errors on the file.

Then `npm run dev` and verify in the browser:
1. A started group with no documents sent shows `Dokumente fehlen` on the group card.
2. Expanding the participant list shows the same badge per participant.
3. Expanding a participant opens the checklist. Sending a document updates that participant's badge and (once all `muss_vorhanden` + signed counterparts are satisfied) also clears the group-card badge.
4. Other participants' badges remain unchanged when you send to just one participant.

- [ ] **Step 6: Commit**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add src/admin/components/GroupManager.tsx && git commit -m "feat(admin): per-participant document checklist + badges on group card"
```

---

## Task 12 — Final verification + SPEC updates

- [ ] **Step 1: Backend**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher/api && composer lint && composer test
```
Expected: lint clean; 43 tests green.

- [ ] **Step 2: Frontend**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && npm run lint && npm run build
```
Expected: build green; no new lint errors on touched files.

- [ ] **Step 3: SPEC updates**

Add to `api/SPEC.md` (Important Constraints), one bullet:

```
- Group document sends are recorded per participant (`document_sends.client_id` populated for `context_type = 'group'`); participant completeness is computed against the `DOCUMENT_DEFINITIONS` mirror in `lib/DocumentCompleteness.php`.
```

Add to `src/admin/SPEC.md` (Important Constraints), one bullet:

```
- Therapy and group cards surface a three-state document-completeness badge (red `Dokumente fehlen`, orange `Unterschriften fehlen`, none for complete or not-started); group cards aggregate the worst state across active participants, and each participant row carries its own badge and checklist.
```

Root `SPEC.md`: no change warranted.

- [ ] **Step 4: Commit spec updates**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git add api/SPEC.md src/admin/SPEC.md && git commit -m "docs(specs): document completeness indicator and per-participant tracking"
```

- [ ] **Step 5: Git log sanity**

```bash
cd /Users/tobias.winkler/Projects/mut-taucher && git log --oneline -n 15
```
Expected: clean sequence of the 11 implementation commits plus the spec update, in order.

---

## Self-Review Notes

- **Spec coverage:** all four spec sections (Definitions, Data model, Backend, Frontend) map to tasks. Migration → Task 1. PHP helper + tests → Task 2. Send/Status endpoints → Tasks 3 + 4. List DTOs → Tasks 5 + 6. Frontend types → Task 7. Hook signature → Task 8. Checklist threading → Task 9. Therapy badge + new badge component → Task 10. Group-side badges + per-participant checklist → Task 11. Final verification + SPECs → Task 12.
- **Placeholder check:** no "TBD", "similar to", "add error handling" phrases. Each code-changing step carries the actual code block.
- **Type consistency:** `DocumentStatus` is `'complete' | 'signed-pending' | 'sends-pending' | null` in both the PHP helper (returns the three non-null values; caller adds `null`) and the TypeScript union (all four values). `documentStatus` (camelCase) is the DTO/frontend field; `document_key` (snake_case) is the DB column and the PHP helper's expected input shape.
- **Out-of-scope deferrals acknowledged:** no task touches the patient list, dashboard, or legacy-send backfill.
