-- Replace static wire transfer text with dynamic payment note placeholder
UPDATE document_templates
SET html_content = REPLACE(
  html_content,
  '<p>Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.</p>',
  '<p>{{payment_note}}</p>'
)
WHERE template_key = 'rechnung';
