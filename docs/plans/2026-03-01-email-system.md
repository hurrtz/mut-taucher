# Email System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace PHP `mail()` with PHPMailer SMTP, add contact form endpoint, auto booking confirmation, PDF document generation with TCPDF, and admin-triggered document emails.

**Architecture:** PHPMailer wraps SMTP delivery, TCPDF generates PDFs on-the-fly. New `Mailer` helper class used by all email-sending code. Contact form gets a public API endpoint. Document emails triggered from admin panel with sent-status tracking in DB.

**Tech Stack:** PHP 8+, PHPMailer, TCPDF, MySQL, React/TypeScript frontend

---

### Task 1: Initialize Composer and install dependencies

**Files:**
- Create: `api/composer.json`

**Step 1: Initialize Composer in the api/ directory**

Run from project root:
```bash
cd api && composer init --name=mut-taucher/api --type=project --no-interaction
```

**Step 2: Install PHPMailer and TCPDF**

```bash
cd api && composer require phpmailer/phpmailer tecnickcom/tcpdf
```

**Step 3: Add Composer autoload to the API entry point**

Add as the very first `require` in `api/index.php`, before any other requires:

```php
require_once __DIR__ . '/vendor/autoload.php';
```

**Step 4: Add `api/vendor/` to `.gitignore`**

Append to `.gitignore`:
```
api/vendor/
```

**Step 5: Verify PHP still works**

```bash
cd api && php -l index.php
```

Expected: `No syntax errors detected`

**Step 6: Commit**

```bash
git add api/composer.json api/composer.lock api/index.php .gitignore
git commit -m "feat: add Composer with PHPMailer and TCPDF dependencies"
```

---

### Task 2: Add SMTP config to config.php

**Files:**
- Modify: `api/config.php`
- Modify: `api/config.example.php` (if exists, otherwise create)

**Step 1: Add SMTP settings to `api/config.php`**

Add these keys after the existing `'site_url'` entry:

```php
    // SMTP
    'smtp_host'       => '',
    'smtp_port'       => 587,
    'smtp_user'       => '',
    'smtp_pass'       => '',
    'smtp_from_email' => 'praxis@mut-taucher.de',
    'smtp_from_name'  => 'Mut-Taucher Praxis',
```

**Step 2: Update `api/config.example.php` with the same keys** (empty values)

Read the existing file first. Add the same SMTP block with empty/example values.

**Step 3: Commit**

```bash
git add api/config.php api/config.example.php
git commit -m "feat: add SMTP configuration to config.php"
```

---

### Task 3: Create Mailer helper class

**Files:**
- Create: `api/lib/Mailer.php`

**Step 1: Write `api/lib/Mailer.php`**

```php
<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Mailer {
    private array $config;

    public function __construct() {
        $this->config = require __DIR__ . '/../config.php';
    }

    /**
     * Send an email via SMTP.
     *
     * @param string $to        Recipient email
     * @param string $toName    Recipient name
     * @param string $subject   Email subject
     * @param string $htmlBody  HTML body
     * @param string $textBody  Plain text fallback
     * @param array  $attachments  Array of ['path' => string, 'name' => string]
     * @return void
     * @throws Exception
     */
    public function send(
        string $to,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody = '',
        array $attachments = []
    ): void {
        $mail = new PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = $this->config['smtp_host'];
        $mail->Port       = $this->config['smtp_port'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $this->config['smtp_user'];
        $mail->Password   = $this->config['smtp_pass'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(
            $this->config['smtp_from_email'],
            $this->config['smtp_from_name']
        );
        $mail->addAddress($to, $toName);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = $textBody ?: strip_tags($htmlBody);

        foreach ($attachments as $att) {
            if (isset($att['string'])) {
                $mail->addStringAttachment($att['string'], $att['name'], 'base64', 'application/pdf');
            } else {
                $mail->addAttachment($att['path'], $att['name']);
            }
        }

        $mail->send();
    }

    /**
     * Send an email with a PDF attachment generated from a string (no temp file).
     */
    public function sendWithPdf(
        string $to,
        string $toName,
        string $subject,
        string $htmlBody,
        string $pdfContent,
        string $pdfFilename
    ): void {
        $this->send($to, $toName, $subject, $htmlBody, '', [
            ['string' => $pdfContent, 'name' => $pdfFilename],
        ]);
    }
}
```

