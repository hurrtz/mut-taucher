<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

// ─── Clients CRUD ───────────────────────────────────────────────

/**
 * GET /api/admin/clients?status=active
 */
function handleGetClients(): void {
    requireAuth();
    $db = getDB();
    $status = $_GET['status'] ?? 'active';

    $stmt = $db->prepare(
        'SELECT c.*, (SELECT COUNT(*) FROM therapies t WHERE t.client_id = c.id) as therapy_count
         FROM clients c WHERE c.status = ? ORDER BY c.created_at DESC'
    );
    $stmt->execute([$status]);
    $clients = $stmt->fetchAll();

    $result = array_map(fn($c) => [
        'id'           => (int)$c['id'],
        'name'         => $c['name'],
        'email'        => $c['email'],
        'phone'        => $c['phone'],
        'notes'        => $c['notes'],
        'status'       => $c['status'],
        'bookingId'    => $c['booking_id'] ? (int)$c['booking_id'] : null,
        'therapyCount' => (int)$c['therapy_count'],
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
        'SELECT c.*, (SELECT COUNT(*) FROM therapies t WHERE t.client_id = c.id) as therapy_count
         FROM clients c WHERE c.id = ?'
    );
    $stmt->execute([$id]);
    $c = $stmt->fetch();

    if (!$c) {
        http_response_code(404);
        echo json_encode(['error' => 'Klient:in nicht gefunden']);
        return;
    }

    echo json_encode([
        'id'           => (int)$c['id'],
        'name'         => $c['name'],
        'email'        => $c['email'],
        'phone'        => $c['phone'],
        'notes'        => $c['notes'],
        'status'       => $c['status'],
        'bookingId'    => $c['booking_id'] ? (int)$c['booking_id'] : null,
        'therapyCount' => (int)$c['therapy_count'],
        'createdAt'    => $c['created_at'],
    ]);
}

/**
 * POST /api/admin/clients
 * Body: { name, email, phone?, notes? }
 */
function handleCreateClient(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';

    if (!$name || !$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Name und E-Mail sind erforderlich']);
        return;
    }

    $stmt = $db->prepare(
        'INSERT INTO clients (name, email, phone, notes) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$name, $email, $input['phone'] ?? null, $input['notes'] ?? null]);

    echo json_encode(['id' => (int)$db->lastInsertId(), 'message' => 'Klient:in angelegt']);
}

/**
 * PUT /api/admin/clients/:id
 */
function handleUpdateClient(int $id): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $stmt = $db->prepare(
        'UPDATE clients SET name = ?, email = ?, phone = ?, notes = ?, status = ? WHERE id = ?'
    );
    $stmt->execute([
        $input['name'] ?? '',
        $input['email'] ?? '',
        $input['phone'] ?? null,
        $input['notes'] ?? null,
        $input['status'] ?? 'active',
        $id,
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Klient:in nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Klient:in aktualisiert']);
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
        echo json_encode(['error' => 'Klient:in nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Klient:in gelöscht']);
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
        echo json_encode(['error' => 'Klient:in wurde bereits aus dieser Buchung angelegt']);
        return;
    }

    $stmt = $db->prepare(
        'INSERT INTO clients (name, email, booking_id) VALUES (?, ?, ?)'
    );
    $stmt->execute([$booking['client_name'], $booking['client_email'], $bookingId]);

    echo json_encode([
        'id' => (int)$db->lastInsertId(),
        'message' => 'Klient:in aus Buchung angelegt',
    ]);
}
