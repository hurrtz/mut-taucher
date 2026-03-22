<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title @var array $extra */

$bookingNumber = $extra['bookingNumber'] ?? '';
$amountFormatted = $extra['amountFormatted'] ?? '0,00 €';
$durationMinutes = $extra['durationMinutes'] ?? 60;
$therapyLabel = $extra['therapyLabel'] ?? 'Erstgespräch';
$sessionDate = $extra['sessionDate'] ?? $date;
$sessionTime = $extra['sessionTime'] ?? '';
$clientStreet = htmlspecialchars($extra['clientStreet'] ?? '');
$clientZip = htmlspecialchars($extra['clientZip'] ?? '');
$clientCity = htmlspecialchars($extra['clientCity'] ?? '');
$paymentNote = htmlspecialchars($extra['paymentNote'] ?? 'Bitte überweisen Sie den Betrag vor dem Termin.');

$config = require __DIR__ . '/../../config.php';
$tName = htmlspecialchars($therapistName);
$tStreet = htmlspecialchars($config['therapist_street'] ?? '');
$tZip = htmlspecialchars($config['therapist_zip'] ?? '');
$tCity = htmlspecialchars($config['therapist_city'] ?? '');
$accountHolder = htmlspecialchars($config['bank_account_holder'] ?? '');
$iban = htmlspecialchars($config['bank_iban'] ?? '');
$bic = htmlspecialchars($config['bank_bic'] ?? '');
$bankName = htmlspecialchars($config['bank_name'] ?? '');

$pdf->writeHTML('<p style="color: #64748b"><span style="font-size: 8pt">' . $tName . ' · ' . $tStreet . ' · ' . $tZip . ' ' . $tCity . '</span></p>');
$pdf->writeHTML('<p><strong>' . htmlspecialchars($clientName) . '</strong><br>'
    . $clientStreet . '<br>' . $clientZip . ' ' . $clientCity . '</p>');
$pdf->Ln(8);

$pdf->writeHTML('<table cellpadding="0" border="0" width="100%"><tr>
<td width="50%"></td>
<td width="50%"><strong>Buchungsnummer:</strong> ' . htmlspecialchars($bookingNumber) . '<br><strong>Datum:</strong> ' . htmlspecialchars($date) . '</td>
</tr></table>');
$pdf->Ln(4);

$pdf->writeHTML('<h2>Zahlungsaufforderung</h2>');
$pdf->writeHTML('<p>Vielen Dank für Ihre Terminbuchung. Bitte überweisen Sie den folgenden Betrag. Der Termin gilt erst nach Zahlungseingang als verbindlich gebucht.</p>');
$pdf->writeHTML('<p>Diese Zahlungsaufforderung stellt noch keine Rechnung dar. Die Rechnung wird nach Zahlungseingang erstellt.</p>');
$pdf->Ln(2);

$pdf->writeHTML('<table cellpadding="8" border="0" width="100%">
<tr>
<th width="35%" bgcolor="#2dd4bf" style="color: #ffffff" align="left">Leistung</th>
<th width="30%" bgcolor="#2dd4bf" style="color: #ffffff" align="left">Datum</th>
<th width="13%" bgcolor="#2dd4bf" style="color: #ffffff" align="left">Dauer</th>
<th width="22%" bgcolor="#2dd4bf" style="color: #ffffff" align="right">Betrag</th>
</tr>
<tr>
<td style="border-bottom: 1px solid #e2e8f0">' . htmlspecialchars($therapyLabel) . '</td>
<td style="border-bottom: 1px solid #e2e8f0">' . htmlspecialchars($sessionDate) . ($sessionTime ? ' ' . htmlspecialchars($sessionTime) : '') . '</td>
<td style="border-bottom: 1px solid #e2e8f0">' . $durationMinutes . ' Min.</td>
<td align="right" style="border-bottom: 1px solid #e2e8f0">' . htmlspecialchars($amountFormatted) . '</td>
</tr>
<tr>
<td colspan="3" align="right"><strong>Gesamtbetrag:</strong></td>
<td align="right" style="border-top: 2px solid #2dd4bf"><strong>' . htmlspecialchars($amountFormatted) . '</strong></td>
</tr>
</table>');
$pdf->Ln(6);

$pdf->writeHTML('<p><strong>Zahlungsdaten</strong></p>');
$pdf->writeHTML('<table cellpadding="3" border="0" width="100%">
<tr><td width="35%"><strong>Empfänger</strong></td><td width="65%">' . $accountHolder . '</td></tr>
<tr><td width="35%"><strong>IBAN</strong></td><td width="65%">' . $iban . '</td></tr>
<tr><td width="35%"><strong>BIC</strong></td><td width="65%">' . $bic . '</td></tr>
<tr><td width="35%"><strong>Bank</strong></td><td width="65%">' . $bankName . '</td></tr>
<tr><td width="35%"><strong>Verwendungszweck</strong></td><td width="65%">' . htmlspecialchars($bookingNumber) . '</td></tr>
</table>');
$pdf->Ln(2);

$pdf->writeHTML('<p>' . $paymentNote . '</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p>Mit freundlichen Grüßen<br><strong>' . $tName . '</strong></p>');
