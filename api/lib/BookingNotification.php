<?php

require_once __DIR__ . '/Mailer.php';

/**
 * Send a booking notification email to the therapist.
 *
 * @param array  $booking  Booking row from DB (or assembled data)
 * @param string $status   'new' | 'confirmed'
 */
function sendBookingNotification(array $booking, string $status = 'new'): void {
    $config = require __DIR__ . '/../config.php';
    $therapistEmail = $config['therapist_email'] ?? '';
    if (!$therapistEmail) {
        return;
    }

    $paymentMethodLabels = [
        'stripe'        => 'Kreditkarte / Online-Zahlung (Stripe)',
        'paypal'        => 'PayPal',
        'wire_transfer' => 'Überweisung',
    ];

    $paymentMethod = $booking['payment_method'] ?? 'wire_transfer';
    $paymentMethodLabel = $paymentMethodLabels[$paymentMethod] ?? $paymentMethod;

    if ($status === 'confirmed') {
        $paymentStatus = 'Bezahlt';
        $bookingStatus = 'Bestätigt';
    } elseif ($paymentMethod === 'wire_transfer') {
        $paymentStatus = 'Ausstehend (Überweisung)';
        $bookingStatus = 'Warte auf Zahlung';
    } else {
        $paymentStatus = 'Ausstehend';
        $bookingStatus = 'Warte auf Zahlung';
    }

    $clientName = trim(($booking['client_first_name'] ?? '') . ' ' . ($booking['client_last_name'] ?? ''));
    $clientEmail = $booking['client_email'] ?? '';
    $clientPhone = $booking['client_phone'] ?? '';
    $clientMessage = $booking['client_message'] ?? null;
    $dateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
    $time = $booking['booking_time'] ?? '';
    $duration = (int)($booking['duration_minutes'] ?? 50);
    $invoiceNumber = $booking['invoice_number'] ?? null;
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';

    $subject = $status === 'confirmed'
        ? "Zahlung bestätigt — $clientName ($dateFormatted)"
        : "Neue Buchung — $clientName ($dateFormatted)";

    ob_start();
    include __DIR__ . '/../templates/email/booking_notification.php';
    $htmlBody = ob_get_clean();

    $mailer = new Mailer();
    $mailer->send(
        $therapistEmail,
        $therapistName,
        $subject,
        $htmlBody
    );
}
