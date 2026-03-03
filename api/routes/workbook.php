<?php

/**
 * Workbook materials routes: CRUD, download, send via email.
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../lib/Mailer.php';
require_once __DIR__ . '/clients.php'; // composeClientName

// ─── List all materials ─────────────────────────────────────────

function handleGetWorkbookMaterials(): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->query('SELECT * FROM workbook_materials ORDER BY group_name, name');
    $rows = $stmt->fetchAll();

    $result = [];
    foreach ($rows as $r) {
        $result[] = [
            'id'        => (int)$r['id'],
            'name'      => $r['name'],
            'groupName' => $r['group_name'],
            'filename'  => $r['filename'],
            'mimeType'  => $r['mime_type'],
            'fileSize'  => (int)$r['file_size'],
            'createdAt' => $r['created_at'],
        ];
    }

    echo json_encode($result);
}

// ─── Upload a new material ──────────────────────────────────────

function handleUploadWorkbookMaterial(): void {
    requireAuth();
    $db = getDB();

    if (empty($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Datei hochgeladen']);
        return;
    }

    $file = $_FILES['file'];
    $name = trim($_POST['name'] ?? '');
    $groupName = trim($_POST['groupName'] ?? '') ?: null;

    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Name ist erforderlich']);
        return;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Fehler beim Hochladen: Code ' . $file['error']]);
        return;
    }

    // Max 20MB
    if ($file['size'] > 20 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'Datei darf maximal 20 MB groß sein']);
        return;
    }

    $allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    $mime = $file['type'] ?: 'application/octet-stream';
    if (!in_array($mime, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nur PDF, JPG und PNG erlaubt']);
        return;
    }

    $dir = __DIR__ . '/../assets/workbook';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = date('Y-m-d') . '_' . uniqid() . ($ext ? '.' . $ext : '');
    $destPath = $dir . '/' . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Datei konnte nicht gespeichert werden']);
        return;
    }

    $relativePath = 'assets/workbook/' . $safeName;

    $stmt = $db->prepare(
        'INSERT INTO workbook_materials (name, group_name, filename, mime_type, file_size, file_path)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, $groupName, $file['name'], $mime, $file['size'], $relativePath]);

    $id = (int)$db->lastInsertId();
    $stmt = $db->prepare('SELECT * FROM workbook_materials WHERE id = ?');
    $stmt->execute([$id]);
    $r = $stmt->fetch();

    http_response_code(201);
    echo json_encode([
        'id'        => (int)$r['id'],
        'name'      => $r['name'],
        'groupName' => $r['group_name'],
        'filename'  => $r['filename'],
        'mimeType'  => $r['mime_type'],
        'fileSize'  => (int)$r['file_size'],
        'createdAt' => $r['created_at'],
    ]);
}

// ─── Delete material + file ─────────────────────────────────────

function handleDeleteWorkbookMaterial(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('SELECT * FROM workbook_materials WHERE id = ?');
    $stmt->execute([$id]);
    $mat = $stmt->fetch();

    if (!$mat) {
        http_response_code(404);
        echo json_encode(['error' => 'Material nicht gefunden']);
        return;
    }

    $filePath = __DIR__ . '/../' . $mat['file_path'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    $stmt = $db->prepare('DELETE FROM workbook_materials WHERE id = ?');
    $stmt->execute([$id]);

    echo json_encode(['message' => 'Material gelöscht']);
}

// ─── Download / preview file ────────────────────────────────────

function handleDownloadWorkbookMaterial(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('SELECT * FROM workbook_materials WHERE id = ?');
    $stmt->execute([$id]);
    $mat = $stmt->fetch();

    if (!$mat) {
        http_response_code(404);
        echo json_encode(['error' => 'Material nicht gefunden']);
        return;
    }

    $filePath = __DIR__ . '/../' . $mat['file_path'];
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Datei nicht gefunden']);
        return;
    }

    header_remove('Content-Type');
    header('Content-Type: ' . $mat['mime_type']);
    header('Content-Disposition: inline; filename="' . $mat['filename'] . '"');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
}

// ─── Send material to clients via email ─────────────────────────

function handleSendWorkbookMaterial(int $id): void {
    requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    $clientIds = $input['clientIds'] ?? [];
    if (empty($clientIds) || !is_array($clientIds)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Empfänger:innen ausgewählt']);
        return;
    }

    $stmt = $db->prepare('SELECT * FROM workbook_materials WHERE id = ?');
    $stmt->execute([$id]);
    $mat = $stmt->fetch();

    if (!$mat) {
        http_response_code(404);
        echo json_encode(['error' => 'Material nicht gefunden']);
        return;
    }

    $filePath = __DIR__ . '/../' . $mat['file_path'];
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Datei nicht gefunden']);
        return;
    }

    // Fetch clients
    $placeholders = implode(',', array_fill(0, count($clientIds), '?'));
    $stmt = $db->prepare("SELECT * FROM clients WHERE id IN ($placeholders)");
    $stmt->execute($clientIds);
    $clients = $stmt->fetchAll();

    if (empty($clients)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine gültigen Empfänger:innen gefunden']);
        return;
    }

    $mailer = new Mailer();
    $results = [];

    foreach ($clients as $c) {
        $clientName = composeClientName($c['title'], $c['first_name'], $c['last_name'], $c['suffix']);
        $subject = 'Arbeitsmaterial: ' . $mat['name'];
        $html = '<p>Liebe:r ' . htmlspecialchars($clientName) . ',</p>'
              . '<p>anbei erhalten Sie das Arbeitsmaterial <strong>' . htmlspecialchars($mat['name']) . '</strong>.</p>'
              . '<p>Herzliche Grüße</p>';

        try {
            $mailer->send(
                $c['email'],
                $clientName,
                $subject,
                $html,
                '',
                [['path' => $filePath, 'name' => $mat['filename']]]
            );

            // Record send
            $stmt2 = $db->prepare('INSERT INTO workbook_sends (material_id, client_id) VALUES (?, ?)');
            $stmt2->execute([$id, $c['id']]);

            $results[] = ['clientId' => (int)$c['id'], 'success' => true];
        } catch (\Exception $e) {
            $results[] = ['clientId' => (int)$c['id'], 'success' => false, 'error' => $e->getMessage()];
        }
    }

    echo json_encode(['results' => $results]);
}
