<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var array $extra */

$invoiceNumber = $extra['invoiceNumber'] ?? '';
$amountFormatted = $extra['amountFormatted'] ?? '0,00 €';
$durationMinutes = $extra['durationMinutes'] ?? 60;
$therapyLabel = $extra['therapyLabel'] ?? 'Einzeltherapie';
$sessionDate = $extra['sessionDate'] ?? $date;
$sessionTime = $extra['sessionTime'] ?? '';

$pdf->writeHTML('<p><strong>Rechnungsempfänger:</strong> ' . htmlspecialchars($clientName) . '</p>');
$pdf->writeHTML('<p><strong>Rechnungsnummer:</strong> ' . htmlspecialchars($invoiceNumber) . '</p>');
$pdf->writeHTML('<p><strong>Rechnungsdatum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(6);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, 'Leistungsübersicht', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->Ln(2);

// Table
$html = '<table border="1" cellpadding="6" style="border-collapse: collapse;">
    <tr style="background-color: #f1f5f9; font-weight: bold;">
        <td width="50%">Leistung</td>
        <td width="20%">Datum</td>
        <td width="15%">Dauer</td>
        <td width="15%" align="right">Betrag</td>
    </tr>
    <tr>
        <td>' . htmlspecialchars($therapyLabel) . '</td>
        <td>' . htmlspecialchars($sessionDate) . ($sessionTime ? ' ' . htmlspecialchars($sessionTime) : '') . '</td>
        <td>' . $durationMinutes . ' Min.</td>
        <td align="right">' . htmlspecialchars($amountFormatted) . '</td>
    </tr>
    <tr style="font-weight: bold;">
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
