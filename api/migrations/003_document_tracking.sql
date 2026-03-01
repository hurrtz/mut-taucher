-- Add document-sent tracking columns to bookings
ALTER TABLE bookings ADD COLUMN contract_sent TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN dsgvo_sent TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN confidentiality_sent TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN online_therapy_sent TINYINT(1) NOT NULL DEFAULT 0;
