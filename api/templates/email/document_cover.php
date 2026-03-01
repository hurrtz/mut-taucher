<?php /** @var string $clientName @var string $documentName @var string $therapistName @var string $siteUrl */ ?>
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2dd4bf;"><?= htmlspecialchars($documentName) ?></h2>
  <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
  <p>anbei erhalten Sie das Dokument <strong><?= htmlspecialchars($documentName) ?></strong> als PDF.</p>
  <p>Bitte lesen Sie es sorgfältig durch. Bei Fragen stehe ich Ihnen gerne zur Verfügung.</p>
  <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="font-size: 12px; color: #94a3b8;"><?= htmlspecialchars($siteUrl) ?></p>
</body>
</html>
