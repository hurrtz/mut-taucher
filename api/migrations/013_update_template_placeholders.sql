-- Add address and tax placeholders to document templates

-- Update rechnung: add therapist address/tax header and client address
UPDATE document_templates SET
  html_content = '<p><strong>{{therapist_name}}</strong><br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>\n<p>Steuernummer: {{therapist_tax_id}}</p>\n<br>\n<p><strong>Rechnungsempfänger:</strong></p>\n<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>\n<p><strong>Rechnungsnummer:</strong> {{invoice_number}}</p>\n<p><strong>Rechnungsdatum:</strong> {{date}}</p>\n<br>\n<h2>Leistungsübersicht</h2>\n<br>\n<table border="1" cellpadding="6">\n<tr>\n<td width="50%"><strong>Leistung</strong></td>\n<td width="20%"><strong>Datum</strong></td>\n<td width="15%"><strong>Dauer</strong></td>\n<td width="15%" align="right"><strong>Betrag</strong></td>\n</tr>\n<tr>\n<td>{{therapy_label}}</td>\n<td>{{session_date}} {{session_time}}</td>\n<td>{{duration_minutes}} Min.</td>\n<td align="right">{{amount}}</td>\n</tr>\n<tr>\n<td colspan="3" align="right"><strong>Gesamtbetrag:</strong></td>\n<td align="right"><strong>{{amount}}</strong></td>\n</tr>\n</table>\n<br>\n<p><strong>Hinweis:</strong> Gemäß § 4 Nr. 14 UStG ist die Leistung umsatzsteuerbefreit (Heilbehandlung im Bereich der Humanmedizin).</p>\n<br>\n<p>Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.</p>\n<br><br>\n<p>Mit freundlichen Grüßen</p>\n<p>{{therapist_name}}</p>',
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date", "invoice_number", "amount", "duration_minutes", "therapy_label", "session_date", "session_time"]'
WHERE template_key = 'rechnung';

-- Update vertrag_erstgespraech: add therapist address and client address
UPDATE document_templates SET
  html_content = '<h1>Vertrag — Erstgespräch</h1>\n<p><strong>Zwischen:</strong></p>\n<p>{{therapist_name}}<br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>\n<p>(nachfolgend „Therapeutin")</p>\n<p><strong>und</strong></p>\n<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>\n<p>(nachfolgend „Klient/in")</p>\n<br>\n<p><strong>Datum:</strong> {{date}}</p>\n<br>\n<h2>§ 1 Gegenstand des Vertrages</h2>\n<p>[PLATZHALTER: Hier wird der Gegenstand des Vertrages für das Erstgespräch beschrieben.]</p>\n<br>\n<h2>§ 2 Leistungen</h2>\n<p>[PLATZHALTER: Beschreibung des Erstgesprächs, Dauer, Ablauf.]</p>\n<br>\n<h2>§ 3 Vergütung</h2>\n<p>[PLATZHALTER: Honorar, Zahlungsbedingungen, Absageregelungen.]</p>\n<br>\n<h2>§ 4 Schweigepflicht</h2>\n<p>[PLATZHALTER: Hinweis auf die gesetzliche Schweigepflicht.]</p>\n<br><br>\n<p>_________________________        _________________________</p>\n<p>Ort, Datum                                Unterschrift Klient/in</p>',
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key = 'vertrag_erstgespraech';

-- Update vertrag_einzeltherapie: add therapist address and client address
UPDATE document_templates SET
  html_content = '<h1>Vertrag — Einzeltherapie</h1>\n<p><strong>Zwischen:</strong></p>\n<p>{{therapist_name}}<br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>\n<p>(nachfolgend „Therapeutin")</p>\n<p><strong>und</strong></p>\n<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>\n<p>(nachfolgend „Klient/in")</p>\n<br>\n<p><strong>Datum:</strong> {{date}}</p>\n<br>\n<h2>§ 1 Gegenstand des Vertrages</h2>\n<p>[PLATZHALTER: Hier wird der Gegenstand des Behandlungsvertrages für Einzeltherapie beschrieben.]</p>\n<br>\n<h2>§ 2 Leistungen</h2>\n<p>[PLATZHALTER: Beschreibung der therapeutischen Leistungen, Sitzungsdauer, Häufigkeit.]</p>\n<br>\n<h2>§ 3 Vergütung</h2>\n<p>[PLATZHALTER: Honorar, Zahlungsbedingungen, Absageregelungen.]</p>\n<br>\n<h2>§ 4 Schweigepflicht</h2>\n<p>[PLATZHALTER: Hinweis auf die gesetzliche Schweigepflicht.]</p>\n<br><br>\n<p>_________________________        _________________________</p>\n<p>Ort, Datum                                Unterschrift Klient/in</p>',
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key = 'vertrag_einzeltherapie';

