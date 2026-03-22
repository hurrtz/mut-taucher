<?php /** @var string $clientName @var string $dateFormatted @var string $time @var int $duration @var string $therapistName @var string $siteUrl @var string $accountHolder @var string $iban @var string $bic @var string $bankName @var string $amount @var string $reference @var string $bookingNumber */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="<?= STYLE_H2 ?>">Buchungsbestätigung</h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>vielen Dank für Ihre Buchung. Ihr Termin wurde reserviert:</p>
      <div style="<?= STYLE_ALERT_INFO ?>">
        <p style="<?= STYLE_P_FIRST ?>"><strong>Buchungsnummer:</strong> <?= htmlspecialchars($bookingNumber) ?></p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Uhrzeit:</strong> <?= htmlspecialchars($time) ?> Uhr</p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Dauer:</strong> <?= $duration ?> Minuten</p>
      </div>
      <p>Im Anhang erhalten Sie Ihre Zahlungsaufforderung. Bitte überweisen Sie den folgenden Betrag, um Ihren Termin verbindlich zu bestätigen:</p>
      <div style="<?= STYLE_BANK_BOX ?>">
        <table style="<?= STYLE_BANK_TABLE ?>">
          <tr><td style="<?= STYLE_BANK_LABEL ?>">Empfänger</td><td style="<?= STYLE_BANK_VALUE ?>"><?= htmlspecialchars($accountHolder) ?></td></tr>
          <tr><td style="<?= STYLE_BANK_LABEL ?>">IBAN</td><td style="<?= STYLE_BANK_VALUE ?>"><?= htmlspecialchars($iban) ?></td></tr>
          <tr><td style="<?= STYLE_BANK_LABEL ?>">BIC</td><td style="<?= STYLE_BANK_VALUE ?>"><?= htmlspecialchars($bic) ?></td></tr>
          <tr><td style="<?= STYLE_BANK_LABEL ?>">Bank</td><td style="<?= STYLE_BANK_VALUE ?>"><?= htmlspecialchars($bankName) ?></td></tr>
          <tr><td style="<?= STYLE_BANK_LABEL ?>">Betrag</td><td style="<?= STYLE_BANK_VALUE ?>"><?= htmlspecialchars($amount) ?></td></tr>
          <tr><td style="<?= STYLE_BANK_LABEL ?>">Verwendungszweck</td><td style="<?= STYLE_BANK_VALUE ?>"><?= htmlspecialchars($reference) ?></td></tr>
        </table>
      </div>
      <div style="<?= STYLE_ALERT_WARNING ?>">
        <p style="<?= STYLE_WARNING_TEXT ?>">
          <strong>Bitte beachten Sie:</strong> Termine können bis 48 Stunden (zwei Tage) vorher kostenfrei abgesagt werden. Bei kurzfristiger Absage oder Nichterscheinen wird das Honorar als Ausfallhonorar berechnet.
        </p>
      </div>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
