<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../slots.php';

/**
 * GET /api/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
function handleGetSlots(): void {
    $from = $_GET['from'] ?? '';
    $to   = $_GET['to']   ?? '';

    if (!$from || !$to) {
        http_response_code(400);
        echo json_encode(['error' => 'Parameter "from" und "to" erforderlich']);
        return;
    }

    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiges Datumsformat (YYYY-MM-DD erwartet)']);
        return;
    }

    $db = getDB();
    $slots = generateSlots($db, $from, $to);
    echo json_encode($slots);
}

/**
 * POST /api/bookings
 * Body: { ruleId, date, time, name, email }
 */
function handleCreateBooking(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    $ruleId = $input['ruleId'] ?? null;
    $date   = $input['date']   ?? '';
    $time   = $input['time']   ?? '';
    $name   = trim($input['name']  ?? '');
    $email  = trim($input['email'] ?? '');

    if (!$ruleId || !$date || !$time || !$name || !$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Alle Felder sind erforderlich']);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige E-Mail-Adresse']);
        return;
    }

    $db = getDB();

    // Verify rule exists
    $stmt = $db->prepare('SELECT id, duration_minutes FROM recurring_rules WHERE id = ?');
    $stmt->execute([$ruleId]);
    $rule = $stmt->fetch();

    if (!$rule) {
        http_response_code(404);
        echo json_encode(['error' => 'Regel nicht gefunden']);
        return;
    }

    // Check slot is actually available by generating slots for that date
    $slots = generateSlots($db, $date, $date);
    $slotAvailable = false;
    foreach ($slots as $slot) {
        if ($slot['ruleId'] === (int)$ruleId && $slot['date'] === $date && $slot['time'] === $time) {
            $slotAvailable = true;
            break;
        }
    }

    if (!$slotAvailable) {
        http_response_code(409);
        echo json_encode(['error' => 'Dieser Termin ist nicht mehr verfügbar']);
        return;
    }

    // Insert booking
    try {
        $stmt = $db->prepare(
            'INSERT INTO bookings (rule_id, booking_date, booking_time, duration_minutes, client_name, client_email)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$ruleId, $date, $time, $rule['duration_minutes'], $name, $email]);

        $bookingId = $db->lastInsertId();

        echo json_encode([
            'id'      => (int)$bookingId,
            'message' => 'Termin erfolgreich gebucht',
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            // Duplicate key — slot was booked between check and insert
            http_response_code(409);
            echo json_encode(['error' => 'Dieser Termin wurde gerade von jemand anderem gebucht']);
        } else {
            throw $e;
        }
    }
}
