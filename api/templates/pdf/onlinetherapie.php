<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName */

$pdf->writeHTML('<p><strong>Zwischen:</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($therapistName) . ' (nachfolgend „Therapeutin")</p>');
$pdf->writeHTML('<p><strong>und</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($clientName) . ' (nachfolgend „Klient/in")</p>');
$pdf->Ln(4);

$sections = [
    '§ 1 Gegenstand' => '[PLATZHALTER: Vereinbarung über die Durchführung der Therapie über eine Online-Plattform (Videotelefonie).]',
    '§ 2 Technische Voraussetzungen' => '[PLATZHALTER: Stabile Internetverbindung, ruhiger Raum, Kamera und Mikrofon, unterstützte Plattform.]',
    '§ 3 Datenschutz und Verschlüsselung' => '[PLATZHALTER: Verwendete Plattform, Ende-zu-Ende-Verschlüsselung, keine Aufzeichnung der Sitzungen.]',
    '§ 4 Grenzen der Online-Therapie' => '[PLATZHALTER: Hinweis auf Situationen, in denen Präsenztherapie empfohlen wird (akute Krisen, Suizidalität).]',
    '§ 5 Haftung' => '[PLATZHALTER: Haftungsausschluss bei technischen Störungen.]',
];

foreach ($sections as $heading => $content) {
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 8, $heading, 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    $pdf->writeHTML('<p>' . $content . '</p>');
    $pdf->Ln(2);
}

$pdf->Ln(4);
$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________</p>');
$pdf->writeHTML('<p>Ort, Datum&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift Klient/in</p>');
