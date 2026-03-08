<?php /** @var string $clientName @var string $dateFormatted @var string $timeFormatted @var string $therapistName @var string $siteUrl @var string $label */ ?>
<?php include __DIR__ . '/_header.php'; ?>
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
<?php include __DIR__ . '/_footer.php'; ?>
