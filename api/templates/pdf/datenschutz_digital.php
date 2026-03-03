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

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 1 Hinweis auf Datenschutzrisiken</h2>');
$pdf->writeHTML('<p>Im Rahmen unserer Zusammenarbeit kann Kommunikation über digitale Kanäle stattfinden (E-Mail, Videokonferenz, Messenger). Ich wurde darüber aufgeklärt, dass diese Kommunikationsformen trotz Verschlüsselung mit folgenden Risiken verbunden sein können:</p>');
$pdf->Ln(1);
$pdf->writeHTML('<ul>
    <li>Unbefugter Zugriff auf Kommunikationsinhalte durch Dritte</li>
    <li>Datenverlust oder technische Störungen</li>
    <li>Serverstandorte außerhalb der EU</li>
    <li>Metadatenerhebung durch Plattformanbieter</li>
</ul>');
$pdf->Ln(2);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 2 Verantwortlichkeit</h2>');
$pdf->writeHTML('<p>Die Therapeutin trifft geeignete Maßnahmen zum Schutz der Kommunikation (z.B. Ende-zu-Ende-Verschlüsselung, sichere Plattformen). Ein vollständiger Schutz kann jedoch technisch nicht garantiert werden.</p>');
$pdf->Ln(2);

$pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">&sect; 3 Einverständnis</h2>');
$pdf->writeHTML('<p>Ich habe die oben genannten Risiken zur Kenntnis genommen und bin mit der Nutzung digitaler Kommunikationskanäle im Rahmen der therapeutischen Zusammenarbeit einverstanden.</p>');

renderSignatureBlock($pdf);
