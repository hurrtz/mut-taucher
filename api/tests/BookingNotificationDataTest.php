<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/BookingNotificationData.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;

final class BookingNotificationDataTest extends TestCase
{
    private function makeData(array $overrides = [], NotificationStatus $status = NotificationStatus::New): BookingNotificationData
    {
        $defaults = [
            'clientFirstName' => 'Max',
            'clientLastName'  => 'Mustermann',
            'clientEmail'     => 'max@example.com',
            'clientPhone'     => '0170 1234567',
            'clientStreet'    => 'Musterstraße 1',
            'clientZip'       => '10115',
            'clientCity'      => 'Berlin',
            'clientMessage'   => null,
            'bookingDate'     => '2026-03-15',
            'bookingTime'     => '10:00',
            'durationMinutes' => 50,
            'paymentMethod'   => 'wire_transfer',
            'invoiceNumber'   => '26-0001',
        ];
        $args = array_merge($defaults, $overrides);
        return new BookingNotificationData(...$args, status: $status);
    }

    #[Test]
    public function it_computes_client_name(): void
    {
        $data = $this->makeData(['clientFirstName' => 'Anna', 'clientLastName' => 'Schmidt']);
        $this->assertSame('Anna Schmidt', $data->clientName);
    }

    #[Test]
    public function it_trims_client_name(): void
    {
        $data = $this->makeData(['clientFirstName' => ' Anna', 'clientLastName' => 'Schmidt ']);
        $this->assertSame('Anna Schmidt', $data->clientName);
    }

    #[Test]
    public function it_formats_date_as_german(): void
    {
        $data = $this->makeData(['bookingDate' => '2026-12-01']);
        $this->assertSame('01.12.2026', $data->dateFormatted);
    }

    #[Test]
    public function it_detects_confirmed_status(): void
    {
        $new = $this->makeData(status: NotificationStatus::New);
        $confirmed = $this->makeData(status: NotificationStatus::Confirmed);

        $this->assertFalse($new->isConfirmed());
        $this->assertTrue($confirmed->isConfirmed());
    }

    #[Test]
    #[DataProvider('paymentMethodLabelProvider')]
    public function it_maps_payment_method_labels(string $method, string $expected): void
    {
        $data = $this->makeData(['paymentMethod' => $method]);
        $this->assertSame($expected, $data->paymentMethodLabel());
    }

    public static function paymentMethodLabelProvider(): array
    {
        return [
            'stripe'        => ['stripe', 'Kreditkarte / Online-Zahlung (Stripe)'],
            'paypal'        => ['paypal', 'PayPal'],
            'wire_transfer' => ['wire_transfer', 'Überweisung'],
            'unknown'       => ['bitcoin', 'bitcoin'],
        ];
    }

    #[Test]
    public function it_shows_bezahlt_when_confirmed(): void
    {
        $data = $this->makeData(status: NotificationStatus::Confirmed);
        $this->assertSame('Bezahlt', $data->paymentStatusLabel());
        $this->assertSame('Bestätigt', $data->bookingStatusLabel());
    }

    #[Test]
    public function it_shows_ausstehend_for_new_wire_transfer(): void
    {
        $data = $this->makeData(['paymentMethod' => 'wire_transfer'], NotificationStatus::New);
        $this->assertSame('Ausstehend (Überweisung)', $data->paymentStatusLabel());
        $this->assertSame('Warte auf Zahlung', $data->bookingStatusLabel());
    }

    #[Test]
    public function it_shows_ausstehend_for_new_stripe(): void
    {
        $data = $this->makeData(['paymentMethod' => 'stripe'], NotificationStatus::New);
        $this->assertSame('Ausstehend', $data->paymentStatusLabel());
    }

    #[Test]
    public function it_generates_subject_for_new_booking(): void
    {
        $data = $this->makeData(['bookingDate' => '2026-03-15'], NotificationStatus::New);
        $this->assertSame('Neue Buchung — Max Mustermann (15.03.2026)', $data->subject());
    }

    #[Test]
    public function it_generates_subject_for_confirmed_booking(): void
    {
        $data = $this->makeData(['bookingDate' => '2026-03-15'], NotificationStatus::Confirmed);
        $this->assertSame('Zahlung bestätigt — Max Mustermann (15.03.2026)', $data->subject());
    }

    #[Test]
    public function it_creates_from_booking_row(): void
    {
        $row = [
            'client_first_name' => 'Erika',
            'client_last_name'  => 'Musterfrau',
            'client_email'      => 'erika@example.com',
            'client_phone'      => '030 9876543',
            'client_street'     => 'Hauptstraße 5',
            'client_zip'        => '10178',
            'client_city'       => 'Berlin',
            'client_message'    => 'Ich brauche Hilfe',
            'booking_date'      => '2026-04-01',
            'booking_time'      => '14:30',
            'duration_minutes'  => 50,
            'payment_method'    => 'paypal',
            'invoice_number'    => '26-0042',
        ];

        $data = BookingNotificationData::fromBookingRow($row, NotificationStatus::Confirmed);

        $this->assertSame('Erika Musterfrau', $data->clientName);
        $this->assertSame('erika@example.com', $data->clientEmail);
        $this->assertSame('PayPal', $data->paymentMethodLabel());
        $this->assertSame('Bezahlt', $data->paymentStatusLabel());
        $this->assertSame('26-0042', $data->invoiceNumber);
        $this->assertTrue($data->isConfirmed());
    }

    #[Test]
    public function it_handles_missing_row_fields_gracefully(): void
    {
        $data = BookingNotificationData::fromBookingRow([]);

        $this->assertSame('', $data->clientName);
        $this->assertSame('', $data->clientEmail);
        $this->assertSame(50, $data->durationMinutes);
        $this->assertSame('wire_transfer', $data->paymentMethod);
        $this->assertNull($data->invoiceNumber);
        $this->assertFalse($data->isConfirmed());
    }
}
