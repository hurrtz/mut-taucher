<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title @var array $extra */

$pdf->writeHTML('<h1 style="color: #2dd4bf; font-size: 16pt;">' . htmlspecialchars($title) . '</h1>');
$pdf->Ln(2);

$invoiceNumber = $extra['invoiceNumber'] ?? '';
$amountFormatted = $extra['amountFormatted'] ?? '0,00 €';
$durationMinutes = $extra['durationMinutes'] ?? 60;
$therapyLabel = $extra['therapyLabel'] ?? 'Einzeltherapie';
$sessionDate = $extra['sessionDate'] ?? $date;
$sessionTime = $extra['sessionTime'] ?? '';

$pdf->writeHTML('<table cellpadding="8"><tr>
  <td style="background-color: #f0fdfa; border-left: 3px solid #2dd4bf;">
    <strong>Rechnungsempfänger:</strong> ' . htmlspecialchars($clientName) . '<br/>
    <strong>Rechnungsnummer:</strong> ' . htmlspecialchars($invoiceNumber) . '<br/>
    <strong>Rechnungsdatum:</strong> ' . htmlspecialchars($date) . '
  </td>
</tr></table>');
$pdf->Ln(6);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">Leistungsübersicht</h2>');
$pdf->Ln(2);

$html = '<table border="1" cellpadding="6" style="border-collapse: collapse;">
    <tr style="background-color: #2dd4bf; color: #ffffff; font-weight: bold;">
        <td width="50%">Leistung</td>
        <td width="20%">Datum</td>
        <td width="15%">Dauer</td>
        <td width="15%" align="right">Betrag</td>
    </tr>
    <tr style="background-color: #f8fafc;">
        <td>' . htmlspecialchars($therapyLabel) . '</td>
        <td>' . htmlspecialchars($sessionDate) . ($sessionTime ? ' ' . htmlspecialchars($sessionTime) : '') . '</td>
        <td>' . $durationMinutes . ' Min.</td>
        <td align="right">' . htmlspecialchars($amountFormatted) . '</td>
    </tr>
    <tr style="font-weight: bold; background-color: #f0fdfa;">
        <td colspan="3" align="right">Gesamtbetrag:</td>
        <td align="right">' . htmlspecialchars($amountFormatted) . '</td>
    </tr>
</table>';
$pdf->writeHTML($html);
$pdf->Ln(6);

$pdf->writeHTML('<p><strong>Hinweis:</strong> Gemäß § 4 Nr. 14 UStG ist die Leistung umsatzsteuerbefreit (Heilbehandlung im Bereich der Humanmedizin).</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p>Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>Mit freundlichen Grüßen</p>');
$pdf->writeHTML('<p>' . htmlspecialchars($therapistName) . '</p>');
