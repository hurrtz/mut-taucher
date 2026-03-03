ALTER TABLE document_sends
    ADD COLUMN client_id INT UNSIGNED DEFAULT NULL AFTER id,
    ADD INDEX (client_id);

-- Backfill from context
UPDATE document_sends SET client_id = context_id WHERE context_type = 'client';
UPDATE document_sends ds JOIN therapies t ON ds.context_id = t.id
    SET ds.client_id = t.client_id WHERE ds.context_type = 'therapy';
