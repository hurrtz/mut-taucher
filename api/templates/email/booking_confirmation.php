<?php /** @var string $clientName @var string $dateFormatted @var string $time @var int $duration @var string $therapistName @var string $siteUrl */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="color: #2dd4bf; margin-top: 0;">Terminbestätigung</h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>vielen Dank für Ihre Buchung. Ihr Termin wurde bestätigt:</p>
      <div style="background: #f0fdfa; border-left: 4px solid #2dd4bf; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
        <p style="margin: 4px 0;"><strong>Uhrzeit:</strong> <?= htmlspecialchars($time) ?> Uhr</p>
        <p style="margin: 4px 0;"><strong>Dauer:</strong> <?= $duration ?> Minuten</p>
      </div>
      <p>Wir freuen uns auf Sie!</p>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
