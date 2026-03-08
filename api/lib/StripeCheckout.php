<?php

require_once __DIR__ . '/../vendor/autoload.php';

/**
 * Create a Stripe Checkout Session for a booking.
 */
function createStripeCheckoutSession(int $bookingId, int $amountCents, string $description, string $customerEmail): string {
    $config = require __DIR__ . '/../config.php';
    \Stripe\Stripe::setApiKey($config['stripe_secret_key']);

    $siteUrl = rtrim($config['site_url'] ?? '', '/');

    $session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'mode' => 'payment',
        'customer_email' => $customerEmail,
        'line_items' => [[
            'price_data' => [
                'currency' => 'eur',
                'unit_amount' => $amountCents,
                'product_data' => [
                    'name' => $description,
                ],
            ],
            'quantity' => 1,
        ]],
        'metadata' => [
            'booking_id' => (string)$bookingId,
        ],
        'success_url' => $siteUrl . '/booking/success?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => $siteUrl . '/booking/cancelled',
    ]);

    return $session->url;
}
