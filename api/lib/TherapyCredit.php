<?php

require_once __DIR__ . '/InvoiceNumber.php';

/**
 * Therapy "Guthaben" (cancellation credit) logic for individual therapy.
 *
 * A session that was already PAID but is then CANCELLED ("Abgesagt") becomes a credit
 * source: the client paid for a session they won't receive, so the therapist owes one.
 * A non-cancelled session that is settled from that credit (paid_from_credit = 1) is a
 * consumer. The net credit a client holds is sources minus consumers, never below zero.
 *
 * The functions operate on plain session rows (associative arrays with the DB column
 * names) so the core logic is pure and unit-testable without a database.
 */

/** A paid + cancelled session that was NOT itself settled from credit. */
function isCreditSource(array $session): bool {
    return ($session['status'] ?? '') === 'cancelled'
        && ($session['payment_status'] ?? '') === 'paid'
        && empty($session['paid_from_credit']);
}

/** A non-cancelled session that was settled from existing credit. */
function isCreditConsumer(array $session): bool {
    return !empty($session['paid_from_credit'])
        && ($session['status'] ?? '') !== 'cancelled';
}

/**
 * Net credit (in whole sessions) derived from a list of session rows.
 * Clamped at zero — consumers never exceed what was earned in practice, but a stray
 * data state must not produce a negative balance.
 */
function therapyNetCreditFromRows(array $sessions): int {
    $sources = 0;
    $consumers = 0;
    foreach ($sessions as $s) {
        if (isCreditSource($s)) {
            $sources++;
        } elseif (isCreditConsumer($s)) {
            $consumers++;
        }
    }
    return max(0, $sources - $consumers);
}

/**
 * Net credit for a therapy, read from the database.
 * Pass $excludeSessionId to ignore one session (e.g. the one currently being updated)
 * when deciding whether spare credit is available to spend on it.
 */
function therapyNetCredit(PDO $db, int $therapyId, ?int $excludeSessionId = null): int {
    $sql = 'SELECT status, payment_status, paid_from_credit FROM therapy_sessions WHERE therapy_id = ?';
    $params = [$therapyId];
    if ($excludeSessionId !== null) {
        $sql .= ' AND id <> ?';
        $params[] = $excludeSessionId;
    }
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return therapyNetCreditFromRows($stmt->fetchAll(PDO::FETCH_ASSOC));
}

/**
 * Filter the sessions a package invoice should cover: open (due), held (not cancelled),
 * and not yet individually invoiced — so nothing is billed twice.
 */
function packageInvoiceSessions(array $sessions): array {
    return array_values(array_filter($sessions, fn($s) =>
        ($s['status'] ?? '') !== 'cancelled'
        && ($s['payment_status'] ?? '') === 'due'
        && empty($s['invoice_sent'])
    ));
}

/**
 * Total (in cents) for a set of sessions, honouring per-session cost overrides and
 * falling back to the therapy default.
 */
function packageInvoiceTotalCents(array $sessions, int $defaultCostCents): int {
    $total = 0;
    foreach ($sessions as $s) {
        $override = isset($s['session_cost_cents_override']) && $s['session_cost_cents_override'] !== null
            ? (int)$s['session_cost_cents_override']
            : null;
        $total += resolveSessionCost($override, $defaultCostCents);
    }
    return $total;
}
