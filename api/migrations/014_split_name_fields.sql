-- Split single name field into structured parts for clients and bookings

-- ─── Clients ────────────────────────────────────────────────────
ALTER TABLE clients ADD COLUMN title VARCHAR(50) DEFAULT NULL AFTER id;
ALTER TABLE clients ADD COLUMN first_name VARCHAR(255) NOT NULL DEFAULT '' AFTER name;
ALTER TABLE clients ADD COLUMN last_name VARCHAR(255) NOT NULL DEFAULT '' AFTER first_name;
ALTER TABLE clients ADD COLUMN suffix VARCHAR(100) DEFAULT NULL AFTER last_name;

-- Migrate: last word = last_name, rest = first_name
UPDATE clients SET
  last_name = SUBSTRING_INDEX(name, ' ', -1),
  first_name = IF(LOCATE(' ', name) > 0,
    LEFT(name, LENGTH(name) - LENGTH(SUBSTRING_INDEX(name, ' ', -1)) - 1),
    name);

ALTER TABLE clients DROP COLUMN name;

-- ─── Bookings ───────────────────────────────────────────────────
ALTER TABLE bookings ADD COLUMN client_first_name VARCHAR(255) NOT NULL DEFAULT '' AFTER client_name;
ALTER TABLE bookings ADD COLUMN client_last_name VARCHAR(255) NOT NULL DEFAULT '' AFTER client_first_name;

UPDATE bookings SET
  client_last_name = SUBSTRING_INDEX(client_name, ' ', -1),
  client_first_name = IF(LOCATE(' ', client_name) > 0,
    LEFT(client_name, LENGTH(client_name) - LENGTH(SUBSTRING_INDEX(client_name, ' ', -1)) - 1),
    client_name);

ALTER TABLE bookings DROP COLUMN client_name;
