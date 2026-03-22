<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../jwt.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../slots.php';
require_once __DIR__ . '/../lib/DocumentRegistry.php';

/**
 * POST /api/login
 * Body: { password }
 */
function handleLogin(): void {
    $config = require __DIR__ . '/../config.php';
    $input = json_decode(file_get_contents('php://input'), true);
    $password = $input['password'] ?? '';

    if (!$password || !password_verify($password, $config['admin_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Falsches Passwort']);
        return;
    }

    $token = jwtEncode([
        'role' => 'admin',
        'iat'  => time(),
        'exp'  => time() + 86400, // 24 hours
    ], $config['jwt_secret']);

    echo json_encode(['token' => $token]);
}

// ─── Rules CRUD ──────────────────────────────────────────────────

/**
 * GET /api/admin/rules
 */
function handleGetRules(): void {
    requireAuth();
    $db = getDB();
    $rules = loadRules($db);

    // Format for frontend
    $result = array_map(function ($rule) {
        return [
            'id'              => (int)$rule['id'],
            'label'           => $rule['label'],
            'time'            => $rule['time'],
            'durationMinutes' => (int)$rule['duration_minutes'],
            'startDate'       => $rule['start_date'],
            'endDate'         => $rule['end_date'],
            'days'            => array_map(fn($d) => [
                'dayOfWeek' => (int)$d['day_of_week'],
                'frequency' => $d['frequency'],
            ], $rule['days']),
            'exceptions'      => $rule['exceptions'],
            'category'        => $rule['category'] ?? 'erstgespraech',
            'priceCents'      => $rule['price_cents'] !== null ? (int)$rule['price_cents'] : null,
        ];
    }, $rules);

    echo json_encode(array_values($result));
}

/**
 * POST /api/admin/rules
 * Body: { label, time, durationMinutes, days: [{dayOfWeek, frequency}], startDate, endDate }
 */
function handleCreateRule(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $db->beginTransaction();
    try {
        $stmt = $db->prepare(
            'INSERT INTO recurring_rules (label, time, duration_minutes, start_date, end_date, category, price_cents)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['label'] ?? '',
            $input['time'],
            $input['durationMinutes'] ?? 60,
            $input['startDate'],
            $input['endDate'] ?: null,
            $input['category'] ?? 'erstgespraech',
            isset($input['priceCents']) ? (int)$input['priceCents'] : null,
        ]);
        $ruleId = $db->lastInsertId();

        $dayStmt = $db->prepare(
            'INSERT INTO rule_days (rule_id, day_of_week, frequency) VALUES (?, ?, ?)'
        );
        foreach ($input['days'] as $day) {
            $dayStmt->execute([$ruleId, $day['dayOfWeek'], $day['frequency']]);
        }

        $db->commit();

        echo json_encode(['id' => (int)$ruleId, 'message' => 'Regel angelegt']);
    } catch (\Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * PUT /api/admin/rules/:id
 */
function handleUpdateRule(int $id): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $db->beginTransaction();
    try {
        $stmt = $db->prepare(
            'UPDATE recurring_rules SET label = ?, time = ?, duration_minutes = ?, start_date = ?, end_date = ?, category = ?, price_cents = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $input['label'] ?? '',
            $input['time'],
            $input['durationMinutes'] ?? 60,
            $input['startDate'],
            $input['endDate'] ?: null,
            $input['category'] ?? 'erstgespraech',
            isset($input['priceCents']) ? (int)$input['priceCents'] : null,
            $id,
        ]);

        // Replace days
        $db->prepare('DELETE FROM rule_days WHERE rule_id = ?')->execute([$id]);
        $dayStmt = $db->prepare(
            'INSERT INTO rule_days (rule_id, day_of_week, frequency) VALUES (?, ?, ?)'
        );
        foreach ($input['days'] as $day) {
            $dayStmt->execute([$id, $day['dayOfWeek'], $day['frequency']]);
        }

        $db->commit();

        echo json_encode(['message' => 'Regel aktualisiert']);
    } catch (\Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * DELETE /api/admin/rules/:id
 */
function handleDeleteRule(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('DELETE FROM recurring_rules WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Regel nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Regel gelöscht']);
}

// ─── Exceptions ──────────────────────────────────────────────────

/**
 * POST /api/admin/rules/:id/exceptions
 * Body: { date }
 * Toggles: if exception exists, remove it; otherwise add it.
 */
