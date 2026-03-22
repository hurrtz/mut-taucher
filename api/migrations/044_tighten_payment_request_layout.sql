UPDATE document_templates
SET html_content = REPLACE(
  html_content,
  '<p><strong>Zahlungsdaten</strong></p>
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
  '<p><strong>Zahlungsdaten</strong></p>
<table cellpadding="3" border="0" width="100%">
<tr><td width="35%"><strong>Empfänger</strong></td><td width="65%">{{bank_account_holder}}</td></tr>
<tr><td width="35%"><strong>IBAN</strong></td><td width="65%">{{bank_iban}}</td></tr>
<tr><td width="35%"><strong>BIC</strong></td><td width="65%">{{bank_bic}}</td></tr>
<tr><td width="35%"><strong>Bank</strong></td><td width="65%">{{bank_name}}</td></tr>
<tr><td width="35%"><strong>Verwendungszweck</strong></td><td width="65%">{{booking_number}}</td></tr>
</table>
<p>{{payment_note}}</p>
<p>Mit freundlichen Grüßen<br><strong>{{therapist_name}}</strong></p>'
)
WHERE template_key = 'zahlungsaufforderung_erstgespraech'
  AND html_content LIKE '%<table cellpadding="6" border="0" width="100%">%'
  AND html_content LIKE '%<p><strong>{{therapist_name}}</strong></p>%';
