<?php /** @var string $clientName @var string $dateFormatted @var string $time @var int $duration @var string $therapistName @var string $siteUrl @var string $accountHolder @var string $iban @var string $bic @var string $bankName @var string $amount @var string $reference */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="color: #2dd4bf; margin-top: 0;">Terminreservierung</h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>vielen Dank für Ihre Buchung. Ihr Termin wurde reserviert:</p>
      <div style="background: #f0fdfa; border-left: 4px solid #2dd4bf; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
        <p style="margin: 4px 0;"><strong>Uhrzeit:</strong> <?= htmlspecialchars($time) ?> Uhr</p>
        <p style="margin: 4px 0;"><strong>Dauer:</strong> <?= $duration ?> Minuten</p>
      </div>
      <p>Bitte überweisen Sie den folgenden Betrag, um Ihren Termin zu bestätigen:</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 4px 0; color: #64748b;">Empfänger</td><td style="padding: 4px 0; font-weight: 600;"><?= htmlspecialchars($accountHolder) ?></td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">IBAN</td><td style="padding: 4px 0; font-weight: 600;"><?= htmlspecialchars($iban) ?></td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">BIC</td><td style="padding: 4px 0; font-weight: 600;"><?= htmlspecialchars($bic) ?></td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Bank</td><td style="padding: 4px 0; font-weight: 600;"><?= htmlspecialchars($bankName) ?></td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Betrag</td><td style="padding: 4px 0; font-weight: 600;"><?= htmlspecialchars($amount) ?></td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Verwendungszweck</td><td style="padding: 4px 0; font-weight: 600;"><?= htmlspecialchars($reference) ?></td></tr>
        </table>
      </div>
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          <strong>Bitte beachten Sie:</strong> Termine können bis 48 Stunden (zwei Tage) vorher kostenfrei abgesagt werden. Bei kurzfristiger Absage oder Nichterscheinen wird das Honorar als Ausfallhonorar berechnet.
        </p>
      </div>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
