<?php /** @var string $clientName @var string $documentName @var string $therapistName @var string $siteUrl */ ?>
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Branded header -->
    <div style="background-color: #2dd4bf; padding: 20px; text-align: center;">
      <img src="cid:logo" width="40" height="40" style="vertical-align: middle;" alt="Mut Taucher">
      <span style="color: #ffffff; font-size: 22px; font-weight: bold; margin-left: 8px; vertical-align: middle;">Mut Taucher</span>
    </div>

    <!-- Body -->
    <div style="padding: 24px 32px;">
      <h2 style="color: #2dd4bf; margin-top: 0;"><?= htmlspecialchars($documentName) ?></h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>anbei erhalten Sie das Dokument <strong><?= htmlspecialchars($documentName) ?></strong> als PDF.</p>
      <p>Bitte lesen Sie es sorgfältig durch. Bei Fragen stehe ich Ihnen gerne zur Verfügung.</p>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;"><?= htmlspecialchars($therapistName) ?> &middot; <?= htmlspecialchars($siteUrl) ?></p>
    </div>
  </div>
</body>
</html>
