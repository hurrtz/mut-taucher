<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title */

$pdf->writeHTML('<h1 style="color: #2dd4bf; font-size: 16pt;">' . htmlspecialchars($title) . '</h1>');
$pdf->Ln(2);

$pdf->writeHTML('<table cellpadding="8"><tr>
  <td style="background-color: #f0fdfa; border-left: 3px solid #2dd4bf;">
    <strong>Klient/in:</strong> ' . htmlspecialchars($clientName) . '<br/>
    <strong>Datum:</strong> ' . htmlspecialchars($date) . '
  </td>
</tr></table>');
$pdf->Ln(4);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 1 Gegenstand</h2>');
$pdf->writeHTML('<p>Die therapeutischen Sitzungen werden per Videokonferenz über eine verschlüsselte Plattform durchgeführt. Hiermit erkläre ich mein Einverständnis zur Nutzung dieses Formats.</p>');
$pdf->Ln(2);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 2 Technische Voraussetzungen</h2>');
$pdf->writeHTML('<p>Ich stelle sicher, dass ich über eine stabile Internetverbindung, ein geeignetes Endgerät mit Kamera und Mikrofon sowie einen ruhigen, ungestörten Raum verfüge.</p>');
$pdf->Ln(2);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 3 Datenschutz und Vertraulichkeit</h2>');
$pdf->writeHTML('<p>Ich bin darauf hingewiesen worden, dass bei der Nutzung digitaler Kommunikationsmittel trotz Verschlüsselung ein Restrisiko bezüglich der Datensicherheit besteht. Ich akzeptiere dieses Risiko.</p>');
$pdf->Ln(2);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 4 Aufzeichnungsverbot</h2>');
$pdf->writeHTML('<p>Jegliche Aufzeichnung (Bild, Ton, Screenshot) der Sitzung ist ohne ausdrückliche schriftliche Zustimmung beider Parteien untersagt.</p>');

renderSignatureBlock($pdf);
