<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Mailer {
    private array $config;

    public function __construct() {
        $this->config = require __DIR__ . '/../config.php';
    }

    private const MAX_RETRIES = 1;
    private const RETRY_DELAY_MS = 500;

    /**
     * Send an email — uses Brevo HTTP API if configured, otherwise SMTP.
     * Retries once on transient failures (network errors, 5xx responses).
     */
    public function send(
        string $to,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody = '',
        array $attachments = []
    ): void {
        $lastException = null;

        for ($attempt = 0; $attempt <= self::MAX_RETRIES; $attempt++) {
            try {
                if (!empty($this->config['brevo_api_key'])) {
                    $this->sendViaBrevo($to, $toName, $subject, $htmlBody, $textBody, $attachments);
                } else {
                    $this->sendViaSmtp($to, $toName, $subject, $htmlBody, $textBody, $attachments);
                }
                return; // Success
            } catch (\Exception $e) {
                $lastException = $e;
                error_log("Mailer: attempt " . ($attempt + 1) . " failed for '$to': " . $e->getMessage());

                // Only retry on transient errors (network/5xx), not client errors (4xx)
                if ($attempt < self::MAX_RETRIES && $this->isTransientError($e)) {
                    usleep(self::RETRY_DELAY_MS * 1000);
                    continue;
                }
                break;
            }
        }

        throw $lastException;
    }

    /**
     * Determine if an exception represents a transient/retryable error.
     */
    private function isTransientError(\Exception $e): bool {
        $msg = $e->getMessage();
        // Brevo 5xx or curl/network errors are transient
        if (preg_match('/Brevo API error \(5\d{2}\)/', $msg)) {
            return true;
        }
        if (str_contains($msg, 'Brevo API error:') && !str_contains($msg, 'Brevo API error (')) {
            return true; // curl error (no HTTP code)
        }
        // SMTP connection failures are transient
        if (str_contains($msg, 'SMTP connect') || str_contains($msg, 'Connection timed out')) {
            return true;
        }
        return false;
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

    /**
     * Resolve the logo file path for embedding/attaching.
     */
    private function getLogoFile(): ?string {
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
        return (file_exists($logoFile)) ? $logoFile : null;
    }

    /**
     * Send via Brevo HTTP API (works when SMTP ports are blocked).
     */
    private function sendViaBrevo(
        string $to,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody,
        array $attachments
    ): void {
        // Embed logo as base64 inline image
        $logoFile = $this->getLogoFile();
        if ($logoFile) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($logoFile);
            $logoBase64 = base64_encode(file_get_contents($logoFile));
            $htmlBody = str_replace('cid:logo', "data:{$mime};base64,{$logoBase64}", $htmlBody);
        }

        $payload = [
            'sender' => [
                'name' => $this->config['smtp_from_name'],
                'email' => $this->config['smtp_from_email'],
            ],
            'to' => [
                ['email' => $to, 'name' => $toName],
            ],
            'subject' => $subject,
            'htmlContent' => $htmlBody,
        ];

        if ($textBody) {
            $payload['textContent'] = $textBody;
        }

        if (!empty($attachments)) {
            $payload['attachment'] = [];
            foreach ($attachments as $att) {
                if (isset($att['string'])) {
                    $payload['attachment'][] = [
                        'content' => base64_encode($att['string']),
                        'name' => $att['name'],
                    ];
                } else {
                    $payload['attachment'][] = [
                        'content' => base64_encode(file_get_contents($att['path'])),
                        'name' => $att['name'],
                    ];
                }
            }
        }

        $ch = curl_init('https://api.brevo.com/v3/smtp/email');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'accept: application/json',
                'content-type: application/json',
                'api-key: ' . $this->config['brevo_api_key'],
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new Exception('Brevo API error: ' . $curlError);
        }

        if ($httpCode >= 400) {
            $body = json_decode($response, true);
            $msg = $body['message'] ?? $response;
            throw new Exception('Brevo API error (' . $httpCode . '): ' . $msg);
        }
    }

    /**
     * Send via SMTP (PHPMailer) — used for local dev with Mailpit.
     */
    private function sendViaSmtp(
        string $to,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody,
        array $attachments
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

        $logoFile = $this->getLogoFile();
        if ($logoFile) {
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
}
