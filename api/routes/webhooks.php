<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../db.php';

/**
 * POST /api/webhooks/stripe
 * Receives Stripe webhook events. No auth — verified via signature.
 */
function handleStripeWebhook(): void {
    $config = require __DIR__ . '/../config.php';
    $payload = file_get_contents('php://input');
    $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

    if (empty($config['stripe_webhook_secret'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Webhook secret not configured']);
        return;
    }

    try {
        $event = \Stripe\Webhook::constructEvent(
            $payload,
            $sigHeader,
            $config['stripe_webhook_secret']
        );
    } catch (\Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Webhook signature verification failed: ' . $e->getMessage()]);
        return;
    }

    if ($event->type === 'checkout.session.completed') {
        $session = $event->data->object;
        $bookingId = (int)($session->metadata->booking_id ?? 0);

        if ($bookingId > 0) {
            $db = getDB();

            // Update booking status to confirmed
            $stmt = $db->prepare(
                'UPDATE bookings SET status = "confirmed", payment_id = ? WHERE id = ? AND status = "pending_payment"'
            );
            $stmt->execute([$session->id, $bookingId]);

            // Send confirmation email and invoice if booking was updated
            if ($stmt->rowCount() > 0) {
                // Confirmation email
                try {
                    require_once __DIR__ . '/../lib/Mailer.php';
                    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
                    $stmt->execute([$bookingId]);
                    $booking = $stmt->fetch();

                    if ($booking) {
                        $mailer = new Mailer();
                        $clientName = trim($booking['client_first_name'] . ' ' . $booking['client_last_name']);
                        $dateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
                        $time = $booking['booking_time'];
                        $duration = (int)$booking['duration_minutes'];
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
                    }
                } catch (\Exception $e) {
                    // Don't fail the webhook if confirmation email fails
                }

                // Invoice
                try {
                    require_once __DIR__ . '/../lib/BookingInvoice.php';
                    sendBookingInvoice($db, $bookingId);
                } catch (\Exception $e) {
                    // Don't fail the webhook if invoice fails
                }

                // Notify therapist about confirmed payment
                try {
                    require_once __DIR__ . '/../lib/BookingNotification.php';
                    if ($booking) {
                        sendBookingNotification($booking, 'confirmed');
                    }
                } catch (\Exception $e) {
                    // Don't fail the webhook if notification fails
                }
            }
        }
    }

    echo json_encode(['received' => true]);
}
