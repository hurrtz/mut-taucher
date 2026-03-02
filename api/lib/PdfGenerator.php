<?php

require_once __DIR__ . '/../vendor/autoload.php';

class PdfGenerator {
    private string $therapistName;

    public function __construct() {
        $config = require __DIR__ . '/../config.php';
        $this->therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
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
            '{{date}}'             => htmlspecialchars($date),
            '{{therapist_name}}'   => htmlspecialchars($this->therapistName),
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

    public function generate(string $type, string $clientName, string $date, array $extra = []): string {
        $titles = [
            'behandlungsvertrag'        => 'Behandlungsvertrag',
            'datenschutzinfo'           => 'Datenschutzinformation nach Art. 13 DSGVO',
            'schweigepflichtentbindung' => 'Schweigepflichtentbindung',
            'onlinetherapie'            => 'Vereinbarung über Online-Therapie',
            'kurzvertrag'               => 'Kurzvertrag / Honorarvereinbarung',
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
            $pdf->writeHTML($html);
        } else {
            $templateFile = __DIR__ . '/../templates/pdf/' . $type . '.php';
            if (!file_exists($templateFile)) {
                throw new RuntimeException("PDF template not found: $type");
            }
            $therapistName = $this->therapistName;
            include $templateFile;
        }

        return $pdf->Output('', 'S');
    }
}
