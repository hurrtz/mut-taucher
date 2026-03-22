<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

/**
 * Compose a display name from structured parts.
 */
function composeClientName(?string $title, string $firstName, string $lastName, ?string $suffix): string {
    return trim(implode(' ', array_filter([$title, $firstName, $lastName, $suffix])));
}

function clientCanBeDeletedFromRow(array $row): bool {
    $hasRelevantActivity =
        (int)($row['therapy_count'] ?? 0) > 0
        || (int)($row['group_participation_count'] ?? 0) > 0
        || (int)($row['note_count'] ?? 0) > 0
        || (int)($row['relevant_document_count'] ?? 0) > 0
        || (int)($row['workbook_send_count'] ?? 0) > 0
        || (int)($row['document_send_count'] ?? 0) > 0
        || trim((string)($row['notes'] ?? '')) !== ''
        || (bool)($row['booking_invoice_sent'] ?? false)
        || (($row['booking_status'] ?? null) === 'completed');

    return !$hasRelevantActivity;
}

function fetchClientRow(PDO $db, int $id): ?array {
    $stmt = $db->prepare(
        'SELECT c.*,
                b.status as booking_status,
                b.invoice_sent as booking_invoice_sent,
                (SELECT COUNT(*) FROM therapies t WHERE t.client_id = c.id) as therapy_count,
                (SELECT COUNT(*) FROM group_participants gp WHERE gp.client_id = c.id) as group_participation_count,
                (SELECT COUNT(*) FROM group_participants gp WHERE gp.client_id = c.id AND gp.status = \'active\') as group_count,
                (SELECT COUNT(*) FROM client_notes cn WHERE cn.client_id = c.id) as note_count,
                (SELECT COUNT(*) FROM client_documents cd
                 WHERE cd.client_id = c.id
                   AND NOT (
                     cd.direction = \'sent\'
                     AND cd.label LIKE \'Zahlungsaufforderung B%\'
                     AND cd.filename LIKE \'Zahlungsaufforderung_B%.pdf\'
                   )
                ) as relevant_document_count,
                (SELECT COUNT(*) FROM workbook_sends ws WHERE ws.client_id = c.id) as workbook_send_count,
                (SELECT COUNT(*) FROM document_sends ds WHERE ds.client_id = c.id) as document_send_count
         FROM clients c
         LEFT JOIN bookings b ON b.id = c.booking_id
         WHERE c.id = ?'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function serializeClientRow(array $c): array {
    return [
        'id'           => (int)$c['id'],
        'title'        => $c['title'],
        'firstName'    => $c['first_name'],
        'lastName'     => $c['last_name'],
        'suffix'       => $c['suffix'],
        'name'         => composeClientName($c['title'], $c['first_name'], $c['last_name'], $c['suffix']),
        'email'        => $c['email'],
        'phone'        => $c['phone'],
        'street'       => $c['street'],
        'zip'          => $c['zip'],
        'city'         => $c['city'],
        'country'      => $c['country'],
        'notes'        => $c['notes'],
        'status'       => $c['status'],
        'bookingId'    => $c['booking_id'] ? (int)$c['booking_id'] : null,
        'therapyCount' => (int)$c['therapy_count'],
        'groupCount'   => (int)$c['group_count'],
        'deletable'    => clientCanBeDeletedFromRow($c),
        'createdAt'    => $c['created_at'],
    ];
}

// ─── Clients CRUD ───────────────────────────────────────────────

/**
 * GET /api/admin/clients?status=active
 */
function handleGetClients(): void {
    requireAuth();
    $db = getDB();
    $status = $_GET['status'] ?? 'active';

    if ($status === 'all') {
        $stmt = $db->query(
            'SELECT c.*,
                    b.status as booking_status,
                    b.invoice_sent as booking_invoice_sent,
                    (SELECT COUNT(*) FROM therapies t WHERE t.client_id = c.id) as therapy_count,
                    (SELECT COUNT(*) FROM group_participants gp WHERE gp.client_id = c.id) as group_participation_count,
                    (SELECT COUNT(*) FROM group_participants gp WHERE gp.client_id = c.id AND gp.status = \'active\') as group_count,
                    (SELECT COUNT(*) FROM client_notes cn WHERE cn.client_id = c.id) as note_count,
                    (SELECT COUNT(*) FROM client_documents cd
                     WHERE cd.client_id = c.id
                       AND NOT (
                         cd.direction = \'sent\'
                         AND cd.label LIKE \'Zahlungsaufforderung B%\'
                         AND cd.filename LIKE \'Zahlungsaufforderung_B%.pdf\'
                       )
                    ) as relevant_document_count,
                    (SELECT COUNT(*) FROM workbook_sends ws WHERE ws.client_id = c.id) as workbook_send_count,
                    (SELECT COUNT(*) FROM document_sends ds WHERE ds.client_id = c.id) as document_send_count
             FROM clients c
             LEFT JOIN bookings b ON b.id = c.booking_id
             ORDER BY c.status ASC, c.created_at DESC'
        );
    } else {
        $stmt = $db->prepare(
            'SELECT c.*,
                    b.status as booking_status,
                    b.invoice_sent as booking_invoice_sent,
                    (SELECT COUNT(*) FROM therapies t WHERE t.client_id = c.id) as therapy_count,
                    (SELECT COUNT(*) FROM group_participants gp WHERE gp.client_id = c.id) as group_participation_count,
                    (SELECT COUNT(*) FROM group_participants gp WHERE gp.client_id = c.id AND gp.status = \'active\') as group_count,
                    (SELECT COUNT(*) FROM client_notes cn WHERE cn.client_id = c.id) as note_count,
                    (SELECT COUNT(*) FROM client_documents cd
                     WHERE cd.client_id = c.id
                       AND NOT (
                         cd.direction = \'sent\'
                         AND cd.label LIKE \'Zahlungsaufforderung B%\'
                         AND cd.filename LIKE \'Zahlungsaufforderung_B%.pdf\'
                       )
                    ) as relevant_document_count,
                    (SELECT COUNT(*) FROM workbook_sends ws WHERE ws.client_id = c.id) as workbook_send_count,
                    (SELECT COUNT(*) FROM document_sends ds WHERE ds.client_id = c.id) as document_send_count
             FROM clients c
             LEFT JOIN bookings b ON b.id = c.booking_id
             WHERE c.status = ?
             ORDER BY c.created_at DESC'
        );
        $stmt->execute([$status]);
    }
    $clients = $stmt->fetchAll();

    $result = array_map('serializeClientRow', $clients);

    echo json_encode(array_values($result));
}

/**
 * GET /api/admin/clients/:id
 */
function handleGetClient(int $id): void {
    requireAuth();
    $db = getDB();

    $c = fetchClientRow($db, $id);

    if (!$c) {
        http_response_code(404);
        echo json_encode(['error' => 'Patient:in nicht gefunden']);
        return;
    }

    echo json_encode(serializeClientRow($c));
}

/**
 * POST /api/admin/clients
 * Body: { title?, firstName, lastName, suffix?, email, phone?, notes? }
 */
function handleCreateClient(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $firstName = $input['firstName'] ?? '';
    $lastName = $input['lastName'] ?? '';
    $email = $input['email'] ?? '';

    if (!$firstName || !$lastName || !$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Vorname, Nachname und E-Mail sind erforderlich']);
        return;
    }

    $stmt = $db->prepare(
        'INSERT INTO clients (title, first_name, last_name, suffix, email, phone, street, zip, city, country, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $input['title'] ?? null,
        $firstName,
        $lastName,
        $input['suffix'] ?? null,
        $email,
        $input['phone'] ?? null,
        $input['street'] ?? null,
        $input['zip'] ?? null,
        $input['city'] ?? null,
        $input['country'] ?? 'Deutschland',
        $input['notes'] ?? null,
    ]);

    echo json_encode(['id' => (int)$db->lastInsertId(), 'message' => 'Patient:in angelegt']);
}

/**
 * PUT /api/admin/clients/:id
 */
function handleUpdateClient(int $id): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $fieldMap = [
        'title'     => 'title',
        'firstName' => 'first_name',
        'lastName'  => 'last_name',
        'suffix'    => 'suffix',
        'email'     => 'email',
        'phone'     => 'phone',
        'street'    => 'street',
        'zip'       => 'zip',
        'city'      => 'city',
        'country'   => 'country',
        'notes'     => 'notes',
        'status'    => 'status',
    ];

    $sets = [];
    $params = [];
    foreach ($fieldMap as $jsonKey => $dbCol) {
        if (array_key_exists($jsonKey, $input)) {
            $sets[] = "$dbCol = ?";
            $params[] = $input[$jsonKey];
        }
    }

    if (empty($sets)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Änderungen angegeben']);
        return;
    }

    $params[] = $id;
    $stmt = $db->prepare('UPDATE clients SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Patient:in nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Patient:in aktualisiert']);
}

/**
 * DELETE /api/admin/clients/:id
 */
function handleDeleteClient(int $id): void {
    requireAuth();
    $db = getDB();

    $client = fetchClientRow($db, $id);
    if (!$client) {
        http_response_code(404);
        echo json_encode(['error' => 'Patient:in nicht gefunden']);
        return;
    }

    if (!clientCanBeDeletedFromRow($client)) {
        http_response_code(409);
        echo json_encode(['error' => 'Patient:in hat relevante Aktivitäten und kann nicht gelöscht werden. Bitte archivieren.']);
        return;
    }

    $db->prepare('DELETE FROM document_sends WHERE client_id = ?')->execute([$id]);
    $stmt = $db->prepare('DELETE FROM clients WHERE id = ?');
    $stmt->execute([$id]);

    echo json_encode(['message' => 'Patient:in gelöscht']);
}

/**
 * POST /api/admin/bookings/:id/migrate-to-client
 * Creates a client from an existing booking.
 */
function handleMigrateBookingToClient(int $bookingId): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        http_response_code(404);
        echo json_encode(['error' => 'Buchung nicht gefunden']);
        return;
    }

    // Check if client already exists for this booking
    $existingStmt = $db->prepare('SELECT id FROM clients WHERE booking_id = ?');
    $existingStmt->execute([$bookingId]);
    if ($existingStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Patient:in wurde bereits aus dieser Buchung angelegt']);
        return;
    }

    $stmt = $db->prepare(
        'INSERT INTO clients (first_name, last_name, email, phone, street, zip, city, booking_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $booking['client_first_name'],
        $booking['client_last_name'],
        $booking['client_email'],
        $booking['client_phone'] ?? null,
        $booking['client_street'],
        $booking['client_zip'],
        $booking['client_city'],
        $bookingId,
    ]);

    echo json_encode([
        'id' => (int)$db->lastInsertId(),
        'message' => 'Patient:in aus Buchung angelegt',
    ]);
}
