<?php /** @var string $clientName @var string $invoiceNumber @var string $amountFormatted @var string $therapistName @var string $siteUrl @var string $dateFormatted */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="color: #2dd4bf; margin-top: 0;">Rechnung <?= htmlspecialchars($invoiceNumber) ?></h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>anbei erhalten Sie Ihre Rechnung <strong><?= htmlspecialchars($invoiceNumber) ?></strong> über <strong><?= htmlspecialchars($amountFormatted) ?></strong> für Ihre Sitzung am <?= htmlspecialchars($dateFormatted) ?>.</p>
      <p>Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.</p>
      <p>Bei Fragen stehe ich Ihnen gerne zur Verfügung.</p>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
