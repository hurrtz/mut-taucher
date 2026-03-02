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
    $allowed = '<p><br><strong><b><em><i><u><h1><h2><h3><ul><ol><li><table><tr><td><th><thead><tbody><span>';
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
