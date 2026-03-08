<?php /** @var string $clientName @var string $documentName @var string $therapistName @var string $siteUrl */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="color: #2dd4bf; margin-top: 0;"><?= htmlspecialchars($documentName) ?></h2>
      <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
      <p>anbei erhalten Sie das Dokument <strong><?= htmlspecialchars($documentName) ?></strong> als PDF.</p>
      <p>Bitte lesen Sie es sorgfältig durch. Bei Fragen stehe ich Ihnen gerne zur Verfügung.</p>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