**Step 2: Commit**

```bash
git add api/lib/Mailer.php
git commit -m "feat: add Mailer helper class wrapping PHPMailer SMTP"
```

---

### Task 4: Create email templates

**Files:**
- Create: `api/templates/email/contact_copy.php`
- Create: `api/templates/email/booking_confirmation.php`
- Create: `api/templates/email/document_cover.php`

**Step 1: Write `api/templates/email/contact_copy.php`**

This template receives `$name`, `$email`, `$phone`, `$message`, `$therapistName`, `$siteUrl`.

```php
<?php /** @var string $name @var string $email @var string $phone @var string $message @var string $therapistName @var string $siteUrl */ ?>
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2dd4bf;">Kopie Ihrer Nachricht</h2>
  <p>Hallo <?= htmlspecialchars($name) ?>,</p>
  <p>vielen Dank für Ihre Nachricht. Hier ist eine Kopie für Ihre Unterlagen:</p>
  <div style="background: #f8fafc; border-left: 4px solid #2dd4bf; padding: 16px; margin: 16px 0;">
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
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="font-size: 12px; color: #94a3b8;"><?= htmlspecialchars($siteUrl) ?></p>
</body>
</html>
```

**Step 2: Write `api/templates/email/booking_confirmation.php`**

Receives `$clientName`, `$dateFormatted`, `$time`, `$duration`, `$therapistName`, `$siteUrl`.

```php
<?php /** @var string $clientName @var string $dateFormatted @var string $time @var int $duration @var string $therapistName @var string $siteUrl */ ?>
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2dd4bf;">Terminbestätigung</h2>
  <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
  <p>vielen Dank für Ihre Buchung. Ihr Termin wurde bestätigt:</p>
  <div style="background: #f8fafc; border-left: 4px solid #2dd4bf; padding: 16px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Datum:</strong> <?= htmlspecialchars($dateFormatted) ?></p>
    <p style="margin: 4px 0;"><strong>Uhrzeit:</strong> <?= htmlspecialchars($time) ?> Uhr</p>
    <p style="margin: 4px 0;"><strong>Dauer:</strong> <?= $duration ?> Minuten</p>
  </div>
  <p>Wir freuen uns auf Sie!</p>
  <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="font-size: 12px; color: #94a3b8;"><?= htmlspecialchars($siteUrl) ?></p>
</body>
</html>
```

**Step 3: Write `api/templates/email/document_cover.php`**

Receives `$clientName`, `$documentName`, `$therapistName`, `$siteUrl`.

```php
<?php /** @var string $clientName @var string $documentName @var string $therapistName @var string $siteUrl */ ?>
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2dd4bf;"><?= htmlspecialchars($documentName) ?></h2>
  <p>Hallo <?= htmlspecialchars($clientName) ?>,</p>
  <p>anbei erhalten Sie das Dokument <strong><?= htmlspecialchars($documentName) ?></strong> als PDF.</p>
  <p>Bitte lesen Sie es sorgfältig durch. Bei Fragen stehe ich Ihnen gerne zur Verfügung.</p>
  <p>Mit freundlichen Grüßen<br><strong><?= htmlspecialchars($therapistName) ?></strong></p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="font-size: 12px; color: #94a3b8;"><?= htmlspecialchars($siteUrl) ?></p>
</body>
</html>
```

**Step 4: Commit**

```bash
git add api/templates/
git commit -m "feat: add HTML email templates (contact copy, booking confirmation, document cover)"
```

