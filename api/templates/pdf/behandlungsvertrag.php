<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName */

$pdf->writeHTML('<p><strong>Zwischen:</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($therapistName) . ' (nachfolgend „Therapeutin")</p>');
$pdf->writeHTML('<p><strong>und</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($clientName) . ' (nachfolgend „Klient/in")</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 1 Gegenstand des Vertrages', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>[PLATZHALTER: Hier wird der Gegenstand des Behandlungsvertrages beschrieben. Bitte durch die tatsächlichen Vertragsbedingungen ersetzen.]</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 2 Leistungen', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>[PLATZHALTER: Beschreibung der therapeutischen Leistungen, Sitzungsdauer, Häufigkeit.]</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 3 Vergütung', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>[PLATZHALTER: Honorar, Zahlungsbedingungen, Absageregelungen.]</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 4 Schweigepflicht', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>[PLATZHALTER: Hinweis auf die gesetzliche Schweigepflicht.]</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________</p>');
$pdf->writeHTML('<p>Ort, Datum&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift Klient/in</p>');
