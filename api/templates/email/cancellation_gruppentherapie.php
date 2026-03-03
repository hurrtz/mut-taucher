<?php /** @var string $clientName @var string $dateFormatted @var string $timeFormatted @var string $therapistName @var string $siteUrl @var string $label */ ?>
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #2dd4bf; padding: 20px; text-align: center;">
      <img src="cid:logo" width="40" height="40" style="vertical-align: middle;" alt="Mut Taucher">
      <span style="color: #ffffff; font-size: 22px; font-weight: bold; margin-left: 8px; vertical-align: middle;">Mut Taucher</span>
    </div>
    <div style="padding: 24px 32px;">
      <h2 style="color: #cf1322; margin-top: 0;">Terminabsage — Gruppentherapie</h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>leider müssen wir die Gruppensitzung absagen:</p>
      <div style="background: #fff1f0; border-left: 4px solid #cf1322; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong><?= htmlspecialchars($label) ?></strong></p>
        <p style="margin: 4px 0;"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
        <p style="margin: 4px 0;"><strong>Uhrzeit:</strong> <?= htmlspecialchars($timeFormatted) ?> Uhr</p>
      </div>
      <p>Wir bitten um Ihr Verständnis und melden uns zeitnah mit einem Ersatztermin.</p>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
    </div>
    <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;"><?= htmlspecialchars($therapistName) ?> &middot; <?= htmlspecialchars($siteUrl) ?></p>
    </div>
  </div>
</body>
</html>
