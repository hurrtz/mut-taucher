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
     */
    public function send(
        string $to,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody = '',
        array $attachments = []
    ): void {
        if (empty($this->config['smtp_host'])) {
            throw new Exception('SMTP not configured');
        }

        $mail = new PHPMailer(true);

        $mail->isSMTP();
        $mail->Timeout    = 10;
        $mail->Host       = $this->config['smtp_host'];
        $mail->Port       = $this->config['smtp_port'];
        $hasAuth = !empty($this->config['smtp_user']);
        $mail->SMTPAuth   = $hasAuth;
        if ($hasAuth) {
            $mail->Username   = $this->config['smtp_user'];
            $mail->Password   = $this->config['smtp_pass'];
            $mail->SMTPSecure = $this->config['smtp_port'] == 465
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
        } else {
            $mail->SMTPSecure = false;
            $mail->SMTPAutoTLS = false;
        }
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

        // Embed tall logo for branded email header (fall back to default logo)
        $db = getDB();
        $stmt = $db->query('SELECT logo_tall_path, logo_path FROM brand_settings WHERE id = 1');
        $row = $stmt->fetch();
        $logoFile = null;
        if ($row && !empty($row['logo_tall_path'])) {
            $logoFile = __DIR__ . '/../' . $row['logo_tall_path'];
        }
        if (!$logoFile || !file_exists($logoFile)) {
            $logoFile = $row && !empty($row['logo_path']) ? __DIR__ . '/../' . $row['logo_path'] : __DIR__ . '/../assets/logo.png';
        }
        if (file_exists($logoFile)) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($logoFile);
            $mail->addEmbeddedImage($logoFile, 'logo', basename($logoFile), 'base64', $mime);
        }

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
