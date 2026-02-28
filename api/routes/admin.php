<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../jwt.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../slots.php';

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
            'INSERT INTO recurring_rules (label, time, duration_minutes, start_date, end_date)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['label'] ?? '',
            $input['time'],
            $input['durationMinutes'] ?? 50,
            $input['startDate'],
            $input['endDate'] ?: null,
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
            'UPDATE recurring_rules SET label = ?, time = ?, duration_minutes = ?, start_date = ?, end_date = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $input['label'] ?? '',
            $input['time'],
            $input['durationMinutes'] ?? 50,
            $input['startDate'],
            $input['endDate'] ?: null,
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
        'INSERT INTO events (label, event_date, time, duration_minutes) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $input['label'] ?? '',
        $date,
        $time,
        $input['durationMinutes'] ?? 50,
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

/**
 * GET /api/admin/bookings?from=...&to=...
 */
function handleGetBookings(): void {
    requireAuth();
    $from = $_GET['from'] ?? '';
    $to   = $_GET['to']   ?? '';

    $db = getDB();

    $sql = 'SELECT b.*, r.label as rule_label, e.label as event_label FROM bookings b
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

    $result = array_map(fn($b) => [
        'id'             => (int)$b['id'],
        'ruleId'         => $b['rule_id'] ? (int)$b['rule_id'] : null,
        'eventId'        => $b['event_id'] ? (int)$b['event_id'] : null,
        'ruleLabel'      => $b['rule_label'] ?? $b['event_label'] ?? '',
        'date'           => $b['booking_date'],
        'time'           => $b['booking_time'],
        'durationMinutes' => (int)$b['duration_minutes'],
        'clientName'     => $b['client_name'],
        'clientEmail'    => $b['client_email'],
        'status'         => $b['status'],
        'introEmailSent' => (bool)$b['intro_email_sent'],
        'reminderSent'   => (bool)$b['reminder_sent'],
        'createdAt'      => $b['created_at'],
    ], $bookings);

    echo json_encode(array_values($result));
}

/**
 * PATCH /api/admin/bookings/:id
 * Body: { status?, introEmailSent?, reminderSent? }
 */
function handleUpdateBooking(int $id): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $fields = [];
    $params = [];

    if (isset($input['status'])) {
        $fields[] = 'status = ?';
        $params[] = $input['status'];
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

    echo json_encode(['message' => 'Buchung aktualisiert']);
}

/**
 * POST /api/admin/bookings/:id/email
 * Body: { type: "intro" | "reminder" }
 */
function handleSendEmail(int $bookingId): void {
    requireAuth();
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

    $dateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
    $siteUrl = $config['site_url'] ?? 'https://example.com';

    if ($type === 'intro') {
        $subject = 'Ihr Termin bei ' . ($config['therapist_name'] ?? 'Mut-Taucher');
        $body = "Hallo {$booking['client_name']},\n\n"
            . "vielen Dank für Ihre Buchung.\n\n"
            . "Ihr Termin:\n"
            . "Datum: {$dateFormatted}\n"
            . "Uhrzeit: {$booking['booking_time']} Uhr\n"
            . "Dauer: {$booking['duration_minutes']} Minuten\n\n"
            . "Wir freuen uns auf Sie!\n\n"
            . "Mit freundlichen Grüßen\n"
            . ($config['therapist_name'] ?? 'Mut-Taucher Praxis') . "\n"
            . $siteUrl;
    } else {
        $subject = 'Erinnerung: Ihr Termin am ' . $dateFormatted;
        $body = "Hallo {$booking['client_name']},\n\n"
            . "dies ist eine freundliche Erinnerung an Ihren bevorstehenden Termin.\n\n"
            . "Datum: {$dateFormatted}\n"
            . "Uhrzeit: {$booking['booking_time']} Uhr\n"
            . "Dauer: {$booking['duration_minutes']} Minuten\n\n"
            . "Wir freuen uns auf Sie!\n\n"
            . "Mit freundlichen Grüßen\n"
            . ($config['therapist_name'] ?? 'Mut-Taucher Praxis') . "\n"
            . $siteUrl;
    }

    $headers = "From: " . ($config['therapist_email'] ?? 'noreply@example.com') . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n";

    $sent = mail($booking['client_email'], $subject, $body, $headers);

    if (!$sent) {
        http_response_code(500);
        echo json_encode(['error' => 'E-Mail konnte nicht gesendet werden']);
        return;
    }

    // Mark as sent
    $flagField = $type === 'intro' ? 'intro_email_sent' : 'reminder_sent';
    $db->prepare("UPDATE bookings SET $flagField = 1 WHERE id = ?")->execute([$bookingId]);

    echo json_encode(['message' => 'E-Mail gesendet']);
}
