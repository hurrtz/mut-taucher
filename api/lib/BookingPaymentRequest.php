<?php

require_once __DIR__ . '/BookingNumber.php';
require_once __DIR__ . '/Mailer.php';
require_once __DIR__ . '/PdfGenerator.php';

function fetchBookingPaymentRequestBooking(PDO $db, int $bookingId): array {
    $stmt = $db->prepare(
        'SELECT b.*, r.price_cents as rule_price_cents, e.price_cents as event_price_cents
         FROM bookings b
         LEFT JOIN recurring_rules r ON b.rule_id = r.id
         LEFT JOIN events e ON b.event_id = e.id
         WHERE b.id = ?'
    );
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        throw new RuntimeException("Buchung #{$bookingId} nicht gefunden");
    }

    return $booking;
}

function buildBookingPaymentRequestContext(PDO $db, int $bookingId): array {
    $config = require __DIR__ . '/../config.php';
    $booking = fetchBookingPaymentRequestBooking($db, $bookingId);

    if (!empty($booking['booking_number'])) {
        $bookingNumber = $booking['booking_number'];
    } else {
        $bookingNumber = generateBookingNumber($db);
        $db->prepare('UPDATE bookings SET booking_number = ? WHERE id = ?')
            ->execute([$bookingNumber, $bookingId]);
        $booking['booking_number'] = $bookingNumber;
    }

    $clientName = trim($booking['client_first_name'] . ' ' . $booking['client_last_name']);
    $documentDateFormatted = date('d.m.Y');
    $sessionDateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
    $amountCents = $booking['rule_price_cents'] !== null
        ? (int)$booking['rule_price_cents']
        : ($booking['event_price_cents'] !== null ? (int)$booking['event_price_cents'] : 9500);
    $amountFormatted = number_format($amountCents / 100, 2, ',', '.') . ' €';
    $durationMinutes = (int)$booking['duration_minutes'];

    return [
        'booking' => $booking,
        'clientName' => $clientName,
        'documentDateFormatted' => $documentDateFormatted,
        'sessionDateFormatted' => $sessionDateFormatted,
        'bookingNumber' => $bookingNumber,
        'amountFormatted' => $amountFormatted,
        'durationMinutes' => $durationMinutes,
        'therapyLabel' => 'Erstgespräch',
        'therapistName' => $config['therapist_name'] ?? 'Mut-Taucher Praxis',
        'siteUrl' => $config['site_url'] ?? '',
        'accountHolder' => $config['bank_account_holder'] ?? '',
        'iban' => $config['bank_iban'] ?? '',
        'bic' => $config['bank_bic'] ?? '',
        'bankName' => $config['bank_name'] ?? '',
        'paymentNote' => 'Bitte überweisen Sie den Betrag vor dem Termin am '
            . $sessionDateFormatted
            . ' und geben Sie als Verwendungszweck die Buchungsnummer '
            . $bookingNumber
            . ' an.',
    ];
}

function generateBookingPaymentRequestPdfFromContext(array $context): array {
    $booking = $context['booking'];
    $pdfGen = new PdfGenerator();
    $templateKey = $pdfGen->resolveTemplateKey('pdf:zahlungsaufforderung_erstgespraech', 'zahlungsaufforderung_erstgespraech');
    $pdfContent = $pdfGen->generate($templateKey, $context['clientName'], $context['documentDateFormatted'], [
        'bookingNumber' => $context['bookingNumber'],
        'amountFormatted' => $context['amountFormatted'],
        'durationMinutes' => $context['durationMinutes'],
        'therapyLabel' => $context['therapyLabel'],
        'sessionDate' => $context['sessionDateFormatted'],
        'sessionTime' => $booking['booking_time'],
        'clientStreet' => $booking['client_street'] ?? '',
        'clientZip' => $booking['client_zip'] ?? '',
        'clientCity' => $booking['client_city'] ?? '',
        'paymentNote' => $context['paymentNote'],
    ]);

    return [
        'content' => $pdfContent,
        'filename' => 'Zahlungsaufforderung_' . $context['bookingNumber'] . '.pdf',
    ];
}

function loadArchivedBookingPaymentRequestAttachment(PDO $db, array $context): ?array {
    $bookingId = (int)$context['booking']['id'];
    $bookingNumber = $context['bookingNumber'];

    $stmt = $db->prepare(
        'SELECT cd.filename, cd.file_path
         FROM client_documents cd
         JOIN clients c ON c.id = cd.client_id
         WHERE c.booking_id = ?
           AND cd.direction = "sent"
           AND cd.label = ?
         ORDER BY cd.created_at DESC
         LIMIT 1'
    );
    $stmt->execute([$bookingId, 'Zahlungsaufforderung ' . $bookingNumber]);
    $row = $stmt->fetch();

    if (!$row) {
        return null;
    }

    $absolutePath = __DIR__ . '/../' . $row['file_path'];
    if (!is_file($absolutePath)) {
        return null;
    }

    return [
        'content' => file_get_contents($absolutePath),
        'filename' => $row['filename'],
    ];
}

function getBookingPaymentRequestAttachment(PDO $db, int $bookingId): array {
    $context = buildBookingPaymentRequestContext($db, $bookingId);
    $attachment = loadArchivedBookingPaymentRequestAttachment($db, $context);

    if ($attachment) {
        return $attachment + ['context' => $context];
    }

    return generateBookingPaymentRequestPdfFromContext($context) + ['context' => $context];
}

/**
 * Generate, send, and archive a payment request for an intro-call booking.
 *
 * @return string The booking number used as payment reference
 * @throws Exception if the booking or delivery fails
 */
function sendBookingPaymentRequest(PDO $db, int $bookingId): string {
    $context = buildBookingPaymentRequestContext($db, $bookingId);
    $attachment = generateBookingPaymentRequestPdfFromContext($context);
    $booking = $context['booking'];

    $dateFormatted = $context['sessionDateFormatted'];
    $time = $booking['booking_time'];
    $duration = $context['durationMinutes'];
    $therapistName = $context['therapistName'];
    $siteUrl = $context['siteUrl'];
    $accountHolder = $context['accountHolder'];
    $iban = $context['iban'];
    $bic = $context['bic'];
    $bankName = $context['bankName'];
    $amount = $context['amountFormatted'];
    $reference = $context['bookingNumber'];
    $bookingNumber = $context['bookingNumber'];
    $clientName = $context['clientName'];

    ob_start();
    include __DIR__ . '/../templates/email/booking_wire_transfer.php';
    $htmlBody = ob_get_clean();

    $mailer = new Mailer();
    $mailer->sendWithPdf(
        $booking['client_email'],
        $clientName,
        'Buchungsbestätigung ' . $bookingNumber . ' — ' . $therapistName,
        $htmlBody,
        $attachment['content'],
        $attachment['filename']
    );

    $db->prepare(
        'UPDATE bookings SET payment_request_sent = 1, payment_request_sent_at = NOW() WHERE id = ?'
    )->execute([$bookingId]);

    $clientStmt = $db->prepare('SELECT id FROM clients WHERE booking_id = ?');
    $clientStmt->execute([$bookingId]);
    $client = $clientStmt->fetch();
    if ($client) {
        require_once __DIR__ . '/../routes/client_history.php';
        archiveSentDocument((int)$client['id'], 'Zahlungsaufforderung ' . $bookingNumber, $attachment['content'], $attachment['filename']);
    }

    return $bookingNumber;
}
