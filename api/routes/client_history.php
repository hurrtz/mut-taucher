<?php

/**
 * Client history routes: timeline, notes CRUD, document upload/download.
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/clients.php'; // composeClientName

// ─── Timeline ────────────────────────────────────────────────────

function handleGetClientTimeline(int $clientId): void {
    requireAuth();
    $db = getDB();

    $limit = max(1, min(200, (int)($_GET['limit'] ?? 50)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));

    $events = [];

    // 1. Individual sessions
    $stmt = $db->prepare(
        'SELECT s.id, s.session_date, s.session_time, s.duration_minutes, s.status, s.notes,
                s.payment_status, s.payment_paid_date, s.invoice_sent,
                t.label as therapy_label, t.session_cost_cents
         FROM therapy_sessions s
         JOIN therapies t ON s.therapy_id = t.id
         WHERE t.client_id = ?
         ORDER BY s.session_date DESC, s.session_time DESC'
    );
    $stmt->execute([$clientId]);
    foreach ($stmt->fetchAll() as $row) {
        $events[] = [
            'type' => 'session',
            'date' => $row['session_date'],
            'time' => $row['session_time'],
            'data' => [
                'id' => (int)$row['id'],
                'therapyLabel' => $row['therapy_label'],
                'durationMinutes' => (int)$row['duration_minutes'],
                'status' => $row['status'],
                'notes' => $row['notes'],
                'paymentStatus' => $row['payment_status'],
                'invoiceSent' => (bool)$row['invoice_sent'],
                'costCents' => (int)$row['session_cost_cents'],
            ],
        ];

        // Payment event (separate timeline entry)
        if ($row['payment_paid_date']) {
            $events[] = [
                'type' => 'payment',
                'date' => $row['payment_paid_date'],
                'time' => '00:00',
                'data' => [
                    'source' => 'session',
                    'sessionId' => (int)$row['id'],
                    'therapyLabel' => $row['therapy_label'],
                    'amountCents' => (int)$row['session_cost_cents'],
                ],
            ];
        }
    }

    // 2. Group sessions
    $stmt = $db->prepare(
        'SELECT gs.id, gs.session_date, gs.session_time, gs.duration_minutes, gs.status, gs.notes,
                g.label as group_label, g.session_cost_cents,
                gsp.payment_status, gsp.payment_paid_date, gsp.invoice_sent
         FROM group_sessions gs
         JOIN therapy_groups g ON gs.group_id = g.id
         JOIN group_participants gp ON gp.group_id = g.id AND gp.client_id = ?
         LEFT JOIN group_session_payments gsp ON gsp.group_session_id = gs.id AND gsp.client_id = ?
         ORDER BY gs.session_date DESC, gs.session_time DESC'
    );
    $stmt->execute([$clientId, $clientId]);
    foreach ($stmt->fetchAll() as $row) {
        $events[] = [
            'type' => 'group_session',
            'date' => $row['session_date'],
            'time' => $row['session_time'],
            'data' => [
                'id' => (int)$row['id'],
                'groupLabel' => $row['group_label'],
                'durationMinutes' => (int)$row['duration_minutes'],
                'status' => $row['status'],
                'notes' => $row['notes'],
                'paymentStatus' => $row['payment_status'],
                'invoiceSent' => (bool)($row['invoice_sent'] ?? false),
                'costCents' => (int)$row['session_cost_cents'],
            ],
        ];

        if ($row['payment_paid_date']) {
            $events[] = [
                'type' => 'payment',
                'date' => $row['payment_paid_date'],
                'time' => '00:00',
                'data' => [
                    'source' => 'group_session',
                    'groupSessionId' => (int)$row['id'],
                    'groupLabel' => $row['group_label'],
                    'amountCents' => (int)$row['session_cost_cents'],
                ],
            ];
        }
    }

    // 3. Client documents (sent & received)
    $stmt = $db->prepare(
        'SELECT id, direction, label, filename, mime_type, file_size, notes, created_at
         FROM client_documents
         WHERE client_id = ?
         ORDER BY created_at DESC'
    );
    $stmt->execute([$clientId]);
    foreach ($stmt->fetchAll() as $row) {
        $events[] = [
            'type' => $row['direction'] === 'sent' ? 'document_sent' : 'document_received',
            'date' => substr($row['created_at'], 0, 10),
            'time' => substr($row['created_at'], 11, 5),
            'data' => [
                'id' => (int)$row['id'],
                'label' => $row['label'],
                'filename' => $row['filename'],
                'mimeType' => $row['mime_type'],
                'fileSize' => (int)$row['file_size'],
                'notes' => $row['notes'],
            ],
        ];
    }

    // 4. Client notes
    $stmt = $db->prepare(
        'SELECT id, note_type, session_id, group_session_id, content, created_at, updated_at
         FROM client_notes
         WHERE client_id = ?
         ORDER BY created_at DESC'
    );
    $stmt->execute([$clientId]);
    foreach ($stmt->fetchAll() as $row) {
        $events[] = [
            'type' => 'note',
            'date' => substr($row['created_at'], 0, 10),
            'time' => substr($row['created_at'], 11, 5),
            'data' => [
                'id' => (int)$row['id'],
                'noteType' => $row['note_type'],
                'sessionId' => $row['session_id'] ? (int)$row['session_id'] : null,
                'groupSessionId' => $row['group_session_id'] ? (int)$row['group_session_id'] : null,
                'content' => $row['content'],
                'updatedAt' => $row['updated_at'],
            ],
        ];
    }

    // 5. Intro-call booking lifecycle
    $stmt = $db->prepare(
        'SELECT be.id, be.event_type, be.occurred_at,
                b.booking_date, b.booking_time, b.booking_number, b.status
         FROM booking_events be
         JOIN bookings b ON b.id = be.booking_id
         WHERE be.client_id = ?
         ORDER BY be.occurred_at DESC'
    );
    $stmt->execute([$clientId]);
    foreach ($stmt->fetchAll() as $row) {
        $events[] = [
            'type' => 'booking_event',
            'date' => substr($row['occurred_at'], 0, 10),
            'time' => substr($row['occurred_at'], 11, 5),
            'data' => [
                'id' => (int)$row['id'],
                'eventType' => $row['event_type'],
                'bookingDate' => $row['booking_date'],
                'bookingTime' => $row['booking_time'],
                'bookingNumber' => $row['booking_number'],
                'bookingStatus' => $row['status'],
            ],
        ];
    }

    // Sort all events reverse-chronologically
    usort($events, function ($a, $b) {
        $cmp = strcmp($b['date'], $a['date']);
        if ($cmp !== 0) return $cmp;
        return strcmp($b['time'], $a['time']);
    });

    $total = count($events);
    $events = array_slice($events, $offset, $limit);

    echo json_encode(['events' => array_values($events), 'total' => $total]);
}

// ─── Notes CRUD ──────────────────────────────────────────────────

function handleGetClientNotes(int $clientId): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare(
        'SELECT id, note_type, session_id, group_session_id, content, created_at, updated_at
         FROM client_notes WHERE client_id = ? ORDER BY created_at DESC'
    );
    $stmt->execute([$clientId]);

    echo json_encode($stmt->fetchAll());
}

function handleCreateClientNote(int $clientId): void {
    requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    $noteType = $input['noteType'] ?? 'general';
    $content = trim($input['content'] ?? '');
    $sessionId = $input['sessionId'] ?? null;
    $groupSessionId = $input['groupSessionId'] ?? null;

    if (!$content) {
        http_response_code(400);
        echo json_encode(['error' => 'Inhalt ist erforderlich']);
        return;
    }

    if (!in_array($noteType, ['general', 'session', 'group_session'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiger Notiztyp']);
        return;
    }

    $stmt = $db->prepare(
        'INSERT INTO client_notes (client_id, note_type, session_id, group_session_id, content)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$clientId, $noteType, $sessionId, $groupSessionId, $content]);

    $id = (int)$db->lastInsertId();
    $stmt = $db->prepare('SELECT * FROM client_notes WHERE id = ?');
    $stmt->execute([$id]);

    http_response_code(201);
    echo json_encode($stmt->fetch());
}

function handleUpdateClientNote(int $noteId): void {
    requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    $content = trim($input['content'] ?? '');
    if (!$content) {
        http_response_code(400);
        echo json_encode(['error' => 'Inhalt ist erforderlich']);
        return;
    }

    $stmt = $db->prepare('UPDATE client_notes SET content = ? WHERE id = ?');
    $stmt->execute([$content, $noteId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Notiz nicht gefunden']);
        return;
    }

    $stmt = $db->prepare('SELECT * FROM client_notes WHERE id = ?');
    $stmt->execute([$noteId]);
    echo json_encode($stmt->fetch());
}

function handleDeleteClientNote(int $noteId): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('DELETE FROM client_notes WHERE id = ?');
    $stmt->execute([$noteId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Notiz nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Notiz gelöscht']);
}

// ─── Document Upload / Download / Delete ─────────────────────────

function handleUploadClientDocument(int $clientId): void {
    requireAuth();
    $db = getDB();

    if (empty($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Datei hochgeladen']);
        return;
    }

    $file = $_FILES['file'];
    $label = trim($_POST['label'] ?? '');
    $notes = trim($_POST['notes'] ?? '') ?: null;

    if (!$label) {
        http_response_code(400);
        echo json_encode(['error' => 'Bezeichnung ist erforderlich']);
        return;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Fehler beim Hochladen: Code ' . $file['error']]);
        return;
    }

    // Max 10MB
    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'Datei darf maximal 10 MB groß sein']);
        return;
    }

    $dir = __DIR__ . '/../assets/client_docs/' . $clientId;
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = 'received_' . date('Y-m-d') . '_' . uniqid() . ($ext ? '.' . $ext : '');
    $destPath = $dir . '/' . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Datei konnte nicht gespeichert werden']);
        return;
    }

    $relativePath = 'assets/client_docs/' . $clientId . '/' . $safeName;

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

    $id = (int)$db->lastInsertId();
    $stmt = $db->prepare('SELECT * FROM client_documents WHERE id = ?');
    $stmt->execute([$id]);

    http_response_code(201);
    echo json_encode($stmt->fetch());
}

function handleDownloadClientDocument(int $docId): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('SELECT * FROM client_documents WHERE id = ?');
    $stmt->execute([$docId]);
    $doc = $stmt->fetch();

    if (!$doc) {
        http_response_code(404);
        echo json_encode(['error' => 'Dokument nicht gefunden']);
        return;
    }

    $filePath = __DIR__ . '/../' . $doc['file_path'];
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Datei nicht gefunden']);
        return;
    }

    header('Content-Type: ' . $doc['mime_type']);
    header('Content-Disposition: attachment; filename="' . $doc['filename'] . '"');
    header('Content-Length: ' . filesize($filePath));
    header_remove('Content-Type'); // Remove the JSON header set by index.php
    header('Content-Type: ' . $doc['mime_type']);
    readfile($filePath);
    exit;
}

function handleDeleteClientDocument(int $docId): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('SELECT * FROM client_documents WHERE id = ?');
    $stmt->execute([$docId]);
    $doc = $stmt->fetch();

    if (!$doc) {
        http_response_code(404);
        echo json_encode(['error' => 'Dokument nicht gefunden']);
        return;
    }

    // Delete file from disk
    $filePath = __DIR__ . '/../' . $doc['file_path'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    $stmt = $db->prepare('DELETE FROM client_documents WHERE id = ?');
    $stmt->execute([$docId]);

    echo json_encode(['message' => 'Dokument gelöscht']);
}

// ─── Helper: Archive a sent PDF to client_documents ──────────────

function archiveSentDocument(int $clientId, string $label, string $pdfContent, string $pdfFilename, ?int $documentSendId = null): void {
    $db = getDB();

    $dir = __DIR__ . '/../assets/client_docs/' . $clientId;
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $safeName = 'sent_' . date('Y-m-d') . '_' . uniqid() . '.pdf';
    $destPath = $dir . '/' . $safeName;
    file_put_contents($destPath, $pdfContent);

    $relativePath = 'assets/client_docs/' . $clientId . '/' . $safeName;

    $stmt = $db->prepare(
        'INSERT INTO client_documents (client_id, direction, label, filename, mime_type, file_size, file_path, document_send_id)
         VALUES (?, "sent", ?, ?, "application/pdf", ?, ?, ?)'
    );
    $stmt->execute([
        $clientId,
        $label,
        $pdfFilename,
        strlen($pdfContent),
        $relativePath,
        $documentSendId,
    ]);
}
