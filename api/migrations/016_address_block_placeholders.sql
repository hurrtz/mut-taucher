-- Add composite address block placeholders (therapist_address, client_address)
-- to all document templates that already have individual address fields.

UPDATE document_templates SET
  placeholders = '["therapist_address", "client_address", "client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key IN (
  'vertrag_erstgespraech',
  'vertrag_einzeltherapie',
  'vertrag_gruppentherapie',
  'onlinetherapie',
  'datenschutzinfo',
  'schweigepflichtentbindung',
  'video_einverstaendnis',
  'datenschutz_digital',
  'email_einwilligung'
);

UPDATE document_templates SET
  placeholders = '["therapist_address", "client_address", "client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date", "invoice_number", "amount", "duration_minutes", "therapy_label", "session_date", "session_time"]'
WHERE template_key = 'rechnung';
