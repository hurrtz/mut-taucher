<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

/**
 * GET /api/admin/templates
 * Returns list of all templates (without html_content).
 */
function handleGetTemplates(): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->query(
        'SELECT template_key, label, placeholders, updated_at FROM document_templates ORDER BY label ASC'
    );
    $rows = $stmt->fetchAll();

    $result = array_map(fn($r) => [
        'key'          => $r['template_key'],
        'label'        => $r['label'],
        'placeholders' => json_decode($r['placeholders'], true),
        'updatedAt'    => $r['updated_at'],
    ], $rows);

    echo json_encode(array_values($result));
}

/**
 * GET /api/admin/templates/:key
 * Returns full template detail including htmlContent.
 */
function handleGetTemplate(string $key): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare(
        'SELECT template_key, label, html_content, placeholders, updated_at FROM document_templates WHERE template_key = ?'
    );
    $stmt->execute([$key]);
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Vorlage nicht gefunden']);
        return;
    }

    echo json_encode([
        'key'          => $row['template_key'],
        'label'        => $row['label'],
        'htmlContent'  => $row['html_content'],
        'placeholders' => json_decode($row['placeholders'], true),
        'updatedAt'    => $row['updated_at'],
    ]);
}

/**
 * POST /api/admin/templates/:key/preview
 * Body: { htmlContent }
 * Returns a PDF preview with sample placeholder data.
 */
function handlePreviewTemplate(string $key): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('SELECT label FROM document_templates WHERE template_key = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Vorlage nicht gefunden']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $htmlContent = $input['htmlContent'] ?? '';
    if (!$htmlContent) {
        http_response_code(400);
        echo json_encode(['error' => 'htmlContent ist erforderlich']);
        return;
    }

    require_once __DIR__ . '/../lib/PdfGenerator.php';
    $generator = new PdfGenerator();
    $html = $generator->replacePlaceholdersSample($htmlContent);
    $pdfData = $generator->generateFromHtml($row['label'], $html);

    // Override the default JSON content-type set in index.php
    header('Content-Type: application/pdf', true);
    header('Content-Disposition: inline; filename="vorschau.pdf"');
    echo $pdfData;
}

/**
 * PUT /api/admin/templates/:key
 * Body: { htmlContent }
 * Updates the HTML content of a template.
 */
function handleUpdateTemplate(string $key): void {
    requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    $htmlContent = $input['htmlContent'] ?? '';
    if (!$htmlContent) {
        http_response_code(400);
        echo json_encode(['error' => 'htmlContent ist erforderlich']);
        return;
    }

    // Strip unsafe tags, keep TCPDF-safe subset
    $allowed = '<p><br><strong><b><em><i><u><h1><h2><h3><ul><ol><li><table><tr><td><th><thead><tbody><span><img><mark>';
    $htmlContent = strip_tags($htmlContent, $allowed);

    $stmt = $db->prepare(
        'UPDATE document_templates SET html_content = ? WHERE template_key = ?'
    );
    $stmt->execute([$htmlContent, $key]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Vorlage nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Vorlage aktualisiert']);
}

/**
 * POST /api/admin/templates/upload-image
 * Accepts multipart form-data with an 'image' file.
 * Returns { url: "/api/assets/uploads/img_xxx.png" }
 */
function handleUploadImage(): void {
    requireAuth();

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Datei hochgeladen']);
        return;
    }

    $file = $_FILES['image'];

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
        'image/png'  => 'png',
        'image/jpeg' => 'jpg',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
    ];

    if (!isset($allowedMimes[$mime])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiger Dateityp (erlaubt: PNG, JPG, GIF, WebP)']);
        return;
    }

    $ext = $allowedMimes[$mime];
    $filename = 'img_' . uniqid() . '.' . $ext;
    $uploadDir = __DIR__ . '/../assets/uploads';

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $dest = $uploadDir . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        http_response_code(500);
        echo json_encode(['error' => 'Fehler beim Speichern der Datei']);
        return;
    }

    echo json_encode(['url' => '/api/assets/uploads/' . $filename]);
}