function handleToggleException(int $ruleId): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $date = $input['date'] ?? '';

    if (!$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Datum erforderlich']);
        return;
    }

    $db = getDB();

    // Check if exception exists
    $stmt = $db->prepare(
        'SELECT id FROM rule_exceptions WHERE rule_id = ? AND exception_date = ?'
    );
    $stmt->execute([$ruleId, $date]);
    $existing = $stmt->fetch();

    if ($existing) {
        $db->prepare('DELETE FROM rule_exceptions WHERE id = ?')->execute([$existing['id']]);
        echo json_encode(['action' => 'removed', 'date' => $date]);
    } else {
        $stmt = $db->prepare(
            'INSERT INTO rule_exceptions (rule_id, exception_date) VALUES (?, ?)'
        );
        $stmt->execute([$ruleId, $date]);
        echo json_encode(['action' => 'added', 'date' => $date]);
    }
}

// ─── Events (one-off slots) ──────────────────────────────────────

/**
 * GET /api/admin/events
 */
function handleGetEvents(): void {
    requireAuth();
    $db = getDB();
    $events = $db->query('SELECT * FROM events ORDER BY event_date ASC, time ASC')->fetchAll();

    $result = array_map(fn($e) => [
        'id'              => (int)$e['id'],
        'label'           => $e['label'],
        'date'            => $e['event_date'],
        'time'            => $e['time'],
        'durationMinutes' => (int)$e['duration_minutes'],
        'category'        => $e['category'] ?? 'erstgespraech',
        'priceCents'      => $e['price_cents'] !== null ? (int)$e['price_cents'] : null,
    ], $events);

    echo json_encode(array_values($result));
}

/**
 * POST /api/admin/events
 * Body: { label, date, time, durationMinutes }
 */
function handleCreateEvent(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $date = $input['date'] ?? '';
    $time = $input['time'] ?? '';

    if (!$date || !$time) {
        http_response_code(400);
        echo json_encode(['error' => 'Datum und Uhrzeit erforderlich']);
        return;
    }

    $stmt = $db->prepare(
        'INSERT INTO events (label, event_date, time, duration_minutes, category, price_cents) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $input['label'] ?? '',
        $date,
        $time,
        $input['durationMinutes'] ?? 60,
        $input['category'] ?? 'erstgespraech',
        isset($input['priceCents']) ? (int)$input['priceCents'] : null,
    ]);

    echo json_encode(['id' => (int)$db->lastInsertId(), 'message' => 'Einzeltermin angelegt']);
}

/**
 * DELETE /api/admin/events/:id
 */
function handleDeleteEvent(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('DELETE FROM events WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Einzeltermin nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Einzeltermin gelöscht']);
}

// ─── Bookings ────────────────────────────────────────────────────

