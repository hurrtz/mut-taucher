<?php

require_once __DIR__ . '/../db.php';

/**
 * Load brand settings from DB, cached per-request.
 */
function loadBrandSettings(): array {
    static $settings = null;
    if ($settings !== null) return $settings;

    try {
        $db = getDB();
        $stmt = $db->query('SELECT * FROM brand_settings WHERE id = 1');
        $row = $stmt->fetch();
        if ($row) {
            $settings = $row;
            return $settings;
        }
    } catch (\Exception $e) {
        // Fall through to defaults
    }

    $settings = [
        'practice_name'     => 'Mut Taucher',
        'subtitle'          => 'Mut-Taucher Praxis',
        'logo_path'         => 'assets/logo.png',
        'primary_color'    => '#2dd4bf',
        'secondary_color'  => '#94a3b8',
        'font_family'      => 'helvetica',
        'font_size_body'   => 11,
        'font_size_heading' => 16,
    ];
    return $settings;
}

/**
 * Convert hex color (#rrggbb) to RGB array [r, g, b].
 */
function hexToRgb(string $hex): array {
    $hex = ltrim($hex, '#');
    return [
        hexdec(substr($hex, 0, 2)),
        hexdec(substr($hex, 2, 2)),
        hexdec(substr($hex, 4, 2)),
    ];
}

/**
 * Render branded PDF header with logo, practice name, and therapist info.
 *
 * @param TCPDF  $pdf
 * @param string $therapistName
 */
function renderPdfHeader(TCPDF $pdf, string $therapistName): void {
    $brand = loadBrandSettings();
    $primaryRgb = hexToRgb($brand['primary_color']);
    $secondaryRgb = hexToRgb($brand['secondary_color']);
    $font = $brand['font_family'];
    $headingSize = (int)$brand['font_size_heading'];
    $bodySize = (int)$brand['font_size_body'];

    $logoPath = __DIR__ . '/../' . $brand['logo_path'];
    $startY = $pdf->GetY();

    // Logo (left-aligned, 12mm height)
    if (file_exists($logoPath)) {
        $ext = strtoupper(pathinfo($logoPath, PATHINFO_EXTENSION));
        if ($ext === 'SVG') $ext = 'SVG';
        $pdf->Image($logoPath, 25, $startY, 12, 12, $ext !== 'SVG' ? $ext : '');
    }

    // Practice name in primary color, next to logo
    $pdf->SetXY(40, $startY);
    $pdf->SetFont($font, 'B', $headingSize);
    $pdf->SetTextColor($primaryRgb[0], $primaryRgb[1], $primaryRgb[2]);
    $pdf->Cell(0, 7, $brand['practice_name'], 0, 1);

    // Subtitle in secondary color below (skip if empty)
    $subtitle = trim($brand['subtitle'] ?? '');
    if ($subtitle !== '') {
        $pdf->SetX(40);
        $pdf->SetFont($font, '', 9);
        $pdf->SetTextColor($secondaryRgb[0], $secondaryRgb[1], $secondaryRgb[2]);
        $pdf->Cell(0, 4, $subtitle, 0, 1);
    }

    // Accent line in primary color
    $pdf->Ln(3);
    $lineY = $pdf->GetY();
    $pdf->SetDrawColor($primaryRgb[0], $primaryRgb[1], $primaryRgb[2]);
    $pdf->SetLineWidth(0.5);
    $pdf->Line(25, $lineY, 185, $lineY);
    $pdf->Ln(6);

    // Reset text color
    $pdf->SetTextColor(51, 65, 85);
    $pdf->SetFont($font, '', $bodySize);
}

/**
 * Render signature block with table layout.
 *
 * @param TCPDF $pdf
 * @param bool  $dual  true = two-column (place+date / client signature), false = single (client only)
 */
function renderSignatureBlock(TCPDF $pdf, bool $dual = true): void {
    $pdf->Ln(10);

    if ($dual) {
        $html = '<table cellpadding="4" width="100%">
            <tr>
                <td width="45%" style="border-top: 1px solid #334155;">Ort, Datum</td>
                <td width="10%">&nbsp;</td>
                <td width="45%" style="border-top: 1px solid #334155;">Unterschrift Klient/in</td>
            </tr>
        </table>';
    } else {
        $html = '<table cellpadding="4" width="50%">
            <tr>
                <td style="border-top: 1px solid #334155;">Unterschrift Klient/in</td>
            </tr>
        </table>';
    }

    $pdf->writeHTML($html, true, false, true, false, '');
}
