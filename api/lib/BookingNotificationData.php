<?php

enum NotificationStatus: string {
    case New = 'new';
    case Confirmed = 'confirmed';
}

/**
 * Typed data transfer object for booking notification emails.
 *
 * Keep this compatible with the production PHP runtime.
 */
final class BookingNotificationData {
    public string $clientName;
    public string $dateFormatted;

    public function __construct(
        public string $clientFirstName,
        public string $clientLastName,
        public string $clientEmail,
        public string $clientPhone,
        public string $clientStreet,
        public string $clientZip,
        public string $clientCity,
        public ?string $clientMessage,
        public string $bookingDate,
        public string $bookingTime,
        public int $durationMinutes,
        public string $paymentMethod,
        public ?string $bookingNumber,
        public ?string $invoiceNumber,
        public NotificationStatus $status = NotificationStatus::New,
    ) {
        $this->clientName = trim("$this->clientFirstName $this->clientLastName");
        $this->dateFormatted = date('d.m.Y', strtotime($this->bookingDate));
    }

    /**
     * Create from a booking DB row.
     */
    public static function fromBookingRow(array $row, NotificationStatus $status = NotificationStatus::New): self {
        return new self(
            clientFirstName: $row['client_first_name'] ?? '',
            clientLastName:  $row['client_last_name'] ?? '',
            clientEmail:     $row['client_email'] ?? '',
            clientPhone:     $row['client_phone'] ?? '',
            clientStreet:    $row['client_street'] ?? '',
            clientZip:       $row['client_zip'] ?? '',
            clientCity:      $row['client_city'] ?? '',
            clientMessage:   $row['client_message'] ?? null,
            bookingDate:     $row['booking_date'] ?? '',
            bookingTime:     $row['booking_time'] ?? '',
            durationMinutes: (int)($row['duration_minutes'] ?? 50),
            paymentMethod:   $row['payment_method'] ?? 'wire_transfer',
            bookingNumber:   $row['booking_number'] ?? null,
            invoiceNumber:   $row['invoice_number'] ?? null,
            status:          $status,
        );
    }

    public function isConfirmed(): bool {
        return $this->status === NotificationStatus::Confirmed;
    }

    public function paymentMethodLabel(): string {
        return match ($this->paymentMethod) {
            'stripe'        => 'Kreditkarte / Online-Zahlung (Stripe)',
            'paypal'        => 'PayPal',
            'wire_transfer' => 'Überweisung',
            default         => $this->paymentMethod,
        };
    }

    public function paymentStatusLabel(): string {
        if ($this->isConfirmed()) {
            return 'Bezahlt';
        }
        return $this->paymentMethod === 'wire_transfer'
            ? 'Ausstehend (Überweisung)'
            : 'Ausstehend';
    }

    public function bookingStatusLabel(): string {
        return $this->isConfirmed() ? 'Bestätigt' : 'Warte auf Zahlung';
    }

    public function subject(): string {
        return $this->isConfirmed()
            ? "Zahlung bestätigt — {$this->clientName} ({$this->dateFormatted})"
            : "Neue Buchung — {$this->clientName} ({$this->dateFormatted})";
    }
}
