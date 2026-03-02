<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title */

$pdf->writeHTML('<h1>' . htmlspecialchars($title) . '</h1>');
$pdf->writeHTML('<p><strong>Zwischen:</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($therapistName) . ' (nachfolgend „Therapeutin")</p>');
$pdf->writeHTML('<p><strong>und</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($clientName) . ' (nachfolgend „Klient/in")</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 1 Gegenstand', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Gegenstand dieses Kurzvertrages ist die Durchführung eines Erstgesprächs (Kennenlerngespräch) im Rahmen der psychotherapeutischen Beratung per Videokonferenz.</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 2 Umfang und Dauer', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Das Erstgespräch umfasst eine Sitzung von 50 Minuten Dauer. Es dient dem gegenseitigen Kennenlernen, der Klärung des Anliegens und der Einschätzung, ob und welche therapeutische Begleitung geeignet ist.</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 3 Honorar', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Das Honorar für das Erstgespräch beträgt <strong>95,00 €</strong>. Die Zahlung erfolgt im Voraus per Überweisung oder PayPal. Eine Rechnung wird nach der Sitzung zugestellt.</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 4 Absageregelung', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Eine kostenfreie Absage ist bis 24 Stunden vor dem vereinbarten Termin möglich. Bei späterer Absage oder Nichterscheinen wird das volle Honorar berechnet.</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 5 Schweigepflicht', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>Die Therapeutin unterliegt der gesetzlichen Schweigepflicht gemäß § 203 StGB. Alle im Erstgespräch besprochenen Inhalte werden vertraulich behandelt.</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________</p>');
$pdf->writeHTML('<p>Ort, Datum&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift Klient/in</p>');
