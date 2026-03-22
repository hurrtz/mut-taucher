CREATE TABLE IF NOT EXISTS booking_numbers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_prefix CHAR(2) NOT NULL,
  sequence_number INT NOT NULL,
  booking_number VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_year_seq (year_prefix, sequence_number)
);

ALTER TABLE bookings
  ADD COLUMN booking_number VARCHAR(10) DEFAULT NULL AFTER invoice_number,
  ADD COLUMN payment_request_sent BOOLEAN NOT NULL DEFAULT FALSE AFTER invoice_sent_at,
  ADD COLUMN payment_request_sent_at TIMESTAMP NULL DEFAULT NULL AFTER payment_request_sent;

INSERT INTO template_mappings (sending_point, template_key)
SELECT 'pdf:zahlungsaufforderung_erstgespraech', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM template_mappings WHERE sending_point = 'pdf:zahlungsaufforderung_erstgespraech'
);

INSERT INTO document_templates (template_key, label, group_name, html_content, placeholders)
SELECT
  'zahlungsaufforderung_erstgespraech',
  'Zahlungsaufforderung — Erstgespräch',
  'Buchungen',
  '<p style="color: #64748b"><span style="font-size: 8pt">{{therapist_name}} · {{therapist_street}} · {{therapist_zip}} {{therapist_city}}</span></p>
<p><strong>{{client_name}}</strong><br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>
<br><br>
<table cellpadding="0" border="0" width="100%">
<tr>
<td width="50%"></td>
<td width="50%"><strong>Buchungsnummer:</strong> {{booking_number}}<br><strong>Datum:</strong> {{date}}</td>
</tr>
</table>
<br>
<h2>Zahlungsaufforderung</h2>
<p>Vielen Dank für Ihre Terminbuchung. Bitte überweisen Sie den folgenden Betrag, um Ihren Termin verbindlich zu bestätigen.</p>
<table cellpadding="8" border="0" width="100%">
<tr>
<th width="35%" bgcolor="#2dd4bf" style="color: #ffffff" align="left">Leistung</th>
<th width="30%" bgcolor="#2dd4bf" style="color: #ffffff" align="left">Datum</th>
<th width="13%" bgcolor="#2dd4bf" style="color: #ffffff" align="left">Dauer</th>
<th width="22%" bgcolor="#2dd4bf" style="color: #ffffff" align="right">Betrag</th>
</tr>
<tr>
<td style="border-bottom: 1px solid #e2e8f0">{{therapy_label}}</td>
<td style="border-bottom: 1px solid #e2e8f0">{{session_date}} {{session_time}}</td>
<td style="border-bottom: 1px solid #e2e8f0">{{duration_minutes}} Min.</td>
<td align="right" style="border-bottom: 1px solid #e2e8f0">{{amount}}</td>
</tr>
<tr>
<td colspan="3" align="right"><strong>Gesamtbetrag:</strong></td>
<td align="right" style="border-top: 2px solid #2dd4bf"><strong>{{amount}}</strong></td>
</tr>
</table>
<br>
<p><strong>Zahlungsdaten</strong></p>
<table cellpadding="6" border="0" width="100%">
<tr><td width="35%"><strong>Empfänger</strong></td><td width="65%">{{bank_account_holder}}</td></tr>
<tr><td width="35%"><strong>IBAN</strong></td><td width="65%">{{bank_iban}}</td></tr>
<tr><td width="35%"><strong>BIC</strong></td><td width="65%">{{bank_bic}}</td></tr>
<tr><td width="35%"><strong>Bank</strong></td><td width="65%">{{bank_name}}</td></tr>
<tr><td width="35%"><strong>Verwendungszweck</strong></td><td width="65%">{{booking_number}}</td></tr>
</table>
<br>
<p>{{payment_note}}</p>
<br><br>
<p>Mit freundlichen Grüßen</p>
<p><strong>{{therapist_name}}</strong></p>',
  '["client_name", "client_street", "client_zip", "client_city", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "date", "booking_number", "amount", "duration_minutes", "therapy_label", "session_date", "session_time", "payment_note", "bank_account_holder", "bank_iban", "bank_bic", "bank_name"]'
WHERE NOT EXISTS (
  SELECT 1 FROM document_templates WHERE template_key = 'zahlungsaufforderung_erstgespraech'
);

UPDATE document_templates
SET placeholders = '["client_name", "client_street", "client_zip", "client_city", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date", "invoice_number", "booking_number", "amount", "duration_minutes", "therapy_label", "session_date", "session_time", "payment_note"]'
WHERE template_key = 'rechnung'
  AND placeholders NOT LIKE '%booking_number%';

UPDATE document_templates
SET html_content = REPLACE(
  html_content,
  '<strong>Rechnungsnummer:</strong> {{invoice_number}}<br><strong>Rechnungsdatum:</strong> {{date}}',
  '<strong>Rechnungsnummer:</strong> {{invoice_number}}<br><strong>Buchungsnummer:</strong> {{booking_number}}<br><strong>Rechnungsdatum:</strong> {{date}}'
)
WHERE template_key = 'rechnung'
  AND html_content LIKE '%<strong>Rechnungsnummer:</strong> {{invoice_number}}<br><strong>Rechnungsdatum:</strong> {{date}}%';
