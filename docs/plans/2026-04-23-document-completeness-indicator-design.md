# 2026-04-23 — Document Completeness Indicator Design

Visible signal on each active therapy and group (and, inside a group, on each active participant) when required documents have not been sent or not come back signed. Starting premise: a therapist should be able to scan the Einzeltherapie and Gruppen tabs and immediately see where there is paperwork still to finish.

## Definitions

- **Started:** `start_date <= today` AND `status = 'active'`. Not started → no indicator.
- **Required documents:** entries in `DOCUMENT_DEFINITIONS[contextType]` with `category = 'muss_vorhanden'`.
- **Signed counterpart:** the companion `_sig` key on required entries that have one. Considered satisfied when a row with that `_sig` key exists in `document_sends` scoped to the same subject (therapy client, or group participant).
- **Status enum, per subject:**
  - `'sends-pending'` — at least one required document has no `document_sends` row for this subject.
  - `'signed-pending'` — every required document has been sent, but at least one `signedCounterpart` key has no `document_sends` row for this subject.
  - `'complete'` — every required document is sent and every required `signedCounterpart` is recorded.
  - `null` — the subject has not started yet, or the therapy/group is archived. No indicator.

For groups, the status is resolved **per participant**. The group itself carries an aggregate `participantsDocumentStatus`: the worst state across active participants (`sends-pending` > `signed-pending` > `complete`; `null` if the group has no active participants or is not started).

## Data model

The `document_sends` table already carries a nullable `client_id`. Today `client_id` is always `NULL` for `context_type = 'group'` because `handleDocumentSend` suppresses client resolution for groups. That is the change.

Going forward, every newly inserted row with `context_type = 'group'` carries a non-NULL `client_id` identifying the specific participant. Legacy NULL rows remain in the database as historical group-level sends; they are ignored by all new completeness computations.

**Migration 051:**

```sql
-- Migration 051: covering index for per-subject document-sends lookups
ALTER TABLE document_sends
  ADD INDEX idx_document_sends_context_client
  (context_type, context_id, client_id, document_key);
```

No column change. No backfill. No attempt to retroactively distribute legacy group-level sends to participants — that mapping is not recoverable, and the therapist will see the badge red on affected groups, which is the correct signal.

## Backend changes

### `POST /admin/documents/send`

Location: `api/routes/admin.php`, `handleDocumentSend`.

- When `contextType === 'group'`:
  - Require new body field `clientId: number`. 400 when missing.
  - Look up the participant via `SELECT client_id FROM group_participants WHERE group_id = ? AND client_id = ? AND status = 'active'`. 404 when no active participant matches.
  - Resolve name / email / address from the linked `clients` row.
  - Send email + PDF (no longer suppressed for groups; the previous empty-`clientEmail` short-circuit is gone).
  - Insert `document_sends` row with `client_id = clientId`.
- Therapy / booking / client contexts: unchanged.

### `GET /admin/documents/status`

Location: `api/routes/admin.php`, `handleDocumentStatus`.

- New optional `clientId` query param.
- When provided: `WHERE context_type = ? AND context_id = ? AND client_id = ?`.
- When omitted: current behaviour (returns all sends for the context, useful for the legacy group-level view — kept for backward compatibility although no caller will need it after this change).

### Completeness helper

New file `api/lib/DocumentCompleteness.php`.

- PHP mirror of `DOCUMENT_DEFINITIONS` (the therapy and group lists).
- `computeDocumentStatus(array $sends, string $contextType): 'complete' | 'signed-pending' | 'sends-pending'` — pure, no I/O. Input is a flat array of `['document_key' => ...]` rows. Output is the enum string. `null` (the "not started / archived" case) is the caller's job, not the helper's — keeps the helper a pure function.
- Tested with PHPUnit: transitions between states, empty-sends case, edge cases (extra unknown keys in sends are ignored; signed-counterpart with no main send still resolves to `'sends-pending'` because the main is also missing).

### Therapy list: `GET /admin/therapies`

- Each therapy DTO gains `documentStatus: 'complete' | 'signed-pending' | 'sends-pending' | null`.
- For each active therapy where `start_date <= CURDATE()`, one additional query per therapy (or a single JOIN aggregation across all returned therapies — see Implementation note) retrieves its `document_sends`, feeds them to `computeDocumentStatus`, and writes the result to the DTO.
- For archived or not-yet-started therapies, `documentStatus = null`.

### Group list: `GET /admin/groups`

- Each `participant` DTO gains `documentStatus` (`null` when the group is archived or not started; otherwise the computed enum).
- Each group DTO gains `participantsDocumentStatus`: aggregate `worst(participants.map(p => p.documentStatus))` (`null` when the group is not started / archived or has no active participants).

### Implementation note on list queries

To avoid N+1, the list endpoints can either:
1. Emit one aggregate query joining `document_sends` with the list IDs and grouping by `(context_id, client_id, document_key)`, then bucket in PHP.
2. Iterate and issue one small query per therapy / group (cheaper to write, acceptable for admin list sizes — practice-scale).

