<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

/**
 * Compose a display name from structured parts.
 */
function composeClientName(?string $title, string $firstName, string $lastName, ?string $suffix): string {
    return trim(implode(' ', array_filter([$title, $firstName, $lastName, $suffix])));
}

// ─── Clients CRUD ───────────────────────────────────────────────

/**
 * GET /api/admin/clients?status=active
 */
function handleGetClients(): void {
    requireAuth();
    $db = getDB();
    $status = $_GET['status'] ?? 'active';

    $stmt = $db->prepare(
        'SELECT c.*,
                (SELECT COUNT(*) FROM therapies t WHERE t.client_id = c.id) as therapy_count,
                (SELECT COUNT(*) FROM group_participants gp WHERE gp.client_id = c.id AND gp.status = \'active\') as group_count
         FROM clients c WHERE c.status = ? ORDER BY c.created_at DESC'
    );
    $stmt->execute([$status]);
    $clients = $stmt->fetchAll();

    $result = array_map(fn($c) => [
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
        'createdAt'    => $c['created_at'],
    ], $clients);

    echo json_encode(array_values($result));
}

/**
 * GET /api/admin/clients/:id
 */
function handleGetClient(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare(
        'SELECT c.*,
                (SELECT COUNT(*) FROM therapies t WHERE t.client_id = c.id) as therapy_count,
                (SELECT COUNT(*) FROM group_participants gp WHERE gp.client_id = c.id AND gp.status = \'active\') as group_count
         FROM clients c WHERE c.id = ?'
    );
    $stmt->execute([$id]);
    $c = $stmt->fetch();

    if (!$c) {
        http_response_code(404);
        echo json_encode(['error' => 'Patient:in nicht gefunden']);
        return;
    }

    echo json_encode([
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
        'createdAt'    => $c['created_at'],
    ]);
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

    $stmt = $db->prepare(
        'UPDATE clients SET title = ?, first_name = ?, last_name = ?, suffix = ?, email = ?, phone = ?, street = ?, zip = ?, city = ?, country = ?, notes = ?, status = ? WHERE id = ?'
    );
    $stmt->execute([
        $input['title'] ?? null,
        $input['firstName'] ?? '',
        $input['lastName'] ?? '',
        $input['suffix'] ?? null,
        $input['email'] ?? '',
        $input['phone'] ?? null,
        $input['street'] ?? null,
        $input['zip'] ?? null,
        $input['city'] ?? null,
        $input['country'] ?? 'Deutschland',
        $input['notes'] ?? null,
        $input['status'] ?? 'active',
        $id,
    ]);

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

    $stmt = $db->prepare('DELETE FROM clients WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Patient:in nicht gefunden']);
        return;
    }

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
        'INSERT INTO clients (first_name, last_name, email, booking_id) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $booking['client_first_name'],
        $booking['client_last_name'],
        $booking['client_email'],
        $bookingId,
    ]);

    echo json_encode([
        'id' => (int)$db->lastInsertId(),
        'message' => 'Patient:in aus Buchung angelegt',
    ]);
}
