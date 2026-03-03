<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/clients.php';

// ─── Therapies CRUD ─────────────────────────────────────────────

/**
 * GET /api/admin/therapies?status=active
 */
function handleGetTherapies(): void {
    requireAuth();
    $db = getDB();
    $status = $_GET['status'] ?? 'active';

    $stmt = $db->prepare(
        'SELECT t.*, c.title as client_title, c.first_name as client_first_name, c.last_name as client_last_name, c.suffix as client_suffix, c.email as client_email
         FROM therapies t
         JOIN clients c ON t.client_id = c.id
         WHERE t.status = ?
         ORDER BY t.created_at DESC'
    );
    $stmt->execute([$status]);
    $therapies = $stmt->fetchAll();

    $result = [];
    foreach ($therapies as $t) {
        $scheduleStmt = $db->prepare(
            'SELECT day_of_week, frequency, time FROM therapy_schedule_rules WHERE therapy_id = ?'
        );
        $scheduleStmt->execute([$t['id']]);
        $schedule = $scheduleStmt->fetchAll();

        $result[] = [
            'id'                     => (int)$t['id'],
            'clientId'               => (int)$t['client_id'],
            'clientName'             => composeClientName($t['client_title'], $t['client_first_name'], $t['client_last_name'], $t['client_suffix']),
            'clientEmail'            => $t['client_email'],
            'label'                  => $t['label'],
            'startDate'              => $t['start_date'],
            'endDate'                => $t['end_date'],
            'status'                 => $t['status'],
            'videoLink'              => $t['video_link'],
            'sessionCostCents'       => (int)$t['session_cost_cents'],
            'sessionDurationMinutes' => (int)$t['session_duration_minutes'],
            'notes'                  => $t['notes'],
            'createdAt'              => $t['created_at'],
            'schedule'               => array_map(fn($s) => [
                'dayOfWeek' => (int)$s['day_of_week'],
                'frequency' => $s['frequency'],
                'time'      => $s['time'],
            ], $schedule),
        ];
    }

    echo json_encode(array_values($result));
}

/**
 * GET /api/admin/therapies/:id
 */
function handleGetTherapy(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare(
        'SELECT t.*, c.title as client_title, c.first_name as client_first_name, c.last_name as client_last_name, c.suffix as client_suffix, c.email as client_email
         FROM therapies t
         JOIN clients c ON t.client_id = c.id
         WHERE t.id = ?'
    );
    $stmt->execute([$id]);
    $t = $stmt->fetch();

    if (!$t) {
        http_response_code(404);
        echo json_encode(['error' => 'Therapie nicht gefunden']);
        return;
    }

    $scheduleStmt = $db->prepare(
        'SELECT day_of_week, frequency, time FROM therapy_schedule_rules WHERE therapy_id = ?'
    );
    $scheduleStmt->execute([$id]);
    $schedule = $scheduleStmt->fetchAll();

    $exceptionsStmt = $db->prepare(
        'SELECT exception_date FROM therapy_schedule_exceptions WHERE therapy_id = ? ORDER BY exception_date'
    );
    $exceptionsStmt->execute([$id]);
    $exceptions = array_column($exceptionsStmt->fetchAll(), 'exception_date');

    echo json_encode([
        'id'                     => (int)$t['id'],
        'clientId'               => (int)$t['client_id'],
        'clientName'             => composeClientName($t['client_title'], $t['client_first_name'], $t['client_last_name'], $t['client_suffix']),
        'clientEmail'            => $t['client_email'],
        'label'                  => $t['label'],
        'startDate'              => $t['start_date'],
        'endDate'                => $t['end_date'],
        'status'                 => $t['status'],
        'videoLink'              => $t['video_link'],
        'sessionCostCents'       => (int)$t['session_cost_cents'],
        'sessionDurationMinutes' => (int)$t['session_duration_minutes'],
        'notes'                  => $t['notes'],
        'createdAt'              => $t['created_at'],
        'schedule'               => array_map(fn($s) => [
            'dayOfWeek' => (int)$s['day_of_week'],
            'frequency' => $s['frequency'],
            'time'      => $s['time'],
        ], $schedule),
        'exceptions'             => $exceptions,
    ]);
}

/**
 * POST /api/admin/therapies
 * Body: { clientId, label, startDate, endDate?, sessionCostCents?, sessionDurationMinutes?, videoLink?, notes?, schedule: [{dayOfWeek, frequency, time}] }
 */
