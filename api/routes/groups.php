<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

// ─── Helper: format group row ────────────────────────────────────

function formatGroupRow(array $g, PDO $db): array {
    // Schedule rules
    $schedStmt = $db->prepare(
        'SELECT day_of_week, frequency, time FROM group_schedule_rules WHERE group_id = ?'
    );
    $schedStmt->execute([$g['id']]);
    $schedule = $schedStmt->fetchAll();

    // Participant count
    $countStmt = $db->prepare(
        'SELECT COUNT(*) FROM group_participants WHERE group_id = ? AND status = \'active\''
    );
    $countStmt->execute([$g['id']]);
    $participantCount = (int)$countStmt->fetchColumn();

    return [
        'id'                     => (int)$g['id'],
        'label'                  => $g['label'],
        'maxParticipants'        => (int)$g['max_participants'],
        'participantCount'       => $participantCount,
        'showOnHomepage'         => (bool)$g['show_on_homepage'],
        'startDate'              => $g['start_date'],
        'endDate'                => $g['end_date'],
        'status'                 => $g['status'],
        'videoLink'              => $g['video_link'],
        'sessionCostCents'       => (int)$g['session_cost_cents'],
        'sessionDurationMinutes' => (int)$g['session_duration_minutes'],
        'notes'                  => $g['notes'],
        'createdAt'              => $g['created_at'],
        'schedule'               => array_map(fn($s) => [
            'dayOfWeek' => (int)$s['day_of_week'],
            'frequency' => $s['frequency'],
            'time'      => $s['time'],
        ], $schedule),
    ];
}

// ─── Groups CRUD ─────────────────────────────────────────────────

/**
 * GET /api/admin/groups?status=active
 */
function handleGetGroups(): void {
    requireAuth();
    $db = getDB();
    $status = $_GET['status'] ?? 'active';

    $stmt = $db->prepare('SELECT * FROM therapy_groups WHERE status = ? ORDER BY created_at DESC');
    $stmt->execute([$status]);
    $groups = $stmt->fetchAll();

    $result = array_map(fn($g) => formatGroupRow($g, $db), $groups);
    echo json_encode(array_values($result));
}

/**
 * GET /api/admin/groups/:id
 */
function handleGetGroup(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('SELECT * FROM therapy_groups WHERE id = ?');
    $stmt->execute([$id]);
    $g = $stmt->fetch();

    if (!$g) {
        http_response_code(404);
        echo json_encode(['error' => 'Gruppe nicht gefunden']);
        return;
    }

    $result = formatGroupRow($g, $db);

    // Add exceptions
    $excStmt = $db->prepare(
        'SELECT exception_date FROM group_schedule_exceptions WHERE group_id = ? ORDER BY exception_date'
    );
    $excStmt->execute([$id]);
    $result['exceptions'] = array_column($excStmt->fetchAll(), 'exception_date');

    // Add participants
    $partStmt = $db->prepare(
        'SELECT gp.client_id, c.name as client_name, c.email as client_email, gp.joined_at, gp.status
         FROM group_participants gp
         JOIN clients c ON gp.client_id = c.id
         WHERE gp.group_id = ?
         ORDER BY gp.joined_at'
    );
    $partStmt->execute([$id]);
    $result['participants'] = array_map(fn($p) => [
        'clientId'    => (int)$p['client_id'],
        'clientName'  => $p['client_name'],
        'clientEmail' => $p['client_email'],
        'joinedAt'    => $p['joined_at'],
        'status'      => $p['status'],
    ], $partStmt->fetchAll());

    echo json_encode($result);
}

/**
 * POST /api/admin/groups
 */
