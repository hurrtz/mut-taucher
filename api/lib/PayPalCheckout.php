<?php

require_once __DIR__ . '/../vendor/autoload.php';

use PaypalServerSdkLib\PaypalServerSdkClientBuilder;
use PaypalServerSdkLib\Authentication\ClientCredentialsAuthCredentialsBuilder;
use PaypalServerSdkLib\Environment;
use PaypalServerSdkLib\Models\Builders\OrderRequestBuilder;
use PaypalServerSdkLib\Models\Builders\PurchaseUnitRequestBuilder;
use PaypalServerSdkLib\Models\Builders\AmountWithBreakdownBuilder;
use PaypalServerSdkLib\Models\Builders\OrderApplicationContextBuilder;
use PaypalServerSdkLib\Models\CheckoutPaymentIntent;
use PaypalServerSdkLib\Models\OrderApplicationContextUserAction;
use PaypalServerSdkLib\Models\OrderApplicationContextShippingPreference;

function getPayPalClient() {
    $config = require __DIR__ . '/../config.php';

    $environment = !empty($config['paypal_sandbox'])
        ? Environment::SANDBOX
        : Environment::PRODUCTION;

    return PaypalServerSdkClientBuilder::init()
        ->clientCredentialsAuthCredentials(
            ClientCredentialsAuthCredentialsBuilder::init(
                $config['paypal_client_id'],
                $config['paypal_client_secret']
            )
        )
        ->environment($environment)
        ->build();
}

/**
 * Create a PayPal order for a booking and return the approval URL.
 */
function createPayPalOrder(int $bookingId, int $amountCents, string $description, string $customerEmail): string {
    $config = require __DIR__ . '/../config.php';
    $siteUrl = rtrim($config['site_url'] ?? '', '/');

    $client = getPayPalClient();

    $amount = number_format($amountCents / 100, 2, '.', '');

    $orderRequest = OrderRequestBuilder::init(CheckoutPaymentIntent::CAPTURE, [
        PurchaseUnitRequestBuilder::init(
            AmountWithBreakdownBuilder::init('EUR', $amount)->build()
        )
            ->description($description)
            ->referenceId("booking-{$bookingId}")
            ->customId((string)$bookingId)
            ->build()
    ])
        ->applicationContext(
            OrderApplicationContextBuilder::init()
                ->returnUrl($siteUrl . '/booking/success?paypal=1')
                ->cancelUrl($siteUrl . '/booking/cancelled')
                ->userAction(OrderApplicationContextUserAction::PAY_NOW)
                ->shippingPreference(OrderApplicationContextShippingPreference::NO_SHIPPING)
                ->brandName($config['therapist_name'] ?? 'Mut-Taucher Praxis')
                ->build()
        )
        ->build();

    $response = $client->getOrdersController()->createOrder(['body' => $orderRequest]);
    $order = $response->getResult();
    $orderId = $order->getId();

    // Store the PayPal order ID in the booking
    $db = getDB();
    $stmt = $db->prepare('UPDATE bookings SET payment_id = ? WHERE id = ?');
    $stmt->execute([$orderId, $bookingId]);

    // Find the approval link
    $links = $order->getLinks() ?? [];
    foreach ($links as $link) {
        if ($link->getRel() === 'approve') {
            return $link->getHref();
        }
    }

    throw new \RuntimeException('No PayPal approval URL found in order response');
}

/**
 * Capture a PayPal order after buyer approval.
 * Returns the order ID on success.
 */
function capturePayPalOrder(string $orderId): string {
    $client = getPayPalClient();

    $response = $client->getOrdersController()->captureOrder([
        'id' => $orderId,
        'prefer' => 'return=representation',
    ]);

    $order = $response->getResult();

    if ($order->getStatus() !== 'COMPLETED') {
        throw new \RuntimeException('PayPal capture failed: status ' . $order->getStatus());
    }

    return $order->getId();
}