function fetchAdminBookingRow(PDO $db, int $bookingId): ?array {
    $stmt = $db->prepare(
        'SELECT b.*, r.label as rule_label, e.label as event_label,
                r.price_cents as rule_price_cents, e.price_cents as event_price_cents,
                (SELECT COUNT(*) FROM clients c WHERE c.booking_id = b.id) as has_client
         FROM bookings b
         LEFT JOIN recurring_rules r ON b.rule_id = r.id
         LEFT JOIN events e ON b.event_id = e.id
         WHERE b.id = ?'
    );
    $stmt->execute([$bookingId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function serializeAdminBookingRow(array $b): array {
    return [
        'id'                  => (int)$b['id'],
        'ruleId'              => $b['rule_id'] ? (int)$b['rule_id'] : null,
        'eventId'             => $b['event_id'] ? (int)$b['event_id'] : null,
        'ruleLabel'           => $b['rule_label'] ?? $b['event_label'] ?? '',
        'date'                => $b['booking_date'],
        'time'                => $b['booking_time'],
        'durationMinutes'     => (int)$b['duration_minutes'],
        'clientFirstName'     => $b['client_first_name'],
        'clientLastName'      => $b['client_last_name'],
        'clientName'          => trim($b['client_first_name'] . ' ' . $b['client_last_name']),
        'clientEmail'         => $b['client_email'],
        'clientPhone'         => $b['client_phone'] ?? null,
        'clientStreet'        => $b['client_street'] ?? null,
        'clientZip'           => $b['client_zip'] ?? null,
        'clientCity'          => $b['client_city'] ?? null,
        'clientMessage'       => $b['client_message'] ?? null,
        'status'              => $b['status'],
        'paymentMethod'       => $b['payment_method'],
        'paymentId'           => $b['payment_id'],
        'bookingNumber'       => $b['booking_number'] ?? null,
        'paymentRequestSent'  => (bool)($b['payment_request_sent'] ?? false),
        'paymentRequestSentAt'=> $b['payment_request_sent_at'] ?? null,
        'introEmailSent'      => (bool)$b['intro_email_sent'],
        'reminderSent'        => (bool)$b['reminder_sent'],
        'invoiceSent'         => (bool)$b['invoice_sent'],
        'invoiceSentAt'       => $b['invoice_sent_at'],
        'priceCents'          => $b['rule_price_cents'] !== null ? (int)$b['rule_price_cents'] : ($b['event_price_cents'] !== null ? (int)$b['event_price_cents'] : null),
        'createdAt'           => $b['created_at'],
        'hasClient'           => (int)$b['has_client'] > 0,
    ];
}

/**
 * GET /api/admin/bookings?from=...&to=...
 */
function handleGetBookings(): void {
    requireAuth();
    $from = $_GET['from'] ?? '';
    $to   = $_GET['to']   ?? '';

    $db = getDB();

    $sql = 'SELECT b.*, r.label as rule_label, e.label as event_label,
                   r.price_cents as rule_price_cents, e.price_cents as event_price_cents,
                   (SELECT COUNT(*) FROM clients c WHERE c.booking_id = b.id) as has_client
            FROM bookings b
            LEFT JOIN recurring_rules r ON b.rule_id = r.id
            LEFT JOIN events e ON b.event_id = e.id';
    $params = [];

    if ($from && $to) {
        $sql .= ' WHERE b.booking_date BETWEEN ? AND ?';
        $params = [$from, $to];
    }

    $sql .= ' ORDER BY b.booking_date ASC, b.booking_time ASC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();

    $result = array_map('serializeAdminBookingRow', $bookings);

    echo json_encode(array_values($result));
}

/**
 * PATCH /api/admin/bookings/:id
 * Body: { status?, introEmailSent?, reminderSent? }
 */
function handleUpdateBooking(int $id): void {
    requireAuth();
    require_once __DIR__ . '/../lib/BookingInvoice.php';
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();
    $existing = fetchAdminBookingRow($db, $id);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Buchung nicht gefunden']);
        return;
    }

    $fields = [];
    $params = [];
    $shouldAttemptInvoice = false;
    $warning = null;

    if (isset($input['status'])) {
        if ($input['status'] === 'cancelled') {
            $db->prepare('DELETE FROM bookings WHERE id = ?')->execute([$id]);
            echo json_encode(['message' => 'Buchung gelöscht', 'deletedId' => $id]);
            return;
        }
        if (in_array($input['status'], ['confirmed', 'completed'], true)) {
            $fields[] = 'status = ?';
            $params[] = $input['status'];

            if (
                !$existing['invoice_sent']
                && (
                    ($existing['status'] === 'pending_payment' && $input['status'] === 'confirmed')
                    || ($existing['status'] !== 'completed' && $input['status'] === 'completed')
                )
            ) {
                $shouldAttemptInvoice = true;
            }
        }
    }
    if (isset($input['introEmailSent'])) {
        $fields[] = 'intro_email_sent = ?';
        $params[] = $input['introEmailSent'] ? 1 : 0;
    }
    if (isset($input['reminderSent'])) {
        $fields[] = 'reminder_sent = ?';
        $params[] = $input['reminderSent'] ? 1 : 0;
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Änderungen angegeben']);
        return;
    }

    $params[] = $id;
    $sql = 'UPDATE bookings SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    if ($shouldAttemptInvoice) {
        try {
            sendBookingInvoice($db, $id);
        } catch (Throwable $e) {
            $warning = 'Status gespeichert, aber die Rechnung konnte nicht automatisch gesendet werden.';
            error_log('Automatic booking invoice failed for booking #' . $id . ': ' . $e->getMessage());
        }
    }

    $updated = fetchAdminBookingRow($db, $id);
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Buchung nicht gefunden']);
        return;
    }

    echo json_encode([
        'message' => 'Buchung aktualisiert',
        'warning' => $warning,
        'booking' => serializeAdminBookingRow($updated),
    ]);
}

/**
 * POST /api/admin/bookings/:id/email
 * Body: { type: "intro" | "reminder" }
 */
function handleSendEmail(int $bookingId): void {
    requireAuth();
    require_once __DIR__ . '/../lib/Mailer.php';
    $config = require __DIR__ . '/../config.php';
    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? '';

    if (!in_array($type, ['intro', 'reminder'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Typ muss "intro" oder "reminder" sein']);
        return;
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        http_response_code(404);
        echo json_encode(['error' => 'Buchung nicht gefunden']);
        return;
    }

    $clientName = trim($booking['client_first_name'] . ' ' . $booking['client_last_name']);
    $dateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
    $time = $booking['booking_time'];
    $duration = (int)$booking['duration_minutes'];
    $bookingNumber = $booking['booking_number'] ?? null;
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';

    ob_start();
    include __DIR__ . '/../templates/email/booking_confirmation.php';
    $htmlBody = ob_get_clean();

    if ($type === 'intro') {
        $subject = 'Ihr Termin bei ' . $therapistName;
    } else {
        $subject = 'Erinnerung: Ihr Termin am ' . $dateFormatted;
    }

    try {
        $mailer = new Mailer();
        $mailer->send($booking['client_email'], $clientName, $subject, $htmlBody);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'E-Mail konnte nicht gesendet werden']);
        return;
    }

    $flagField = $type === 'intro' ? 'intro_email_sent' : 'reminder_sent';
    $db->prepare("UPDATE bookings SET $flagField = 1 WHERE id = ?")->execute([$bookingId]);

    echo json_encode(['message' => 'E-Mail gesendet']);
}