---

### Task 5: Create PDF document templates

**Files:**
- Create: `api/templates/pdf/behandlungsvertrag.php`
- Create: `api/templates/pdf/datenschutzinfo.php`
- Create: `api/templates/pdf/schweigepflichtentbindung.php`
- Create: `api/templates/pdf/onlinetherapie.php`
- Create: `api/lib/PdfGenerator.php`

**Step 1: Write `api/lib/PdfGenerator.php`**

A helper that creates a TCPDF instance with Mut-Taucher header styling and provides a method per document type.

```php
<?php

require_once __DIR__ . '/../vendor/autoload.php';

class PdfGenerator {
    private string $therapistName;

    public function __construct() {
        $config = require __DIR__ . '/../config.php';
        $this->therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    }

    private function createPdf(string $title): TCPDF {
        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8');
        $pdf->SetCreator('Mut-Taucher');
        $pdf->SetAuthor($this->therapistName);
        $pdf->SetTitle($title);

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(true);
        $pdf->setFooterData(['0', '0', '0'], ['200', '200', '200']);

        $pdf->SetFont('helvetica', '', 11);
        $pdf->SetMargins(25, 25, 25);
        $pdf->SetAutoPageBreak(true, 25);
        $pdf->AddPage();

        // Header
        $pdf->SetFont('helvetica', 'B', 18);
        $pdf->SetTextColor(45, 212, 191); // primary teal
        $pdf->Cell(0, 12, $title, 0, 1, 'L');
        $pdf->SetTextColor(51, 65, 85); // text color
        $pdf->SetFont('helvetica', '', 11);
        $pdf->Ln(4);

        return $pdf;
    }

    /**
     * Generate a PDF and return its content as a string.
     */
    public function generate(string $type, string $clientName, string $date): string {
        $templateFile = __DIR__ . '/../templates/pdf/' . $type . '.php';
        if (!file_exists($templateFile)) {
            throw new RuntimeException("PDF template not found: $type");
        }

        $titles = [
            'behandlungsvertrag'      => 'Behandlungsvertrag',
            'datenschutzinfo'         => 'Datenschutzinformation nach Art. 13 DSGVO',
            'schweigepflichtentbindung' => 'Schweigepflichtentbindung',
            'onlinetherapie'          => 'Vereinbarung über Online-Therapie',
        ];

        $title = $titles[$type] ?? $type;
        $pdf = $this->createPdf($title);

        // Include template — it writes content onto $pdf
        $therapistName = $this->therapistName;
        include $templateFile;

        return $pdf->Output('', 'S');
    }
}
```

**Step 2: Write `api/templates/pdf/behandlungsvertrag.php`**

This file is included by PdfGenerator. It has access to `$pdf` (TCPDF), `$clientName`, `$date`, `$therapistName`.

```php
<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName */

$pdf->writeHTML('<p><strong>Zwischen:</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($therapistName) . ' (nachfolgend „Therapeutin")</p>');
$pdf->writeHTML('<p><strong>und</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($clientName) . ' (nachfolgend „Klient/in")</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 1 Gegenstand des Vertrages', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>[PLATZHALTER: Hier wird der Gegenstand des Behandlungsvertrages beschrieben. Bitte durch die tatsächlichen Vertragsbedingungen ersetzen.]</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 2 Leistungen', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>[PLATZHALTER: Beschreibung der therapeutischen Leistungen, Sitzungsdauer, Häufigkeit.]</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 3 Vergütung', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>[PLATZHALTER: Honorar, Zahlungsbedingungen, Absageregelungen.]</p>');
$pdf->Ln(4);

$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 8, '§ 4 Schweigepflicht', 0, 1);
$pdf->SetFont('helvetica', '', 11);
$pdf->writeHTML('<p>[PLATZHALTER: Hinweis auf die gesetzliche Schweigepflicht.]</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________</p>');
$pdf->writeHTML('<p>Ort, Datum&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift Klient/in</p>');
```

