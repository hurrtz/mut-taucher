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

    public function generate(string $type, string $clientName, string $date): string {
        $templateFile = __DIR__ . '/../templates/pdf/' . $type . '.php';
        if (!file_exists($templateFile)) {
            throw new RuntimeException("PDF template not found: $type");
        }

        $titles = [
            'behandlungsvertrag'        => 'Behandlungsvertrag',
            'datenschutzinfo'           => 'Datenschutzinformation nach Art. 13 DSGVO',
            'schweigepflichtentbindung' => 'Schweigepflichtentbindung',
            'onlinetherapie'            => 'Vereinbarung über Online-Therapie',
        ];

        $title = $titles[$type] ?? $type;
        $pdf = $this->createPdf($title);

        $therapistName = $this->therapistName;
        include $templateFile;

        return $pdf->Output('', 'S');
    }
}
