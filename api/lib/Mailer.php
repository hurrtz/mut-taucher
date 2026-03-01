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
