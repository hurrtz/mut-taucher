<?php
/**
 * One-off housekeeping: undo a batch of accidentally auto-generated Einzeltherapie
 * invoices (numbers 10–19) so they are treated as if they never happened.
 *
 * For each targeted invoice number (sequence 10..19) it:
 *   1. deletes the archived PDF from the client's history (client_documents + file),
 *   2. frees the invoice number (invoice_numbers row),
 *   3. resets the therapy sessions that were marked invoiced in that same batch
 *      (invoice_sent -> 0) so they can be invoiced properly later.
 *
 * SAFE BY DEFAULT: runs as a DRY RUN (reports only). Add --apply (CLI) or ?apply=yes
 * (browser) to actually perform the changes.
 *
 * Usage:
 *   Dry run:  php cleanup_invoices_10_19.php
 *   Apply:    php cleanup_invoices_10_19.php --apply
 *   Browser:  https://mut-taucher.de/api/cleanup_invoices_10_19.php          (dry run)
 *             https://mut-taucher.de/api/cleanup_invoices_10_19.php?apply=yes (apply)
 *
 * Range can be overridden: --from=10 --to=19  (or ?from=10&to=19)
 */

ini_set('display_errors', '1');
error_reporting(E_ALL);
header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/db.php';

$cli = php_sapi_name() === 'cli';
$opts = $cli ? getopt('', ['apply', 'from:', 'to:']) : $_GET;
$apply = $cli ? array_key_exists('apply', $opts) : (($_GET['apply'] ?? '') === 'yes');
$from  = (int)($opts['from'] ?? 10);
$to    = (int)($opts['to'] ?? 19);

$db = getDB();

echo "=== Invoice cleanup (sequence {$from}..{$to}) ===\n";
echo $apply ? "MODE: APPLY (changes will be written)\n\n" : "MODE: DRY RUN (no changes)\n\n";

// 1) Target invoice numbers
$stmt = $db->prepare(
    'SELECT invoice_number, sequence_number, created_at
     FROM invoice_numbers
     WHERE sequence_number BETWEEN ? AND ?
     ORDER BY sequence_number'
);
$stmt->execute([$from, $to]);
$targets = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!$targets) {
    echo "No invoice numbers in range {$from}..{$to}. Nothing to do.\n";
    exit(0);
}

$invoiceNumbers = array_column($targets, 'invoice_number');
$createdAt = array_column($targets, 'created_at');
$minCreated = min($createdAt);
$maxCreated = date('Y-m-d H:i:s', strtotime(max($createdAt)) + 300); // +5 min buffer

echo "Invoice numbers (" . count($invoiceNumbers) . "): " . implode(', ', $invoiceNumbers) . "\n";
echo "Created between {$minCreated} and " . max($createdAt) . "\n\n";

// 2) Archived documents for these invoices (matched by label / filename / invoice_number)
$labels    = array_map(fn($n) => "Rechnung {$n}", $invoiceNumbers);
$filenames = array_map(fn($n) => "Rechnung_{$n}.pdf", $invoiceNumbers);
$ph = fn($a) => implode(',', array_fill(0, count($a), '?'));

$docStmt = $db->prepare(
    "SELECT id, client_id, label, filename, file_path, created_at
     FROM client_documents
     WHERE invoice_number IN ({$ph($invoiceNumbers)})
        OR label IN ({$ph($labels)})
        OR filename IN ({$ph($filenames)})"
);
$docStmt->execute([...$invoiceNumbers, ...$labels, ...$filenames]);
$docs = $docStmt->fetchAll(PDO::FETCH_ASSOC);

echo "Client documents to remove (" . count($docs) . "):\n";
foreach ($docs as $d) {
    echo "  - doc#{$d['id']} client#{$d['client_id']} \"{$d['label']}\" ({$d['filename']}) {$d['created_at']}\n";
}
$clientIds = array_values(array_unique(array_map(fn($d) => (int)$d['client_id'], $docs)));
echo "\nAffected client(s): " . ($clientIds ? implode(', ', $clientIds) : '(none found)') . "\n\n";

// 3) Therapy sessions invoiced in this batch (for the affected clients, within the window)
$sessions = [];
if ($clientIds) {
    $sessStmt = $db->prepare(
        "SELECT s.id, s.session_date, s.invoice_sent_at, t.client_id
         FROM therapy_sessions s
         JOIN therapies t ON s.therapy_id = t.id
         WHERE t.client_id IN ({$ph($clientIds)})
           AND s.invoice_sent = 1
           AND s.invoice_sent_at BETWEEN ? AND ?
         ORDER BY s.session_date"
    );
    $sessStmt->execute([...$clientIds, $minCreated, $maxCreated]);
    $sessions = $sessStmt->fetchAll(PDO::FETCH_ASSOC);
}
echo "Therapy sessions to reset to un-invoiced (" . count($sessions) . "):\n";
foreach ($sessions as $s) {
    echo "  - session#{$s['id']} client#{$s['client_id']} date {$s['session_date']} invoiced_at {$s['invoice_sent_at']}\n";
}
echo "\n";

if (!$apply) {
    echo "DRY RUN complete. Re-run with --apply (or ?apply=yes) to perform these changes.\n";
    exit(0);
}

// 4) Apply
$db->beginTransaction();
try {
    if ($docs) {
        $docIds = array_map(fn($d) => (int)$d['id'], $docs);
        $db->prepare("DELETE FROM client_documents WHERE id IN ({$ph($docIds)})")->execute($docIds);
    }
    $db->prepare("DELETE FROM invoice_numbers WHERE sequence_number BETWEEN ? AND ?")->execute([$from, $to]);
    if ($sessions) {
        $sessIds = array_map(fn($s) => (int)$s['id'], $sessions);
        $db->prepare("UPDATE therapy_sessions SET invoice_sent = 0, invoice_sent_at = NULL WHERE id IN ({$ph($sessIds)})")->execute($sessIds);
    }
    $db->commit();
} catch (Exception $e) {
    $db->rollBack();
    echo "FAILED, rolled back: " . $e->getMessage() . "\n";
    exit(1);
}

// 5) Remove PDF files from disk (after commit; cannot be rolled back)
$filesRemoved = 0;
foreach ($docs as $d) {
    $path = __DIR__ . '/' . ltrim($d['file_path'], '/');
    if (is_file($path) && @unlink($path)) {
        $filesRemoved++;
    }
}

echo "APPLIED.\n";
echo "  - Deleted " . count($docs) . " client document row(s); removed {$filesRemoved} PDF file(s)\n";
echo "  - Freed " . count($invoiceNumbers) . " invoice number(s)\n";
echo "  - Reset " . count($sessions) . " therapy session(s) to un-invoiced\n";
