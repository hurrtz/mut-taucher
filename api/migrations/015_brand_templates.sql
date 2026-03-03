-- Replace underscore signature hacks with proper table elements,
-- and use <th> in rechnung header row so applyBranding() can style it.
-- No inline styles — PdfGenerator::applyBranding() handles branding at render time.

-- vertrag_erstgespraech: dual signature table
UPDATE document_templates SET html_content = '<h1>Vertrag — Erstgespräch</h1>
<p><strong>Zwischen:</strong></p>
<p>{{therapist_name}}<br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>
<p>(nachfolgend „Therapeutin")</p>
<p><strong>und</strong></p>
<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>
<p>(nachfolgend „Klient/in")</p>
<br>
<p><strong>Datum:</strong> {{date}}</p>
<br>
<h2>§ 1 Gegenstand des Vertrages</h2>
<p>[PLATZHALTER: Hier wird der Gegenstand des Vertrages für das Erstgespräch beschrieben.]</p>
<br>
<h2>§ 2 Leistungen</h2>
<p>[PLATZHALTER: Beschreibung des Erstgesprächs, Dauer, Ablauf.]</p>
<br>
<h2>§ 3 Vergütung</h2>
<p>[PLATZHALTER: Honorar, Zahlungsbedingungen, Absageregelungen.]</p>
<br>
<h2>§ 4 Schweigepflicht</h2>
<p>[PLATZHALTER: Hinweis auf die gesetzliche Schweigepflicht.]</p>
<br><br>
<table cellpadding="4" width="100%"><tr><td width="50%" align="center" style="border-top: 1px solid #334155">Ort, Datum</td><td width="50%" align="center" style="border-top: 1px solid #334155">Unterschrift Klient/in</td></tr></table>'
WHERE template_key = 'vertrag_erstgespraech';

-- vertrag_einzeltherapie: dual signature table
UPDATE document_templates SET html_content = '<h1>Vertrag — Einzeltherapie</h1>
<p><strong>Zwischen:</strong></p>
<p>{{therapist_name}}<br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>
<p>(nachfolgend „Therapeutin")</p>
<p><strong>und</strong></p>
<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>
<p>(nachfolgend „Klient/in")</p>
<br>
<p><strong>Datum:</strong> {{date}}</p>
<br>
<h2>§ 1 Gegenstand des Vertrages</h2>
<p>[PLATZHALTER: Hier wird der Gegenstand des Behandlungsvertrages für Einzeltherapie beschrieben.]</p>
<br>
<h2>§ 2 Leistungen</h2>
<p>[PLATZHALTER: Beschreibung der therapeutischen Leistungen, Sitzungsdauer, Häufigkeit.]</p>
<br>
<h2>§ 3 Vergütung</h2>
<p>[PLATZHALTER: Honorar, Zahlungsbedingungen, Absageregelungen.]</p>
<br>
<h2>§ 4 Schweigepflicht</h2>
<p>[PLATZHALTER: Hinweis auf die gesetzliche Schweigepflicht.]</p>
<br><br>
<table cellpadding="4" width="100%"><tr><td width="50%" align="center" style="border-top: 1px solid #334155">Ort, Datum</td><td width="50%" align="center" style="border-top: 1px solid #334155">Unterschrift Klient/in</td></tr></table>'
WHERE template_key = 'vertrag_einzeltherapie';

-- vertrag_gruppentherapie: dual signature table
UPDATE document_templates SET html_content = '<h1>Vertrag — Gruppentherapie</h1>
<p><strong>Zwischen:</strong></p>
<p>{{therapist_name}}<br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>
<p>(nachfolgend „Therapeutin")</p>
<p><strong>und</strong></p>
<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>
<p>(nachfolgend „Klient/in")</p>
<br>
<p><strong>Datum:</strong> {{date}}</p>
<br>
<h2>§ 1 Gegenstand des Vertrages</h2>
<p>[PLATZHALTER: Hier wird der Gegenstand des Behandlungsvertrages für Gruppentherapie beschrieben.]</p>
<br>
<h2>§ 2 Leistungen</h2>
<p>[PLATZHALTER: Beschreibung der Gruppentherapie, Sitzungsdauer, Häufigkeit, Gruppengröße.]</p>
<br>
<h2>§ 3 Vergütung</h2>
<p>[PLATZHALTER: Honorar, Zahlungsbedingungen, Absageregelungen.]</p>
<br>
<h2>§ 4 Schweigepflicht</h2>
<p>[PLATZHALTER: Hinweis auf die gesetzliche Schweigepflicht.]</p>
<br>
<h2>§ 5 Vertraulichkeit in der Gruppe</h2>
<p>[PLATZHALTER: Besondere Vertraulichkeitsvereinbarung für das Gruppenformat.]</p>
<br><br>
<table cellpadding="4" width="100%"><tr><td width="50%" align="center" style="border-top: 1px solid #334155">Ort, Datum</td><td width="50%" align="center" style="border-top: 1px solid #334155">Unterschrift Klient/in</td></tr></table>'
WHERE template_key = 'vertrag_gruppentherapie';

-- schweigepflichtentbindung: single-column signature table
UPDATE document_templates SET html_content = '<p>Ich, <strong>{{client_name}}</strong>, entbinde hiermit</p>
<p><strong>{{therapist_name}}</strong></p>
<p>von der Schweigepflicht gegenüber folgenden Personen/Institutionen:</p>
<br>
<p>[PLATZHALTER: Hier können spezifische Personen oder Institutionen benannt werden, z.B. Hausarzt, Psychiater, Krankenkasse.]</p>
<br>
<p>Diese Entbindung bezieht sich auf:</p>
<p>[PLATZHALTER: Art der Informationen, die weitergegeben werden dürfen.]</p>
<br>
<p>Diese Erklärung kann jederzeit widerrufen werden.</p>
<br>
<p><strong>Datum:</strong> {{date}}</p>
<br><br>
<table cellpadding="4" width="50%"><tr><td align="center" style="border-top: 1px solid #334155">Unterschrift Klient/in</td></tr></table>'
WHERE template_key = 'schweigepflichtentbindung';

-- onlinetherapie: dual signature table
UPDATE document_templates SET html_content = '<p><strong>Zwischen:</strong></p>
<p>{{therapist_name}}<br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>
<p>(nachfolgend „Therapeutin")</p>
<p><strong>und</strong></p>
<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>
<p>(nachfolgend „Klient/in")</p>
<br>
<h2>§ 1 Gegenstand</h2>
<p>[PLATZHALTER: Vereinbarung über die Durchführung der Therapie über eine Online-Plattform (Videotelefonie).]</p>
<br>
<h2>§ 2 Technische Voraussetzungen</h2>
<p>[PLATZHALTER: Stabile Internetverbindung, ruhiger Raum, Kamera und Mikrofon, unterstützte Plattform.]</p>
<br>
<h2>§ 3 Datenschutz und Verschlüsselung</h2>
<p>[PLATZHALTER: Verwendete Plattform, Ende-zu-Ende-Verschlüsselung, keine Aufzeichnung der Sitzungen.]</p>
<br>
<h2>§ 4 Grenzen der Online-Therapie</h2>
<p>[PLATZHALTER: Hinweis auf Situationen, in denen Präsenztherapie empfohlen wird (akute Krisen, Suizidalität).]</p>
<br>
<h2>§ 5 Haftung</h2>
<p>[PLATZHALTER: Haftungsausschluss bei technischen Störungen.]</p>
<br>
<p><strong>Datum:</strong> {{date}}</p>
<br><br>
<table cellpadding="4" width="100%"><tr><td width="50%" align="center" style="border-top: 1px solid #334155">Ort, Datum</td><td width="50%" align="center" style="border-top: 1px solid #334155">Unterschrift Klient/in</td></tr></table>'
WHERE template_key = 'onlinetherapie';

-- video_einverstaendnis: dual signature table
UPDATE document_templates SET html_content = '<p><strong>Klient/in:</strong> {{client_name}}</p>
<p><strong>Datum:</strong> {{date}}</p>
<br>
<h2>§ 1 Gegenstand</h2>
<p>Die therapeutischen Sitzungen werden per Videokonferenz über eine verschlüsselte Plattform durchgeführt. Hiermit erkläre ich mein Einverständnis zur Nutzung dieses Formats.</p>
<br>
<h2>§ 2 Technische Voraussetzungen</h2>
<p>Ich stelle sicher, dass ich über eine stabile Internetverbindung, ein geeignetes Endgerät mit Kamera und Mikrofon sowie einen ruhigen, ungestörten Raum verfüge.</p>
<br>
<h2>§ 3 Datenschutz und Vertraulichkeit</h2>
<p>Ich bin darauf hingewiesen worden, dass bei der Nutzung digitaler Kommunikationsmittel trotz Verschlüsselung ein Restrisiko bezüglich der Datensicherheit besteht. Ich akzeptiere dieses Risiko.</p>
<br>
<h2>§ 4 Aufzeichnungsverbot</h2>
<p>Jegliche Aufzeichnung (Bild, Ton, Screenshot) der Sitzung ist ohne ausdrückliche schriftliche Zustimmung beider Parteien untersagt.</p>
<br><br>
<table cellpadding="4" width="100%"><tr><td width="50%" align="center" style="border-top: 1px solid #334155">Ort, Datum</td><td width="50%" align="center" style="border-top: 1px solid #334155">Unterschrift Klient/in</td></tr></table>'
WHERE template_key = 'video_einverstaendnis';

-- datenschutz_digital: dual signature table
UPDATE document_templates SET html_content = '<p><strong>Klient/in:</strong> {{client_name}}</p>
<p><strong>Datum:</strong> {{date}}</p>
<br>
<h2>§ 1 Hinweis auf Datenschutzrisiken</h2>
<p>Im Rahmen unserer Zusammenarbeit kann Kommunikation über digitale Kanäle stattfinden (E-Mail, Videokonferenz, Messenger). Ich wurde darüber aufgeklärt, dass diese Kommunikationsformen trotz Verschlüsselung mit folgenden Risiken verbunden sein können:</p>
<br>
<ul>
<li>Unbefugter Zugriff auf Kommunikationsinhalte durch Dritte</li>
<li>Datenverlust oder technische Störungen</li>
<li>Serverstandorte außerhalb der EU</li>
<li>Metadatenerhebung durch Plattformanbieter</li>
</ul>
<br>
<h2>§ 2 Verantwortlichkeit</h2>
<p>Die Therapeutin trifft geeignete Maßnahmen zum Schutz der Kommunikation (z.B. Ende-zu-Ende-Verschlüsselung, sichere Plattformen). Ein vollständiger Schutz kann jedoch technisch nicht garantiert werden.</p>
<br>
<h2>§ 3 Einverständnis</h2>
<p>Ich habe die oben genannten Risiken zur Kenntnis genommen und bin mit der Nutzung digitaler Kommunikationskanäle im Rahmen der therapeutischen Zusammenarbeit einverstanden.</p>
<br><br>
<table cellpadding="4" width="100%"><tr><td width="50%" align="center" style="border-top: 1px solid #334155">Ort, Datum</td><td width="50%" align="center" style="border-top: 1px solid #334155">Unterschrift Klient/in</td></tr></table>'
WHERE template_key = 'datenschutz_digital';

-- email_einwilligung: dual signature table
UPDATE document_templates SET html_content = '<p><strong>Klient/in:</strong> {{client_name}}</p>
<p><strong>Datum:</strong> {{date}}</p>
<br>
<h2>Einwilligung zur E-Mail-Kommunikation</h2>
<p>Hiermit erkläre ich mein Einverständnis, dass {{therapist_name}} mich im Rahmen der therapeutischen Zusammenarbeit per E-Mail kontaktieren darf.</p>
<br>
<p>Dies umfasst insbesondere:</p>
<ul>
<li>Terminbestätigungen und -erinnerungen</li>
<li>Versand von Dokumenten und Rechnungen</li>
<li>Organisatorische Absprachen</li>
</ul>
<br>
<p><strong>Hinweis:</strong> E-Mail-Kommunikation ist nicht vollständig vor dem Zugriff Dritter geschützt. Therapeutische Inhalte werden nach Möglichkeit nicht per E-Mail übermittelt. Für vertrauliche Kommunikation stehen sichere Alternativen zur Verfügung.</p>
<br>
<p>Diese Einwilligung kann jederzeit widerrufen werden.</p>
<br><br>
<table cellpadding="4" width="100%"><tr><td width="50%" align="center" style="border-top: 1px solid #334155">Ort, Datum</td><td width="50%" align="center" style="border-top: 1px solid #334155">Unterschrift Klient/in</td></tr></table>'
WHERE template_key = 'email_einwilligung';

-- rechnung: use <th> for header row instead of <td><strong>
UPDATE document_templates SET html_content = '<p><strong>{{therapist_name}}</strong><br>{{therapist_street}}<br>{{therapist_zip}} {{therapist_city}}</p>
<p>Steuernummer: {{therapist_tax_id}}</p>
<br>
<p><strong>Rechnungsempfänger:</strong></p>
<p>{{client_name}}<br>{{client_street}}<br>{{client_zip}} {{client_city}}</p>
<p><strong>Rechnungsnummer:</strong> {{invoice_number}}</p>
<p><strong>Rechnungsdatum:</strong> {{date}}</p>
<br>
<h2>Leistungsübersicht</h2>
<br>
<table border="1" cellpadding="6">
<tr>
<th width="50%">Leistung</th>
<th width="20%">Datum</th>
<th width="15%">Dauer</th>
<th width="15%" align="right">Betrag</th>
</tr>
<tr>
<td>{{therapy_label}}</td>
<td>{{session_date}} {{session_time}}</td>
<td>{{duration_minutes}} Min.</td>
<td align="right">{{amount}}</td>
</tr>
<tr>
<td colspan="3" align="right"><strong>Gesamtbetrag:</strong></td>
<td align="right"><strong>{{amount}}</strong></td>
</tr>
</table>
<br>
<p><strong>Hinweis:</strong> Gemäß § 4 Nr. 14 UStG ist die Leistung umsatzsteuerbefreit (Heilbehandlung im Bereich der Humanmedizin).</p>
<br>
<p>Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.</p>
<br><br>
<p>Mit freundlichen Grüßen</p>
<p>{{therapist_name}}</p>'
WHERE template_key = 'rechnung';

-- datenschutzinfo: no signature, no changes needed (just ensure clean HTML)
-- Already has no underscores, keeping as-is
