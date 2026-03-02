<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName */

$pdf->writeHTML('<p><strong>Klient/in:</strong> ' . htmlspecialchars($clientName) . '</p>');
$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 1 Hinweis auf Datenschutzrisiken', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Im Rahmen unserer Zusammenarbeit kann Kommunikation über digitale Kanäle stattfinden (E-Mail, Videokonferenz, Messenger). Ich wurde darüber aufgeklärt, dass diese Kommunikationsformen trotz Verschlüsselung mit folgenden Risiken verbunden sein können:</p>');
$pdf->Ln(2);
$pdf->writeHTML('<ul>
    <li>Unbefugter Zugriff auf Kommunikationsinhalte durch Dritte</li>
    <li>Datenverlust oder technische Störungen</li>
    <li>Serverstandorte außerhalb der EU</li>
    <li>Metadatenerhebung durch Plattformanbieter</li>
</ul>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 2 Verantwortlichkeit', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Die Therapeutin trifft geeignete Maßnahmen zum Schutz der Kommunikation (z.B. Ende-zu-Ende-Verschlüsselung, sichere Plattformen). Ein vollständiger Schutz kann jedoch technisch nicht garantiert werden.</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 3 Einverständnis', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Ich habe die oben genannten Risiken zur Kenntnis genommen und bin mit der Nutzung digitaler Kommunikationskanäle im Rahmen der therapeutischen Zusammenarbeit einverstanden.</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________</p>');
$pdf->writeHTML('<p>Ort, Datum&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift Klient/in</p>');
