<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../slots.php';

/**
 * GET /api/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
function handleGetSlots(): void {
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

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
    ob_start();
    require_once __DIR__ . '/../lib/BookingEvents.php';
    $input = json_decode(file_get_contents('php://input'), true);

    $ruleId    = $input['ruleId']  ?? null;
    $eventId   = $input['eventId'] ?? null;
    $date      = $input['date']    ?? '';
    $time      = $input['time']    ?? '';
    $firstName = trim($input['firstName'] ?? '');
    $lastName  = trim($input['lastName']  ?? '');
    $email     = trim($input['email'] ?? '');
    $phone     = trim($input['phone'] ?? '');
    $street    = trim($input['street'] ?? '');
    $zip       = trim($input['zip'] ?? '');
    $city      = trim($input['city'] ?? '');
    $message       = trim($input['message'] ?? '');
    $paymentMethod = $input['paymentMethod'] ?? 'wire_transfer';
    if (!in_array($paymentMethod, ['stripe', 'paypal', 'wire_transfer'], true)) {
        $paymentMethod = 'wire_transfer';
    }

    if ((!$ruleId && !$eventId) || !$date || !$time || !$firstName || !$lastName || !$email || !$phone || !$street || !$zip || !$city) {
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
    $amountCents = 9500;

    if ($eventId) {
        // Verify event exists
        $stmt = $db->prepare('SELECT id, duration_minutes, price_cents FROM events WHERE id = ?');
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Einzeltermin nicht gefunden']);
            return;
        }
        $durationMinutes = (int)$event['duration_minutes'];
        if ($event['price_cents'] !== null) {
            $amountCents = (int)$event['price_cents'];
        }
    } else {
        // Verify rule exists
        $stmt = $db->prepare('SELECT id, duration_minutes, price_cents FROM recurring_rules WHERE id = ?');
        $stmt->execute([$ruleId]);
        $rule = $stmt->fetch();

        if (!$rule) {
            http_response_code(404);
            echo json_encode(['error' => 'Regel nicht gefunden']);
            return;
        }
        $durationMinutes = (int)$rule['duration_minutes'];
        if ($rule['price_cents'] !== null) {
            $amountCents = (int)$rule['price_cents'];
        }
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
            'INSERT INTO bookings (rule_id, event_id, booking_date, booking_time, duration_minutes, client_first_name, client_last_name, client_email, client_phone, client_street, client_zip, client_city, client_message, status, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'pending_payment\', ?)'
        );
        $stmt->execute([$ruleId, $eventId, $date, $time, $durationMinutes, $firstName, $lastName, $email, $phone, $street, $zip, $city, $message ?: null, $paymentMethod]);

        $bookingId = $db->lastInsertId();

        require_once __DIR__ . '/../lib/BookingNumber.php';
        $bookingNumber = generateBookingNumber($db);
        $db->prepare('UPDATE bookings SET booking_number = ? WHERE id = ?')
            ->execute([$bookingNumber, $bookingId]);

        // Auto-create client/patient from booking
        $clientId = null;
        try {
            $clientStmt = $db->prepare(
                'INSERT INTO clients (first_name, last_name, email, phone, street, zip, city, booking_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $clientStmt->execute([$firstName, $lastName, $email, $phone, $street, $zip, $city, (int)$bookingId]);
            $clientId = (int)$db->lastInsertId();
        } catch (Throwable $e) {
            // Don't fail the booking if client creation fails
        }

        try {
            recordBookingEvent($db, (int)$bookingId, 'requested', $clientId);
        } catch (Throwable $e) {
            error_log('Booking event logging failed for booking #' . $bookingId . ': ' . $e->getMessage());
        }

        // For Stripe: create Checkout Session and return URL
        $stripeCheckoutUrl = null;
        if ($paymentMethod === 'stripe') {
            require_once __DIR__ . '/../lib/StripeCheckout.php';
            $stripeCheckoutUrl = createStripeCheckoutSession(
                (int)$bookingId,
                $amountCents,
                'Erstgespräch (50 Minuten)',
                $email
            );
        }

        // For PayPal: create Order and return approval URL
        $paypalApprovalUrl = null;
        if ($paymentMethod === 'paypal') {
            require_once __DIR__ . '/../lib/PayPalCheckout.php';
            $paypalApprovalUrl = createPayPalOrder(
                (int)$bookingId,
                $amountCents,
                'Erstgespräch (50 Minuten)',
                $email
            );
        }

        // For wire transfer: send payment request and archive it to the client history
        if ($paymentMethod === 'wire_transfer') {
            try {
                require_once __DIR__ . '/../lib/BookingPaymentRequest.php';
                sendBookingPaymentRequest($db, (int)$bookingId);
            } catch (Throwable $e) {
                error_log('Payment request failed for booking #' . $bookingId . ': ' . $e->getMessage());
            }
        }

        // Notify therapist about new booking
        try {
            require_once __DIR__ . '/../lib/BookingNotification.php';
            $notificationData = new BookingNotificationData(
                clientFirstName: $firstName,
                clientLastName:  $lastName,
                clientEmail:     $email,
                clientPhone:     $phone,
                clientStreet:    $street,
                clientZip:       $zip,
                clientCity:      $city,
                clientMessage:   $message ?: null,
                bookingDate:     $date,
                bookingTime:     $time,
                durationMinutes: $durationMinutes,
                paymentMethod:   $paymentMethod,
                bookingNumber:   $bookingNumber,
                invoiceNumber:   null,
            );
            sendBookingNotification($notificationData);
        } catch (Throwable $e) {
            error_log('Booking notification failed for booking #' . $bookingId . ': ' . $e->getMessage());
        }

        $config = require __DIR__ . '/../config.php';
        $response = [
            'id'            => (int)$bookingId,
            'message'       => 'Termin erfolgreich gebucht',
            'bookingNumber' => $bookingNumber,
            'paymentMethod' => $paymentMethod,
        ];

        if ($stripeCheckoutUrl) {
            $response['stripeCheckoutUrl'] = $stripeCheckoutUrl;
        }

        if ($paypalApprovalUrl) {
            $response['paypalApprovalUrl'] = $paypalApprovalUrl;
        }

        if ($paymentMethod === 'wire_transfer') {
            $response['bankDetails'] = [
                'accountHolder' => $config['bank_account_holder'] ?? '',
                'iban'          => $config['bank_iban'] ?? '',
                'bic'           => $config['bank_bic'] ?? '',
                'bankName'      => $config['bank_name'] ?? '',
                'amount'        => number_format($amountCents / 100, 2, ',', '.') . ' €',
                'bookingNumber' => $bookingNumber,
                'reference'     => $bookingNumber,
            ];
        }

        $json = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($json === false) {
            throw new RuntimeException('Booking response encoding failed: ' . json_last_error_msg());
        }

        $unexpectedOutput = ob_get_clean();
        if ($unexpectedOutput !== '') {
            error_log('Unexpected output during booking #' . $bookingId . ': ' . trim($unexpectedOutput));
        }

        echo $json;
    } catch (PDOException $e) {
        $unexpectedOutput = ob_get_clean();
        if ($unexpectedOutput !== '') {
            error_log('Unexpected output before booking PDO error: ' . trim($unexpectedOutput));
        }

        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'Dieser Termin wurde gerade von jemand anderem gebucht']);
        } else {
            throw $e;
        }
    } catch (Throwable $e) {
        $unexpectedOutput = ob_get_clean();
        if ($unexpectedOutput !== '') {
            error_log('Unexpected output before booking failure: ' . trim($unexpectedOutput));
        }

        error_log('Booking creation failed: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Interner Fehler bei der Buchung']);
    }
}

/**
 * POST /api/paypal/capture
 * Body: { orderId: string }
 * Captures a PayPal order after buyer approval, confirms the booking.
 */
