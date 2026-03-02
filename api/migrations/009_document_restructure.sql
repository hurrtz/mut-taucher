-- Migration 009: Document registry restructure + rename booking → erstgespraech
-- 1. Add 'client' and 'erstgespraech' to ENUM, then migrate data, then remove 'booking'

-- Step 1: Expand ENUM to include new values
ALTER TABLE document_sends MODIFY context_type ENUM('booking','erstgespraech','therapy','group','client') NOT NULL;

-- Step 2: Rename booking → erstgespraech
UPDATE document_sends SET context_type = 'erstgespraech' WHERE context_type = 'booking';

-- Step 3: Remove 'booking' from ENUM
ALTER TABLE document_sends MODIFY context_type ENUM('erstgespraech','therapy','group','client') NOT NULL;

-- Step 4: Migrate client-level doc sends from erstgespraech → client context
--         (resolve client via clients.booking_id)
INSERT INTO document_sends (context_type, context_id, document_key, sent_at)
SELECT 'client', c.id, ds.document_key, ds.sent_at
FROM document_sends ds
JOIN clients c ON c.booking_id = ds.context_id
WHERE ds.context_type = 'erstgespraech'
  AND ds.document_key IN ('dsgvo_hinweise','impressum','preisangabe','privatleistung_hinweis','datenspeicherung','dokumentation','datenschutz_digital','email_einwilligung');

DELETE FROM document_sends
WHERE context_type = 'erstgespraech'
  AND document_key IN ('dsgvo_hinweise','impressum','preisangabe','privatleistung_hinweis','datenspeicherung','dokumentation','datenschutz_digital','email_einwilligung');

-- Step 5: Migrate client-level doc sends from therapy → client context
INSERT INTO document_sends (context_type, context_id, document_key, sent_at)
SELECT 'client', t.client_id, ds.document_key, ds.sent_at
FROM document_sends ds
JOIN therapies t ON t.id = ds.context_id
WHERE ds.context_type = 'therapy'
  AND ds.document_key IN ('dsgvo_hinweise','dokumentation','datenspeicherung','privatleistung','email_einwilligung');

DELETE FROM document_sends
WHERE context_type = 'therapy'
  AND document_key IN ('dsgvo_hinweise','dokumentation','datenspeicherung','privatleistung','email_einwilligung');

-- Step 6: Drop legacy columns from bookings
ALTER TABLE bookings DROP COLUMN contract_sent;
ALTER TABLE bookings DROP COLUMN dsgvo_sent;
ALTER TABLE bookings DROP COLUMN confidentiality_sent;
ALTER TABLE bookings DROP COLUMN online_therapy_sent;
