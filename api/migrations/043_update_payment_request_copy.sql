UPDATE document_templates
SET html_content = REPLACE(
  html_content,
  '<p>Vielen Dank für Ihre Terminbuchung. Bitte überweisen Sie den folgenden Betrag, um Ihren Termin verbindlich zu bestätigen.</p>',
  '<p>Vielen Dank für Ihre Terminbuchung. Bitte überweisen Sie den folgenden Betrag. Der Termin gilt erst nach Zahlungseingang als verbindlich gebucht.</p><p>Diese Zahlungsaufforderung stellt noch keine Rechnung dar. Die Rechnung wird nach Zahlungseingang erstellt.</p>'
)
WHERE template_key = 'zahlungsaufforderung_erstgespraech'
  AND html_content LIKE '%Bitte überweisen Sie den folgenden Betrag, um Ihren Termin verbindlich zu bestätigen.%';