// ─── Document Send/Status (generic) ─────────────────────────────

/**
 * POST /api/admin/documents/send
 * Body: { contextType, contextId, documentKey }
 * Sends a document (PDF if template exists) and records it in document_sends.
 */
function handleDocumentSend(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $contextType = $input['contextType'] ?? '';
    $contextId = (int)($input['contextId'] ?? 0);
    $documentKey = $input['documentKey'] ?? '';

    if (!$contextType || !$contextId || !$documentKey) {
        http_response_code(400);
        echo json_encode(['error' => 'contextType, contextId und documentKey sind erforderlich']);
        return;
    }

    $doc = DocumentRegistry::findDocument($contextType, $documentKey);
    if (!$doc) {
        http_response_code(400);
        echo json_encode(['error' => 'Unbekannter Dokumenttyp']);
        return;
    }

    // Resolve client name/email based on context
    $clientName = '';
    $clientEmail = '';
    $resolvedClientId = null;

    $clientStreet = '';
    $clientZip = '';
    $clientCity = '';
    $clientCountry = '';

    if ($contextType === 'client') {
        $resolvedClientId = $contextId;
        $stmt = $db->prepare('SELECT title, first_name, last_name, suffix, email, street, zip, city, country FROM clients WHERE id = ?');
        $stmt->execute([$contextId]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Patient:in nicht gefunden']);
            return;
        }
        $clientName = composeClientName($row['title'], $row['first_name'], $row['last_name'], $row['suffix']);
        $clientEmail = $row['email'];
        $clientStreet = $row['street'] ?? '';
        $clientZip = $row['zip'] ?? '';
        $clientCity = $row['city'] ?? '';
        $clientCountry = $row['country'] ?? '';
    } elseif ($contextType === 'erstgespraech') {
        $stmt = $db->prepare('SELECT client_first_name, client_last_name, client_email, client_street, client_zip, client_city FROM bookings WHERE id = ?');
        $stmt->execute([$contextId]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Buchung nicht gefunden']);
            return;
        }
        $clientName = trim($row['client_first_name'] . ' ' . $row['client_last_name']);
        $clientEmail = $row['client_email'];
        $clientStreet = $row['client_street'] ?? '';
        $clientZip = $row['client_zip'] ?? '';
        $clientCity = $row['client_city'] ?? '';
    } elseif ($contextType === 'therapy') {
        $stmt = $db->prepare(
            'SELECT t.client_id, c.title, c.first_name, c.last_name, c.suffix, c.email, c.street, c.zip, c.city, c.country FROM therapies t JOIN clients c ON t.client_id = c.id WHERE t.id = ?'
        );
        $stmt->execute([$contextId]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Therapie nicht gefunden']);
            return;
        }
        $resolvedClientId = (int)$row['client_id'];
        $clientName = composeClientName($row['title'], $row['first_name'], $row['last_name'], $row['suffix']);
        $clientEmail = $row['email'];
        $clientStreet = $row['street'] ?? '';
        $clientZip = $row['zip'] ?? '';
        $clientCity = $row['city'] ?? '';
        $clientCountry = $row['country'] ?? '';
    } elseif ($contextType === 'group') {
        // Groups don't have a single client — document sends are recorded but not emailed
        $clientName = '';
        $clientEmail = '';
    }

    // If document has a PDF template, generate and send
    if ($doc['template'] && $clientEmail) {
        require_once __DIR__ . '/../lib/Mailer.php';
        require_once __DIR__ . '/../lib/PdfGenerator.php';
        $config = require __DIR__ . '/../config.php';

        $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
        $siteUrl = $config['site_url'] ?? '';
        $dateFormatted = date('d.m.Y');

        $pdfGen = new PdfGenerator();
        $pdfContent = $pdfGen->generate($doc['template'], $clientName, $dateFormatted, [
            'clientStreet'  => $clientStreet,
            'clientZip'     => $clientZip,
            'clientCity'    => $clientCity,
            'clientCountry' => $clientCountry,
        ]);

        $documentName = $doc['label'];
        ob_start();
        include __DIR__ . '/../templates/email/document_cover.php';
        $htmlBody = ob_get_clean();

        try {
            $mailer = new Mailer();
            $pdfFilename = str_replace(' ', '_', $doc['label']) . '.pdf';
            $mailer->sendWithPdf(
                $clientEmail,
                $clientName,
                $doc['label'] . ' — ' . $therapistName,
                $htmlBody,
                $pdfContent,
                $pdfFilename
            );
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Dokument konnte nicht gesendet werden: ' . $e->getMessage()]);
            return;
        }
    }

    // Record in document_sends
    $stmt = $db->prepare(
        'INSERT INTO document_sends (client_id, context_type, context_id, document_key) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$resolvedClientId, $contextType, $contextId, $documentKey]);
    $documentSendId = (int)$db->lastInsertId();

    // Archive sent PDF to client documents
    if ($resolvedClientId && isset($pdfContent) && isset($pdfFilename)) {
        require_once __DIR__ . '/client_history.php';
        archiveSentDocument($resolvedClientId, $doc['label'], $pdfContent, $pdfFilename, $documentSendId);
    }

    echo json_encode(['message' => $doc['label'] . ' gesendet/vermerkt']);
}

/**
 * GET /api/admin/documents/status?contextType=&contextId=
 * Returns send history for a given context.
 */
function handleDocumentStatus(): void {
    requireAuth();
    $db = getDB();

    $contextType = $_GET['contextType'] ?? '';
    $contextId = (int)($_GET['contextId'] ?? 0);

    if (!$contextType || !$contextId) {
        http_response_code(400);
        echo json_encode(['error' => 'contextType und contextId sind erforderlich']);
        return;
    }

    $stmt = $db->prepare(
        'SELECT document_key, sent_at FROM document_sends
         WHERE context_type = ? AND context_id = ?
         ORDER BY sent_at DESC'
    );
    $stmt->execute([$contextType, $contextId]);
    $sends = $stmt->fetchAll();

    $result = array_map(fn($s) => [
        'documentKey' => $s['document_key'],
        'sentAt'      => $s['sent_at'],
    ], $sends);

    echo json_encode(array_values($result));
}

/**
 * GET /api/admin/documents/registry
 * Returns the full document registry for the frontend.
 */
function handleDocumentRegistry(): void {
    requireAuth();
    echo json_encode(DocumentRegistry::getAll());
}

// ─── Calendar Sessions ──────────────────────────────────────────

/**
 * GET /api/admin/calendar-sessions?from=&to=
 * Returns therapy + group sessions for calendar display.
 */
function handleGetCalendarSessions(): void {
    requireAuth();
    $from = $_GET['from'] ?? '';
    $to   = $_GET['to']   ?? '';

    if (!$from || !$to) {
        http_response_code(400);
        echo json_encode(['error' => 'from und to sind erforderlich']);
        return;
    }

    $db = getDB();

    $sql = "
        SELECT 'einzeltherapie' AS category, ts.session_date AS sessionDate, ts.session_time AS sessionTime,
               ts.duration_minutes AS durationMinutes, t.label, ts.status, ts.id AS sessionId, t.id AS sourceId
        FROM therapy_sessions ts
        JOIN therapies t ON ts.therapy_id = t.id
        WHERE ts.session_date BETWEEN ? AND ? AND ts.status != 'cancelled'
        UNION ALL
        SELECT 'gruppentherapie', gs.session_date, gs.session_time,
               gs.duration_minutes, tg.label, gs.status, gs.id, tg.id
        FROM group_sessions gs
        JOIN therapy_groups tg ON gs.group_id = tg.id
        WHERE gs.session_date BETWEEN ? AND ? AND gs.status != 'cancelled'
        ORDER BY sessionDate ASC, sessionTime ASC
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([$from, $to, $from, $to]);
    $rows = $stmt->fetchAll();

    $result = array_map(fn($r) => [
        'category'        => $r['category'],
        'sessionDate'     => $r['sessionDate'],
        'sessionTime'     => $r['sessionTime'],
        'durationMinutes' => (int)$r['durationMinutes'],
        'label'           => $r['label'],
        'status'          => $r['status'],
        'sessionId'       => (int)$r['sessionId'],
        'sourceId'        => (int)$r['sourceId'],
    ], $rows);

    echo json_encode(array_values($result));
}

// ─── Block Day ──────────────────────────────────────────────────

/**
 * POST /api/admin/calendar/block-day
 * Blocks an entire day: adds exceptions to all schedules, cancels all sessions.
 */
function handleBlockDay(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $date = $input['date'] ?? '';
    $reason = $input['reason'] ?? '';

    if (!$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Datum erforderlich']);
        return;
    }

    $db = getDB();
    $cancelled = [];

    $db->beginTransaction();
    try {
        // 1. Insert into blocked_days
        $stmt = $db->prepare('INSERT IGNORE INTO blocked_days (block_date, reason) VALUES (?, ?)');
        $stmt->execute([$date, $reason]);

        // 2. Add exceptions for all active recurring_rules
        $rules = $db->query('SELECT id FROM recurring_rules')->fetchAll();
        $excStmt = $db->prepare('INSERT IGNORE INTO rule_exceptions (rule_id, exception_date) VALUES (?, ?)');
        foreach ($rules as $rule) {
            $excStmt->execute([$rule['id'], $date]);
        }

        // 3. Add exceptions for all active therapies
        $therapies = $db->query("SELECT id FROM therapies WHERE status = 'active'")->fetchAll();
        $therapyExcStmt = $db->prepare('INSERT IGNORE INTO therapy_schedule_exceptions (therapy_id, exception_date) VALUES (?, ?)');
        foreach ($therapies as $therapy) {
            $therapyExcStmt->execute([$therapy['id'], $date]);
        }

        // 4. Add exceptions for all active groups
        $groups = $db->query("SELECT id FROM therapy_groups WHERE status = 'active'")->fetchAll();
        $groupExcStmt = $db->prepare('INSERT IGNORE INTO group_schedule_exceptions (group_id, exception_date) VALUES (?, ?)');
        foreach ($groups as $group) {
            $groupExcStmt->execute([$group['id'], $date]);
        }

        // 5. Cancel bookings on that date
        $bookingStmt = $db->prepare(
            "SELECT b.id, b.booking_date, b.booking_time, b.client_first_name, b.client_last_name, b.client_email
             FROM bookings b WHERE b.booking_date = ? AND b.status != 'cancelled'"
        );
        $bookingStmt->execute([$date]);
        $bookings = $bookingStmt->fetchAll();
        foreach ($bookings as $b) {
            $cancelled[] = [
                'type' => 'erstgespraech',
                'id' => (int)$b['id'],
                'date' => $b['booking_date'],
                'time' => $b['booking_time'],
                'clientName' => trim($b['client_first_name'] . ' ' . $b['client_last_name']),
                'clientEmail' => $b['client_email'],
            ];
        }
        $db->prepare("DELETE FROM bookings WHERE booking_date = ?")->execute([$date]);

        // 6. Cancel therapy sessions
        $tsStmt = $db->prepare(
            "SELECT ts.id AS session_id, t.id AS therapy_id, ts.session_date, ts.session_time,
                    t.label, c.first_name, c.last_name, c.email
             FROM therapy_sessions ts
             JOIN therapies t ON ts.therapy_id = t.id
             JOIN clients c ON t.client_id = c.id
             WHERE ts.session_date = ? AND ts.status != 'cancelled'"
        );
        $tsStmt->execute([$date]);
        $therapySessions = $tsStmt->fetchAll();
        foreach ($therapySessions as $ts) {
            $cancelled[] = [
                'type' => 'einzeltherapie',
                'id' => (int)$ts['therapy_id'],
                'sessionId' => (int)$ts['session_id'],
                'date' => $ts['session_date'],
                'time' => $ts['session_time'],
                'label' => $ts['label'],
                'clientName' => trim($ts['first_name'] . ' ' . $ts['last_name']),
                'clientEmail' => $ts['email'],
            ];
        }
        $db->prepare("UPDATE therapy_sessions SET status = 'cancelled' WHERE session_date = ? AND status != 'cancelled'")->execute([$date]);

        // 7. Cancel group sessions
        $gsStmt = $db->prepare(
            "SELECT gs.id AS session_id, tg.id AS group_id, gs.session_date, gs.session_time, tg.label
             FROM group_sessions gs
             JOIN therapy_groups tg ON gs.group_id = tg.id
             WHERE gs.session_date = ? AND gs.status != 'cancelled'"
        );
        $gsStmt->execute([$date]);
        $groupSessions = $gsStmt->fetchAll();
        foreach ($groupSessions as $gs) {
            // Get participants
            $partStmt = $db->prepare(
                "SELECT c.first_name, c.last_name, c.email
                 FROM group_participants gp JOIN clients c ON gp.client_id = c.id
                 WHERE gp.group_id = ? AND gp.status = 'active'"
            );
            $partStmt->execute([$gs['group_id']]);
            $participants = array_map(fn($p) => [
                'name' => trim($p['first_name'] . ' ' . $p['last_name']),
                'email' => $p['email'],
            ], $partStmt->fetchAll());

            $cancelled[] = [
                'type' => 'gruppentherapie',
                'id' => (int)$gs['group_id'],
                'sessionId' => (int)$gs['session_id'],
                'date' => $gs['session_date'],
                'time' => $gs['session_time'],
                'label' => $gs['label'],
                'participants' => $participants,
            ];
        }
        $db->prepare("UPDATE group_sessions SET status = 'cancelled' WHERE session_date = ? AND status != 'cancelled'")->execute([$date]);

        $db->commit();
    } catch (\Exception $e) {
        $db->rollBack();
        throw $e;
    }

    echo json_encode(['cancelled' => $cancelled]);
}

/**
 * DELETE /api/admin/calendar/block-day
 * Removes a blocked day (does NOT undo cancellations).
 */
function handleUnblockDay(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $date = $input['date'] ?? '';

    if (!$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Datum erforderlich']);
        return;
    }

    $db = getDB();
    $db->prepare('DELETE FROM blocked_days WHERE block_date = ?')->execute([$date]);
    echo json_encode(['message' => 'Tag entsperrt']);
}

/**
 * GET /api/admin/calendar/blocked-days
 * Returns all blocked dates.
 */
function handleGetBlockedDays(): void {
    requireAuth();
    $db = getDB();
    $rows = $db->query('SELECT block_date, reason FROM blocked_days ORDER BY block_date ASC')->fetchAll();
    $result = array_map(fn($r) => [
        'date' => $r['block_date'],
        'reason' => $r['reason'],
    ], $rows);
    echo json_encode(array_values($result));
}

/**
 * POST /api/admin/calendar/cancel-session
 * Cancels an individual therapy or group session.
 */
function handleCancelCalendarSession(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? '';
    $sessionId = (int)($input['sessionId'] ?? 0);

    if (!in_array($type, ['einzeltherapie', 'gruppentherapie']) || !$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'type und sessionId erforderlich']);
        return;
    }

    $db = getDB();
    $cancelled = null;

    if ($type === 'einzeltherapie') {
        $stmt = $db->prepare(
            "SELECT ts.id AS session_id, t.id AS therapy_id, ts.session_date, ts.session_time,
                    t.label, c.first_name, c.last_name, c.email
             FROM therapy_sessions ts
             JOIN therapies t ON ts.therapy_id = t.id
             JOIN clients c ON t.client_id = c.id
             WHERE ts.id = ? AND ts.status != 'cancelled'"
        );
        $stmt->execute([$sessionId]);
        $ts = $stmt->fetch();
        if ($ts) {
            $db->prepare("UPDATE therapy_sessions SET status = 'cancelled' WHERE id = ?")->execute([$sessionId]);
            $cancelled = [
                'type' => 'einzeltherapie',
                'id' => (int)$ts['therapy_id'],
                'sessionId' => (int)$ts['session_id'],
                'date' => $ts['session_date'],
                'time' => $ts['session_time'],
                'label' => $ts['label'],
                'clientName' => trim($ts['first_name'] . ' ' . $ts['last_name']),
                'clientEmail' => $ts['email'],
            ];
        }
    } else {
        $stmt = $db->prepare(
            "SELECT gs.id AS session_id, tg.id AS group_id, gs.session_date, gs.session_time, tg.label
             FROM group_sessions gs
             JOIN therapy_groups tg ON gs.group_id = tg.id
             WHERE gs.id = ? AND gs.status != 'cancelled'"
        );
        $stmt->execute([$sessionId]);
        $gs = $stmt->fetch();
        if ($gs) {
            $db->prepare("UPDATE group_sessions SET status = 'cancelled' WHERE id = ?")->execute([$sessionId]);
            $partStmt = $db->prepare(
                "SELECT c.first_name, c.last_name, c.email
                 FROM group_participants gp JOIN clients c ON gp.client_id = c.id
                 WHERE gp.group_id = ? AND gp.status = 'active'"
            );
            $partStmt->execute([$gs['group_id']]);
            $participants = array_map(fn($p) => [
                'name' => trim($p['first_name'] . ' ' . $p['last_name']),
                'email' => $p['email'],
            ], $partStmt->fetchAll());

            $cancelled = [
                'type' => 'gruppentherapie',
                'id' => (int)$gs['group_id'],
                'sessionId' => (int)$gs['session_id'],
                'date' => $gs['session_date'],
                'time' => $gs['session_time'],
                'label' => $gs['label'],
                'participants' => $participants,
            ];
        }
    }

    if (!$cancelled) {
        http_response_code(404);
        echo json_encode(['error' => 'Sitzung nicht gefunden oder bereits abgesagt']);
        return;
    }

    echo json_encode(['cancelled' => $cancelled]);
}

