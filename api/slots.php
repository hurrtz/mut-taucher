<?php

require_once __DIR__ . '/db.php';

/**
 * Load all rules with their days and exceptions from DB.
 * Returns array of rule arrays with nested 'days' and 'exceptions'.
 */
function loadRules(PDO $db): array {
    $rules = $db->query('SELECT * FROM recurring_rules ORDER BY id')->fetchAll();

    $days = $db->query('SELECT * FROM rule_days ORDER BY rule_id, day_of_week')->fetchAll();
    $exceptions = $db->query('SELECT * FROM rule_exceptions ORDER BY rule_id, exception_date')->fetchAll();

    $daysByRule = [];
    foreach ($days as $d) {
        $daysByRule[$d['rule_id']][] = $d;
    }

    $excByRule = [];
    foreach ($exceptions as $e) {
        $excByRule[$e['rule_id']][] = $e['exception_date'];
    }

    foreach ($rules as &$rule) {
        $rule['days'] = $daysByRule[$rule['id']] ?? [];
        $rule['exceptions'] = $excByRule[$rule['id']] ?? [];
    }

    return $rules;
}

/**
 * Generate available slots from rules for a date range.
 * Excludes dates with existing bookings.
 */
function generateSlots(PDO $db, string $from, string $to): array {
    $rules = loadRules($db);

    // Load confirmed bookings in range
    $stmt = $db->prepare(
        'SELECT rule_id, booking_date, booking_time FROM bookings
         WHERE status = "confirmed" AND booking_date BETWEEN ? AND ?'
    );
    $stmt->execute([$from, $to]);
    $bookings = $stmt->fetchAll();

    $bookedSet = [];
    foreach ($bookings as $b) {
        $bookedSet[$b['rule_id'] . '|' . $b['booking_date'] . '|' . $b['booking_time']] = true;
    }

    $horizonDate = date('Y-m-d', strtotime('+12 months'));
    $slots = [];

    foreach ($rules as $rule) {
        $ruleStart = $rule['start_date'];
        $ruleEnd = $rule['end_date'] ?? $horizonDate;

        $effectiveStart = max($from, $ruleStart);
        $effectiveEnd = min($to, $ruleEnd, $horizonDate);

        if ($effectiveStart > $effectiveEnd) continue;

        $ruleStartTs = strtotime($ruleStart);
        $current = strtotime($effectiveStart);
        $end = strtotime($effectiveEnd);

        while ($current <= $end) {
            // PHP: 1=Mon ... 7=Sun (ISO 8601)
            $isoDay = (int)date('N', $current);
            $dateStr = date('Y-m-d', $current);

            foreach ($rule['days'] as $dayConfig) {
                if ((int)$dayConfig['day_of_week'] !== $isoDay) continue;

                // Check biweekly alignment
                if ($dayConfig['frequency'] === 'biweekly') {
                    $weeksDiff = (int)floor(($current - $ruleStartTs) / (7 * 86400));
                    // Use ISO week difference for consistency
                    $ruleWeek = (int)date('W', $ruleStartTs);
                    $currentWeek = (int)date('W', $current);
                    $ruleYear = (int)date('o', $ruleStartTs);
                    $currentYear = (int)date('o', $current);
                    $totalWeeksDiff = ($currentYear - $ruleYear) * 52 + ($currentWeek - $ruleWeek);
                    if ($totalWeeksDiff % 2 !== 0) continue;
                }

                // Skip exceptions
                if (in_array($dateStr, $rule['exceptions'])) continue;

                // Skip if already booked
                $key = $rule['id'] . '|' . $dateStr . '|' . $rule['time'];
                if (isset($bookedSet[$key])) continue;

                $slots[] = [
                    'id'              => 'slot-' . $rule['id'] . '-' . $dateStr,
                    'ruleId'          => (int)$rule['id'],
                    'date'            => $dateStr,
                    'time'            => $rule['time'],
                    'durationMinutes' => (int)$rule['duration_minutes'],
                ];
            }

            $current = strtotime('+1 day', $current);
        }
    }

    // ─── Events (one-off slots) ────────────────────────────────────
    $eventStmt = $db->prepare(
        'SELECT * FROM events WHERE event_date BETWEEN ? AND ?'
    );
    $eventStmt->execute([$from, $to]);
    $events = $eventStmt->fetchAll();

    // Check which events are already booked
    $eventBookedStmt = $db->prepare(
        'SELECT event_id FROM bookings
         WHERE status = "confirmed" AND event_id IS NOT NULL AND booking_date BETWEEN ? AND ?'
    );
    $eventBookedStmt->execute([$from, $to]);
    $bookedEventIds = [];
    foreach ($eventBookedStmt->fetchAll() as $eb) {
        $bookedEventIds[(int)$eb['event_id']] = true;
    }

    foreach ($events as $event) {
        $eventId = (int)$event['id'];
        if (isset($bookedEventIds[$eventId])) continue;

        $slots[] = [
            'id'              => 'event-' . $eventId,
            'ruleId'          => null,
            'eventId'         => $eventId,
            'date'            => $event['event_date'],
            'time'            => $event['time'],
            'durationMinutes' => (int)$event['duration_minutes'],
        ];
    }

    // Sort by date, then time
    usort($slots, function ($a, $b) {
        return strcmp($a['date'] . $a['time'], $b['date'] . $b['time']);
    });

    return $slots;
}
