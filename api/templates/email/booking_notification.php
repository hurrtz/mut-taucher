<?php
/**
 * @var string $clientName
 * @var string $clientEmail
 * @var string $clientPhone
 * @var string $dateFormatted
 * @var string $time
 * @var int    $duration
 * @var string $paymentMethodLabel
 * @var string $paymentStatus
 * @var string $bookingStatus
 * @var string $therapistName
 * @var string $siteUrl
 * @var string|null $clientMessage
 * @var string|null $invoiceNumber
 */
?>
<?php include __DIR__ . '/_header.php'; ?>
      <h2 style="color: #2dd4bf; margin-top: 0;">Neue Buchung eingegangen</h2>
      <p>Es wurde ein neuer Termin gebucht:</p>

      <div style="background: #f0fdfa; border-left: 4px solid #2dd4bf; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
        <p style="margin: 4px 0;"><strong>Uhrzeit:</strong> <?= htmlspecialchars($time) ?> Uhr</p>
        <p style="margin: 4px 0;"><strong>Dauer:</strong> <?= $duration ?> Minuten</p>
      </div>

      <h3 style="color: #334155; margin-bottom: 8px;">Klient*in</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 4px 8px; color: #64748b;">Name:</td><td style="padding: 4px 8px;"><?= htmlspecialchars($clientName) ?></td></tr>
        <tr><td style="padding: 4px 8px; color: #64748b;">E-Mail:</td><td style="padding: 4px 8px;"><?= htmlspecialchars($clientEmail) ?></td></tr>
        <tr><td style="padding: 4px 8px; color: #64748b;">Telefon:</td><td style="padding: 4px 8px;"><?= htmlspecialchars($clientPhone) ?></td></tr>
      </table>

<?php if (!empty($clientMessage)): ?>
      <h3 style="color: #334155; margin-bottom: 8px;">Nachricht</h3>
      <div style="background: #f8fafc; border-left: 4px solid #e2e8f0; padding: 12px 16px; margin: 8px 0;">
        <p style="margin: 0; white-space: pre-wrap;"><?= htmlspecialchars($clientMessage) ?></p>
      </div>
<?php endif; ?>

      <h3 style="color: #334155; margin-bottom: 8px;">Zahlung</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 4px 8px; color: #64748b;">Zahlungsmethode:</td><td style="padding: 4px 8px;"><?= htmlspecialchars($paymentMethodLabel) ?></td></tr>
        <tr><td style="padding: 4px 8px; color: #64748b;">Zahlungsstatus:</td><td style="padding: 4px 8px;"><strong><?= htmlspecialchars($paymentStatus) ?></strong></td></tr>
        <tr><td style="padding: 4px 8px; color: #64748b;">Buchungsstatus:</td><td style="padding: 4px 8px;"><strong><?= htmlspecialchars($bookingStatus) ?></strong></td></tr>
<?php if (!empty($invoiceNumber)): ?>
        <tr><td style="padding: 4px 8px; color: #64748b;">Rechnungsnummer:</td><td style="padding: 4px 8px;"><?= htmlspecialchars($invoiceNumber) ?></td></tr>
<?php endif; ?>
      </table>

<?php include __DIR__ . '/_footer.php'; ?>
