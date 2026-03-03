<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title */

$pdf->writeHTML('<h1 style="color: #2dd4bf; font-size: 16pt;">' . htmlspecialchars($title) . '</h1>');
$pdf->Ln(2);

$pdf->writeHTML('<p>Ich, <strong>' . htmlspecialchars($clientName) . '</strong>, entbinde hiermit</p>');
$pdf->writeHTML('<p><strong>' . htmlspecialchars($therapistName) . '</strong></p>');
$pdf->writeHTML('<p>von der Schweigepflicht gegenüber folgenden Personen/Institutionen:</p>');
$pdf->Ln(2);

$pdf->writeHTML('<table cellpadding="8"><tr>
  <td style="background-color: #f0fdfa; border-left: 3px solid #2dd4bf;">
    [PLATZHALTER: Hier können spezifische Personen oder Institutionen benannt werden, z.B. Hausarzt, Psychiater, Krankenkasse.]
  </td>
</tr></table>');
$pdf->Ln(4);

$pdf->writeHTML('<p>Diese Entbindung bezieht sich auf:</p>');
$pdf->writeHTML('<table cellpadding="8"><tr>
  <td style="background-color: #f0fdfa; border-left: 3px solid #2dd4bf;">
    [PLATZHALTER: Art der Informationen, die weitergegeben werden dürfen.]
  </td>
</tr></table>');
$pdf->Ln(4);

$pdf->writeHTML('<p>Diese Erklärung kann jederzeit widerrufen werden.</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');

renderSignatureBlock($pdf, false);
