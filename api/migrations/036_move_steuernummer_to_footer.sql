-- Move Steuernummer from invoice body to PDF page footer
UPDATE document_templates
SET html_content = REPLACE(html_content, '<p>Steuernummer: {{therapist_tax_id}}</p>', '')
WHERE template_key = 'rechnung';
