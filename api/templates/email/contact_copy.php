<?php /** @var string $name @var string $email @var string $phone @var string $message @var string $therapistName @var string $siteUrl */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="color: #2dd4bf; margin-top: 0;">Kopie Ihrer Nachricht</h2>
      <p>Hallo <?= htmlspecialchars($name) ?>,</p>
      <p>vielen Dank für Ihre Nachricht. Hier ist eine Kopie für Ihre Unterlagen:</p>
      <div style="background: #f0fdfa; border-left: 4px solid #2dd4bf; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Name:</strong> <?= htmlspecialchars($name) ?></p>
        <p style="margin: 4px 0;"><strong>E-Mail:</strong> <?= htmlspecialchars($email) ?></p>
        <?php if ($phone): ?>
          <p style="margin: 4px 0;"><strong>Telefon:</strong> <?= htmlspecialchars($phone) ?></p>
        <?php endif; ?>
        <p style="margin: 8px 0 0;"><strong>Nachricht:</strong></p>
        <p style="margin: 4px 0; white-space: pre-wrap;"><?= htmlspecialchars($message) ?></p>
      </div>
      <p>Wir melden uns zeitnah bei Ihnen.</p>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