/**
 * POST /api/admin/calendar/send-cancellation-emails
 * Sends cancellation emails for selected items.
 */
function handleSendCancellationEmails(): void {
    requireAuth();
    require_once __DIR__ . '/../lib/Mailer.php';
    $config = require __DIR__ . '/../config.php';
    $input = json_decode(file_get_contents('php://input'), true);
    $items = $input['items'] ?? [];

    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';
    $db = getDB();
    $results = [];

    foreach ($items as $item) {
        $type = $item['type'] ?? '';
        try {
            if ($type === 'erstgespraech') {
                $bookingId = (int)($item['id'] ?? 0);
                $clientName = $item['clientName'] ?? '';
                $clientEmail = $item['clientEmail'] ?? '';
                $dateFormatted = date('d.m.Y', strtotime($item['date'] ?? ''));
                $timeFormatted = $item['time'] ?? '';

                ob_start();
                include __DIR__ . '/../templates/email/cancellation_erstgespraech.php';
                $htmlBody = ob_get_clean();

                $mailer = new Mailer();
                $mailer->send($clientEmail, $clientName, 'Terminabsage — ' . $therapistName, $htmlBody);
                $results[] = ['type' => $type, 'id' => $bookingId, 'success' => true];

            } elseif ($type === 'einzeltherapie') {
                $sessionId = (int)($item['sessionId'] ?? 0);
                $clientName = $item['clientName'] ?? '';
                $clientEmail = $item['clientEmail'] ?? '';
                $dateFormatted = date('d.m.Y', strtotime($item['date'] ?? ''));
                $timeFormatted = $item['time'] ?? '';
                $label = $item['label'] ?? '';

                ob_start();
                include __DIR__ . '/../templates/email/cancellation_einzeltherapie.php';
                $htmlBody = ob_get_clean();

                $mailer = new Mailer();
                $mailer->send($clientEmail, $clientName, 'Terminabsage — ' . $therapistName, $htmlBody);
                $results[] = ['type' => $type, 'sessionId' => $sessionId, 'success' => true];

            } elseif ($type === 'gruppentherapie') {
                $sessionId = (int)($item['sessionId'] ?? 0);
                $dateFormatted = date('d.m.Y', strtotime($item['date'] ?? ''));
                $timeFormatted = $item['time'] ?? '';
                $label = $item['label'] ?? '';
                $participants = $item['participants'] ?? [];

                foreach ($participants as $p) {
                    $clientName = $p['name'] ?? '';
                    $clientEmail = $p['email'] ?? '';

                    ob_start();
                    include __DIR__ . '/../templates/email/cancellation_gruppentherapie.php';
                    $htmlBody = ob_get_clean();

                    $mailer = new Mailer();
                    $mailer->send($clientEmail, $clientName, 'Gruppentherapie-Absage — ' . $therapistName, $htmlBody);
                }
                $results[] = ['type' => $type, 'sessionId' => $sessionId, 'success' => true];
            }
        } catch (\Exception $e) {
            $results[] = ['type' => $type, 'id' => $item['id'] ?? $item['sessionId'] ?? 0, 'success' => false, 'error' => $e->getMessage()];
        }
    }

    echo json_encode(['results' => $results]);
}

