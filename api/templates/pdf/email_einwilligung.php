<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title */

$pdf->writeHTML('<h1>' . htmlspecialchars($title) . '</h1>');
$pdf->writeHTML('<p><strong>Klient/in:</strong> ' . htmlspecialchars($clientName) . '</p>');
$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, 'Einwilligung zur E-Mail-Kommunikation', 0, 1);
$pdf->SetFont('helvetica', '', 11);

$pdf->writeHTML('<p>Hiermit erkläre ich mein Einverständnis, dass ' . htmlspecialchars($therapistName) . ' mich im Rahmen der therapeutischen Zusammenarbeit per E-Mail kontaktieren darf.</p>');
$pdf->Ln(2);

$pdf->writeHTML('<p>Dies umfasst insbesondere:</p>');
$pdf->writeHTML('<ul>
    <li>Terminbestätigungen und -erinnerungen</li>
    <li>Versand von Dokumenten und Rechnungen</li>
    <li>Organisatorische Absprachen</li>
</ul>');
$pdf->Ln(2);

$pdf->writeHTML('<p><strong>Hinweis:</strong> E-Mail-Kommunikation ist nicht vollständig vor dem Zugriff Dritter geschützt. Therapeutische Inhalte werden nach Möglichkeit nicht per E-Mail übermittelt. Für vertrauliche Kommunikation stehen sichere Alternativen zur Verfügung.</p>');
$pdf->Ln(2);

$pdf->writeHTML('<p>Diese Einwilligung kann jederzeit widerrufen werden.</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________</p>');
$pdf->writeHTML('<p>Ort, Datum&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift Klient/in</p>');
