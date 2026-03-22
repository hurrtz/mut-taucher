ALTER TABLE bookings
  ADD COLUMN payment_confirmed_at TIMESTAMP NULL DEFAULT NULL AFTER payment_request_sent_at;

CREATE TABLE booking_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  client_id INT UNSIGNED DEFAULT NULL,
  event_type ENUM(
    'requested',
    'payment_reminder_sent',
    'payment_confirmed',
    'started',
    'completed',
    'cancelled',
    'cancellation_email_sent'
  ) NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_booking_events_booking (booking_id, occurred_at),
  KEY idx_booking_events_client (client_id, occurred_at),
  CONSTRAINT fk_booking_events_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_events_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO booking_events (booking_id, client_id, event_type, occurred_at)
SELECT b.id, c.id, 'requested', b.created_at
FROM bookings b
LEFT JOIN clients c ON c.booking_id = b.id;

UPDATE bookings
SET payment_confirmed_at = COALESCE(invoice_sent_at, created_at)
WHERE payment_confirmed_at IS NULL
  AND invoice_sent = 1;

UPDATE bookings
SET payment_confirmed_at = COALESCE(payment_confirmed_at, created_at)
WHERE payment_confirmed_at IS NULL
  AND payment_method IN ('stripe', 'paypal')
  AND status IN ('confirmed', 'completed');