function handleCreateGroup(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $db->beginTransaction();
    try {
        // If show_on_homepage is true, unset all others first
        if (!empty($input['showOnHomepage'])) {
            $db->exec('UPDATE therapy_groups SET show_on_homepage = FALSE');
        }

        $stmt = $db->prepare(
            'INSERT INTO therapy_groups (label, max_participants, show_on_homepage, start_date, end_date,
             video_link, session_cost_cents, session_duration_minutes, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['label'] ?? '',
            $input['maxParticipants'] ?? 7,
            !empty($input['showOnHomepage']) ? 1 : 0,
            $input['startDate'] ?? null,
            $input['endDate'] ?? null,
            $input['videoLink'] ?? null,
            $input['sessionCostCents'] ?? 9500,
            $input['sessionDurationMinutes'] ?? 90,
            $input['notes'] ?? null,
        ]);
        $groupId = $db->lastInsertId();

        if (!empty($input['schedule'])) {
            $schedStmt = $db->prepare(
                'INSERT INTO group_schedule_rules (group_id, day_of_week, frequency, time) VALUES (?, ?, ?, ?)'
            );
            foreach ($input['schedule'] as $rule) {
                $schedStmt->execute([
                    $groupId,
                    $rule['dayOfWeek'],
                    $rule['frequency'] ?? 'weekly',
                    $rule['time'] ?? '16:30',
                ]);
            }
        }

        $db->commit();
        echo json_encode(['id' => (int)$groupId, 'message' => 'Gruppe angelegt']);
    } catch (\Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * PUT /api/admin/groups/:id
 */
function handleUpdateGroup(int $id): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $db->beginTransaction();
    try {
        // If show_on_homepage is true, unset all others first
        if (!empty($input['showOnHomepage'])) {
            $db->prepare('UPDATE therapy_groups SET show_on_homepage = FALSE WHERE id != ?')->execute([$id]);
        }

        $stmt = $db->prepare(
            'UPDATE therapy_groups SET label = ?, max_participants = ?, show_on_homepage = ?,
             start_date = ?, end_date = ?, status = ?, video_link = ?,
             session_cost_cents = ?, session_duration_minutes = ?, notes = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $input['label'] ?? '',
            $input['maxParticipants'] ?? 7,
            !empty($input['showOnHomepage']) ? 1 : 0,
            $input['startDate'] ?? null,
            $input['endDate'] ?? null,
            $input['status'] ?? 'active',
            $input['videoLink'] ?? null,
            $input['sessionCostCents'] ?? 9500,
            $input['sessionDurationMinutes'] ?? 90,
            $input['notes'] ?? null,
            $id,
        ]);

        // Replace schedule rules if provided
        if (isset($input['schedule'])) {
            $db->prepare('DELETE FROM group_schedule_rules WHERE group_id = ?')->execute([$id]);
            $schedStmt = $db->prepare(
                'INSERT INTO group_schedule_rules (group_id, day_of_week, frequency, time) VALUES (?, ?, ?, ?)'
            );
            foreach ($input['schedule'] as $rule) {
                $schedStmt->execute([
                    $id,
                    $rule['dayOfWeek'],
                    $rule['frequency'] ?? 'weekly',
                    $rule['time'] ?? '16:30',
                ]);
            }
        }

        $db->commit();
        echo json_encode(['message' => 'Gruppe aktualisiert']);
    } catch (\Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * DELETE /api/admin/groups/:id
 */
function handleDeleteGroup(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('DELETE FROM therapy_groups WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Gruppe nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Gruppe gelöscht']);
}

// ─── Participants ────────────────────────────────────────────────

/**
 * POST /api/admin/groups/:id/participants
 * Body: { clientId }
 */
