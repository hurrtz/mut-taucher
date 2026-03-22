<?php

require_once __DIR__ . '/BookingNumber.php';
require_once __DIR__ . '/Mailer.php';
require_once __DIR__ . '/PdfGenerator.php';

/**
 * Generate, send, and archive a payment request for an intro-call booking.
 *
 * @return string The booking number used as payment reference
 * @throws Exception if the booking or delivery fails
 */
function sendBookingPaymentRequest(PDO $db, int $bookingId): string {
    $config = require __DIR__ . '/../config.php';

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

    $clientName = trim($booking['client_first_name'] . ' ' . $booking['client_last_name']);
    $documentDateFormatted = date('d.m.Y');
    $sessionDateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';

    $amountCents = $booking['rule_price_cents'] !== null
        ? (int)$booking['rule_price_cents']
        : ($booking['event_price_cents'] !== null ? (int)$booking['event_price_cents'] : 9500);
    $amountFormatted = number_format($amountCents / 100, 2, ',', '.') . ' €';
    $durationMinutes = (int)$booking['duration_minutes'];
    $therapyLabel = 'Erstgespräch';

    if (!empty($booking['booking_number'])) {
        $bookingNumber = $booking['booking_number'];
    } else {
        $bookingNumber = generateBookingNumber($db);
        $db->prepare('UPDATE bookings SET booking_number = ? WHERE id = ?')
            ->execute([$bookingNumber, $bookingId]);
    }

    $paymentNote = 'Bitte überweisen Sie den Betrag vor dem Termin am '
        . $sessionDateFormatted
        . ' und geben Sie als Verwendungszweck die Buchungsnummer '
        . $bookingNumber
        . ' an.';

    $pdfGen = new PdfGenerator();
    $templateKey = $pdfGen->resolveTemplateKey('pdf:zahlungsaufforderung_erstgespraech', 'zahlungsaufforderung_erstgespraech');
    $pdfContent = $pdfGen->generate($templateKey, $clientName, $documentDateFormatted, [
        'bookingNumber'    => $bookingNumber,
        'amountFormatted'  => $amountFormatted,
        'durationMinutes'  => $durationMinutes,
        'therapyLabel'     => $therapyLabel,
        'sessionDate'      => $sessionDateFormatted,
        'sessionTime'      => $booking['booking_time'],
        'clientStreet'     => $booking['client_street'] ?? '',
        'clientZip'        => $booking['client_zip'] ?? '',
        'clientCity'       => $booking['client_city'] ?? '',
        'paymentNote'      => $paymentNote,
    ]);

    $dateFormatted = $sessionDateFormatted;
    $time = $booking['booking_time'];
    $duration = $durationMinutes;
    $accountHolder = $config['bank_account_holder'] ?? '';
    $iban = $config['bank_iban'] ?? '';
    $bic = $config['bank_bic'] ?? '';
    $bankName = $config['bank_name'] ?? '';
    $amount = $amountFormatted;
    $reference = $bookingNumber;

    ob_start();
    include __DIR__ . '/../templates/email/booking_wire_transfer.php';
    $htmlBody = ob_get_clean();

    $mailer = new Mailer();
    $pdfFilename = "Zahlungsaufforderung_{$bookingNumber}.pdf";
    $mailer->sendWithPdf(
        $booking['client_email'],
        $clientName,
        "Buchungsbestätigung {$bookingNumber} — {$therapistName}",
        $htmlBody,
        $pdfContent,
        $pdfFilename
    );

    $db->prepare(
        'UPDATE bookings SET payment_request_sent = 1, payment_request_sent_at = NOW() WHERE id = ?'
    )->execute([$bookingId]);

    $clientStmt = $db->prepare('SELECT id FROM clients WHERE booking_id = ?');
    $clientStmt->execute([$bookingId]);
    $client = $clientStmt->fetch();
    if ($client) {
        require_once __DIR__ . '/../routes/client_history.php';
        archiveSentDocument((int)$client['id'], "Zahlungsaufforderung {$bookingNumber}", $pdfContent, $pdfFilename);
    }

    return $bookingNumber;
}