**Step 3: Write `api/templates/pdf/datenschutzinfo.php`**

```php
<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName */

$pdf->writeHTML('<p>Sehr geehrte/r ' . htmlspecialchars($clientName) . ',</p>');
$pdf->Ln(2);
$pdf->writeHTML('<p>gemäß Art. 13 der Datenschutz-Grundverordnung (DSGVO) informiere ich Sie über die Verarbeitung Ihrer personenbezogenen Daten:</p>');
$pdf->Ln(4);

$sections = [
    '1. Verantwortliche Stelle' => '[PLATZHALTER: Name, Adresse, Kontaktdaten der Therapeutin.]',
    '2. Zweck der Datenverarbeitung' => '[PLATZHALTER: Durchführung der psychotherapeutischen Behandlung, Abrechnung, gesetzliche Aufbewahrungspflichten.]',
    '3. Rechtsgrundlage' => '[PLATZHALTER: Art. 6 Abs. 1 lit. b DSGVO (Vertrag), Art. 9 Abs. 2 lit. h DSGVO (Gesundheitsdaten).]',
    '4. Empfänger der Daten' => '[PLATZHALTER: Grundsätzlich keine Weitergabe ohne Einwilligung, Ausnahmen bei gesetzlicher Pflicht.]',
    '5. Speicherdauer' => '[PLATZHALTER: 10 Jahre nach Abschluss der Behandlung gemäß § 630f BGB.]',
    '6. Ihre Rechte' => '[PLATZHALTER: Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Beschwerde bei Aufsichtsbehörde.]',
];

foreach ($sections as $heading => $content) {
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 8, $heading, 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    $pdf->writeHTML('<p>' . $content . '</p>');
    $pdf->Ln(2);
}

$pdf->Ln(4);
$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
```

**Step 4: Write `api/templates/pdf/schweigepflichtentbindung.php`**

```php
<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName */

$pdf->writeHTML('<p>Ich, <strong>' . htmlspecialchars($clientName) . '</strong>, entbinde hiermit</p>');
$pdf->writeHTML('<p><strong>' . htmlspecialchars($therapistName) . '</strong></p>');
$pdf->writeHTML('<p>von der Schweigepflicht gegenüber folgenden Personen/Institutionen:</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p>[PLATZHALTER: Hier können spezifische Personen oder Institutionen benannt werden, z.B. Hausarzt, Psychiater, Krankenkasse.]</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p>Diese Entbindung bezieht sich auf:</p>');
$pdf->writeHTML('<p>[PLATZHALTER: Art der Informationen, die weitergegeben werden dürfen.]</p>');
$pdf->Ln(4);

$pdf->writeHTML('<p>Diese Erklärung kann jederzeit widerrufen werden.</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________</p>');
$pdf->writeHTML('<p>Unterschrift Klient/in</p>');
```

**Step 5: Write `api/templates/pdf/onlinetherapie.php`**

```php
<?php
/** @var TCPDF $pdf @var string $clientName @var string $date @var string $therapistName */

$pdf->writeHTML('<p><strong>Zwischen:</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($therapistName) . ' (nachfolgend „Therapeutin")</p>');
$pdf->writeHTML('<p><strong>und</strong></p>');
$pdf->writeHTML('<p>' . htmlspecialchars($clientName) . ' (nachfolgend „Klient/in")</p>');
$pdf->Ln(4);

$sections = [
    '§ 1 Gegenstand' => '[PLATZHALTER: Vereinbarung über die Durchführung der Therapie über eine Online-Plattform (Videotelefonie).]',
    '§ 2 Technische Voraussetzungen' => '[PLATZHALTER: Stabile Internetverbindung, ruhiger Raum, Kamera und Mikrofon, unterstützte Plattform.]',
    '§ 3 Datenschutz und Verschlüsselung' => '[PLATZHALTER: Verwendete Plattform, Ende-zu-Ende-Verschlüsselung, keine Aufzeichnung der Sitzungen.]',
    '§ 4 Grenzen der Online-Therapie' => '[PLATZHALTER: Hinweis auf Situationen, in denen Präsenztherapie empfohlen wird (akute Krisen, Suizidalität).]',
    '§ 5 Haftung' => '[PLATZHALTER: Haftungsausschluss bei technischen Störungen.]',
];

foreach ($sections as $heading => $content) {
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 8, $heading, 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    $pdf->writeHTML('<p>' . $content . '</p>');
    $pdf->Ln(2);
}

$pdf->Ln(4);
$pdf->writeHTML('<p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>');
$pdf->Ln(8);

$pdf->writeHTML('<p>_________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________</p>');
$pdf->writeHTML('<p>Ort, Datum&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift Klient/in</p>');
```

