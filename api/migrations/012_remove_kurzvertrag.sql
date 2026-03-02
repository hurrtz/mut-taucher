-- Remove kurzvertrag template, now covered by vertrag_erstgespraech
DELETE FROM document_templates WHERE template_key = 'kurzvertrag';
