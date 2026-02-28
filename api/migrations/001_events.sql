-- Migration 001: Add events table and update bookings for one-off slots

CREATE TABLE IF NOT EXISTS events (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label            VARCHAR(255) DEFAULT '',
  event_date       DATE         NOT NULL,
  time             VARCHAR(5)   NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 50,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Drop the FK on rule_id before we can drop the unique index it depends on
ALTER TABLE bookings DROP FOREIGN KEY bookings_ibfk_1;
ALTER TABLE bookings DROP INDEX uq_booking;
ALTER TABLE bookings MODIFY rule_id INT UNSIGNED NULL;
ALTER TABLE bookings ADD COLUMN event_id INT UNSIGNED NULL AFTER rule_id;
ALTER TABLE bookings ADD UNIQUE KEY uq_rule_booking (rule_id, booking_date, booking_time);
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_rule FOREIGN KEY (rule_id) REFERENCES recurring_rules(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
