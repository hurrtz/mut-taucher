-- Price on booking slots
ALTER TABLE recurring_rules ADD COLUMN price_cents INT UNSIGNED DEFAULT NULL;
ALTER TABLE events ADD COLUMN price_cents INT UNSIGNED DEFAULT NULL;

-- Invoice tracking on bookings
ALTER TABLE bookings
  ADD COLUMN invoice_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN invoice_sent_at TIMESTAMP NULL DEFAULT NULL;

-- Bundle invoice tracking on group participants
ALTER TABLE group_participants
  ADD COLUMN invoice_status ENUM('none','full_sent','half1_sent','half2_sent') NOT NULL DEFAULT 'none';

-- New sending points for per-type invoice templates
INSERT INTO template_mappings (sending_point) VALUES
  ('pdf:rechnung_erstgespraech'),
  ('pdf:rechnung_einzeltherapie'),
  ('pdf:rechnung_gruppentherapie');
