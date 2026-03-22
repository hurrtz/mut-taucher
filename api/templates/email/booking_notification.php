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
 * @var string $clientStreet
 * @var string $clientZip
 * @var string $clientCity
 * @var bool   $isConfirmed
 * @var string $therapistName
 * @var string $siteUrl
 * @var string|null $clientMessage
 * @var string|null $bookingNumber
 * @var string|null $invoiceNumber
 */
?>
<?php include __DIR__ . '/_header.php'; ?>
<?php if ($isConfirmed): ?>
      <h2 style="<?= STYLE_H2 ?>">Zahlung bestätigt</h2>
      <p>Die Zahlung für folgenden Termin wurde bestätigt:</p>
<?php else: ?>
      <h2 style="<?= STYLE_H2 ?>">Neue Buchung eingegangen</h2>
      <p>Es wurde ein neuer Termin gebucht:</p>
<?php endif; ?>

      <div style="<?= STYLE_ALERT_INFO ?>">
        <p style="<?= STYLE_P_FIRST ?>"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Uhrzeit:</strong> <?= htmlspecialchars($time) ?> Uhr</p>
        <p style="<?= STYLE_P_NEXT ?>"><strong>Dauer:</strong> <?= $duration ?> Minuten</p>
      </div>

      <h3 style="<?= STYLE_H3 ?>">Klient*in</h3>
      <table style="<?= STYLE_TABLE ?>">
        <tr><td style="<?= STYLE_TD_LABEL ?>">Name:</td><td style="<?= STYLE_TD_VALUE ?>"><?= htmlspecialchars($clientName) ?></td></tr>
        <tr><td style="<?= STYLE_TD_LABEL ?>">E-Mail:</td><td style="<?= STYLE_TD_VALUE ?>"><?= htmlspecialchars($clientEmail) ?></td></tr>
        <tr><td style="<?= STYLE_TD_LABEL ?>">Telefon:</td><td style="<?= STYLE_TD_VALUE ?>"><?= htmlspecialchars($clientPhone) ?></td></tr>
        <tr><td style="<?= STYLE_TD_LABEL ?>">Adresse:</td><td style="<?= STYLE_TD_VALUE ?>"><?= htmlspecialchars($clientStreet) ?>, <?= htmlspecialchars($clientZip) ?> <?= htmlspecialchars($clientCity) ?></td></tr>
      </table>

<?php if (!empty($clientMessage)): ?>
      <h3 style="<?= STYLE_H3 ?>">Nachricht</h3>
      <div style="<?= STYLE_ALERT_NEUTRAL ?>">
        <p style="margin: 0; white-space: pre-wrap;"><?= htmlspecialchars($clientMessage) ?></p>
      </div>
<?php endif; ?>

      <h3 style="<?= STYLE_H3 ?>">Zahlung</h3>
      <table style="<?= STYLE_TABLE ?>">
        <tr><td style="<?= STYLE_TD_LABEL ?>">Zahlungsmethode:</td><td style="<?= STYLE_TD_VALUE ?>"><?= htmlspecialchars($paymentMethodLabel) ?></td></tr>
        <tr><td style="<?= STYLE_TD_LABEL ?>">Zahlungsstatus:</td><td style="<?= STYLE_TD_VALUE ?>"><strong><?= htmlspecialchars($paymentStatus) ?></strong></td></tr>
        <tr><td style="<?= STYLE_TD_LABEL ?>">Buchungsstatus:</td><td style="<?= STYLE_TD_VALUE ?>"><strong><?= htmlspecialchars($bookingStatus) ?></strong></td></tr>
<?php if (!empty($bookingNumber)): ?>
        <tr><td style="<?= STYLE_TD_LABEL ?>">Buchungsnummer:</td><td style="<?= STYLE_TD_VALUE ?>"><?= htmlspecialchars($bookingNumber) ?></td></tr>
<?php endif; ?>
<?php if (!empty($invoiceNumber)): ?>
        <tr><td style="<?= STYLE_TD_LABEL ?>">Rechnungsnummer:</td><td style="<?= STYLE_TD_VALUE ?>"><?= htmlspecialchars($invoiceNumber) ?></td></tr>
<?php endif; ?>
      </table>

<?php include __DIR__ . '/_footer.php'; ?>