function handlePayPalCapture(): void {
    require_once __DIR__ . '/../lib/BookingEvents.php';
    $input = json_decode(file_get_contents('php://input'), true);
    $orderId = $input['orderId'] ?? '';

    if (!$orderId) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID fehlt']);
        return;
    }

    $db = getDB();

    // Find the booking by PayPal order ID
    $stmt = $db->prepare('SELECT * FROM bookings WHERE payment_id = ? AND payment_method = "paypal" AND status = "pending_payment"');
    $stmt->execute([$orderId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        http_response_code(404);
        echo json_encode(['error' => 'Buchung nicht gefunden']);
        return;
    }

    // Capture the payment
    require_once __DIR__ . '/../lib/PayPalCheckout.php';
    try {
        capturePayPalOrder($orderId);
    } catch (\Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Zahlung konnte nicht abgeschlossen werden']);
        return;
    }

    // Confirm the booking
    $stmt = $db->prepare('UPDATE bookings SET status = "confirmed", payment_confirmed_at = NOW() WHERE id = ? AND status = "pending_payment"');
    $stmt->execute([$booking['id']]);

    if ($stmt->rowCount() > 0) {
        try {
            recordBookingEvent($db, (int)$booking['id'], 'payment_confirmed');
        } catch (Throwable $e) {
            error_log('Booking event logging failed for booking #' . $booking['id'] . ': ' . $e->getMessage());
        }

        $config = require __DIR__ . '/../config.php';

        // Send confirmation email
        try {
            require_once __DIR__ . '/../lib/Mailer.php';
            $mailer = new Mailer();
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

            $mailer->send(
                $booking['client_email'],
                $clientName,
                'Terminbestätigung — ' . $therapistName,
                $htmlBody
            );
        } catch (Throwable $e) {
            // Don't fail if email fails
        }

        // Notify therapist about confirmed payment
        try {
            require_once __DIR__ . '/../lib/BookingNotification.php';
            sendBookingNotification(BookingNotificationData::fromBookingRow($booking, NotificationStatus::Confirmed));
        } catch (Throwable $e) {
            error_log('Booking notification failed for booking #' . $booking['id'] . ': ' . $e->getMessage());
        }
    }

    echo json_encode(['message' => 'Zahlung erfolgreich']);
}

/**
 * GET /api/groups/active
 * Returns the group with show_on_homepage = true, or null.
 */
function handleGetActiveGroup(): void {
    $db = getDB();
    $stmt = $db->query(
        'SELECT g.*,
                (SELECT COUNT(*) FROM group_participants gp WHERE gp.group_id = g.id AND gp.status = \'active\') as participant_count
         FROM therapy_groups g
         WHERE g.show_on_homepage = TRUE
         LIMIT 1'
    );
    $group = $stmt->fetch();

    if (!$group) {
        echo json_encode(null);
        return;
    }

    echo json_encode([
        'id'               => (int)$group['id'],
        'label'            => $group['label'],
        'maxParticipants'  => (int)$group['max_participants'],
        'participantCount' => (int)$group['participant_count'],
        'showOnHomepage'   => true,
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
