<?php

require_once __DIR__ . '/InvoiceNumber.php';
require_once __DIR__ . '/BookingNumber.php';
require_once __DIR__ . '/Mailer.php';
require_once __DIR__ . '/PdfGenerator.php';

/**
 * Generate and send an invoice for a booking (Erstgespräch).
 * Marks the booking as invoice_sent in the database.
 *
 * @return string The generated invoice number
 * @throws Exception if sending fails
 */
function sendBookingInvoice(PDO $db, int $bookingId): string {
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

    if (empty($booking['payment_confirmed_at'])) {
        throw new RuntimeException("Rechnung für Buchung #{$bookingId} darf erst nach bestätigter Zahlung erstellt werden");
    }

    $clientName = trim($booking['client_first_name'] . ' ' . $booking['client_last_name']);
    $invoiceDateFormatted = date('d.m.Y');
    $sessionDateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';

    $amountCents = $booking['rule_price_cents'] !== null
        ? (int)$booking['rule_price_cents']
        : ($booking['event_price_cents'] !== null ? (int)$booking['event_price_cents'] : 9500);
    $amountFormatted = number_format($amountCents / 100, 2, ',', '.') . ' €';
    $durationMinutes = (int)$booking['duration_minutes'];
    $therapyLabel = 'Erstgespräch';

    // Use pre-generated invoice number from booking, or generate one if missing (legacy bookings)
    if (!empty($booking['invoice_number'])) {
        $invoiceNumber = $booking['invoice_number'];
    } else {
        $invoiceNumber = generateInvoiceNumber($db);
        $db->prepare('UPDATE bookings SET invoice_number = ? WHERE id = ?')
            ->execute([$invoiceNumber, $bookingId]);
    }

    if (!empty($booking['booking_number'])) {
        $bookingNumber = $booking['booking_number'];
    } else {
        $bookingNumber = generateBookingNumber($db);
        $db->prepare('UPDATE bookings SET booking_number = ? WHERE id = ?')
            ->execute([$bookingNumber, $bookingId]);
    }
    $bookingReference = $bookingNumber
        ? 'Diese Rechnung bezieht sich auf die Buchung ' . $bookingNumber . '. '
        : '';

    $paymentMethod = $booking['payment_method'] ?? 'wire_transfer';
    if ($paymentMethod === 'stripe') {
        $paymentNote = $bookingReference . 'Der Betrag wurde bereits per Kreditkarte beglichen. Bitte nicht erneut überweisen.';
    } elseif ($paymentMethod === 'paypal') {
        $paymentNote = $bookingReference . 'Der Betrag wurde bereits per PayPal beglichen. Bitte nicht erneut überweisen.';
    } else {
        $paymentNote = $bookingReference . 'Der Betrag wurde bereits per Überweisung beglichen. Bitte nicht erneut überweisen.';
    }

    $pdfGen = new PdfGenerator();
    $templateKey = $pdfGen->resolveTemplateKey('pdf:rechnung_erstgespraech', 'rechnung');
    $pdfContent = $pdfGen->generate($templateKey, $clientName, $invoiceDateFormatted, [
        'invoiceNumber'    => $invoiceNumber,
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

    $documentName = 'Rechnung';
    $dateFormatted = $invoiceDateFormatted;
    $sessionDate = $sessionDateFormatted;
    ob_start();
    include __DIR__ . '/../templates/email/invoice_cover.php';
    $htmlBody = ob_get_clean();

    $mailer = new Mailer();
    $pdfFilename = "Rechnung_{$invoiceNumber}.pdf";
    $mailer->sendWithPdf(
        $booking['client_email'],
        $clientName,
        "Rechnung {$invoiceNumber} — {$therapistName}",
        $htmlBody,
        $pdfContent,
        $pdfFilename
    );

    $db->prepare(
        'UPDATE bookings SET invoice_sent = 1, invoice_sent_at = NOW() WHERE id = ?'
    )->execute([$bookingId]);

    // Archive invoice to client's document history
    $clientStmt = $db->prepare('SELECT id FROM clients WHERE booking_id = ?');
    $clientStmt->execute([$bookingId]);
    $client = $clientStmt->fetch();
    if ($client) {
        require_once __DIR__ . '/../routes/client_history.php';
        archiveSentDocument((int)$client['id'], "Rechnung {$invoiceNumber}", $pdfContent, $pdfFilename);
    }

    return $invoiceNumber;
}
