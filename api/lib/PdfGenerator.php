<?php

require_once __DIR__ . '/../vendor/autoload.php';

class PdfGenerator {
    private string $therapistName;
    private string $therapistStreet;
    private string $therapistZip;
    private string $therapistCity;
    private string $therapistTaxId;
    private array $config;

    public function __construct() {
        $this->config = require __DIR__ . '/../config.php';
        $this->therapistName   = $this->config['therapist_name'] ?? 'Mut-Taucher Praxis';
        $this->therapistStreet = $this->config['therapist_street'] ?? '';
        $this->therapistZip    = $this->config['therapist_zip'] ?? '';
        $this->therapistCity   = $this->config['therapist_city'] ?? '';
        $this->therapistTaxId  = $this->config['therapist_tax_id'] ?? '';
    }

    /**
     * Resolve which template key to use for a given sending point.
     * Checks template_mappings for a mapped template_key, falls back to $fallback.
     */
    public function resolveTemplateKey(string $sendingPoint, string $fallback): string {
        try {
            require_once __DIR__ . '/../db.php';
            $db = getDB();
            $stmt = $db->prepare('SELECT template_key FROM template_mappings WHERE sending_point = ? AND template_key IS NOT NULL');
            $stmt->execute([$sendingPoint]);
            $row = $stmt->fetch();
            return ($row && $row['template_key']) ? $row['template_key'] : $fallback;
        } catch (\Exception $e) {
            return $fallback;
        }
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
        // Build composite address blocks (name + street + zip city)
        $therapistAddress = htmlspecialchars($this->therapistName)
            . '<br>' . htmlspecialchars($this->therapistStreet)
            . '<br>' . htmlspecialchars($this->therapistZip) . ' ' . htmlspecialchars($this->therapistCity);

        $clientStreet  = htmlspecialchars($extra['clientStreet'] ?? '');
        $clientZip     = htmlspecialchars($extra['clientZip'] ?? '');
        $clientCity    = htmlspecialchars($extra['clientCity'] ?? '');
        $clientAddress = htmlspecialchars($clientName)
            . '<br>' . $clientStreet
            . '<br>' . $clientZip . ' ' . $clientCity;

        $replacements = [
            '{{therapist_address}}' => $therapistAddress,
            '{{client_address}}'    => $clientAddress,
            '{{client_name}}'       => htmlspecialchars($clientName),
            '{{client_street}}'     => $clientStreet,
            '{{client_zip}}'        => $clientZip,
            '{{client_city}}'       => $clientCity,
            '{{client_country}}'    => htmlspecialchars($extra['clientCountry'] ?? ''),
            '{{date}}'              => htmlspecialchars($date),
            '{{therapist_name}}'    => htmlspecialchars($this->therapistName),
            '{{therapist_street}}'  => htmlspecialchars($this->therapistStreet),
            '{{therapist_zip}}'     => htmlspecialchars($this->therapistZip),
            '{{therapist_city}}'    => htmlspecialchars($this->therapistCity),
            '{{therapist_tax_id}}'  => htmlspecialchars($this->therapistTaxId),
            '{{invoice_number}}'    => htmlspecialchars($extra['invoiceNumber'] ?? ''),
            '{{amount}}'            => htmlspecialchars($extra['amountFormatted'] ?? ''),
            '{{duration_minutes}}'  => htmlspecialchars((string)($extra['durationMinutes'] ?? '')),
            '{{therapy_label}}'     => htmlspecialchars($extra['therapyLabel'] ?? ''),
            '{{session_date}}'      => htmlspecialchars($extra['sessionDate'] ?? ''),
            '{{session_time}}'      => htmlspecialchars($extra['sessionTime'] ?? ''),
            '{{session_count}}'     => htmlspecialchars((string)($extra['sessionCount'] ?? '')),
            '{{total_amount}}'      => htmlspecialchars($extra['totalAmount'] ?? ''),
            '{{payment_label}}'     => htmlspecialchars($extra['paymentLabel'] ?? ''),
            '{{bank_account_holder}}' => htmlspecialchars($this->config['bank_account_holder'] ?? ''),
            '{{bank_iban}}'           => htmlspecialchars($this->config['bank_iban'] ?? ''),
            '{{bank_bic}}'            => htmlspecialchars($this->config['bank_bic'] ?? ''),
            '{{bank_name}}'           => htmlspecialchars($this->config['bank_name'] ?? ''),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $html);
    }

