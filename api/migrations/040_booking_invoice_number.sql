ALTER TABLE bookings ADD COLUMN invoice_number VARCHAR(10) DEFAULT NULL AFTER payment_id;