function handleCreateTherapy(): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $clientId = $input['clientId'] ?? null;
    if (!$clientId) {
        http_response_code(400);
        echo json_encode(['error' => 'clientId ist erforderlich']);
        return;
    }

    $db->beginTransaction();
    try {
        $stmt = $db->prepare(
            'INSERT INTO therapies (client_id, label, start_date, end_date, video_link, session_cost_cents, session_duration_minutes, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $clientId,
            $input['label'] ?? '',
            $input['startDate'] ?? date('Y-m-d'),
            $input['endDate'] ?? null,
            $input['videoLink'] ?? null,
            $input['sessionCostCents'] ?? 12000,
            $input['sessionDurationMinutes'] ?? 60,
            $input['notes'] ?? null,
        ]);
        $therapyId = $db->lastInsertId();

        if (!empty($input['schedule'])) {
            $schedStmt = $db->prepare(
                'INSERT INTO therapy_schedule_rules (therapy_id, day_of_week, frequency, time) VALUES (?, ?, ?, ?)'
            );
            foreach ($input['schedule'] as $rule) {
                $schedStmt->execute([
                    $therapyId,
                    $rule['dayOfWeek'],
                    $rule['frequency'] ?? 'weekly',
                    $rule['time'] ?? '10:00',
                ]);
            }
        }

        $db->commit();
        echo json_encode(['id' => (int)$therapyId, 'message' => 'Therapie angelegt']);
    } catch (\Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * PUT /api/admin/therapies/:id
 */
function handleUpdateTherapy(int $id): void {
    requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $db->beginTransaction();
    try {
        $stmt = $db->prepare(
            'UPDATE therapies SET label = ?, start_date = ?, end_date = ?, status = ?,
             video_link = ?, session_cost_cents = ?, session_duration_minutes = ?, notes = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $input['label'] ?? '',
            $input['startDate'] ?? date('Y-m-d'),
            $input['endDate'] ?? null,
            $input['status'] ?? 'active',
            $input['videoLink'] ?? null,
            $input['sessionCostCents'] ?? 12000,
            $input['sessionDurationMinutes'] ?? 60,
            $input['notes'] ?? null,
            $id,
        ]);

        // Replace schedule rules
        if (isset($input['schedule'])) {
            $db->prepare('DELETE FROM therapy_schedule_rules WHERE therapy_id = ?')->execute([$id]);
            $schedStmt = $db->prepare(
                'INSERT INTO therapy_schedule_rules (therapy_id, day_of_week, frequency, time) VALUES (?, ?, ?, ?)'
            );
            foreach ($input['schedule'] as $rule) {
                $schedStmt->execute([
                    $id,
                    $rule['dayOfWeek'],
                    $rule['frequency'] ?? 'weekly',
                    $rule['time'] ?? '10:00',
                ]);
            }
        }

        $db->commit();
        echo json_encode(['message' => 'Therapie aktualisiert']);
    } catch (\Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * DELETE /api/admin/therapies/:id
 */
function handleDeleteTherapy(int $id): void {
    requireAuth();
    $db = getDB();

    // Check if any session has interaction (status changed, notes, paid, invoice sent)
    $checkStmt = $db->prepare(
        'SELECT COUNT(*) FROM therapy_sessions
         WHERE therapy_id = ? AND (status != \'scheduled\' OR notes IS NOT NULL OR payment_status = \'paid\' OR invoice_sent = 1)'
    );
    $checkStmt->execute([$id]);
    if ((int)$checkStmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Therapie hat Sitzungen mit Interaktionen und kann nicht gelöscht werden. Bitte archivieren.']);
        return;
    }

    $stmt = $db->prepare('DELETE FROM therapies WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Therapie nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Therapie gelöscht']);
}

/**
 * POST /api/admin/therapies/:id/exceptions
 * Body: { date }
 * Toggles exception for therapy schedule.
 */
function handleToggleTherapyException(int $therapyId): void {
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
        'SELECT id FROM therapy_schedule_exceptions WHERE therapy_id = ? AND exception_date = ?'
    );
    $stmt->execute([$therapyId, $date]);
    $existing = $stmt->fetch();

    if ($existing) {
        $db->prepare('DELETE FROM therapy_schedule_exceptions WHERE id = ?')->execute([$existing['id']]);
        echo json_encode(['action' => 'removed', 'date' => $date]);
    } else {
        $stmt = $db->prepare(
            'INSERT INTO therapy_schedule_exceptions (therapy_id, exception_date) VALUES (?, ?)'
        );
        $stmt->execute([$therapyId, $date]);
        echo json_encode(['action' => 'added', 'date' => $date]);
    }
}

// ─── Therapy Sessions ───────────────────────────────────────────

/**
 * GET /api/admin/therapies/:id/sessions?from=&to=
 */
function handleGetTherapySessions(int $therapyId): void {
    requireAuth();
    $db = getDB();

    $from = $_GET['from'] ?? '';
    $to = $_GET['to'] ?? '';

    $sql = 'SELECT * FROM therapy_sessions WHERE therapy_id = ?';
    $params = [$therapyId];

    if ($from && $to) {
        $sql .= ' AND session_date BETWEEN ? AND ?';
        $params[] = $from;
        $params[] = $to;
    }

    $sql .= ' ORDER BY session_date ASC, session_time ASC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $sessions = $stmt->fetchAll();

    $result = array_map(fn($s) => [
        'id'              => (int)$s['id'],
        'therapyId'       => (int)$s['therapy_id'],
        'sessionDate'     => $s['session_date'],
        'sessionTime'     => $s['session_time'],
        'durationMinutes' => (int)$s['duration_minutes'],
        'status'          => $s['status'],
        'notes'           => $s['notes'],
        'paymentStatus'   => $s['payment_status'],
        'paymentDueDate'  => $s['payment_due_date'],
        'paymentPaidDate' => $s['payment_paid_date'],
        'invoiceSent'     => (bool)$s['invoice_sent'],
        'invoiceSentAt'   => $s['invoice_sent_at'],
        'createdAt'       => $s['created_at'],
    ], $sessions);

    echo json_encode(array_values($result));
}

/**
 * POST /api/admin/therapies/:id/sessions
 * Body: { date, time, durationMinutes? }
 */
function handleCreateTherapySession(int $therapyId): void {
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

    // Get therapy default duration
    $therapyStmt = $db->prepare('SELECT session_duration_minutes FROM therapies WHERE id = ?');
    $therapyStmt->execute([$therapyId]);
    $therapy = $therapyStmt->fetch();
    $defaultDuration = $therapy ? (int)$therapy['session_duration_minutes'] : 60;

    $stmt = $db->prepare(
        'INSERT INTO therapy_sessions (therapy_id, session_date, session_time, duration_minutes)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $therapyId,
        $date,
        $time,
        $input['durationMinutes'] ?? $defaultDuration,
    ]);

    echo json_encode(['id' => (int)$db->lastInsertId(), 'message' => 'Sitzung angelegt']);
}