// ─── Booking Invoice ─────────────────────────────────────────────

/**
 * POST /api/admin/bookings/:id/invoice
 * Generates and sends an invoice PDF for a booking (Erstgespräch).
 */
function handleSendBookingInvoice(int $bookingId): void {
    requireAuth();
    require_once __DIR__ . '/../lib/BookingInvoice.php';
    $db = getDB();

    try {
        $invoiceNumber = sendBookingInvoice($db, $bookingId);
    } catch (RuntimeException $e) {
        http_response_code(404);
        echo json_encode(['error' => $e->getMessage()]);
        return;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Rechnung konnte nicht gesendet werden: ' . $e->getMessage()]);
        return;
    }

    $updated = fetchAdminBookingRow($db, $bookingId);
    echo json_encode([
        'message' => 'Rechnung gesendet',
        'invoiceNumber' => $invoiceNumber,
        'booking' => $updated ? serializeAdminBookingRow($updated) : null,
    ]);
}

/**
 * GET /api/admin/counts
 * Returns item counts for the admin sidebar navigation.
 */
function handleGetCounts(): void {
    requireAuth();
    $db = getDB();

    $counts = [];
    $counts['erstgespraeche'] = (int)$db->query("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'")->fetchColumn();
    $counts['kunden'] = (int)$db->query("SELECT COUNT(*) FROM clients WHERE status = 'active'")->fetchColumn();
    $counts['einzel'] = (int)$db->query("SELECT COUNT(*) FROM therapies WHERE status = 'active'")->fetchColumn();
    $counts['gruppen'] = (int)$db->query("SELECT COUNT(*) FROM therapy_groups")->fetchColumn();
    $counts['dokumente'] = (int)$db->query("SELECT COUNT(*) FROM document_templates")->fetchColumn();

    echo json_encode($counts);
}
