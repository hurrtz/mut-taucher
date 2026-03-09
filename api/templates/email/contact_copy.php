<?php /** @var string $name @var string $email @var string $phone @var string $message @var string $therapistName @var string $siteUrl */ ?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="<?= STYLE_H2 ?>">Kopie Ihrer Nachricht</h2>
      <p>Hallo <?= htmlspecialchars($name) ?>,</p>
      <p>vielen Dank für Ihre Nachricht. Hier ist eine Kopie für Ihre Unterlagen:</p>
      <div style="<?= STYLE_ALERT_INFO ?>">
        <p style="<?= STYLE_P_FIRST ?>"><strong>Name:</strong> <?= htmlspecialchars($name) ?></p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>E-Mail:</strong> <?= htmlspecialchars($email) ?></p>
        <?php if ($phone): ?>
          <p style="<?= STYLE_P_NEXT ?>"><strong>Telefon:</strong> <?= htmlspecialchars($phone) ?></p>
        <?php endif; ?>
        <p style="margin: 8px 0 0;"><strong>Nachricht:</strong></p>
        <p style="<?= STYLE_P_NEXT ?> white-space: pre-wrap;"><?= htmlspecialchars($message) ?></p>
      </div>
      <p>Wir melden uns zeitnah bei Ihnen.</p>
      <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
<?php include __DIR__ . '/_footer.php'; ?>