-- Update vertrag_gruppentherapie: add therapist address and client address
UPDATE document_templates SET
  html_content = '<h1>Vertrag — Gruppentherapie</h1>\n<p><strong>Zwischen:</strong></p>\n<p>{{therapist_name}}<br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>\n<p>(nachfolgend „Therapeutin")</p>\n<p><strong>und</strong></p>\n<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>\n<p>(nachfolgend „Klient/in")</p>\n<br>\n<p><strong>Datum:</strong> {{date}}</p>\n<br>\n<h2>§ 1 Gegenstand des Vertrages</h2>\n<p>[PLATZHALTER: Hier wird der Gegenstand des Behandlungsvertrages für Gruppentherapie beschrieben.]</p>\n<br>\n<h2>§ 2 Leistungen</h2>\n<p>[PLATZHALTER: Beschreibung der Gruppentherapie, Sitzungsdauer, Häufigkeit, Gruppengröße.]</p>\n<br>\n<h2>§ 3 Vergütung</h2>\n<p>[PLATZHALTER: Honorar, Zahlungsbedingungen, Absageregelungen.]</p>\n<br>\n<h2>§ 4 Schweigepflicht</h2>\n<p>[PLATZHALTER: Hinweis auf die gesetzliche Schweigepflicht.]</p>\n<br>\n<h2>§ 5 Vertraulichkeit in der Gruppe</h2>\n<p>[PLATZHALTER: Besondere Vertraulichkeitsvereinbarung für das Gruppenformat.]</p>\n<br><br>\n<p>_________________________        _________________________</p>\n<p>Ort, Datum                                Unterschrift Klient/in</p>',
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key = 'vertrag_gruppentherapie';

-- Update onlinetherapie: add therapist and client address
UPDATE document_templates SET
  html_content = '<p><strong>Zwischen:</strong></p>\n<p>{{therapist_name}}<br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>\n<p>(nachfolgend „Therapeutin")</p>\n<p><strong>und</strong></p>\n<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>\n<p>(nachfolgend „Klient/in")</p>\n<br>\n<h2>§ 1 Gegenstand</h2>\n<p>[PLATZHALTER: Vereinbarung über die Durchführung der Therapie über eine Online-Plattform (Videotelefonie).]</p>\n<br>\n<h2>§ 2 Technische Voraussetzungen</h2>\n<p>[PLATZHALTER: Stabile Internetverbindung, ruhiger Raum, Kamera und Mikrofon, unterstützte Plattform.]</p>\n<br>\n<h2>§ 3 Datenschutz und Verschlüsselung</h2>\n<p>[PLATZHALTER: Verwendete Plattform, Ende-zu-Ende-Verschlüsselung, keine Aufzeichnung der Sitzungen.]</p>\n<br>\n<h2>§ 4 Grenzen der Online-Therapie</h2>\n<p>[PLATZHALTER: Hinweis auf Situationen, in denen Präsenztherapie empfohlen wird (akute Krisen, Suizidalität).]</p>\n<br>\n<h2>§ 5 Haftung</h2>\n<p>[PLATZHALTER: Haftungsausschluss bei technischen Störungen.]</p>\n<br>\n<p><strong>Datum:</strong> {{date}}</p>\n<br><br>\n<p>_________________________        _________________________</p>\n<p>Ort, Datum                                Unterschrift Klient/in</p>',
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key = 'onlinetherapie';

-- Update datenschutzinfo: add address placeholders
UPDATE document_templates SET
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key = 'datenschutzinfo';

-- Update schweigepflichtentbindung: add address placeholders
UPDATE document_templates SET
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key = 'schweigepflichtentbindung';

-- Update video_einverstaendnis: add address placeholders
UPDATE document_templates SET
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key = 'video_einverstaendnis';

-- Update datenschutz_digital: add address placeholders
UPDATE document_templates SET
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key = 'datenschutz_digital';

-- Update email_einwilligung: add address placeholders
UPDATE document_templates SET
  placeholders = '["client_name", "client_street", "client_zip", "client_city", "client_country", "therapist_name", "therapist_street", "therapist_zip", "therapist_city", "therapist_tax_id", "date"]'
WHERE template_key = 'email_einwilligung';