**Step 6: Commit**

```bash
git add api/lib/PdfGenerator.php api/templates/pdf/
git commit -m "feat: add TCPDF generator and 4 legal document templates (placeholder text)"
```

---

### Task 6: Database migration for document tracking

**Files:**
- Create: `api/migrations/003_document_tracking.sql`

**Step 1: Write the migration**

```sql
-- Add document-sent tracking columns to bookings
ALTER TABLE bookings ADD COLUMN contract_sent TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN dsgvo_sent TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN confidentiality_sent TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN online_therapy_sent TINYINT(1) NOT NULL DEFAULT 0;
```

**Step 2: Run migration**

```bash
php api/migrate.php
```

Expected: `Running 003_document_tracking.sql ... OK`

**Step 3: Commit**

```bash
git add api/migrations/003_document_tracking.sql
git commit -m "feat: add document-sent tracking columns to bookings table"
```

---

### Task 7: Create contact form endpoint

**Files:**
- Modify: `api/index.php`
- Modify: `api/routes/public.php`

**Step 1: Add route to `api/index.php`**

Add after the `POST /bookings` route block (after line 46):

```php
if ($method === 'POST' && $uri === '/contact') {
    handleContact();
    exit;
}
```

**Step 2: Add `handleContact()` to `api/routes/public.php`**

Add at the end of the file:

```php
/**
 * POST /api/contact
 * Body: { name, email, phone?, message, sendCopy? }
 */
function handleContact(): void {
    $config = require __DIR__ . '/../config.php';
    require_once __DIR__ . '/../lib/Mailer.php';

    $input = json_decode(file_get_contents('php://input'), true);

    $name    = trim($input['name'] ?? '');
    $email   = trim($input['email'] ?? '');
    $phone   = trim($input['phone'] ?? '');
    $message = trim($input['message'] ?? '');
    $sendCopy = !empty($input['sendCopy']);

    if (!$name || !$email || !$message) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, E-Mail und Nachricht sind erforderlich']);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige E-Mail-Adresse']);
        return;
    }

    $mailer = new Mailer();
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $therapistEmail = $config['therapist_email'] ?? '';
    $siteUrl = $config['site_url'] ?? '';

    // Send to therapist
    $therapistSubject = "Neue Kontaktanfrage von $name";
    $therapistBody = "Name: $name\nE-Mail: $email\n"
        . ($phone ? "Telefon: $phone\n" : '')
        . "\nNachricht:\n$message";

    try {
        $mailer->send(
            $therapistEmail,
            $therapistName,
            $therapistSubject,
            nl2br(htmlspecialchars($therapistBody)),
            $therapistBody
        );
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Nachricht konnte nicht gesendet werden']);
        return;
    }

    // Send copy to user if requested
    if ($sendCopy) {
        ob_start();
        include __DIR__ . '/../templates/email/contact_copy.php';
        $htmlBody = ob_get_clean();

        try {
            $mailer->send($email, $name, 'Kopie Ihrer Nachricht an ' . $therapistName, $htmlBody);
        } catch (Exception $e) {
            // Don't fail the request if the copy fails — the main message was sent
        }
    }

    echo json_encode(['message' => 'Nachricht gesendet']);
}
```