    private function createPdf(string $title): TCPDF {
        require_once __DIR__ . '/PdfHeader.php';

        $brand = loadBrandSettings();
        $font = $brand['font_family'];
        $bodySize = (int)$brand['font_size_body'];

        $footerLine1 = sprintf(
            '%s  ·  IBAN: %s  ·  BIC: %s  ·  %s',
            $this->config['bank_account_holder'] ?? '',
            $this->config['bank_iban'] ?? '',
            $this->config['bank_bic'] ?? '',
            $this->config['bank_name'] ?? ''
        );
        $footerLine2 = sprintf('Steuernummer: %s', $this->therapistTaxId);

        $pdf = new class($footerLine1, $footerLine2, $font) extends TCPDF {
            private string $footerLine1;
            private string $footerLine2;
            private string $footerFont;

            public function __construct(string $line1, string $line2, string $font) {
                parent::__construct('P', 'mm', 'A4', true, 'UTF-8');
                $this->footerLine1 = $line1;
                $this->footerLine2 = $line2;
                $this->footerFont = $font;
            }

            public function Footer(): void {
                $this->SetY(-18);
                $this->SetDrawColor(200, 200, 200);
                $this->SetLineWidth(0.3);
                $this->Line(25, $this->GetY(), 185, $this->GetY());
                $this->Ln(2);
                $this->SetFont($this->footerFont, '', 7);
                $this->SetTextColor(100, 116, 139);
                $this->Cell(0, 4, $this->footerLine1, 0, 1, 'C');
                $this->Cell(0, 4, $this->footerLine2, 0, 0, 'C');
            }
        };

        $pdf->SetCreator('Mut-Taucher');
        $pdf->SetAuthor($this->therapistName);
        $pdf->SetTitle($title);

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(true);

        $pdf->SetFont($font, '', $bodySize);
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
            'invoiceNumber'  => '26-0042',
            'amountFormatted'=> '95,00 €',
            'durationMinutes'=> '50',
            'therapyLabel'   => 'Einzeltherapie',
            'sessionDate'    => $today,
            'sessionTime'    => '10:00',
            'sessionCount'   => '10',
            'totalAmount'    => '950,00 €',
            'paymentLabel'   => 'Gesamtbetrag',
        ]);
    }

    /**
     * Apply brand styling to semantic HTML at render time.
     * Injects inline styles so both DB templates and preview get consistent branding.
     */
    private function applyBranding(string $html): string {
        require_once __DIR__ . '/PdfHeader.php';
        $brand = loadBrandSettings();
        $color = $brand['primary_color'];
        $headingSize = (int)$brand['font_size_heading'];

        // Only brand tags that don't already have a style attribute (user styles take priority)
        $html = preg_replace(
            '/<h1(?![^>]*\bstyle\b)(?=[\s>])/',
            '<h1 style="color: ' . $color . '; font-size: ' . $headingSize . 'pt;"',
            $html
        );
        $html = preg_replace(
            '/<h2(?![^>]*\bstyle\b)(?=[\s>])/',
            '<h2 style="color: ' . $color . '; font-size: 12pt; border-bottom: 1px solid #e2e8f0;"',
            $html
        );
        $html = preg_replace(
            '/<th(?![^>]*\bstyle\b)(?=[\s>])/',
            '<th style="background-color: ' . $color . '; color: #ffffff; padding: 6px;"',
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
            'vertrag_einzeltherapie'    => 'Vertrag — Einzeltherapie',
            'vertrag_gruppentherapie'   => 'Vertrag — Gruppentherapie',
            'datenschutzinfo'           => 'Datenschutzinformation nach Art. 13 DSGVO',
            'schweigepflichtentbindung' => 'Schweigepflichtentbindung',
            'onlinetherapie'            => 'Vereinbarung über Online-Therapie',
            'video_einverstaendnis'     => 'Einverständnis zur Video-Therapie',
            'datenschutz_digital'       => 'Datenschutzrisiken digitaler Kommunikation',
            'email_einwilligung'        => 'Einwilligung zur E-Mail-Kommunikation',
            'rechnung'                  => 'Rechnung',
            'rechnung_erstgespraech'    => 'Rechnung — Erstgespräch',
            'rechnung_einzeltherapie'   => 'Rechnung — Einzeltherapie',
            'rechnung_gruppentherapie'  => 'Rechnung — Gruppentherapie',
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
