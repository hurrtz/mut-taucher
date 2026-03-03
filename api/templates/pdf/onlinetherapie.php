<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName @var string $title */

$pdf->writeHTML('<h1 style="color: #2dd4bf; font-size: 16pt;">' . htmlspecialchars($title) . '</h1>');
$pdf->Ln(2);

$pdf->writeHTML('<table cellpadding="8"><tr>
  <td style="background-color: #f0fdfa; border-left: 3px solid #2dd4bf;">
    <strong>Zwischen:</strong> ' . htmlspecialchars($therapistName) . ' (nachfolgend &bdquo;Therapeutin&ldquo;)<br/>
    <strong>und:</strong> ' . htmlspecialchars($clientName) . ' (nachfolgend &bdquo;Klient/in&ldquo;)
  </td>
</tr></table>');
$pdf->Ln(4);

$sections = [
    '§ 1 Gegenstand' => '[PLATZHALTER: Vereinbarung über die Durchführung der Therapie über eine Online-Plattform (Videotelefonie).]',
    '§ 2 Technische Voraussetzungen' => '[PLATZHALTER: Stabile Internetverbindung, ruhiger Raum, Kamera und Mikrofon, unterstützte Plattform.]',
    '§ 3 Datenschutz und Verschlüsselung' => '[PLATZHALTER: Verwendete Plattform, Ende-zu-Ende-Verschlüsselung, keine Aufzeichnung der Sitzungen.]',
    '§ 4 Grenzen der Online-Therapie' => '[PLATZHALTER: Hinweis auf Situationen, in denen Präsenztherapie empfohlen wird (akute Krisen, Suizidalität).]',
    '§ 5 Haftung' => '[PLATZHALTER: Haftungsausschluss bei technischen Störungen.]',
];

foreach ($sections as $heading => $content) {
    $pdf->writeHTML('<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;">' . htmlspecialchars($heading) . '</h2>');
    $pdf->writeHTML('<p>' . $content . '</p>');
    $pdf->Ln(1);
}

$pdf->Ln(2);
$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');

renderSignatureBlock($pdf);
