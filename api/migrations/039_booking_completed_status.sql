ALTER TABLE bookings MODIFY COLUMN status ENUM('pending_payment','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending_payment';