function handleAddParticipant(int $groupId): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $clientId = $input['clientId'] ?? null;
    if (!$clientId) {
        http_response_code(400);
        echo json_encode(['error' => 'clientId ist erforderlich']);
        return;
    }

    // Check max constraint
    $groupStmt = $db->prepare('SELECT max_participants FROM therapy_groups WHERE id = ?');
    $groupStmt->execute([$groupId]);
    $group = $groupStmt->fetch();

    if (!$group) {
        http_response_code(404);
        echo json_encode(['error' => 'Gruppe nicht gefunden']);
        return;
    }

    $countStmt = $db->prepare(
        'SELECT COUNT(*) FROM group_participants WHERE group_id = ? AND status = \'active\''
    );
    $countStmt->execute([$groupId]);
    $currentCount = (int)$countStmt->fetchColumn();

    if ($currentCount >= (int)$group['max_participants']) {
        http_response_code(400);
        echo json_encode(['error' => 'Maximale Teilnehmerzahl erreicht']);
        return;
    }

    // Check if already a participant (possibly left)
    $existingStmt = $db->prepare(
        'SELECT id, status FROM group_participants WHERE group_id = ? AND client_id = ?'
    );
    $existingStmt->execute([$groupId, $clientId]);
    $existing = $existingStmt->fetch();

    if ($existing && $existing['status'] === 'active') {
        http_response_code(409);
        echo json_encode(['error' => 'Klient:in ist bereits Teilnehmer:in']);
        return;
    }

    $db->beginTransaction();
    try {
        if ($existing) {
            // Re-activate
            $db->prepare(
                'UPDATE group_participants SET status = \'active\', left_at = NULL, joined_at = NOW() WHERE id = ?'
            )->execute([$existing['id']]);
        } else {
            $db->prepare(
                'INSERT INTO group_participants (group_id, client_id) VALUES (?, ?)'
            )->execute([$groupId, $clientId]);
        }

        // Create payment rows for future scheduled sessions
        $futureStmt = $db->prepare(
            'SELECT id FROM group_sessions WHERE group_id = ? AND session_date >= CURDATE() AND status = \'scheduled\''
        );
        $futureStmt->execute([$groupId]);
        $futureSessions = $futureStmt->fetchAll();

        if (!empty($futureSessions)) {
            $payStmt = $db->prepare(
                'INSERT IGNORE INTO group_session_payments (group_session_id, client_id) VALUES (?, ?)'
            );
            foreach ($futureSessions as $session) {
                $payStmt->execute([$session['id'], $clientId]);
            }
        }

        $db->commit();
        echo json_encode(['message' => 'Teilnehmer:in hinzugefügt']);
    } catch (\Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * DELETE /api/admin/groups/:id/participants/:clientId
 */
function handleRemoveParticipant(int $groupId, int $clientId): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare(
        'UPDATE group_participants SET status = \'left\', left_at = NOW()
         WHERE group_id = ? AND client_id = ? AND status = \'active\''
    );
    $stmt->execute([$groupId, $clientId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Teilnehmer:in nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Teilnehmer:in entfernt']);
}

// ─── Schedule Exceptions ─────────────────────────────────────────

/**
 * POST /api/admin/groups/:id/exceptions
 * Body: { date }
 */
function handleToggleGroupException(int $groupId): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $date = $input['date'] ?? '';

    if (!$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Datum erforderlich']);
        return;
    }

    $db = getDB();

    $stmt = $db->prepare(
        'SELECT id FROM group_schedule_exceptions WHERE group_id = ? AND exception_date = ?'
    );
    $stmt->execute([$groupId, $date]);
    $existing = $stmt->fetch();

    if ($existing) {
        $db->prepare('DELETE FROM group_schedule_exceptions WHERE id = ?')->execute([$existing['id']]);
        echo json_encode(['action' => 'removed', 'date' => $date]);
    } else {
        $stmt = $db->prepare(
            'INSERT INTO group_schedule_exceptions (group_id, exception_date) VALUES (?, ?)'
        );
        $stmt->execute([$groupId, $date]);
        echo json_encode(['action' => 'added', 'date' => $date]);
    }
}

// ─── Group Sessions ──────────────────────────────────────────────

/**
 * GET /api/admin/groups/:id/sessions?from=&to=
 */
function handleGetGroupSessions(int $groupId): void {
    requireAuth();
    $db = getDB();

    $from = $_GET['from'] ?? '';
    $to = $_GET['to'] ?? '';

    $sql = 'SELECT * FROM group_sessions WHERE group_id = ?';
    $params = [$groupId];

    if ($from && $to) {
        $sql .= ' AND session_date BETWEEN ? AND ?';
        $params[] = $from;
        $params[] = $to;
    }

    $sql .= ' ORDER BY session_date ASC, session_time ASC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $sessions = $stmt->fetchAll();

    $result = [];
    foreach ($sessions as $s) {
        // Get payment rows for this session
        $payStmt = $db->prepare(
            'SELECT gsp.*, c.name as client_name
             FROM group_session_payments gsp
             JOIN clients c ON gsp.client_id = c.id
             WHERE gsp.group_session_id = ?
             ORDER BY c.name'
        );
        $payStmt->execute([$s['id']]);
        $payments = $payStmt->fetchAll();

        $result[] = [
            'id'              => (int)$s['id'],
            'groupId'         => (int)$s['group_id'],
            'sessionDate'     => $s['session_date'],
            'sessionTime'     => $s['session_time'],
            'durationMinutes' => (int)$s['duration_minutes'],
            'status'          => $s['status'],
            'notes'           => $s['notes'],
            'createdAt'       => $s['created_at'],
            'payments'        => array_map(fn($p) => [
                'id'              => (int)$p['id'],
                'groupSessionId'  => (int)$p['group_session_id'],
                'clientId'        => (int)$p['client_id'],
                'clientName'      => $p['client_name'],
                'paymentStatus'   => $p['payment_status'],
                'paymentDueDate'  => $p['payment_due_date'],
                'paymentPaidDate' => $p['payment_paid_date'],
                'invoiceSent'     => (bool)$p['invoice_sent'],
                'invoiceSentAt'   => $p['invoice_sent_at'],
            ], $payments),
        ];
    }

    echo json_encode(array_values($result));
}

/**
 * POST /api/admin/groups/:id/sessions
 * Body: { date, time, durationMinutes? }
 */
function handleCreateGroupSession(int $groupId): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $date = $input['date'] ?? '';
    $time = $input['time'] ?? '';

    if (!$date || !$time) {
        http_response_code(400);
        echo json_encode(['error' => 'Datum und Uhrzeit erforderlich']);
        return;
    }

    // Get group default duration
    $groupStmt = $db->prepare('SELECT session_duration_minutes FROM therapy_groups WHERE id = ?');
    $groupStmt->execute([$groupId]);
    $group = $groupStmt->fetch();
    $defaultDuration = $group ? (int)$group['session_duration_minutes'] : 90;

    $db->beginTransaction();
    try {
        $stmt = $db->prepare(
            'INSERT INTO group_sessions (group_id, session_date, session_time, duration_minutes) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $groupId,
            $date,
            $time,
            $input['durationMinutes'] ?? $defaultDuration,
        ]);
        $sessionId = $db->lastInsertId();

        // Create payment rows for all active participants
        $partStmt = $db->prepare(
            'SELECT client_id FROM group_participants WHERE group_id = ? AND status = \'active\''
        );
        $partStmt->execute([$groupId]);
        $participants = $partStmt->fetchAll();

        $payStmt = $db->prepare(
            'INSERT INTO group_session_payments (group_session_id, client_id) VALUES (?, ?)'
        );
        foreach ($participants as $p) {
            $payStmt->execute([$sessionId, $p['client_id']]);
        }

        $db->commit();
        echo json_encode(['id' => (int)$sessionId, 'message' => 'Sitzung angelegt']);
    } catch (\Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * POST /api/admin/groups/:id/sessions/generate
 * Body: { from, to }
 */
function handleGenerateGroupSessions(int $groupId): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $from = $input['from'] ?? '';
    $to = $input['to'] ?? '';

    if (!$from || !$to) {
        http_response_code(400);
        echo json_encode(['error' => 'from und to sind erforderlich']);
        return;
    }

    // Get group + schedule
    $groupStmt = $db->prepare('SELECT * FROM therapy_groups WHERE id = ?');
    $groupStmt->execute([$groupId]);
    $group = $groupStmt->fetch();

    if (!$group) {
        http_response_code(404);
        echo json_encode(['error' => 'Gruppe nicht gefunden']);
        return;
    }

    $schedStmt = $db->prepare('SELECT * FROM group_schedule_rules WHERE group_id = ?');
    $schedStmt->execute([$groupId]);
    $scheduleRules = $schedStmt->fetchAll();

    if (empty($scheduleRules)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Zeitplan-Regeln definiert']);
        return;
    }

    // Get exceptions
    $excStmt = $db->prepare(
        'SELECT exception_date FROM group_schedule_exceptions WHERE group_id = ?'
    );
    $excStmt->execute([$groupId]);
    $exceptions = array_column($excStmt->fetchAll(), 'exception_date');

    // Get existing sessions to avoid duplicates
    $existingStmt = $db->prepare(
        'SELECT session_date, session_time FROM group_sessions WHERE group_id = ? AND session_date BETWEEN ? AND ?'
    );
    $existingStmt->execute([$groupId, $from, $to]);
    $existing = [];
    foreach ($existingStmt->fetchAll() as $e) {
        $existing[$e['session_date'] . '_' . $e['session_time']] = true;
    }

    // Get active participants
    $partStmt = $db->prepare(
        'SELECT client_id FROM group_participants WHERE group_id = ? AND status = \'active\''
    );
    $partStmt->execute([$groupId]);
    $participants = $partStmt->fetchAll();

    $insertStmt = $db->prepare(
        'INSERT INTO group_sessions (group_id, session_date, session_time, duration_minutes) VALUES (?, ?, ?, ?)'
    );
    $payStmt = $db->prepare(
        'INSERT INTO group_session_payments (group_session_id, client_id) VALUES (?, ?)'
    );

    $created = 0;
    $startDate = new DateTime($from);
    $endDate = new DateTime($to);
    $duration = (int)$group['session_duration_minutes'];
    $groupStart = $group['start_date'] ? new DateTime($group['start_date']) : null;

    while ($startDate <= $endDate) {
        $dateStr = $startDate->format('Y-m-d');
        $dayOfWeek = (int)$startDate->format('N');

        foreach ($scheduleRules as $rule) {
            if ((int)$rule['day_of_week'] !== $dayOfWeek) continue;

            // Check biweekly
            if ($rule['frequency'] === 'biweekly' && $groupStart) {
                $weeksDiff = (int)$groupStart->diff($startDate)->days / 7;
                if ($weeksDiff % 2 !== 0) continue;
            }

            // Check exceptions
            if (in_array($dateStr, $exceptions)) continue;

            // Check existing
            $key = $dateStr . '_' . $rule['time'];
            if (isset($existing[$key])) continue;

            $insertStmt->execute([$groupId, $dateStr, $rule['time'], $duration]);
            $sessionId = $db->lastInsertId();

            // Create payment rows for each active participant
            foreach ($participants as $p) {
                $payStmt->execute([$sessionId, $p['client_id']]);
            }

            $created++;
        }

        $startDate->modify('+1 day');
    }

    echo json_encode(['created' => $created, 'message' => "$created Sitzungen generiert"]);
}

