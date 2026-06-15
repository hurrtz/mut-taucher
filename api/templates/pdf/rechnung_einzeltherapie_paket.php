<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title @var array $extra */

$invoiceNumber = $extra['invoiceNumber'] ?? '';
$totalFormatted = $extra['totalAmount'] ?? ($extra['amountFormatted'] ?? '0,00 €');
$therapyLabel = $extra['therapyLabel'] ?? 'Einzeltherapie';
$sessionCount = (int)($extra['sessionCount'] ?? 0);
$unitPriceFormatted = $extra['unitPriceFormatted'] ?? '';
$clientStreet = htmlspecialchars($extra['clientStreet'] ?? '');
$clientZip = htmlspecialchars($extra['clientZip'] ?? '');
$clientCity = htmlspecialchars($extra['clientCity'] ?? '');
$paymentNote = htmlspecialchars($extra['paymentNote'] ?? 'Bitte überweisen Sie den Gesamtbetrag vor dem ersten Termin.');

$config = require __DIR__ . '/../../config.php';
$tName = htmlspecialchars($therapistName);
$tStreet = htmlspecialchars($config['therapist_street'] ?? '');
$tZip = htmlspecialchars($config['therapist_zip'] ?? '');
$tCity = htmlspecialchars($config['therapist_city'] ?? '');

// Sender line (small, like envelope window)
$pdf->writeHTML('<p style="color: #64748b"><span style="font-size: 8pt">' . $tName . ' · ' . $tStreet . ' · ' . $tZip . ' ' . $tCity . '</span></p>');

// Recipient address
$pdf->writeHTML('<p><strong>' . htmlspecialchars($clientName) . '</strong><br>'
    . $clientStreet . '<br>' . $clientZip . ' ' . $clientCity . '</p>');
$pdf->Ln(8);

// Invoice metadata (right-aligned via table)
$pdf->writeHTML('<table cellpadding="0" border="0" width="100%"><tr>
<td width="50%"></td>
<td width="50%"><strong>Rechnungsnummer:</strong> ' . htmlspecialchars($invoiceNumber) . '<br><strong>Rechnungsdatum:</strong> ' . htmlspecialchars($date) . '</td>
</tr></table>');
$pdf->Ln(4);

// Heading
$pdf->writeHTML('<h2>Rechnung</h2>');

// Service table — a single package line (no per-session dates)
$sessionWord = $sessionCount === 1 ? 'Sitzung' : 'Sitzungen';
$mengeCell = $unitPriceFormatted !== ''
    ? $sessionCount . ' × ' . htmlspecialchars($unitPriceFormatted)
    : $sessionCount . ' ' . $sessionWord;

$rows = '<table cellpadding="8" border="0" width="100%">
<tr>
<th width="52%" bgcolor="#2dd4bf" style="color: #ffffff" align="left">Leistung</th>
<th width="26%" bgcolor="#2dd4bf" style="color: #ffffff" align="left">Menge</th>
<th width="22%" bgcolor="#2dd4bf" style="color: #ffffff" align="right">Betrag</th>
</tr>
<tr>
<td style="border-bottom: 1px solid #e2e8f0"><strong>' . htmlspecialchars($therapyLabel) . '</strong><br><span style="color: #64748b; font-size: 9pt">Therapiepaket (' . $sessionCount . ' ' . $sessionWord . ')</span></td>
<td style="border-bottom: 1px solid #e2e8f0">' . $mengeCell . '</td>
<td align="right" style="border-bottom: 1px solid #e2e8f0">' . htmlspecialchars($totalFormatted) . '</td>
</tr>
<tr>
<td colspan="2" align="right"><strong>Gesamtbetrag:</strong></td>
<td align="right" style="border-top: 2px solid #2dd4bf"><strong>' . htmlspecialchars($totalFormatted) . '</strong></td>
</tr>
</table>';

$pdf->writeHTML($rows);
$pdf->Ln(6);

$pdf->writeHTML('<p style="color: #64748b"><strong>Hinweis:</strong> Gemäß § 4 Nr. 14 UStG ist die Leistung umsatzsteuerbefreit (Heilbehandlung im Bereich der Psychotherapie).</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p>' . $paymentNote . '</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>Mit freundlichen Grüßen</p>');
$pdf->writeHTML('<p><strong>' . $tName . '</strong></p>');
