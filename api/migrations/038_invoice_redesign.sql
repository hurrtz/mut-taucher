-- Redesign invoice template: standard German invoice layout, styled table
-- Removes inline bank details (now in TCPDF page footer)
UPDATE document_templates SET html_content = '<p style="color: #64748b"><span style="font-size: 8pt">{{therapist_name}} · {{therapist_street}} · {{therapist_zip}} {{therapist_city}}</span></p>
<p><strong>{{client_name}}</strong><br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>
<br><br>
<table cellpadding="0" border="0" width="100%">
<tr>
<td width="50%"></td>
<td width="50%"><strong>Rechnungsnummer:</strong> {{invoice_number}}<br><strong>Rechnungsdatum:</strong> {{date}}</td>
</tr>
</table>
<br>
<h2>Rechnung</h2>
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
<p style="color: #64748b"><strong>Hinweis:</strong> Gemäß § 4 Nr. 14 UStG ist die Leistung umsatzsteuerbefreit (Heilbehandlung im Bereich der Humanmedizin).</p>
<br>
<p>{{payment_note}}</p>
<br><br>
<p>Mit freundlichen Grüßen</p>
<p><strong>{{therapist_name}}</strong></p>'
WHERE template_key = 'rechnung'
