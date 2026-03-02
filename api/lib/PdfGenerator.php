<?php

require_once __DIR__ . '/../vendor/autoload.php';

class PdfGenerator {
    private string $therapistName;
    private string $therapistStreet;
    private string $therapistZip;
    private string $therapistCity;
    private string $therapistTaxId;

    public function __construct() {
        $config = require __DIR__ . '/../config.php';
        $this->therapistName   = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
        $this->therapistStreet = $config['therapist_street'] ?? '';
        $this->therapistZip    = $config['therapist_zip'] ?? '';
        $this->therapistCity   = $config['therapist_city'] ?? '';
        $this->therapistTaxId  = $config['therapist_tax_id'] ?? '';
    }

    /**
     * Load template HTML from database.
     * Returns html_content or null if not found.
     */
    private function loadFromDatabase(string $type): ?string {
        try {
            require_once __DIR__ . '/../db.php';
            $db = getDB();
            $stmt = $db->prepare('SELECT html_content FROM document_templates WHERE template_key = ?');
            $stmt->execute([$type]);
            $row = $stmt->fetch();
            return $row ? $row['html_content'] : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Replace {{placeholder}} tokens in HTML with escaped values.
     */
    private function replacePlaceholders(string $html, string $clientName, string $date, array $extra = []): string {
        $replacements = [
            '{{client_name}}'      => htmlspecialchars($clientName),
            '{{client_street}}'    => htmlspecialchars($extra['clientStreet'] ?? ''),
            '{{client_zip}}'       => htmlspecialchars($extra['clientZip'] ?? ''),
            '{{client_city}}'      => htmlspecialchars($extra['clientCity'] ?? ''),
            '{{client_country}}'   => htmlspecialchars($extra['clientCountry'] ?? ''),
            '{{date}}'             => htmlspecialchars($date),
            '{{therapist_name}}'   => htmlspecialchars($this->therapistName),
            '{{therapist_street}}' => htmlspecialchars($this->therapistStreet),
            '{{therapist_zip}}'    => htmlspecialchars($this->therapistZip),
            '{{therapist_city}}'   => htmlspecialchars($this->therapistCity),
            '{{therapist_tax_id}}' => htmlspecialchars($this->therapistTaxId),
            '{{invoice_number}}'   => htmlspecialchars($extra['invoiceNumber'] ?? ''),
            '{{amount}}'           => htmlspecialchars($extra['amountFormatted'] ?? ''),
            '{{duration_minutes}}' => htmlspecialchars((string)($extra['durationMinutes'] ?? '')),
            '{{therapy_label}}'    => htmlspecialchars($extra['therapyLabel'] ?? ''),
            '{{session_date}}'     => htmlspecialchars($extra['sessionDate'] ?? ''),
            '{{session_time}}'     => htmlspecialchars($extra['sessionTime'] ?? ''),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $html);
    }

    private function createPdf(string $title): TCPDF {
        require_once __DIR__ . '/PdfHeader.php';

        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8');
        $pdf->SetCreator('Mut-Taucher');
        $pdf->SetAuthor($this->therapistName);
        $pdf->SetTitle($title);

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(true);
        $pdf->setFooterData(['0', '0', '0'], ['200', '200', '200']);

        $pdf->SetFont('helvetica', '', 11);
        $pdf->SetMargins(25, 35, 25);
        $pdf->SetAutoPageBreak(true, 25);
        $pdf->AddPage();

        // Branded header on every PDF
        renderPdfHeader($pdf, $this->therapistName);

        return $pdf;
    }

    /**
     * Replace {{placeholder}} tokens with sample data for preview.
     */
    public function replacePlaceholdersSample(string $html): string {
        $today = date('d.m.Y');
        return $this->replacePlaceholders($html, 'Max Mustermann', $today, [
            'clientStreet'   => 'Musterstraße 1',
            'clientZip'      => '10115',
            'clientCity'     => 'Berlin',
            'clientCountry'  => 'Deutschland',
            'invoiceNumber'  => 'RE-2026-0042',
            'amountFormatted'=> '95,00 €',
            'durationMinutes'=> '50',
            'therapyLabel'   => 'Einzeltherapie',
            'sessionDate'    => $today,
            'sessionTime'    => '10:00',
        ]);
    }

    /**
     * Apply brand styling to semantic HTML at render time.
     * Injects inline styles so both DB templates and preview get consistent branding.
     */
    private function applyBranding(string $html): string {
        // Only brand tags that don't already have a style attribute (user styles take priority)
        $html = preg_replace(
            '/<h1(?![^>]*\bstyle\b)(?=[\s>])/',
            '<h1 style="color: #2dd4bf; font-size: 16pt;"',
            $html
        );
        $html = preg_replace(
            '/<h2(?![^>]*\bstyle\b)(?=[\s>])/',
            '<h2 style="color: #2dd4bf; font-size: 12pt; border-bottom: 1px solid #e2e8f0;"',
            $html
        );
        $html = preg_replace(
            '/<th(?![^>]*\bstyle\b)(?=[\s>])/',
            '<th style="background-color: #2dd4bf; color: #ffffff; padding: 6px;"',
            $html
        );
        return $html;
    }

    /**
     * Convert /api/assets/... URLs to absolute filesystem paths for TCPDF.
     */
    private function resolveImagePaths(string $html): string {
        $assetsDir = realpath(__DIR__ . '/../assets');
        if (!$assetsDir) return $html;

        return preg_replace_callback(
            '/(<img\b[^>]*\bsrc\s*=\s*["\'])\/api\/assets\/([^"\']+)(["\'])/',
            function ($matches) use ($assetsDir) {
                $path = $assetsDir . '/' . $matches[2];
                return $matches[1] . $path . $matches[3];
            },
            $html
        );
    }

    /**
     * Generate a PDF from raw HTML (used for preview).
     */
    public function generateFromHtml(string $title, string $html): string {
        $pdf = $this->createPdf($title);
        $branded = $this->applyBranding($html);
        $pdf->writeHTML($this->resolveImagePaths($branded));
        return $pdf->Output('', 'S');
    }

    public function generate(string $type, string $clientName, string $date, array $extra = []): string {
        $titles = [
            'vertrag_erstgespraech'     => 'Vertrag — Erstgespräch',
            'vertrag_einzeltherapie'    => 'Vertrag — Einzeltherapie',
            'vertrag_gruppentherapie'   => 'Vertrag — Gruppentherapie',
            'datenschutzinfo'           => 'Datenschutzinformation nach Art. 13 DSGVO',
            'schweigepflichtentbindung' => 'Schweigepflichtentbindung',
            'onlinetherapie'            => 'Vereinbarung über Online-Therapie',
            'video_einverstaendnis'     => 'Einverständnis zur Video-Therapie',
            'datenschutz_digital'       => 'Datenschutzrisiken digitaler Kommunikation',
            'email_einwilligung'        => 'Einwilligung zur E-Mail-Kommunikation',
            'rechnung'                  => 'Rechnung',
        ];

        $title = $titles[$type] ?? $type;
        $pdf = $this->createPdf($title);

        // Try DB template first, fall back to PHP file
        $dbHtml = $this->loadFromDatabase($type);
        if ($dbHtml !== null) {
            $html = $this->replacePlaceholders($dbHtml, $clientName, $date, $extra);
            $branded = $this->applyBranding($html);
            $pdf->writeHTML($this->resolveImagePaths($branded));
        } else {
            $templateFile = __DIR__ . '/../templates/pdf/' . $type . '.php';
            if (!file_exists($templateFile)) {
                throw new RuntimeException("PDF template not found: $type");
            }
            $therapistName = $this->therapistName;
            // $title is available to PHP templates for rendering their own heading
            include $templateFile;
        }

        return $pdf->Output('', 'S');
    }
}
