<?php /** @var string $clientName @var string $invoiceNumber @var string|null $bookingNumber @var string $amountFormatted @var string $therapistName @var string $siteUrl @var string $dateFormatted @var string $sessionDate @var string $paymentNote */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="<?= STYLE_H2 ?>">Rechnung <?= htmlspecialchars($invoiceNumber) ?></h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>anbei erhalten Sie Ihre Rechnung <strong><?= htmlspecialchars($invoiceNumber) ?></strong> über <strong><?= htmlspecialchars($amountFormatted) ?></strong> für Ihre Sitzung am <?= htmlspecialchars($sessionDate) ?>.</p>
<?php if (!empty($bookingNumber)): ?>
      <p>Die Rechnung bezieht sich auf Ihre Buchung <strong><?= htmlspecialchars($bookingNumber) ?></strong>.</p>
<?php endif; ?>
      <p><strong>Rechnungsdatum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
      <p><?= htmlspecialchars($paymentNote) ?></p>
      <p>Bei Fragen stehe ich Ihnen gerne zur Verfügung.</p>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
