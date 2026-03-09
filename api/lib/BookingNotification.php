<?php

require_once __DIR__ . '/BookingNotificationData.php';
require_once __DIR__ . '/Mailer.php';

/**
 * Send a booking notification email to the therapist.
 *
 * @throws \Exception if email sending fails
 */
function sendBookingNotification(BookingNotificationData $data): void {
    $config = require __DIR__ . '/../config.php';
    $therapistEmail = $config['therapist_email'] ?? '';
    if (!$therapistEmail || !filter_var($therapistEmail, FILTER_VALIDATE_EMAIL)) {
        return;
    }

    // Extract template variables from the typed DTO
    $isConfirmed = $data->isConfirmed();
    $clientName = $data->clientName;
    $clientEmail = $data->clientEmail;
    $clientPhone = $data->clientPhone;
    $clientStreet = $data->clientStreet;
    $clientZip = $data->clientZip;
    $clientCity = $data->clientCity;
    $clientMessage = $data->clientMessage;
    $dateFormatted = $data->dateFormatted;
    $time = $data->bookingTime;
    $duration = $data->durationMinutes;
    $paymentMethodLabel = $data->paymentMethodLabel();
    $paymentStatus = $data->paymentStatusLabel();
    $bookingStatus = $data->bookingStatusLabel();
    $invoiceNumber = $data->invoiceNumber;
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';

    ob_start();
    include __DIR__ . '/../templates/email/booking_notification.php';
    $htmlBody = ob_get_clean();

    $mailer = new Mailer();
    $mailer->send(
        $therapistEmail,
        $therapistName,
        $data->subject(),
        $htmlBody
    );
}