/**
 * POST /api/admin/therapies/:id/sessions/generate
 * Body: { from, to }
 * Bulk creates sessions from the therapy's schedule rules.
 */
function handleGenerateSessions(int $therapyId): void {
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

    // Get therapy + schedule
    $therapyStmt = $db->prepare('SELECT * FROM therapies WHERE id = ?');
    $therapyStmt->execute([$therapyId]);
    $therapy = $therapyStmt->fetch();

    if (!$therapy) {
        http_response_code(404);
        echo json_encode(['error' => 'Therapie nicht gefunden']);
        return;
    }

    $schedStmt = $db->prepare('SELECT * FROM therapy_schedule_rules WHERE therapy_id = ?');
    $schedStmt->execute([$therapyId]);
    $scheduleRules = $schedStmt->fetchAll();

    if (empty($scheduleRules)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Zeitplan-Regeln definiert']);
        return;
    }

    // Get exceptions
    $excStmt = $db->prepare(
        'SELECT exception_date FROM therapy_schedule_exceptions WHERE therapy_id = ?'
    );
    $excStmt->execute([$therapyId]);
    $exceptions = array_column($excStmt->fetchAll(), 'exception_date');

    // Get existing sessions to avoid duplicates
    $existingStmt = $db->prepare(
        'SELECT session_date, session_time FROM therapy_sessions WHERE therapy_id = ? AND session_date BETWEEN ? AND ?'
    );
    $existingStmt->execute([$therapyId, $from, $to]);
    $existing = [];
    foreach ($existingStmt->fetchAll() as $e) {
        $existing[$e['session_date'] . '_' . $e['session_time']] = true;
    }

    $insertStmt = $db->prepare(
        'INSERT INTO therapy_sessions (therapy_id, session_date, session_time, duration_minutes) VALUES (?, ?, ?, ?)'
    );

    $created = 0;
    $startDate = new DateTime($from);
    $endDate = new DateTime($to);
    $duration = (int)$therapy['session_duration_minutes'];
    $therapyStart = $therapy['start_date'] ? new DateTime($therapy['start_date']) : null;

    while ($startDate <= $endDate) {
        $dateStr = $startDate->format('Y-m-d');
        $dayOfWeek = (int)$startDate->format('N'); // 1=Mon, 7=Sun

        foreach ($scheduleRules as $rule) {
            if ((int)$rule['day_of_week'] !== $dayOfWeek) continue;

            // Check biweekly: skip every other week from therapy start
            if ($rule['frequency'] === 'biweekly' && $therapyStart) {
                $weeksDiff = (int)$therapyStart->diff($startDate)->days / 7;
                if ($weeksDiff % 2 !== 0) continue;
            }

            // Check exceptions
            if (in_array($dateStr, $exceptions)) continue;

            // Check existing
            $key = $dateStr . '_' . $rule['time'];
            if (isset($existing[$key])) continue;

            $insertStmt->execute([$therapyId, $dateStr, $rule['time'], $duration]);
            $created++;
        }

        $startDate->modify('+1 day');
    }

    echo json_encode(['created' => $created, 'message' => "$created Sitzungen generiert"]);
}

