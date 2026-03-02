<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title */

$pdf->writeHTML('<h1>' . htmlspecialchars($title) . '</h1>');
$pdf->writeHTML('<p><strong>Klient/in:</strong> ' . htmlspecialchars($clientName) . '</p>');
$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 1 Gegenstand', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Die therapeutischen Sitzungen werden per Videokonferenz über eine verschlüsselte Plattform durchgeführt. Hiermit erkläre ich mein Einverständnis zur Nutzung dieses Formats.</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 2 Technische Voraussetzungen', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Ich stelle sicher, dass ich über eine stabile Internetverbindung, ein geeignetes Endgerät mit Kamera und Mikrofon sowie einen ruhigen, ungestörten Raum verfüge.</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 3 Datenschutz und Vertraulichkeit', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Ich bin darauf hingewiesen worden, dass bei der Nutzung digitaler Kommunikationsmittel trotz Verschlüsselung ein Restrisiko bezüglich der Datensicherheit besteht. Ich akzeptiere dieses Risiko.</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 4 Aufzeichnungsverbot', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Jegliche Aufzeichnung (Bild, Ton, Screenshot) der Sitzung ist ohne ausdrückliche schriftliche Zustimmung beider Parteien untersagt.</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________</p>');
$pdf->writeHTML('<p>Ort, Datum&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift Klient/in</p>');
