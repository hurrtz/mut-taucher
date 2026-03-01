<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName */

$pdf->writeHTML('<p>Ich, <strong>' . htmlspecialchars($clientName) . '</strong>, entbinde hiermit</p>');
$pdf->writeHTML('<p><strong>' . htmlspecialchars($therapistName) . '</strong></p>');
$pdf->writeHTML('<p>von der Schweigepflicht gegenüber folgenden Personen/Institutionen:</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p>[PLATZHALTER: Hier können spezifische Personen oder Institutionen benannt werden, z.B. Hausarzt, Psychiater, Krankenkasse.]</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p>Diese Entbindung bezieht sich auf:</p>');
$pdf->writeHTML('<p>[PLATZHALTER: Art der Informationen, die weitergegeben werden dürfen.]</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p>Diese Erklärung kann jederzeit widerrufen werden.</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________</p>');
$pdf->writeHTML('<p>Unterschrift Klient/in</p>');
