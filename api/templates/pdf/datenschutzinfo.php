<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName */

$pdf->writeHTML('<p>Sehr geehrte/r ' . htmlspecialchars($clientName) . ',</p>');
$pdf->Ln(2);
$pdf->writeHTML('<p>gemäß Art. 13 der Datenschutz-Grundverordnung (DSGVO) informiere ich Sie über die Verarbeitung Ihrer personenbezogenen Daten:</p>');
$pdf->Ln(4);

$sections = [
    '1. Verantwortliche Stelle' => '[PLATZHALTER: Name, Adresse, Kontaktdaten der Therapeutin.]',
    '2. Zweck der Datenverarbeitung' => '[PLATZHALTER: Durchführung der psychotherapeutischen Behandlung, Abrechnung, gesetzliche Aufbewahrungspflichten.]',
    '3. Rechtsgrundlage' => '[PLATZHALTER: Art. 6 Abs. 1 lit. b DSGVO (Vertrag), Art. 9 Abs. 2 lit. h DSGVO (Gesundheitsdaten).]',
    '4. Empfänger der Daten' => '[PLATZHALTER: Grundsätzlich keine Weitergabe ohne Einwilligung, Ausnahmen bei gesetzlicher Pflicht.]',
    '5. Speicherdauer' => '[PLATZHALTER: 10 Jahre nach Abschluss der Behandlung gemäß § 630f BGB.]',
    '6. Ihre Rechte' => '[PLATZHALTER: Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Beschwerde bei Aufsichtsbehörde.]',
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