**Decision:** Option 2 for the first cut. Admin lists are on the order of dozens of rows, not thousands; the extra query per row is trivial. If this ever becomes a hotspot, switching to Option 1 is a self-contained refactor.

## Frontend changes

### New component: `src/admin/components/DocumentStatusBadge.tsx`

```tsx
<DocumentStatusBadge status={therapy.documentStatus} />
```

- `status === null` or `status === 'complete'` → renders `null`.
- `status === 'sends-pending'` → red `<Tag>`, label `Dokumente fehlen`.
- `status === 'signed-pending'` → orange `<Tag>`, label `Unterschriften fehlen`.

Colour classes match the existing error / warning banners in the project (red uses the same palette as the upload-duplicate toast; orange matches Ant Design's `warning` token). Ant Design `Tag` with `color="red"` / `color="orange"` is sufficient — no custom styling.

### `TherapyList.tsx`

- Import `DocumentStatusBadge`.
- Render the badge in the card header row (next to, or on the same line as, the existing startDate tag at line ~351).
- The existing `<DocumentCollapse contextType="therapy" contextId={therapy.id} />` (line ~383) stays — it is the fix-up surface.

### `GroupManager.tsx` → `GroupCard`

- Import `DocumentStatusBadge`.
- Render the badge on the group card header (next to the startDate tag at line ~712), bound to `group.participantsDocumentStatus`.
- The current group-level `<DocumentCollapse contextType="group" contextId={group.id} />` at line ~781 **is removed**. The group-level checklist no longer makes sense once tracking is per-participant.

### `GroupManager.tsx` → `ParticipantPanel`

- Each participant row gains a `<DocumentStatusBadge status={participant.documentStatus} />` next to the existing name / tag cluster.
- Each participant row gains an "Dokumente" action (button or Collapse trigger) that expands a `DocumentChecklist` scoped to that participant:
  ```tsx
  <DocumentChecklist
    contextType="group"
    contextId={group.id}
    clientId={participant.clientId}
  />
  ```
- Exact interaction shape (inline expand vs. popover vs. modal) is a fine-tuning choice during implementation; the data contract is what matters.

### `DocumentChecklist` / `DocumentCollapse`

- Both gain an optional `clientId?: number` prop.
- When `clientId` is provided, the internal `fetchStatus` call passes it to the API: `fetchStatus(contextType, contextId, clientId)`.
- `useDocumentSends.fetchStatus` signature widens to accept an optional `clientId`; when set, the URL gains `&clientId=${clientId}`.
- `sendDocument` similarly forwards the `clientId` into the POST body.
- When `clientId` is absent (therapy / historical group call), behaviour is unchanged.

### Types

Extend existing types in `src/lib/data.ts` or `src/lib/useAdminTherapies.ts` / `useAdminGroups.ts`:

```ts
type DocumentStatus = 'complete' | 'signed-pending' | 'sends-pending' | null;

interface Therapy {
  // ...existing
  documentStatus: DocumentStatus;
}

interface GroupParticipant {
  // ...existing
  documentStatus: DocumentStatus;
}

interface Group {
  // ...existing
  participantsDocumentStatus: DocumentStatus;
}
```

## Architecture, tests, risks

- **Single source of truth for document definitions:** today `src/lib/useDocumentSends.ts` and, after this change, `api/lib/DocumentCompleteness.php`. These must stay in sync manually. A comment in each pointing at the other is the first cut; a shared JSON file shipped to both sides is a possible future refactor but adds build complexity.
- **Tests:**
  - `DocumentCompletenessTest` (PHPUnit, pure function): covers `'complete'`, `'signed-pending'`, `'sends-pending'`, empty-input, and unknown-key tolerance.
  - No new frontend tests (repo convention). Lint + build + manual smoke cover the UI.
- **Risk — legacy group sends:** any group that had documents sent under the old group-level code path will have `document_sends` rows with `client_id = NULL`. After this change those rows do not count toward any participant's completeness, so affected groups will light up red for every participant until the therapist re-sends per participant. This is the intended signal. Clearly documented as a migration note for the therapist.
- **Risk — group emails start going out for real:** today `handleDocumentSend` short-circuits the email path for groups (empty `clientEmail`). After this change, sending a document to a group participant produces a real outgoing email to that participant's address. This matches the user's intent ("documents are not sent … for each participant") but is worth explicit acknowledgement so the first live send isn't a surprise.
- **Risk — aggregate worst-state is binary per axis:** a group with ten participants, nine complete and one `sends-pending`, shows red on the group card. The per-participant badges allow the therapist to find the culprit in one click.

## Out of scope

- Patient-list badges in `ClientList.tsx`.
- Dashboard-level counters.
- Migration / retroactive linking of legacy group sends to participants.
- Email re-send automation for historical groups.
- Any per-participant tracking for contexts other than `group` (therapy is already 1-to-1 with a client).