**Step 3: Commit**

```bash
git add api/index.php api/routes/public.php
git commit -m "feat: add POST /contact endpoint with SMTP delivery and optional copy"
```

---

### Task 8: Add automatic booking confirmation email

**Files:**
- Modify: `api/routes/public.php` (the `handleCreateBooking` function)

**Step 1: Add email sending after successful booking insert**

In `handleCreateBooking()`, after the `$bookingId = $db->lastInsertId();` line and before the `echo json_encode(...)` response, add:

```php
        // Send booking confirmation email
        try {
            require_once __DIR__ . '/../lib/Mailer.php';
            $config = require __DIR__ . '/../config.php';
            $mailer = new Mailer();

            $clientName = $name;
            $dateFormatted = date('d.m.Y', strtotime($date));
            $duration = $durationMinutes;
            $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
            $siteUrl = $config['site_url'] ?? '';

            ob_start();
            include __DIR__ . '/../templates/email/booking_confirmation.php';
            $htmlBody = ob_get_clean();

            $mailer->send(
                $email,
                $name,
                'Terminbestätigung — ' . ($config['therapist_name'] ?? 'Mut-Taucher'),
                $htmlBody
            );
        } catch (Exception $e) {
            // Don't fail the booking if email fails
        }
```

**Step 2: Commit**

```bash
git add api/routes/public.php
git commit -m "feat: send automatic booking confirmation email on new bookings"
```

---

### Task 9: Refactor existing admin email to use Mailer + add document endpoint

**Files:**
- Modify: `api/routes/admin.php` (refactor `handleSendEmail`)
- Modify: `api/index.php` (add document route)

**Step 1: Refactor `handleSendEmail` in `api/routes/admin.php`**

Replace the entire `handleSendEmail` function (lines 362-429) with:

```php
function handleSendEmail(int $bookingId): void {
    requireAuth();
    require_once __DIR__ . '/../lib/Mailer.php';
    $config = require __DIR__ . '/../config.php';
    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? '';

    if (!in_array($type, ['intro', 'reminder'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Typ muss "intro" oder "reminder" sein']);
        return;
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        http_response_code(404);
        echo json_encode(['error' => 'Buchung nicht gefunden']);
        return;
    }

    $clientName = $booking['client_name'];
    $dateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
    $time = $booking['booking_time'];
    $duration = (int)$booking['duration_minutes'];
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';

    ob_start();
    include __DIR__ . '/../templates/email/booking_confirmation.php';
    $htmlBody = ob_get_clean();

    if ($type === 'intro') {
        $subject = 'Ihr Termin bei ' . $therapistName;
    } else {
        $subject = 'Erinnerung: Ihr Termin am ' . $dateFormatted;
    }

    try {
        $mailer = new Mailer();
        $mailer->send($booking['client_email'], $clientName, $subject, $htmlBody);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'E-Mail konnte nicht gesendet werden']);
        return;
    }

    $flagField = $type === 'intro' ? 'intro_email_sent' : 'reminder_sent';
    $db->prepare("UPDATE bookings SET $flagField = 1 WHERE id = ?")->execute([$bookingId]);

    echo json_encode(['message' => 'E-Mail gesendet']);
}
```

**Step 2: Add `handleSendDocument` function to `api/routes/admin.php`**

Add at the end of the file:

```php
/**
 * POST /api/admin/bookings/:id/document
 * Body: { type: "contract" | "dsgvo" | "confidentiality" | "online_therapy" }
 */
function handleSendDocument(int $bookingId): void {
    requireAuth();
    require_once __DIR__ . '/../lib/Mailer.php';
    require_once __DIR__ . '/../lib/PdfGenerator.php';
    $config = require __DIR__ . '/../config.php';
    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? '';

    $typeMap = [
        'contract'        => ['template' => 'behandlungsvertrag',       'name' => 'Behandlungsvertrag',                      'column' => 'contract_sent'],
        'dsgvo'           => ['template' => 'datenschutzinfo',          'name' => 'Datenschutzinformation nach Art. 13 DSGVO', 'column' => 'dsgvo_sent'],
        'confidentiality' => ['template' => 'schweigepflichtentbindung', 'name' => 'Schweigepflichtentbindung',               'column' => 'confidentiality_sent'],
        'online_therapy'  => ['template' => 'onlinetherapie',           'name' => 'Vereinbarung über Online-Therapie',        'column' => 'online_therapy_sent'],
    ];

    if (!isset($typeMap[$type])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiger Dokumenttyp']);
        return;
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        http_response_code(404);
        echo json_encode(['error' => 'Buchung nicht gefunden']);
        return;
    }

    $docInfo = $typeMap[$type];
    $clientName = $booking['client_name'];
    $dateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';

    // Generate PDF
    $pdfGen = new PdfGenerator();
    $pdfContent = $pdfGen->generate($docInfo['template'], $clientName, $dateFormatted);

    // Render cover email
    $documentName = $docInfo['name'];
    ob_start();
    include __DIR__ . '/../templates/email/document_cover.php';
    $htmlBody = ob_get_clean();

    // Send
    try {
        $mailer = new Mailer();
        $pdfFilename = str_replace(' ', '_', $docInfo['name']) . '.pdf';
        $mailer->sendWithPdf(
            $booking['client_email'],
            $clientName,
            $docInfo['name'] . ' — ' . $therapistName,
            $htmlBody,
            $pdfContent,
            $pdfFilename
        );
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Dokument konnte nicht gesendet werden: ' . $e->getMessage()]);
        return;
    }

    // Mark as sent
    $db->prepare("UPDATE bookings SET {$docInfo['column']} = 1 WHERE id = ?")->execute([$bookingId]);

    echo json_encode(['message' => $docInfo['name'] . ' gesendet']);
}
```

**Step 3: Add route to `api/index.php`**

Add after the existing `POST /admin/bookings/:id/email` route (after line 115):

```php
if ($method === 'POST' && preg_match('#^/admin/bookings/(\d+)/document$#', $uri, $m)) {
    handleSendDocument((int)$m[1]);
    exit;
}
```

**Step 4: Commit**

```bash
git add api/routes/admin.php api/index.php
git commit -m "feat: refactor admin emails to SMTP, add document sending endpoint with PDF generation"
```

---

### Task 10: Update admin booking response to include document flags

**Files:**
- Modify: `api/routes/admin.php` (the `handleGetBookings` function, around line 300)

**Step 1: Add document flags to the booking response**

In the `$result = array_map(...)` inside `handleGetBookings`, add these 4 lines after `'reminderSent'`:

```php
        'contractSent'        => (bool)$b['contract_sent'],
        'dsgvoSent'           => (bool)$b['dsgvo_sent'],
        'confidentialitySent' => (bool)$b['confidentiality_sent'],
        'onlineTherapySent'   => (bool)$b['online_therapy_sent'],
```

**Step 2: Commit**

```bash
git add api/routes/admin.php
git commit -m "feat: include document-sent flags in admin bookings API response"
```

---

### Task 11: Update frontend types and admin hook

**Files:**
- Modify: `src/lib/useAdminBooking.ts`

**Step 1: Update `AdminBooking` interface**

Add after `reminderSent: boolean;` (line 18):

```typescript
  contractSent: boolean;
  dsgvoSent: boolean;
  confidentialitySent: boolean;
  onlineTherapySent: boolean;
```

**Step 2: Add `sendDocument` function**

Add after the `sendEmail` callback (after line 286):

