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
 * Body: { ruleId?, eventId?, date, time, name, email }
 * Either ruleId or eventId must be provided.
 */
function handleCreateBooking(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    $ruleId  = $input['ruleId']  ?? null;
    $eventId = $input['eventId'] ?? null;
    $date    = $input['date']    ?? '';
    $time    = $input['time']    ?? '';
    $name    = trim($input['name']  ?? '');
    $email   = trim($input['email'] ?? '');

    if ((!$ruleId && !$eventId) || !$date || !$time || !$name || !$email) {
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
    $durationMinutes = 50;

    if ($eventId) {
        // Verify event exists
        $stmt = $db->prepare('SELECT id, duration_minutes FROM events WHERE id = ?');
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Einzeltermin nicht gefunden']);
            return;
        }
        $durationMinutes = (int)$event['duration_minutes'];
    } else {
        // Verify rule exists
        $stmt = $db->prepare('SELECT id, duration_minutes FROM recurring_rules WHERE id = ?');
        $stmt->execute([$ruleId]);
        $rule = $stmt->fetch();

        if (!$rule) {
            http_response_code(404);
            echo json_encode(['error' => 'Regel nicht gefunden']);
            return;
        }
        $durationMinutes = (int)$rule['duration_minutes'];
    }

    // Check slot is actually available by generating slots for that date
    $slots = generateSlots($db, $date, $date);
    $slotAvailable = false;
    foreach ($slots as $slot) {
        if ($eventId) {
            if (($slot['eventId'] ?? null) === (int)$eventId && $slot['date'] === $date && $slot['time'] === $time) {
                $slotAvailable = true;
                break;
            }
        } else {
            if ($slot['ruleId'] === (int)$ruleId && $slot['date'] === $date && $slot['time'] === $time) {
                $slotAvailable = true;
                break;
            }
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
            'INSERT INTO bookings (rule_id, event_id, booking_date, booking_time, duration_minutes, client_name, client_email)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$ruleId, $eventId, $date, $time, $durationMinutes, $name, $email]);

        $bookingId = $db->lastInsertId();

        // Send booking confirmation email
        try {
            require_once __DIR__ . '/../lib/Mailer.php';
            $config = require __DIR__ . '/../config.php';
            $mailer = new Mailer();

            $clientName = $name;
            $dateFormatted = date('d.m.Y', strtotime($date));
            $duration = $durationMinutes;
            $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
            $siteUrl = $config['site_url'] ?? '';

            ob_start();
            include __DIR__ . '/../templates/email/booking_confirmation.php';
            $htmlBody = ob_get_clean();

            $mailer->send(
                $email,
                $name,
                'Terminbestätigung — ' . ($config['therapist_name'] ?? 'Mut-Taucher'),
                $htmlBody
            );
        } catch (Exception $e) {
            // Don't fail the booking if email fails
        }

        echo json_encode([
            'id'      => (int)$bookingId,
            'message' => 'Termin erfolgreich gebucht',
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'Dieser Termin wurde gerade von jemand anderem gebucht']);
        } else {
            throw $e;
        }
    }
}

/**
 * GET /api/groups/active
 * Returns the group with show_on_homepage = true, or null.
 */
function handleGetActiveGroup(): void {
    $db = getDB();
    $stmt = $db->query('SELECT * FROM therapy_groups WHERE show_on_homepage = TRUE LIMIT 1');
    $group = $stmt->fetch();

    if (!$group) {
        echo json_encode(null);
        return;
    }

    echo json_encode([
        'id'                  => (int)$group['id'],
        'label'               => $group['label'],
        'maxParticipants'     => (int)$group['max_participants'],
        'currentParticipants' => (int)$group['current_participants'],
        'showOnHomepage'      => true,
    ]);
}

/**
 * POST /api/contact
 * Body: { name, email, phone?, message, sendCopy? }
 */
function handleContact(): void {
    $config = require __DIR__ . '/../config.php';
    require_once __DIR__ . '/../lib/Mailer.php';

    $input = json_decode(file_get_contents('php://input'), true);

    $name    = trim($input['name'] ?? '');
    $email   = trim($input['email'] ?? '');
    $phone   = trim($input['phone'] ?? '');
    $message = trim($input['message'] ?? '');
    $sendCopy = !empty($input['sendCopy']);

    if (!$name || !$email || !$message) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, E-Mail und Nachricht sind erforderlich']);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige E-Mail-Adresse']);
        return;
    }

    $mailer = new Mailer();
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $therapistEmail = $config['therapist_email'] ?? '';
    $siteUrl = $config['site_url'] ?? '';

    // Send to therapist
    $therapistSubject = "Neue Kontaktanfrage von $name";
    $therapistBody = "Name: $name\nE-Mail: $email\n"
        . ($phone ? "Telefon: $phone\n" : '')
        . "\nNachricht:\n$message";

    try {
        $mailer->send(
            $therapistEmail,
            $therapistName,
            $therapistSubject,
            nl2br(htmlspecialchars($therapistBody)),
            $therapistBody
        );
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Nachricht konnte nicht gesendet werden']);
        return;
    }

    // Send copy to user if requested
    if ($sendCopy) {
        ob_start();
        include __DIR__ . '/../templates/email/contact_copy.php';
        $htmlBody = ob_get_clean();

        try {
            $mailer->send($email, $name, 'Kopie Ihrer Nachricht an ' . $therapistName, $htmlBody);
        } catch (Exception $e) {
            // Don't fail the request if the copy fails — the main message was sent
        }
    }

    echo json_encode(['message' => 'Nachricht gesendet']);
}
