ALTER TABLE bookings ADD COLUMN client_street VARCHAR(255) DEFAULT NULL AFTER client_email;
ALTER TABLE bookings ADD COLUMN client_zip VARCHAR(10) DEFAULT NULL AFTER client_street;
ALTER TABLE bookings ADD COLUMN client_city VARCHAR(100) DEFAULT NULL AFTER client_zip;