/**
 * PATCH /api/admin/group-sessions/:id
 * Body: { status?, notes? }
 */
function handleUpdateGroupSession(int $id): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $fields = [];
    $params = [];

    if (isset($input['status'])) {
        $fields[] = 'status = ?';
        $params[] = $input['status'];
    }
    if (isset($input['notes'])) {
        $fields[] = 'notes = ?';
        $params[] = $input['notes'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Änderungen angegeben']);
        return;
    }

    $params[] = $id;
    $sql = 'UPDATE group_sessions SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['message' => 'Sitzung aktualisiert']);
}

/**
 * DELETE /api/admin/group-sessions/:id
 */
function handleDeleteGroupSession(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('DELETE FROM group_sessions WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Sitzung nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Sitzung gelöscht']);
}

// ─── Group Session Payments ──────────────────────────────────────

/**
 * PATCH /api/admin/group-session-payments/:id
 * Body: { paymentStatus?, paymentPaidDate? }
 */
function handleUpdateGroupPayment(int $id): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $fields = [];
    $params = [];

    if (isset($input['paymentStatus'])) {
        $fields[] = 'payment_status = ?';
        $params[] = $input['paymentStatus'];
    }
    if (isset($input['paymentPaidDate'])) {
        $fields[] = 'payment_paid_date = ?';
        $params[] = $input['paymentPaidDate'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Änderungen angegeben']);
        return;
    }

    $params[] = $id;
    $sql = 'UPDATE group_session_payments SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['message' => 'Zahlung aktualisiert']);
}

