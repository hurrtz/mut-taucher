<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title */

$pdf->writeHTML('<h1 style="color: #2dd4bf; font-size: 16pt;">' . htmlspecialchars($title) . '</h1>');
$pdf->Ln(2);

$pdf->writeHTML('<p>Sehr geehrte/r ' . htmlspecialchars($clientName) . ',</p>');
$pdf->writeHTML('<p>gemäß Art. 13 der Datenschutz-Grundverordnung (DSGVO) informiere ich Sie über die Verarbeitung Ihrer personenbezogenen Daten:</p>');
$pdf->Ln(2);

$sections = [
    '1. Verantwortliche Stelle' => '[PLATZHALTER: Name, Adresse, Kontaktdaten der Therapeutin.]',
    '2. Zweck der Datenverarbeitung' => '[PLATZHALTER: Durchführung der psychotherapeutischen Behandlung, Abrechnung, gesetzliche Aufbewahrungspflichten.]',
    '3. Rechtsgrundlage' => '[PLATZHALTER: Art. 6 Abs. 1 lit. b DSGVO (Vertrag), Art. 9 Abs. 2 lit. h DSGVO (Gesundheitsdaten).]',
    '4. Empfänger der Daten' => '[PLATZHALTER: Grundsätzlich keine Weitergabe ohne Einwilligung, Ausnahmen bei gesetzlicher Pflicht.]',
    '5. Speicherdauer' => '[PLATZHALTER: 10 Jahre nach Abschluss der Behandlung gemäß § 630f BGB.]',
    '6. Ihre Rechte' => '[PLATZHALTER: Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Beschwerde bei Aufsichtsbehörde.]',
];

foreach ($sections as $heading => $content) {
    $pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">' . htmlspecialchars($heading) . '</h2>');
    $pdf->writeHTML('<p>' . $content . '</p>');
    $pdf->Ln(1);
}

$pdf->Ln(4);
$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
