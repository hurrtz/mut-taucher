<?php /** @var string $clientName @var string $dateFormatted @var string $timeFormatted @var string $therapistName @var string $siteUrl @var string $label */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="<?= STYLE_H2_ERROR ?>">Terminabsage — Gruppentherapie</h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>leider müssen wir die Gruppensitzung absagen:</p>
      <div style="<?= STYLE_ALERT_ERROR ?>">
        <p style="<?= STYLE_P_FIRST ?>"><strong><?= htmlspecialchars($label) ?></strong></p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Uhrzeit:</strong> <?= htmlspecialchars($timeFormatted) ?> Uhr</p>
      </div>
      <p>Wir bitten um Ihr Verständnis und melden uns zeitnah mit einem Ersatztermin.</p>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
