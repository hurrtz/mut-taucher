<?php /** @var string $clientName @var string $dateFormatted @var string $time @var string $therapistName @var string $siteUrl @var string $bookingNumber */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="<?= STYLE_H2 ?>">Zahlungserinnerung</h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>für Ihr Erstgespräch liegt aktuell noch kein Zahlungseingang vor.</p>
      <div style="<?= STYLE_ALERT_WARNING ?>">
        <p style="<?= STYLE_P_FIRST ?>"><strong>Buchungsnummer:</strong> <?= htmlspecialchars($bookingNumber) ?></p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Uhrzeit:</strong> <?= htmlspecialchars($time) ?> Uhr</p>
      </div>
      <p>Bitte überweisen Sie den offenen Betrag vor dem Termin. Die ursprüngliche Zahlungsaufforderung erhalten Sie mit dieser E-Mail erneut im Anhang.</p>
      <div style="<?= STYLE_ALERT_ERROR ?>">
        <p style="<?= STYLE_WARNING_TEXT ?>">
          <strong>Wichtig:</strong> Der Termin kann erst nach Zahlungseingang stattfinden. Wenn bis dahin kein Zahlungseingang vorliegt, muss der Termin storniert werden.
        </p>
      </div>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
