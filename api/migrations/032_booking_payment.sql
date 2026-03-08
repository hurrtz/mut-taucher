ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(20) DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN payment_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE bookings MODIFY COLUMN status ENUM('pending_payment','confirmed','cancelled') NOT NULL DEFAULT 'pending_payment';
