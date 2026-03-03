<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title */

$pdf->writeHTML('<h1 style="color: #2dd4bf; font-size: 16pt;">' . htmlspecialchars($title) . '</h1>');
$pdf->Ln(2);

$pdf->writeHTML('<table cellpadding="8"><tr>
  <td style="background-color: #f0fdfa; border-left: 3px solid #2dd4bf;">
    <strong>Zwischen:</strong> ' . htmlspecialchars($therapistName) . ' (nachfolgend &bdquo;Therapeutin&ldquo;)<br/>
    <strong>und:</strong> ' . htmlspecialchars($clientName) . ' (nachfolgend &bdquo;Klient/in&ldquo;)<br/>
    <strong>Datum:</strong> ' . htmlspecialchars($date) . '
  </td>
</tr></table>');
$pdf->Ln(4);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 1 Gegenstand des Vertrages</h2>');
$pdf->writeHTML('<p>[PLATZHALTER: Hier wird der Gegenstand des Vertrages für das Erstgespräch beschrieben.]</p>');
$pdf->Ln(2);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 2 Leistungen</h2>');
$pdf->writeHTML('<p>[PLATZHALTER: Beschreibung des Erstgesprächs, Dauer, Ablauf.]</p>');
$pdf->Ln(2);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 3 Vergütung</h2>');
$pdf->writeHTML('<p>[PLATZHALTER: Honorar, Zahlungsbedingungen, Absageregelungen.]</p>');
$pdf->Ln(2);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 4 Schweigepflicht</h2>');
$pdf->writeHTML('<p>[PLATZHALTER: Hinweis auf die gesetzliche Schweigepflicht.]</p>');

renderSignatureBlock($pdf);
