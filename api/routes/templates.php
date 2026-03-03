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
        'SELECT template_key, label, group_name, placeholders, updated_at FROM document_templates ORDER BY label ASC'
    );
    $rows = $stmt->fetchAll();

    $result = array_map(fn($r) => [
        'key'          => $r['template_key'],
        'label'        => $r['label'],
        'groupName'    => $r['group_name'],
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
        'SELECT template_key, label, group_name, html_content, placeholders, updated_at FROM document_templates WHERE template_key = ?'
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
        'groupName'    => $row['group_name'],
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
 * Body: { htmlContent?, label? }
 * Updates the HTML content and/or label of a template.
 */
function handleUpdateTemplate(string $key): void {
    requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    $htmlContent = $input['htmlContent'] ?? null;
    $label = $input['label'] ?? null;

    if (!$htmlContent && !$label) {
        http_response_code(400);
        echo json_encode(['error' => 'htmlContent oder label ist erforderlich']);
        return;
    }

    $sets = [];
    $params = [];

    if ($htmlContent) {
        // Strip unsafe tags, keep TCPDF-safe subset
        $allowed = '<p><br><strong><b><em><i><u><h1><h2><h3><ul><ol><li><table><tr><td><th><thead><tbody><span><img><mark>';
        $htmlContent = strip_tags($htmlContent, $allowed);
        $sets[] = 'html_content = ?';
        $params[] = $htmlContent;
    }

    if ($label) {
        $sets[] = 'label = ?';
        $params[] = $label;
    }

    $params[] = $key;
    $stmt = $db->prepare(
        'UPDATE document_templates SET ' . implode(', ', $sets) . ' WHERE template_key = ?'
    );
    $stmt->execute($params);

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
/**
 * POST /api/admin/templates
 * Body: { key, label, groupName? }
 * Creates a new template with empty content.
 */
function handleCreateTemplate(): void {
    requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    $key = $input['key'] ?? '';
    $label = $input['label'] ?? '';
    $groupName = $input['groupName'] ?? null;

    if (!$key || !$label) {
        http_response_code(400);
        echo json_encode(['error' => 'key und label sind erforderlich']);
        return;
    }

    if (!preg_match('/^[a-z_]+$/', $key)) {
        http_response_code(400);
        echo json_encode(['error' => 'Schlüssel darf nur Kleinbuchstaben und Unterstriche enthalten']);
        return;
    }

    // Check uniqueness
    $stmt = $db->prepare('SELECT COUNT(*) FROM document_templates WHERE template_key = ?');
    $stmt->execute([$key]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Schlüssel existiert bereits']);
        return;
    }

    $stmt = $db->prepare(
        'INSERT INTO document_templates (template_key, label, group_name, html_content, placeholders) VALUES (?, ?, ?, \'\', \'[]\')'
    );
    $stmt->execute([$key, $label, $groupName]);

    echo json_encode([
        'key'          => $key,
        'label'        => $label,
        'groupName'    => $groupName,
        'placeholders' => [],
        'updatedAt'    => date('Y-m-d H:i:s'),
    ]);
}

/**
 * DELETE /api/admin/templates/:key
 * Deletes a template. FK cascade sets mappings to NULL.
 */
function handleDeleteTemplate(string $key): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('DELETE FROM document_templates WHERE template_key = ?');
    $stmt->execute([$key]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Vorlage nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Vorlage gelöscht']);
}

/**
 * PATCH /api/admin/templates/:key/group
 * Body: { groupName: string | null }
 * Updates the group_name of a template.
 */
function handleUpdateTemplateGroup(string $key): void {
    requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    $groupName = array_key_exists('groupName', $input) ? $input['groupName'] : null;

    $stmt = $db->prepare('UPDATE document_templates SET group_name = ? WHERE template_key = ?');
    $stmt->execute([$groupName ?: null, $key]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Vorlage nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Gruppe aktualisiert']);
}

/**
 * GET /api/admin/template-mappings
 * Returns all template mappings.
 */
function handleGetMappings(): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->query('SELECT sending_point, template_key, updated_at FROM template_mappings ORDER BY sending_point ASC');
    $rows = $stmt->fetchAll();

    $result = array_map(fn($r) => [
        'sendingPoint' => $r['sending_point'],
        'templateKey'  => $r['template_key'],
        'updatedAt'    => $r['updated_at'],
    ], $rows);

    echo json_encode(array_values($result));
}

/**
 * PUT /api/admin/template-mappings
 * Body: { sendingPoint, templateKey: string | null }
 * Updates a single template mapping.
 */
function handleUpdateMapping(): void {
    requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    $sendingPoint = $input['sendingPoint'] ?? '';
    $templateKey = $input['templateKey'] ?? null;

    if (!$sendingPoint) {
        http_response_code(400);
        echo json_encode(['error' => 'sendingPoint ist erforderlich']);
        return;
    }

    $stmt = $db->prepare('UPDATE template_mappings SET template_key = ? WHERE sending_point = ?');
    $stmt->execute([$templateKey ?: null, $sendingPoint]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Zuordnung nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Zuordnung aktualisiert']);
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
