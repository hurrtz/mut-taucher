UPDATE booking_events be
JOIN clients c ON c.booking_id = be.booking_id
SET be.client_id = c.id
WHERE be.client_id IS NULL;

INSERT INTO booking_events (booking_id, client_id, event_type, occurred_at)
SELECT b.id, c.id, 'requested', b.created_at
FROM bookings b
LEFT JOIN clients c ON c.booking_id = b.id
LEFT JOIN booking_events be
  ON be.booking_id = b.id
 AND be.event_type = 'requested'
WHERE be.id IS NULL;

UPDATE bookings
SET payment_confirmed_at = COALESCE(payment_confirmed_at, invoice_sent_at, created_at)
WHERE payment_confirmed_at IS NULL
  AND invoice_sent = 1;

UPDATE bookings
SET payment_confirmed_at = COALESCE(payment_confirmed_at, created_at)
WHERE payment_confirmed_at IS NULL
  AND payment_method IN ('stripe', 'paypal')
  AND status IN ('confirmed', 'completed');

INSERT INTO booking_events (booking_id, client_id, event_type, occurred_at)
SELECT b.id, c.id, 'payment_reminder_sent', COALESCE(b.payment_request_sent_at, b.created_at)
FROM bookings b
LEFT JOIN clients c ON c.booking_id = b.id
LEFT JOIN booking_events be
  ON be.booking_id = b.id
 AND be.event_type = 'payment_reminder_sent'
WHERE b.reminder_sent = 1
  AND be.id IS NULL;

INSERT INTO booking_events (booking_id, client_id, event_type, occurred_at)
SELECT b.id, c.id, 'payment_confirmed', b.payment_confirmed_at
FROM bookings b
LEFT JOIN clients c ON c.booking_id = b.id
LEFT JOIN booking_events be
  ON be.booking_id = b.id
 AND be.event_type = 'payment_confirmed'
WHERE b.payment_confirmed_at IS NOT NULL
  AND be.id IS NULL;

INSERT INTO booking_events (booking_id, client_id, event_type, occurred_at)
SELECT b.id, c.id, 'completed', TIMESTAMP(b.booking_date, b.booking_time)
FROM bookings b
LEFT JOIN clients c ON c.booking_id = b.id
LEFT JOIN booking_events be
  ON be.booking_id = b.id
 AND be.event_type = 'completed'
WHERE b.status = 'completed'
  AND be.id IS NULL;

INSERT INTO booking_events (booking_id, client_id, event_type, occurred_at)
SELECT b.id, c.id, 'cancelled', COALESCE(TIMESTAMP(b.booking_date, b.booking_time), b.created_at)
FROM bookings b
LEFT JOIN clients c ON c.booking_id = b.id
LEFT JOIN booking_events be
  ON be.booking_id = b.id
 AND be.event_type = 'cancelled'
WHERE b.status = 'cancelled'
  AND be.id IS NULL;
