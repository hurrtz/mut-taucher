<?php

/**
 * Record lifecycle events for intro-call bookings so they can be surfaced in
 * the patient timeline without overloading editable notes.
 */

function resolveBookingClientId(PDO $db, int $bookingId): ?int {
    $stmt = $db->prepare('SELECT id FROM clients WHERE booking_id = ? LIMIT 1');
    $stmt->execute([$bookingId]);
    $clientId = $stmt->fetchColumn();

    return $clientId !== false ? (int)$clientId : null;
}

function recordBookingEvent(PDO $db, int $bookingId, string $eventType, ?int $clientId = null): void {
    if ($clientId === null) {
        $clientId = resolveBookingClientId($db, $bookingId);
    }

    $stmt = $db->prepare(
        'INSERT INTO booking_events (booking_id, client_id, event_type) VALUES (?, ?, ?)'
    );
    $stmt->execute([$bookingId, $clientId, $eventType]);
}

function syncBookingEventsClientId(PDO $db, int $bookingId, int $clientId): void {
    $stmt = $db->prepare(
        'UPDATE booking_events SET client_id = ? WHERE booking_id = ? AND client_id IS NULL'
    );
    $stmt->execute([$clientId, $bookingId]);
}
