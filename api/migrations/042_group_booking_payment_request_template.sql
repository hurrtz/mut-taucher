UPDATE document_templates
SET group_name = 'Buchungen'
WHERE template_key = 'zahlungsaufforderung_erstgespraech'
  AND (group_name IS NULL OR group_name = 'Rechnungen');
