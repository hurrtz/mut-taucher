<?php /** @var string $clientName @var string $invoiceNumber @var string $amountFormatted @var string $therapistName @var string $siteUrl @var string $dateFormatted */ ?>
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2dd4bf;">Rechnung <?= htmlspecialchars($invoiceNumber) ?></h2>
  <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
  <p>anbei erhalten Sie Ihre Rechnung <strong><?= htmlspecialchars($invoiceNumber) ?></strong> über <strong><?= htmlspecialchars($amountFormatted) ?></strong> für Ihre Sitzung am <?= htmlspecialchars($dateFormatted) ?>.</p>
  <p>Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.</p>
  <p>Bei Fragen stehe ich Ihnen gerne zur Verfügung.</p>
  <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="font-size: 12px; color: #94a3b8;"><?= htmlspecialchars($siteUrl) ?></p>
</body>
</html>
