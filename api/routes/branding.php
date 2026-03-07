<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

/**
 * GET /api/admin/branding
 * Returns current brand settings.
 */
function handleGetBranding(): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->query('SELECT * FROM brand_settings WHERE id = 1');
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(500);
        echo json_encode(['error' => 'Branding-Einstellungen nicht gefunden']);
        return;
    }

    echo json_encode([
        'practiceName'    => $row['practice_name'],
        'subtitle'        => $row['subtitle'],
        'logoPath'        => $row['logo_path'],
        'logoUrl'         => $row['logo_path'] ? '/api/admin/branding/logo?v=' . strtotime($row['updated_at'] ?? 'now') : null,
        'primaryColor'    => $row['primary_color'],
        'secondaryColor'  => $row['secondary_color'],
        'fontFamily'      => $row['font_family'],
        'fontSizeBody'    => (int)$row['font_size_body'],
        'fontSizeHeading' => (int)$row['font_size_heading'],
    ]);
}

/**
 * PUT /api/admin/branding
 * Partial update of brand settings.
 */
function handleUpdateBranding(): void {
    requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige Eingabe']);
        return;
    }

    $allowedFonts = ['helvetica', 'times', 'courier', 'dejavusans'];
    $sets = [];
    $params = [];

    if (array_key_exists('practiceName', $input)) {
        $val = trim($input['practiceName']);
        if ($val === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Praxisname darf nicht leer sein']);
            return;
        }
        $sets[] = 'practice_name = ?';
        $params[] = $val;
    }

    if (array_key_exists('subtitle', $input)) {
        $sets[] = 'subtitle = ?';
        $params[] = trim($input['subtitle']);
    }

    if (array_key_exists('primaryColor', $input)) {
        if (!preg_match('/^#?[0-9a-fA-F]{6}$/', $input['primaryColor'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Ungültiges Hex-Farbformat für Primärfarbe']);
            return;
        }
        $sets[] = 'primary_color = ?';
        $params[] = ltrim($input['primaryColor'], '#');
    }

    if (array_key_exists('secondaryColor', $input)) {
        if (!preg_match('/^#?[0-9a-fA-F]{6}$/', $input['secondaryColor'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Ungültiges Hex-Farbformat für Sekundärfarbe']);
            return;
        }
        $sets[] = 'secondary_color = ?';
        $params[] = ltrim($input['secondaryColor'], '#');
    }

    if (array_key_exists('fontFamily', $input)) {
        if (!in_array($input['fontFamily'], $allowedFonts, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Ungültige Schriftart. Erlaubt: ' . implode(', ', $allowedFonts)]);
            return;
        }
        $sets[] = 'font_family = ?';
        $params[] = $input['fontFamily'];
    }

    if (array_key_exists('fontSizeBody', $input)) {
        $val = (int)$input['fontSizeBody'];
        if ($val < 8 || $val > 20) {
            http_response_code(400);
            echo json_encode(['error' => 'Schriftgröße Fließtext muss zwischen 8 und 20 liegen']);
            return;
        }
        $sets[] = 'font_size_body = ?';
        $params[] = $val;
    }

    if (array_key_exists('fontSizeHeading', $input)) {
        $val = (int)$input['fontSizeHeading'];
        if ($val < 10 || $val > 28) {
            http_response_code(400);
            echo json_encode(['error' => 'Schriftgröße Überschriften muss zwischen 10 und 28 liegen']);
            return;
        }
        $sets[] = 'font_size_heading = ?';
        $params[] = $val;
    }

    if (empty($sets)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Änderungen angegeben']);
        return;
    }

    $stmt = $db->prepare('UPDATE brand_settings SET ' . implode(', ', $sets) . ' WHERE id = 1');
    $stmt->execute($params);

    // Return updated settings
    handleGetBranding();
}

/**
 * GET /api/admin/branding/logo
 * Serves the current logo file with correct Content-Type.
 */
function handleGetLogo(): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->query('SELECT logo_path FROM brand_settings WHERE id = 1');
    $row = $stmt->fetch();
    $logoPath = $row ? $row['logo_path'] : 'assets/logo.png';

    $filePath = __DIR__ . '/../' . $logoPath;
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Logo nicht gefunden']);
        return;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($filePath);

    header('Content-Type: ' . $mime, true);
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache');
    readfile($filePath);
}

/**
 * POST /api/admin/branding/logo
 * Upload a new logo file (PNG/JPG/SVG, max 2MB).
 */
function handleUploadLogo(): void {
    requireAuth();

    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Datei hochgeladen']);
        return;
    }

    $file = $_FILES['logo'];

    // Max 2 MB
    if ($file['size'] > 2 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'Datei zu groß (max. 2 MB)']);
        return;
    }

    // Validate MIME type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    $allowedMimes = [
        'image/png'     => 'png',
        'image/jpeg'    => 'jpg',
        'image/svg+xml' => 'svg',
    ];

    if (!isset($allowedMimes[$mime])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiger Dateityp (erlaubt: PNG, JPG, SVG)']);
        return;
    }

    $ext = $allowedMimes[$mime];
    $filename = 'logo_' . time() . '.' . $ext;
    $uploadDir = __DIR__ . '/../assets/logos';

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $dest = $uploadDir . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        http_response_code(500);
        echo json_encode(['error' => 'Fehler beim Speichern der Datei']);
        return;
    }

    $logoPath = 'assets/logos/' . $filename;

    $db = getDB();
    $stmt = $db->prepare('UPDATE brand_settings SET logo_path = ? WHERE id = 1');
    $stmt->execute([$logoPath]);

    echo json_encode([
        'logoPath' => $logoPath,
        'logoUrl'  => '/api/admin/branding/logo?v=' . time(),
    ]);
}