/**
 * POST /api/admin/group-session-payments/:id/invoice
 * Generates and sends an invoice PDF for a group session payment.
 */
function handleSendGroupInvoice(int $paymentId): void {
    requireAuth();
    require_once __DIR__ . '/../lib/Mailer.php';
    require_once __DIR__ . '/../lib/PdfGenerator.php';
    $config = require __DIR__ . '/../config.php';
    $db = getDB();

    $stmt = $db->prepare(
        'SELECT gsp.*, gs.session_date, gs.session_time, gs.duration_minutes,
                g.session_cost_cents, g.label as group_label,
                c.name as client_name, c.email as client_email,
                c.street as client_street, c.zip as client_zip,
                c.city as client_city, c.country as client_country
         FROM group_session_payments gsp
         JOIN group_sessions gs ON gsp.group_session_id = gs.id
         JOIN therapy_groups g ON gs.group_id = g.id
         JOIN clients c ON gsp.client_id = c.id
         WHERE gsp.id = ?'
    );
    $stmt->execute([$paymentId]);
    $payment = $stmt->fetch();

    if (!$payment) {
        http_response_code(404);
        echo json_encode(['error' => 'Zahlung nicht gefunden']);
        return;
    }

    $clientName = $payment['client_name'];
    $dateFormatted = date('d.m.Y', strtotime($payment['session_date']));
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';
    $amountCents = (int)$payment['session_cost_cents'];
    $amountFormatted = number_format($amountCents / 100, 2, ',', '.') . ' €';
    $durationMinutes = (int)$payment['duration_minutes'];
    $therapyLabel = $payment['group_label'];
    $invoiceNumber = 'RE-' . date('Y') . '-G' . str_pad($paymentId, 5, '0', STR_PAD_LEFT);

    // Generate invoice PDF
    $pdfGen = new PdfGenerator();
    $pdfContent = $pdfGen->generate('rechnung', $clientName, $dateFormatted, [
        'invoiceNumber'    => $invoiceNumber,
        'amountFormatted'  => $amountFormatted,
        'durationMinutes'  => $durationMinutes,
        'therapyLabel'     => $therapyLabel,
        'sessionDate'      => $dateFormatted,
        'sessionTime'      => $payment['session_time'],
        'clientStreet'     => $payment['client_street'] ?? '',
        'clientZip'        => $payment['client_zip'] ?? '',
        'clientCity'       => $payment['client_city'] ?? '',
        'clientCountry'    => $payment['client_country'] ?? '',
    ]);

    // Render invoice cover email
    $documentName = 'Rechnung';
    ob_start();
    include __DIR__ . '/../templates/email/invoice_cover.php';
    $htmlBody = ob_get_clean();

    try {
        $mailer = new Mailer();
        $pdfFilename = "Rechnung_{$invoiceNumber}.pdf";
        $mailer->sendWithPdf(
            $payment['client_email'],
            $clientName,
            "Rechnung {$invoiceNumber} — {$therapistName}",
            $htmlBody,
            $pdfContent,
            $pdfFilename
        );
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Rechnung konnte nicht gesendet werden: ' . $e->getMessage()]);
        return;
    }

    // Mark invoice as sent
    $db->prepare(
        'UPDATE group_session_payments SET invoice_sent = 1, invoice_sent_at = NOW() WHERE id = ?'
    )->execute([$paymentId]);

    echo json_encode(['message' => 'Rechnung gesendet', 'invoiceNumber' => $invoiceNumber]);
}
