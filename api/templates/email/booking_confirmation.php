<?php /** @var string $clientName @var string $dateFormatted @var string $time @var int $duration @var string $therapistName @var string $siteUrl */ ?>
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2dd4bf;">Terminbestätigung</h2>
  <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
  <p>vielen Dank für Ihre Buchung. Ihr Termin wurde bestätigt:</p>
  <div style="background: #f8fafc; border-left: 4px solid #2dd4bf; padding: 16px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
    <p style="margin: 4px 0;"><strong>Uhrzeit:</strong> <?= htmlspecialchars($time) ?> Uhr</p>
    <p style="margin: 4px 0;"><strong>Dauer:</strong> <?= $duration ?> Minuten</p>
  </div>
  <p>Wir freuen uns auf Sie!</p>
  <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="font-size: 12px; color: #94a3b8;"><?= htmlspecialchars($siteUrl) ?></p>
</body>
</html>
