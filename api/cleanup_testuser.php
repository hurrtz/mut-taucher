<?php
/**
 * Remove all traces of the test user (info@tobiaswinkler.berlin).
 * Safe to run multiple times. Run via browser or CLI.
 *
 * Usage:
 *   CLI:     php cleanup_testuser.php
 *   Browser: https://mut-taucher.de/api/cleanup_testuser.php
 */

ini_set('display_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/db.php';

$email = 'info@tobiaswinkler.berlin';
$db = getDB();
$log = [];

// 1. Find client IDs linked to this email
$stmt = $db->prepare('SELECT id FROM clients WHERE email = ?');
$stmt->execute([$email]);
$clientIds = array_column($stmt->fetchAll(), 'id');

if ($clientIds) {
    $placeholders = implode(',', array_fill(0, count($clientIds), '?'));

    // Delete client documents from disk
    $stmt = $db->prepare("SELECT file_path FROM client_documents WHERE client_id IN ($placeholders)");
    $stmt->execute($clientIds);
    foreach ($stmt->fetchAll() as $doc) {
        $path = __DIR__ . '/' . $doc['file_path'];
        if (file_exists($path)) {
            unlink($path);
            $log[] = "Deleted file: {$doc['file_path']}";
        }
    }

    // Clean up empty client_docs directories
    foreach ($clientIds as $cid) {
        $dir = __DIR__ . '/assets/client_docs/' . $cid;
        if (is_dir($dir)) {
            @rmdir($dir); // only removes if empty
            $log[] = "Removed directory: assets/client_docs/{$cid}";
        }
    }

    // Delete dependent records (most cascade, but be explicit)
    foreach ([
        'workbook_sends',
        'client_documents',
        'client_notes',
        'group_session_payments',
        'group_participants',
        'document_sends',
    ] as $table) {
        $stmt = $db->prepare("DELETE FROM $table WHERE client_id IN ($placeholders)");
        $stmt->execute($clientIds);
        $count = $stmt->rowCount();
        if ($count > 0) $log[] = "Deleted {$count} rows from {$table}";
    }

    // Delete therapies (cascades to therapy_sessions, schedule_rules, schedule_exceptions)
    $stmt = $db->prepare("DELETE FROM therapies WHERE client_id IN ($placeholders)");
    $stmt->execute($clientIds);
    $count = $stmt->rowCount();
    if ($count > 0) $log[] = "Deleted {$count} rows from therapies (+ cascaded sessions/schedules)";

    // Delete clients
    $stmt = $db->prepare("DELETE FROM clients WHERE id IN ($placeholders)");
    $stmt->execute($clientIds);
    $log[] = "Deleted " . count($clientIds) . " client(s)";
}

// 2. Delete bookings by email (not FK'd to clients)
$stmt = $db->prepare('DELETE FROM bookings WHERE client_email = ?');
$stmt->execute([$email]);
$count = $stmt->rowCount();
if ($count > 0) $log[] = "Deleted {$count} booking(s)";

// Summary
if (empty($log)) {
    echo "No traces found for {$email}\n";
} else {
    echo "Cleanup for {$email}:\n";
    foreach ($log as $line) {
        echo "  - {$line}\n";
    }
}
