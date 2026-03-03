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

renderSignatureBlock($pdf);
