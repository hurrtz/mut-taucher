<?php /** @var string $clientName @var string $dateFormatted @var string $time @var int $duration @var string $therapistName @var string $siteUrl */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="<?= STYLE_H2 ?>">Terminbestätigung</h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>vielen Dank für Ihre Buchung. Ihr Termin wurde bestätigt:</p>
      <div style="<?= STYLE_ALERT_INFO ?>">
        <p style="<?= STYLE_P_FIRST ?>"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Uhrzeit:</strong> <?= htmlspecialchars($time) ?> Uhr</p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Dauer:</strong> <?= $duration ?> Minuten</p>
      </div>
      <p>Wir freuen uns auf Sie!</p>
      <div style="<?= STYLE_ALERT_WARNING ?>">
        <p style="<?= STYLE_WARNING_TEXT ?>">
          <strong>Bitte beachten Sie:</strong> Termine können bis 48 Stunden (zwei Tage) vorher kostenfrei abgesagt werden. Bei kurzfristiger Absage oder Nichterscheinen wird das Honorar als Ausfallhonorar berechnet.
        </p>
      </div>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