```typescript
  const sendDocument = useCallback(async (bookingId: number, type: 'contract' | 'dsgvo' | 'confidentiality' | 'online_therapy') => {
    setError(null);
    try {
      await apiFetch(`/admin/bookings/${bookingId}/document`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      const flagMap: Record<string, keyof AdminBooking> = {
        contract: 'contractSent',
        dsgvo: 'dsgvoSent',
        confidentiality: 'confidentialitySent',
        online_therapy: 'onlineTherapySent',
      };
      const flag = flagMap[type];
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, [flag]: true } : b
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Dokumentversand');
    }
  }, []);
```

**Step 3: Add `sendDocument` to the return object**

In the return statement (around line 288), add `sendDocument` after `sendEmail`:

```typescript
    sendEmail,
    sendDocument,
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: May fail because Admin.tsx doesn't use `sendDocument` yet — that's fine, we'll fix in the next task.

**Step 5: Commit**

```bash
git add src/lib/useAdminBooking.ts
git commit -m "feat: add document-sent flags and sendDocument to admin booking hook"
```

---

### Task 12: Add document buttons to Admin UI

**Files:**
- Modify: `src/pages/Admin.tsx`

**Step 1: Update the `BookingList` component props**

Change the `BookingList` function signature (around line 622) to add `onSendDocument`:

```typescript
function BookingList({ bookings, onUpdate, onSendEmail, onSendDocument }: {
  bookings: AdminBooking[];
  onUpdate: (id: number, updates: Partial<AdminBooking>) => void;
  onSendEmail: (id: number, type: 'intro' | 'reminder') => void;
  onSendDocument: (id: number, type: 'contract' | 'dsgvo' | 'confidentiality' | 'online_therapy') => void;
}) {
```

**Step 2: Add document buttons inside the booking card**

After the existing cancel button (the `<X>` button, around line 691), but still inside the `{b.status === 'confirmed' && (<>...</>)}` block, add a document section. Place it after the `</div>` that closes the `flex items-center gap-1` div (line 694), and before the closing `</div>` of the card:

```tsx
          {b.status === 'confirmed' && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
              {([
                ['contract', 'Vertrag', b.contractSent],
                ['dsgvo', 'DSGVO', b.dsgvoSent],
                ['confidentiality', 'Schweigepflicht', b.confidentialitySent],
                ['online_therapy', 'Online-Vereinbarung', b.onlineTherapySent],
              ] as const).map(([type, label, sent]) => (
                <button
                  key={type}
                  onClick={() => onSendDocument(b.id, type)}
                  disabled={sent}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                    sent
                      ? 'border-green-200 text-green-600 bg-green-50 cursor-default'
                      : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                  }`}
                  title={sent ? `${label} gesendet` : `${label} senden`}
                >
                  {sent ? <MailCheck size={12} /> : <Mail size={12} />}
                  {label}
                </button>
              ))}
            </div>
          )}
```

**Step 3: Update where `BookingList` is called**

Find where `<BookingList` is rendered (search for `onSendEmail={sendEmail}`). Add the `onSendDocument` prop. First, destructure `sendDocument` from the hook. In the main Admin component (around line 940), add `sendDocument` to the destructuring:

```typescript
    fetchBookings, updateBooking, sendEmail, sendDocument,
```

Then where `BookingList` is rendered, add:

```tsx
onSendDocument={sendDocument}
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: Clean build.

**Step 5: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: add document send buttons to admin booking UI"
```

---

### Task 13: Final verification

**Step 1: Build check**

```bash
npm run build
```

Expected: Clean build, zero errors.

**Step 2: Lint check**

```bash
npm run lint
```

Expected: No new warnings.

**Step 3: PHP syntax check**

```bash
find api -name '*.php' -not -path '*/vendor/*' -exec php -l {} \;
```

Expected: No syntax errors.

**Step 4: Verify migration status**

```bash
php api/migrate.php --status
```

Expected: All migrations show `✓ applied`.

**Step 5: Final commit if needed**

```bash
git add -A && git commit -m "chore: lint fixes for email system"
```