/**
 * PATCH /api/admin/sessions/:id
 * Body: { status?, notes?, paymentStatus?, paymentPaidDate? }
 */
function handleUpdateSession(int $id): void {
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
    if (isset($input['paymentStatus'])) {
        $fields[] = 'payment_status = ?';
        $params[] = $input['paymentStatus'];
    }
    if (isset($input['paymentPaidDate'])) {
        $fields[] = 'payment_paid_date = ?';
        $params[] = $input['paymentPaidDate'];
    }
    if (isset($input['sessionDate'])) {
        $fields[] = 'session_date = ?';
        $params[] = $input['sessionDate'];
    }
    if (isset($input['sessionTime'])) {
        $fields[] = 'session_time = ?';
        $params[] = $input['sessionTime'];
    }
    if (isset($input['durationMinutes'])) {
        $fields[] = 'duration_minutes = ?';
        $params[] = (int)$input['durationMinutes'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Änderungen angegeben']);
        return;
    }

    $params[] = $id;
    $sql = 'UPDATE therapy_sessions SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['message' => 'Sitzung aktualisiert']);
}

/**
 * DELETE /api/admin/sessions/:id
 */
function handleDeleteSession(int $id): void {
    requireAuth();
    $db = getDB();

    $stmt = $db->prepare('DELETE FROM therapy_sessions WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Sitzung nicht gefunden']);
        return;
    }

    echo json_encode(['message' => 'Sitzung gelöscht']);
}

/**
 * POST /api/admin/sessions/:id/invoice
 * Generates and sends an invoice PDF for a therapy session.
 */
function handleSendInvoice(int $sessionId): void {
    requireAuth();
    require_once __DIR__ . '/../lib/Mailer.php';
    require_once __DIR__ . '/../lib/PdfGenerator.php';
    $config = require __DIR__ . '/../config.php';
    $db = getDB();

    $stmt = $db->prepare(
        'SELECT s.*, t.client_id, t.session_cost_cents, t.label as therapy_label,
                c.title as client_title, c.first_name as client_first_name, c.last_name as client_last_name, c.suffix as client_suffix,
                c.email as client_email,
                c.street as client_street, c.zip as client_zip,
                c.city as client_city, c.country as client_country
         FROM therapy_sessions s
         JOIN therapies t ON s.therapy_id = t.id
         JOIN clients c ON t.client_id = c.id
         WHERE s.id = ?'
    );
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(404);
        echo json_encode(['error' => 'Sitzung nicht gefunden']);
        return;
    }

    $clientName = composeClientName($session['client_title'], $session['client_first_name'], $session['client_last_name'], $session['client_suffix']);
    $dateFormatted = date('d.m.Y', strtotime($session['session_date']));
    $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
    $siteUrl = $config['site_url'] ?? '';
    $amountCents = (int)$session['session_cost_cents'];
    $amountFormatted = number_format($amountCents / 100, 2, ',', '.') . ' €';
    $durationMinutes = (int)$session['duration_minutes'];
    $therapyLabel = $session['therapy_label'];
    $invoiceNumber = 'RE-' . date('Y') . '-' . str_pad($sessionId, 5, '0', STR_PAD_LEFT);

    // Generate invoice PDF
    $pdfGen = new PdfGenerator();
    $templateKey = $pdfGen->resolveTemplateKey('pdf:rechnung_einzeltherapie', 'rechnung');
    $pdfContent = $pdfGen->generate($templateKey, $clientName, $dateFormatted, [
        'invoiceNumber'    => $invoiceNumber,
        'amountFormatted'  => $amountFormatted,
        'durationMinutes'  => $durationMinutes,
        'therapyLabel'     => $therapyLabel,
        'sessionDate'      => $dateFormatted,
        'sessionTime'      => $session['session_time'],
        'clientStreet'     => $session['client_street'] ?? '',
        'clientZip'        => $session['client_zip'] ?? '',
        'clientCity'       => $session['client_city'] ?? '',
        'clientCountry'    => $session['client_country'] ?? '',
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
            $session['client_email'],
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
        'UPDATE therapy_sessions SET invoice_sent = 1, invoice_sent_at = NOW() WHERE id = ?'
    )->execute([$sessionId]);

    // Archive invoice PDF to client documents
    require_once __DIR__ . '/client_history.php';
    archiveSentDocument((int)$session['client_id'], "Rechnung {$invoiceNumber}", $pdfContent, $pdfFilename);

    echo json_encode(['message' => 'Rechnung gesendet', 'invoiceNumber' => $invoiceNumber]);
}
